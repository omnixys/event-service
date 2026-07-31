import { AnalyticsOutboxService } from '../../analytics/analytics-outbox.service.js';
import { env } from '../../config/env.js';
import { UserRoleType, SeatColorGroupMatchType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  EventAccessDeniedError,
  EventMemberNotFoundError,
  EventNotFoundError,
  EventTimelineNotFoundError,
  EventValidationError,
} from '../errors/event-domain.error.js';
import { SeatAllocationExceededError } from '../errors/seat-allocation-exceeded.error.js';
import { AssignUserRoleDTO } from '../models/inputs/assign-user-role.input.js';
import { CreateEventInput } from '../models/inputs/create-event.input.js';
import { RemoveUserFromEventInput } from '../models/inputs/remove-user-from-event.input.js';
import type { SeatColorGroupInput } from '../models/inputs/seat-color-group.input.js';
import {
  CreateTimelineInput,
  RemoveTimelineInput,
  SetTimelineInput,
  TimelineUpsertInput,
  UpdateTimelineInput,
} from '../models/inputs/timeline.input.js';
import { UpdateEventInput } from '../models/inputs/update-event.input.js';
import { EventMapper } from '../models/mapper/event.mapper.js';
import { SettingsCreateMapper } from '../models/mapper/settings.mapper.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { EventRbacService } from './event-rbac.service.js';
import {
  type AuthenticatedUserProjection,
  UserProjectionService,
} from './user-projection.service.js';
import { Injectable } from '@nestjs/common';
import {
  EventRoleType,
  type EventCreatedDTO,
  type EventMilestoneRecordedDTO,
  type EventOwnerChangedDTO,
  type EventRoleAssignedDTO,
  type EventRoleRemovedDTO,
  type EventUpdatedDTO,
  type EventVisibleTab,
  type SeatColorGroupDTO,
} from '@omnixys/contracts-ts';
import {
  KafkaProducerService,
  KafkaTopics,
  type EventType,
  type KafkaMetaInfo,
} from '@omnixys/kafka-ts';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { TraceRunner } from '@omnixys/observability-ts';

const DEFAULT_SEAT_COLOR_STYLES = [
  { background: '#e74c3c', border: '#c0392b', foreground: '#ffffff', legendIcon: '#e74c3c' },
  { background: '#3498db', border: '#2980b9', foreground: '#ffffff', legendIcon: '#3498db' },
  { background: '#2ecc71', border: '#27ae60', foreground: '#ffffff', legendIcon: '#2ecc71' },
  { background: '#f39c12', border: '#e67e22', foreground: '#ffffff', legendIcon: '#f39c12' },
  { background: '#9b59b6', border: '#8e44ad', foreground: '#ffffff', legendIcon: '#9b59b6' },
  { background: '#1abc9c', border: '#16a085', foreground: '#ffffff', legendIcon: '#1abc9c' },
  { background: '#e67e22', border: '#d35400', foreground: '#ffffff', legendIcon: '#e67e22' },
  { background: '#2980b9', border: '#1a6fc4', foreground: '#ffffff', legendIcon: '#2980b9' },
  { background: '#e91e63', border: '#c2185b', foreground: '#ffffff', legendIcon: '#e91e63' },
  { background: '#00bcd4', border: '#00acc1', foreground: '#ffffff', legendIcon: '#00bcd4' },
];

const ALL_GROUP_STYLE = {
  background: '#795548',
  border: '#5d4037',
  foreground: '#ffffff',
  legendIcon: '#795548',
};
const NONE_GROUP_STYLE = {
  background: '#9e9e9e',
  border: '#757575',
  foreground: '#ffffff',
  legendIcon: '#9e9e9e',
};

type EventCreatedWithPlusOneApprovalDTO = EventCreatedDTO & {
  requireApprovalForPlusOnes: boolean;
  scheduleTicketRelease: boolean;
};

type EventUpdatedWithPlusOneApprovalDTO = EventUpdatedDTO & {
  requireApprovalForPlusOnes: boolean;
  scheduleTicketRelease: boolean;
};

@Injectable()
export class EventWriteService {
  private readonly log;

  constructor(
    private readonly prisma: PrismaService,
    private readonly omnixyslog: OmnixysLogger,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly rbacService: EventRbacService,
    private readonly userProjectionService: UserProjectionService,
    private readonly analyticsOutbox: AnalyticsOutboxService,
  ) {
    this.log = this.omnixyslog.log(this.constructor.name);
  }

  private inputToPrismaCreate(inputs: SeatColorGroupInput[]): Array<{
    name: string;
    style: Record<string, string>;
    matchType: SeatColorGroupMatchType;
    invitedByValues: string[];
    priority: number;
    order: number;
    isOrphaned: boolean;
  }> {
    return inputs.map((g) => ({
      name: g.name,
      style: { ...g.style },
      matchType: g.matchType,
      invitedByValues: g.invitedByValues,
      priority: g.priority,
      order: g.order,
      isOrphaned: false,
    }));
  }

  private generateDefaultSeatColorGroups(invitedByOptions: string[]): Array<{
    name: string;
    style: Record<string, string>;
    matchType: SeatColorGroupMatchType;
    invitedByValues: string[];
    priority: number;
    order: number;
    isOrphaned: boolean;
  }> {
    const groups: Array<{
      name: string;
      style: Record<string, string>;
      matchType: SeatColorGroupMatchType;
      invitedByValues: string[];
      priority: number;
      order: number;
      isOrphaned: boolean;
    }> = [];

    invitedByOptions.forEach((option, index) => {
      const style = DEFAULT_SEAT_COLOR_STYLES[index % DEFAULT_SEAT_COLOR_STYLES.length];
      groups.push({
        name: option,
        style: { ...style },
        matchType: SeatColorGroupMatchType.SINGLE,
        invitedByValues: [option],
        priority: index + 1,
        order: index,
        isOrphaned: false,
      });
    });

    groups.push({
      name: 'Alle',
      style: { ...ALL_GROUP_STYLE },
      matchType: SeatColorGroupMatchType.ALL,
      invitedByValues: [...invitedByOptions],
      priority: invitedByOptions.length + 1,
      order: invitedByOptions.length,
      isOrphaned: false,
    });

    groups.push({
      name: 'Keine',
      style: { ...NONE_GROUP_STYLE },
      matchType: SeatColorGroupMatchType.NONE,
      invitedByValues: [],
      priority: invitedByOptions.length + 2,
      order: invitedByOptions.length + 1,
      isOrphaned: false,
    });

    return groups;
  }

  private prismaGroupsToDTOs(
    groups: Array<{
      id: string;
      name: string;
      style: unknown;
      matchType: string;
      invitedByValues: unknown;
      priority: number;
      order: number;
      isOrphaned: boolean;
    }>,
  ): SeatColorGroupDTO[] {
    return groups.map((g) => {
      const style = g.style as {
        background: string;
        foreground: string;
        border: string;
        legendIcon: string;
      };
      return {
        id: g.id,
        name: g.name,
        style: {
          background: style.background,
          foreground: style.foreground,
          border: style.border,
          legendIcon: style.legendIcon,
        },
        matchType: g.matchType as SeatColorGroupDTO['matchType'],
        invitedByValues: g.invitedByValues as string[],
        priority: g.priority,
        order: g.order,
        isOrphaned: g.isOrphaned,
      };
    });
  }

  private async loadEventPayload(eventId: string, actorId?: string): Promise<EventPayload> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        settings: {
          include: { seatColorGroups: true },
        },
      },
    });

    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    const actorRole = actorId
      ? await this.prisma.role.findUnique({
          where: { userId_eventId: { userId: actorId, eventId } },
          select: { role: true },
        })
      : null;

    return EventMapper.toPayload(event, actorRole?.role ?? UserRoleType.ADMIN);
  }

  // ─────────────────────────────────────────────
  // CREATE EVENT
  // ─────────────────────────────────────────────

  async createEvent(
    input: CreateEventInput,
    actor: AuthenticatedUserProjection,
  ): Promise<EventPayload> {
    return TraceRunner.run('[SERVICE] createEvent', async () => {
      const actorId = actor.id;
      this.log.info('Creating event [actor=%s, name=%s]', actorId, input.name);

      let parent = null;
      let depth = 0;
      let path: string = '';

      if (input.parentId) {
        parent = await this.prisma.event.findUnique({
          where: { id: input.parentId },
          include: { settings: true },
        });

        if (!parent) {
          throw new EventNotFoundError(input.parentId);
        }

        depth = parent.depth + 1;
      }

      const childIds: string[] = [];

      const { event: result, settings: createSettings } = await this.prisma.$transaction(
        async (tx) => {
          await this.userProjectionService.upsertAuthenticatedUser(actor, tx);

          /**
           * -------------------------------------------------------
           * 1. CREATE ROOT EVENT
           * -------------------------------------------------------
           */
          const event = await tx.event.create({
            data: {
              name: input.name,
              owner: actorId,
              tags: normalizeTags(input.tags),
              parentId: input.parentId,
              depth,
              path: '',
            },
          });

          path = parent?.path ? `${parent.path}.${event.id}` : event.id;

          await tx.event.update({
            where: { id: event.id },
            data: { path },
          });

          /**
           * -------------------------------------------------------
           * 2. ROLE
           * -------------------------------------------------------
           */
          await tx.role.upsert({
            where: { userId_eventId: { userId: actorId, eventId: event.id } },
            create: {
              userId: actorId,
              eventId: event.id,
              role: UserRoleType.ADMIN,
            },
            update: { role: UserRoleType.ADMIN },
          });

          await this.rbacService.ensureSystemRoles(event.id, tx);

          /**
           * -------------------------------------------------------
           * 3. SETTINGS (PARENT)
           * -------------------------------------------------------
           */
          const parentSettings = input.settings
            ? await tx.settings.create({
                data: {
                  eventId: event.id,
                  ...input.settings,
                  ticketReleaseAt: input.settings.scheduleTicketRelease
                    ? (input.settings.ticketReleaseAt ?? null)
                    : null,
                  seatColorGroups: {
                    create: input.settings.seatColorGroups
                      ? this.inputToPrismaCreate(input.settings.seatColorGroups)
                      : this.generateDefaultSeatColorGroups(input.settings.invitedByOptions),
                  },
                },
                include: { seatColorGroups: true },
              })
            : parent?.settings
              ? await tx.settings.findUnique({
                  where: { id: parent.settings.id },
                  include: { seatColorGroups: true },
                })
              : undefined;

          /**
           * -------------------------------------------------------
           * 4. CHILDREN HANDLING
           * -------------------------------------------------------
           */
          if (input.children?.length) {
            const children = input.children;

            const parentMaxSeats = parentSettings?.maxSeats ?? 50;

            const childrenWithSeats = children.filter((c) => c.settings?.maxSeats != null);

            let seatDistribution: number[];

            /**
             * CASE A: NO CHILD SEATS → DISTRIBUTE
             */
            if (childrenWithSeats.length === 0) {
              const base = Math.floor(parentMaxSeats / children.length);
              let remainder = parentMaxSeats % children.length;

              seatDistribution = children.map(() => {
                const seats = base + (remainder > 0 ? 1 : 0);
                if (remainder > 0) {
                  remainder--;
                }
                return seats;
              });
            } else {
              /**
               * CASE B: CUSTOM SEATS
               */
              const total = children.reduce((sum, c) => sum + (c.settings?.maxSeats ?? 0), 0);

              if (total > parentMaxSeats) {
                throw new SeatAllocationExceededError(parentMaxSeats, total);
              }

              seatDistribution = children.map((c) => c.settings?.maxSeats ?? 0);
            }

            /**
             * -------------------------------------------------------
             * CREATE CHILDREN
             * -------------------------------------------------------
             */
            if (children.length > 0) {
              for (let i = 0; i < children.length; i++) {
                const childInput = children[i];
                const seats = seatDistribution[i];

                if (childInput === undefined) {
                  continue;
                }

                const child = await tx.event.create({
                  data: {
                    name: childInput.name,
                    owner: actorId,
                    tags: normalizeTags(childInput.tags),
                    parentId: event.id,
                    depth: depth + 1,
                    path: '',
                  },
                });

                childIds.push(child.id);

                const childPath = `${path}.${child.id}`;

                await tx.event.update({
                  where: { id: child.id },
                  data: { path: childPath },
                });

                /**
                 * SETTINGS (inherit or override)
                 */
                await tx.settings.create({
                  data: SettingsCreateMapper.from({
                    dto: childInput.settings,
                    parent: parentSettings,
                    eventId: child.id,
                    override: {
                      maxSeats: seats,
                    },
                  }),
                });
                /**
                 * ROLE (inherit admin)
                 */
                await tx.role.upsert({
                  where: { userId_eventId: { userId: actorId, eventId: child.id } },
                  create: {
                    userId: actorId,
                    eventId: child.id,
                    role: UserRoleType.ADMIN,
                  },
                  update: { role: UserRoleType.ADMIN },
                });

                await this.rbacService.ensureSystemRoles(child.id, tx);
              }
            }
          }

          /**
           * -------------------------------------------------------
           * TIMELINE
           * -------------------------------------------------------
           */
          await tx.timeline.create({
            data: {
              eventId: event.id,
              type: 'event-created',
              timestamp: new Date(),
              label: 'Event created',
            },
          });

          await this.analyticsOutbox.enqueue(tx, 'event.created.v1', {
            eventName: 'EventCreated',
            aggregateId: event.id,
            aggregateType: 'event',
            subjectId: actorId,
            properties: {
              category: parentSettings?.category ?? 'GENERAL',
              childCount: childIds.length,
              hasParent: Boolean(input.parentId),
            },
          });

          return { event, settings: parentSettings };
        },
      );

      /**
       * -------------------------------------------------------
       * ASYNC EVENTS (Kafka)
       * -------------------------------------------------------
       */
      const s = createSettings;

      if (!s) {
        throw new Error('Event settings not found after creation');
      }

      const eventCreatedPayload = {
        eventId: result.id,
        name: result.name,
        endsAt: s.endsAt.toISOString(),
        approvalMode: s.approvalMode,
        maxSeats: s.maxSeats,
        requireApprovalForPlusOnes: s.requireApprovalForPlusOnes,
        startsAt: s.startsAt.toISOString(),
        allowPublicRsvp: s.allowPublicRsvp,
        allowPublicPlusOne: s.allowPublicPlusOne,
        allowGuestSeatSelection: s.allowGuestSeatSelection,
        scheduleTicketRelease: s.scheduleTicketRelease,
        ticketReleaseAt: s.ticketReleaseAt?.toISOString(),
        rsvpDeadline: s.rsvpDeadline?.toISOString(),
        category: s.category,
        visibleTabs: s.visibleTabs as unknown as EventVisibleTab[],
        seatColorGroups: (s as Record<string, unknown>).seatColorGroups
          ? this.prismaGroupsToDTOs(
              (s as Record<string, unknown>).seatColorGroups as Array<{
                id: string;
                name: string;
                style: unknown;
                matchType: string;
                invitedByValues: unknown;
                priority: number;
                order: number;
                isOrphaned: boolean;
              }>,
            )
          : undefined,
        occurredAt: new Date().toISOString(),
      } satisfies EventCreatedWithPlusOneApprovalDTO;

      void this.kafkaProducerService.send({
        topic: KafkaTopics.event.created,
        payload: eventCreatedPayload,
        meta: this.meta(actorId, 'Create Event Settings'),
      });

      void this.kafkaProducerService.send({
        topic: KafkaTopics.seat.create,
        payload: {
          eventId: result.id,
          maxSeats: input.settings?.maxSeats ?? 50,
          actorId,
        },
        meta: {
          clazz: this.constructor.name,
          type: 'EVENT',
          service: 'event-service',
          operation: 'Create Event',
          version: '1',
          actorId,
          tenantId: env.DEFAULT_TENANT_ID,
        },
      });

      if (input.address) {
        void this.kafkaProducerService.send({
          topic: KafkaTopics.address.createEventAddress,
          payload: {
            ...input.address,
            eventId: result.id,
          },
          meta: {
            clazz: this.constructor.name,
            type: 'EVENT',
            service: 'event-service',
            operation: 'Create Event Address',
            version: '1',
            actorId,
            tenantId: env.DEFAULT_TENANT_ID,
          },
        });
      }

      const allEventIds = [result.id, ...childIds];
      const now = new Date().toISOString();

      await Promise.all(
        allEventIds.map((eventId) =>
          this.rbacService.publishCurrentAccess(eventId, actorId, actorId),
        ),
      );

      for (const eventId of allEventIds) {
        void this.kafkaProducerService.send({
          topic: KafkaTopics.event.roleAssigned,
          payload: {
            eventId,
            userId: actorId,
            role: EventRoleType.ADMIN,
            assignedBy: actorId,
            occurredAt: now,
          } satisfies EventRoleAssignedDTO,
          meta: this.meta(actorId, 'Create Event Role'),
        });
      }

      void this.kafkaProducerService.send({
        topic: KafkaTopics.event.ownerChanged,
        payload: {
          eventId: result.id,
          oldOwnerId: '',
          newOwnerId: actorId,
          changedBy: actorId,
          occurredAt: now,
        } satisfies EventOwnerChangedDTO,
        meta: this.meta(actorId, 'Create Event Owner'),
      });

      return EventMapper.toPayload(result, UserRoleType.ADMIN);
    });
  }

  // ─────────────────────────────────────────────
  // UPDATE EVENT
  // ─────────────────────────────────────────────
  async updateEvent(input: UpdateEventInput, actorId: string): Promise<EventPayload> {
    return TraceRunner.run('[SERVICE] updateEvent', async () => {
      this.log.info('Updating event: eventId=%s | actorId=%s', input.eventId, actorId);

      const txResult = await this.prisma.$transaction(async (tx) => {
        /**
         * STEP 1: Load event
         */
        const event = await tx.event.findUnique({
          where: { id: input.eventId },
        });

        if (!event) {
          throw new EventNotFoundError(input.eventId);
        }

        /**
         * STEP 2: Parent handling
         */
        let parentData: Partial<typeof event> = {};

        if (input.parentId !== undefined) {
          if (input.parentId === input.eventId) {
            throw new EventValidationError('Event cannot be its own parent', {
              eventId: input.eventId,
            });
          }

          if (input.parentId) {
            const parent = await tx.event.findUnique({
              where: { id: input.parentId },
            });

            if (!parent) {
              throw new EventNotFoundError(input.parentId);
            }

            if (parent.path && event.path && parent.path.startsWith(event.path)) {
              throw new EventValidationError('Cycle detected in event hierarchy', {
                eventId: input.eventId,
                parentId: input.parentId,
              });
            }

            parentData = {
              parentId: input.parentId,
              depth: (parent.depth ?? 0) + 1,
              path: parent.path ? `${parent.path}.${event.id}` : event.id,
            };
          }
        }

        /**
         * STEP 3: Update event
         */
        await tx.event.update({
          where: { id: input.eventId },
          data: {
            ...(input.name != null && {
              name: input.name,
            }),
            ...(input.tags != null && {
              tags: normalizeTags(input.tags),
            }),
            ...parentData,
          },
        });

        /**
         * STEP 4: Settings patch
         */
        if (input.settings) {
          const s = input.settings;

          await tx.settings.update({
            where: { eventId: input.eventId },
            data: {
              ...(s.startsAt !== undefined && {
                startsAt: s.startsAt ? new Date(s.startsAt) : undefined,
              }),
              ...(s.endsAt !== undefined && {
                endsAt: s.endsAt ? new Date(s.endsAt) : undefined,
              }),
              ...(s.allowReEntry !== undefined && {
                allowReEntry: s.allowReEntry,
              }),
              ...(s.rotateSeconds !== undefined && {
                rotateSeconds: s.rotateSeconds,
              }),
              ...(s.maxSeats !== undefined && {
                maxSeats: s.maxSeats,
              }),
              ...(s.dressCode !== undefined && {
                dressCode: s.dressCode,
              }),
              ...(s.description !== undefined && {
                description: s.description,
              }),
              ...(s.isActive !== undefined && {
                isActive: s.isActive,
              }),
              ...(s.allowPublicRsvp !== undefined && {
                allowPublicRsvp: s.allowPublicRsvp,
              }),
              ...(s.allowPublicPlusOne !== undefined && {
                allowPublicPlusOne: s.allowPublicPlusOne,
              }),
              ...(s.allowPublicRsvpWebsite !== undefined && {
                allowPublicRsvpWebsite: s.allowPublicRsvpWebsite,
              }),
              ...(s.allowPlusOneUpdate !== undefined && {
                allowPlusOneUpdate: s.allowPlusOneUpdate,
              }),
              ...(s.maxPlusOnes !== undefined && {
                maxPlusOnes: s.maxPlusOnes,
              }),
              ...(s.requireApprovalForPlusOnes !== undefined && {
                requireApprovalForPlusOnes: s.requireApprovalForPlusOnes,
              }),
              ...(s.rsvpDeadline !== undefined && {
                rsvpDeadline: s.rsvpDeadline ? new Date(s.rsvpDeadline) : null,
              }),
              ...(s.approvalMode !== undefined && {
                approvalMode: s.approvalMode,
              }),
              ...(s.allowGuestSeatSelection !== undefined && {
                allowGuestSeatSelection: s.allowGuestSeatSelection,
              }),
              ...(s.allowSeatOverbooking !== undefined && {
                allowSeatOverbooking: s.allowSeatOverbooking,
              }),
              ...(s.isPublic !== undefined && {
                isPublic: s.isPublic,
              }),
              ...(s.publicRsvpWebsite !== undefined && {
                publicRsvpWebsite: s.publicRsvpWebsite,
              }),
              ...(s.category !== undefined && {
                category: s.category,
              }),
              ...(s.scheduleTicketRelease !== undefined && {
                scheduleTicketRelease: s.scheduleTicketRelease,
              }),
              ...((s.ticketReleaseAt !== undefined || s.scheduleTicketRelease === false) && {
                ticketReleaseAt:
                  s.scheduleTicketRelease === false
                    ? null
                    : s.ticketReleaseAt
                      ? new Date(s.ticketReleaseAt)
                      : null,
              }),

              ...(s.invitedByOptions !== undefined && {
                invitedByOptions: s.invitedByOptions,
              }),
              ...(s.visibleTabs !== undefined && {
                visibleTabs: s.visibleTabs,
              }),
            },
          });

          /**
           * Handle seatColorGroups
           */
          if (s.seatColorGroups !== undefined) {
            const settingsId = await tx.settings.findUnique({
              where: { eventId: input.eventId },
              select: { id: true },
            });

            if (settingsId) {
              await tx.seatColorGroup.deleteMany({
                where: { settingsId: settingsId.id },
              });

              if (s.seatColorGroups.length > 0) {
                await tx.seatColorGroup.createMany({
                  data: this.inputToPrismaCreate(s.seatColorGroups).map((g) => ({
                    ...g,
                    settingsId: settingsId.id,
                  })),
                });
              }
            }
          } else if (s.invitedByOptions !== undefined) {
            /**
             * Auto-sync: invitedByOptions changed without explicit seatColorGroups
             */
            const existingSettings = await tx.settings.findUnique({
              where: { eventId: input.eventId },
              include: { seatColorGroups: true },
            });

            if (existingSettings?.seatColorGroups) {
              const existing = existingSettings.seatColorGroups;
              const oldOptions = existing
                .filter((g) => g.matchType === SeatColorGroupMatchType.SINGLE)
                .map((g) => (g.invitedByValues as string[])[0])
                .filter((o): o is string => o != null);

              const newOptions = s.invitedByOptions;
              const addedOptions = newOptions.filter((o) => !oldOptions.includes(o));
              const removedOptions = oldOptions.filter((o) => !newOptions.includes(o));

              for (const option of addedOptions) {
                const style =
                  DEFAULT_SEAT_COLOR_STYLES[existing.length % DEFAULT_SEAT_COLOR_STYLES.length];
                await tx.seatColorGroup.create({
                  data: {
                    settingsId: existingSettings.id,
                    name: option,
                    style: { ...style },
                    matchType: SeatColorGroupMatchType.SINGLE,
                    invitedByValues: [option],
                    priority: existing.length + 1,
                    order: existing.length,
                    isOrphaned: false,
                  },
                });
              }

              if (removedOptions.length > 0) {
                await tx.seatColorGroup.updateMany({
                  where: {
                    settingsId: existingSettings.id,
                    matchType: SeatColorGroupMatchType.SINGLE,
                    name: { in: removedOptions },
                  },
                  data: { isOrphaned: true },
                });
              }

              const allGroup = existing.find((g) => g.matchType === SeatColorGroupMatchType.ALL);
              if (allGroup) {
                await tx.seatColorGroup.update({
                  where: { id: allGroup.id },
                  data: { invitedByValues: newOptions },
                });
              }
            }
          }
        }

        /**
         * STEP 5: Return FULL ENTITY (CRITICAL)
         */
        const updated = await tx.event.findUnique({
          where: { id: input.eventId },
          include: {
            settings: {
              include: { seatColorGroups: true },
            },
            roles: true,
            timelines: true,
          },
        });

        if (!updated) {
          throw new EventNotFoundError(input.eventId);
        }

        /**
         * STEP 6: Audit log
         */
        // await tx.eventAuditLog.create({
        //   data: {
        //     eventId: input.eventId,
        //     actorId,
        //     action: 'event.updated',
        //     data: JSON.parse(JSON.stringify(input)),
        //   },
        // });

        await this.analyticsOutbox.enqueue(tx, 'event.updated.v1', {
          eventName: 'EventUpdated',
          aggregateId: updated.id,
          aggregateType: 'event',
          subjectId: actorId,
          properties: {
            changedFields: Object.keys(input).filter((field) => field !== 'eventId'),
          },
        });

        return {
          payload: EventMapper.toPayload(updated, UserRoleType.ADMIN),
          settings: updated.settings,
        };
      });

      const updatedSettings = txResult.settings;

      if (updatedSettings) {
        const seatColorGroups = (updatedSettings as Record<string, unknown>).seatColorGroups
          ? this.prismaGroupsToDTOs(
              (updatedSettings as Record<string, unknown>).seatColorGroups as Array<{
                id: string;
                name: string;
                style: unknown;
                matchType: string;
                invitedByValues: unknown;
                priority: number;
                order: number;
                isOrphaned: boolean;
              }>,
            )
          : undefined;

        const eventUpdatedPayload = {
          eventId: input.eventId,
          name: txResult.payload.name,
          endsAt: updatedSettings.endsAt.toISOString(),
          approvalMode: updatedSettings.approvalMode,
          maxSeats: updatedSettings.maxSeats,
          requireApprovalForPlusOnes: updatedSettings.requireApprovalForPlusOnes,
          startsAt: updatedSettings.startsAt.toISOString(),
          allowPublicRsvp: updatedSettings.allowPublicRsvp,
          allowPublicPlusOne: updatedSettings.allowPublicPlusOne,
          allowGuestSeatSelection: updatedSettings.allowGuestSeatSelection,
          scheduleTicketRelease: updatedSettings.scheduleTicketRelease,
          ticketReleaseAt: updatedSettings.ticketReleaseAt?.toISOString(),
          rsvpDeadline: updatedSettings.rsvpDeadline?.toISOString(),
          category: updatedSettings.category,
          visibleTabs: updatedSettings.visibleTabs as unknown as EventVisibleTab[],
          seatColorGroups,
          occurredAt: new Date().toISOString(),
        } satisfies EventUpdatedWithPlusOneApprovalDTO;

        void this.kafkaProducerService.send({
          topic: KafkaTopics.event.updated,
          payload: eventUpdatedPayload,
          meta: this.meta(actorId, 'Update Event Settings'),
        });
      }

      return txResult.payload;
    });
  }

  /**
   * Deletes a SINGLE event (incl. children).
   *
   * Internally reuses bulk logic to guarantee consistency.
   */
  async deleteEvent(eventId: string, actorId: string): Promise<boolean> {
    return TraceRunner.run('[SERVICE] deleteEvent', async () => {
      this.log.warn('Delete single event=%s', eventId);

      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, owner: true },
      });

      if (!event) {
        throw new EventNotFoundError(eventId);
      }

      if (event.owner !== actorId) {
        throw new EventAccessDeniedError(eventId, 'owner-required');
      }

      const eventIds = await this.collectAllEventIds([eventId]);

      /**
       * Reuse same pipeline as bulk delete
       */
      await this.deleteEventsByIds(eventIds, actorId);
      return true;
    });
  }

  /**
   * INTERNAL: shared deletion pipeline.
   */
  private async deleteEventsByIds(eventIds: string[], actorId: string): Promise<void> {
    this.log.debug('deleteEventsByIds=%o', eventIds);

    /**
     * 1. Load roles once
     */
    const roles = await this.prisma.role.findMany({
      where: { eventId: { in: eventIds } },
      select: { userId: true, role: true },
    });

    /**
     * 2. Deduplicate users
     */

    const admins = [
      ...new Set(roles.filter((r) => r.role === UserRoleType.ADMIN).map((r) => r.userId)),
    ];

    const security = [
      ...new Set(roles.filter((r) => r.role === UserRoleType.SECURITY).map((r) => r.userId)),
    ];

    const guests = [
      ...new Set(roles.filter((r) => r.role === UserRoleType.GUEST).map((r) => r.userId)),
    ];

    /**
     * 3. Kafka fan-out (critical for consistency)
     */
    await Promise.all([
      this.kafkaProducerService.send({
        topic: KafkaTopics.invitation.deleteEventInvitations,
        payload: { eventIds },
        meta: this.meta(actorId, 'delete invitations'),
      }),
      this.kafkaProducerService.send({
        topic: KafkaTopics.ticket.deleteEventTickets,
        payload: { eventIds },
        meta: this.meta(actorId, 'delete tickets'),
      }),
      this.kafkaProducerService.send({
        topic: KafkaTopics.seat.delete,
        payload: { eventIds },
        meta: this.meta(actorId, 'delete seats'),
      }),
      this.kafkaProducerService.send({
        topic: KafkaTopics.notification.eventCancelled,
        payload: { eventIds, admins, security, guests },
        meta: this.meta(actorId, 'notify cancel'),
      }),
      this.kafkaProducerService.send({
        topic: KafkaTopics.address.deleteEventAddress,
        payload: { eventIds },
        meta: {
          clazz: this.constructor.name,
          type: 'EVENT',
          service: 'event-service',
          operation: 'Delete Event Address',
          version: '1',
          actorId,
          tenantId: env.DEFAULT_TENANT_ID,
        },
      }),
      this.kafkaProducerService.send({
        topic: KafkaTopics.event.deleted,
        payload: { eventIds },
        meta: this.meta(actorId, 'Delete Event'),
      }),
    ]);

    /**
     * 4. Delete from DB (cascade handles children relations)
     */
    await this.prisma.$transaction(async (tx) => {
      await tx.event.deleteMany({
        where: { id: { in: eventIds } },
      });
      for (const eventId of eventIds) {
        await this.analyticsOutbox.enqueue(tx, 'event.deleted.v1', {
          eventName: 'EventDeleted',
          aggregateId: eventId,
          aggregateType: 'event',
          subjectId: actorId,
          properties: {},
        });
      }
    });

    this.log.debug('Events deleted events=%o. |actorId=%s', eventIds, actorId);

    // this.log.warn('Bulk delete completed for owner=%s', ownerId);
  }

  /**
   * Recursively resolves event hierarchy.
   */
  private async collectAllEventIds(rootIds: string[]): Promise<string[]> {
    const all = new Set<string>(rootIds);

    let queue = [...rootIds];

    while (queue.length > 0) {
      const children = await this.prisma.event.findMany({
        where: {
          parentId: { in: queue },
        },
        select: { id: true },
      });

      const ids = children.map((c) => c.id);

      ids.forEach((id) => all.add(id));

      queue = ids;
    }

    return Array.from(all);
  }

  /**
   * Standard Kafka metadata builder.
   */
  private meta(actorId: string, operation: string): KafkaMetaInfo {
    const type: EventType = 'EVENT';
    return {
      actorId,
      tenantId: env.DEFAULT_TENANT_ID,
      service: 'event-service',
      operation,
      version: '1',
      type,
    };
  }
  /**
   * Deletes ALL events owned by a specific user.
   *
   * Includes:
   * - root events
   * - all children (hierarchy)
   * - fan-out deletion events to other services
   */
  async deleteEvents(ownerId: string, actorId: string): Promise<void> {
    return TraceRunner.run('[SERVICE] deleteEvents', async () => {
      this.log.warn('Bulk delete events for owner=%s', ownerId);

      /**
       * SECURITY: only owner can bulk delete
       */
      // if (ownerId !== actorId) {
      //   throw new Error('Only the owner can delete their events');
      // }

      /**
       * 1. Fetch all root events of owner
       */
      const rootEvents = await this.prisma.event.findMany({
        where: { owner: ownerId },
        select: { id: true },
      });

      if (rootEvents.length === 0) {
        this.log.warn('No events found for owner=%s', ownerId);
        return;
      }

      /**
       * 2. Resolve full hierarchy (root + children)
       */
      const eventIds = await this.collectAllEventIds(rootEvents.map((e) => e.id));

      this.log.debug('Resolved events to delete: %o', eventIds);

      await this.deleteEventsByIds(eventIds, actorId);
    });
  }

  /**
   * Assigns a user to an event with the given role.
   * Uses UPSERT for atomic create/update logic.
   */
  async assignUserToEvent(input: AssignUserRoleDTO): Promise<EventPayload> {
    return TraceRunner.run('[SERVICE] assignUserToEvent', async () => {
      this.log.info('Assign User to Event %o', { input });
      const { userId, eventId, eventRole: role } = input;

      // Ensure event exists (optional but recommended)
      const eventExists = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });

      if (!eventExists) {
        throw new EventNotFoundError(input.eventId);
      }

      await this.userProjectionService.requireUsers([userId]);

      await this.prisma.$transaction([
        this.prisma.role.upsert({
          where: { userId_eventId: { userId, eventId } },
          create: { userId, eventId, role },
          update: { role },
        }),
        // this.prisma.eventAuditLog.create({
        //   data: {
        //     eventId,
        //     actorId,
        //     action: 'USER_ROLE_ASSIGNED',
        //     data: { targetUserId: userId, role },
        //   },
        // }),
      ]);

      await this.rbacService.syncLegacyRoleAssignment(eventId, userId, role, input.actorId);

      void this.kafkaProducerService.send({
        topic: KafkaTopics.event.roleAssigned,
        payload: {
          eventId,
          userId,
          role: role as unknown as EventRoleType,
          assignedBy: input.actorId,
          occurredAt: new Date().toISOString(),
        } satisfies EventRoleAssignedDTO,
        meta: this.meta(input.actorId, 'Assign Event Role'),
      });

      return this.loadEventPayload(eventId, input.actorId);
    });
  }

  /**
   * Removes a user from an event.
   * - Prevents removing the event owner
   * - Atomic delete + audit log
   */
  async removeUserFromEvent(
    input: RemoveUserFromEventInput,
    actorId: string,
  ): Promise<EventPayload> {
    this.log.info('Remove User from Event %o', { actorId, input });

    const { userId: targetUserId, eventId } = input;

    // 1) Load event and both roles (actor + target)
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        owner: true,
        roles: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    // Owner check (target)
    if (event.owner === targetUserId) {
      throw new EventAccessDeniedError(eventId, 'owner-cannot-be-removed');
    }

    // Determine roles
    const targetRole = event.roles.find((r) => r.userId === targetUserId);
    const actorRole = event.roles.find((r) => r.userId === actorId);

    if (!targetRole) {
      throw new EventMemberNotFoundError(eventId, targetUserId);
    }

    if (input.eventRole !== targetRole.role) {
      throw new EventValidationError('Event role does not match target member role', {
        eventId,
        userId: targetUserId,
        expectedRole: input.eventRole,
        actualRole: targetRole.role,
      });
    }

    // 2) Permission Matrix

    // If actor is NOT owner AND tries to remove an admin → forbidden
    if (targetRole.role === UserRoleType.ADMIN && actorId !== event.owner) {
      throw new EventAccessDeniedError(eventId, 'owner-required-to-remove-admin');
    }

    // If actor is NOT admin or owner → forbidden
    const isActorAdminOrOwner = actorRole?.role === UserRoleType.ADMIN || actorId === event.owner;
    if (!isActorAdminOrOwner) {
      throw new EventAccessDeniedError(eventId, 'insufficient-role');
    }

    // If actor is admin and tries to remove an admin → forbidden
    if (
      actorRole?.role === UserRoleType.ADMIN &&
      targetRole.role === UserRoleType.ADMIN &&
      actorId !== event.owner
    ) {
      throw new EventAccessDeniedError(eventId, 'admin-peer-removal-forbidden');
    }

    // Owner removing owner (self removal) is forbidden
    if (actorId === event.owner && targetUserId === event.owner) {
      throw new EventAccessDeniedError(eventId, 'owner-cannot-self-remove');
    }

    // 3) Execute deletion + audit log
    await this.prisma.$transaction([
      this.prisma.role.delete({
        where: { userId_eventId: { userId: targetUserId, eventId } },
      }),

      // this.prisma.eventAuditLog.create({
      //   data: {
      //     eventId,
      //     actorId,
      //     action: 'USER_ROLE_REMOVED',
      //     data: { targetUserId, actorId },
      //   },
      // }),
    ]);

    await this.rbacService.removeAllRolesForUser(eventId, targetUserId, actorId);

    void this.kafkaProducerService.send({
      topic: KafkaTopics.event.roleRemoved,
      payload: {
        eventId,
        userId: targetUserId,
        oldRole: targetRole.role as unknown as EventRoleType,
        removedBy: actorId,
        occurredAt: new Date().toISOString(),
      } satisfies EventRoleRemovedDTO,
      meta: this.meta(actorId, 'Remove Event Role'),
    });

    return this.loadEventPayload(eventId, actorId);
  }

  async transferEventOwnership(
    eventId: string,
    newOwnerId: string,
    actorId: string,
  ): Promise<void> {
    this.log.info('Transfer Ownership from %s to %s, Event=%s', actorId, newOwnerId, eventId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { owner: true },
    });

    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    // Only current owner can transfer ownership
    if (event.owner !== actorId) {
      throw new EventAccessDeniedError(eventId, 'owner-required');
    }

    // Owner cannot transfer to themselves
    if (newOwnerId === event.owner) {
      throw new EventValidationError('User already owns this event', {
        eventId,
        userId: newOwnerId,
      });
    }

    await this.userProjectionService.requireUsers([newOwnerId, event.owner]);

    await this.prisma.$transaction([
      // 1️⃣ new owner gets ADMIN rights
      this.prisma.role.upsert({
        where: { userId_eventId: { userId: newOwnerId, eventId } },
        create: { userId: newOwnerId, eventId, role: UserRoleType.ADMIN },
        update: { role: UserRoleType.ADMIN },
      }),

      // 2️⃣ old owner stays ADMIN or becomes ADMIN? Up to your business logic.
      // recommended: stay ADMIN
      this.prisma.role.upsert({
        where: { userId_eventId: { userId: event.owner, eventId } },
        create: { userId: event.owner, eventId, role: UserRoleType.ADMIN },
        update: { role: UserRoleType.ADMIN },
      }),

      // 3️⃣ update owner field
      this.prisma.event.update({
        where: { id: eventId },
        data: { owner: newOwnerId },
      }),

      // 4️⃣ audit log
      // this.prisma.eventAuditLog.create({
      //   data: {
      //     eventId,
      //     actorId,
      //     action: 'OWNER_TRANSFERRED',
      //     data: { oldOwner: event.owner, newOwner: newOwnerId },
      //   },
      // }),
    ]);

    await this.rbacService.syncLegacyRoleAssignment(
      eventId,
      newOwnerId,
      UserRoleType.ADMIN,
      actorId,
    );
    await this.rbacService.syncLegacyRoleAssignment(
      eventId,
      event.owner,
      UserRoleType.ADMIN,
      actorId,
    );

    void this.kafkaProducerService.send({
      topic: KafkaTopics.event.ownerChanged,
      payload: {
        eventId,
        oldOwnerId: event.owner,
        newOwnerId,
        changedBy: actorId,
        occurredAt: new Date().toISOString(),
      } satisfies EventOwnerChangedDTO,
      meta: this.meta(actorId, 'Transfer Event Ownership'),
    });
  }

  async activateEvent(eventId: string, actorId: string): Promise<boolean> {
    this.log.info('Activate Event %o', { actorId, eventId });

    await this.prisma.$transaction(async (tx) => {
      await tx.settings.update({
        where: { eventId },
        data: { isActive: true },
      });
      await tx.timeline.create({
        data: {
          eventId,
          type: 'event-activated',
          timestamp: new Date(),
          label: 'Event activated',
        },
      });
      await this.analyticsOutbox.enqueue(tx, 'event.activated.v1', {
        eventName: 'EventActivated',
        aggregateId: eventId,
        aggregateType: 'event',
        subjectId: actorId,
        properties: {},
      });
    });

    // await this.prisma.eventAuditLog.create({
    //   data: {
    //     eventId,
    //     actorId,
    //     action: 'EVENT_ACTIVATED',
    //   },
    // });

    return true;
  }

  async deactivateEvent(eventId: string, actorId: string): Promise<boolean> {
    this.log.info('Deactivate Event %o', { actorId, eventId });
    await this.prisma.$transaction(async (tx) => {
      await tx.settings.update({
        where: { eventId },
        data: { isActive: false },
      });
      await tx.timeline.create({
        data: {
          eventId,
          type: 'event-deactivated',
          timestamp: new Date(),
          label: 'Event deactivated',
        },
      });
      await this.analyticsOutbox.enqueue(tx, 'event.deactivated.v1', {
        eventName: 'EventDeactivated',
        aggregateId: eventId,
        aggregateType: 'event',
        subjectId: actorId,
        properties: {},
      });
    });

    // await this.prisma.eventAuditLog.create({
    //   data: {
    //     eventId,
    //     actorId,
    //     action: 'EVENT_DEACTIVATED',
    //   },
    // });

    return true;
  }

  async addTimelines(
    eventId: string,
    inputs: CreateTimelineInput[],
    actorId: string,
  ): Promise<EventPayload> {
    this.log.debug('addTimelines: inputs: %o | actor=%satisfies', inputs, actorId);

    return TraceRunner.run('[SERVICE] addTimelines', async () => {
      if (!inputs.length) {
        throw new EventValidationError('No timelines provided', { eventId });
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.timeline.createMany({
          data: inputs.map((i) => ({
            eventId,
            type: i.type,
            timestamp: new Date(i.timestamp),
            label: i.label,
          })),
        });
      });

      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new EventNotFoundError(eventId);
      }

      return EventMapper.toPayload(event, UserRoleType.ADMIN);
    });
  }

  async updateTimelines(
    eventId: string,
    inputs: UpdateTimelineInput[],
    actorId: string,
  ): Promise<EventPayload> {
    return TraceRunner.run('[SERVICE] updateTimelines', async () => {
      this.log.debug('updateTimelines: inputs: %o | actor=%satisfies', inputs, actorId);
      if (!inputs.length) {
        throw new EventValidationError('No timelines provided', { eventId });
      }

      const timelines = await this.prisma.timeline.findMany({
        where: {
          id: { in: inputs.map((i) => i.id) },
        },
      });

      if (timelines.length !== inputs.length) {
        throw new EventTimelineNotFoundError(
          eventId,
          inputs.map((input) => input.id),
        );
      }

      const eventIdFound = eventId === timelines[0]?.eventId ? eventId : undefined;

      await this.prisma.$transaction(
        inputs.map((i) =>
          this.prisma.timeline.update({
            where: { id: i.id },
            data: {
              type: i.type,
              timestamp: new Date(i.timestamp),
              label: i.label,
            },
          }),
        ),
      );

      const event = await this.prisma.event.findUnique({
        where: { id: eventIdFound },
      });

      if (!event) {
        throw new EventNotFoundError(eventId);
      }

      return EventMapper.toPayload(event, UserRoleType.ADMIN);
    });
  }

  async removeTimelines(
    eventId: string,
    inputs: RemoveTimelineInput[],
    actorId: string,
  ): Promise<EventPayload> {
    return TraceRunner.run('[SERVICE] removeTimelines', async () => {
      this.log.debug('removeTimlines: inputs: %o | actor=%satisfies', inputs, actorId);
      if (!inputs.length) {
        throw new EventValidationError('No timeline IDs provided', { eventId });
      }

      const timelines = await this.prisma.timeline.findMany({
        where: {
          id: { in: inputs.map((i) => i.id) },
        },
      });

      if (!timelines.length) {
        throw new EventTimelineNotFoundError(
          eventId,
          inputs.map((input) => input.id),
        );
      }

      const eventIdFound = eventId === timelines[0]?.eventId ? eventId : undefined;

      await this.prisma.timeline.deleteMany({
        where: {
          id: { in: inputs.map((i) => i.id) },
        },
      });

      const event = await this.prisma.event.findUnique({
        where: { id: eventIdFound },
      });

      if (!event) {
        throw new EventNotFoundError(eventId);
      }

      return EventMapper.toPayload(event, UserRoleType.ADMIN);
    });
  }

  async setTimelines(input: SetTimelineInput, actorId: string): Promise<EventPayload> {
    return TraceRunner.run('[SERVICE] setTimelines', async () => {
      this.log.debug('SetTimelineInput: inputs: %o | actor=%satisfies', input, actorId);

      const { eventId, timelines } = input;

      this.log.info('Set timelines eventId=%s count=%d', eventId, timelines.length);

      // ─────────────────────────────────────────────
      // 1. VALIDATION
      // ─────────────────────────────────────────────

      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new EventNotFoundError(eventId);
      }

      // ─────────────────────────────────────────────
      // 2. LOAD CURRENT STATE
      // ─────────────────────────────────────────────

      const existing = await this.prisma.timeline.findMany({
        where: { eventId },
      });

      const existingMap = new Map(existing.map((t) => [t.id, t]));

      // ─────────────────────────────────────────────
      // 3. DIFF LOGIC
      // ─────────────────────────────────────────────

      const toCreate: typeof timelines = [];
      const toUpdate: TimelineUpsertInput[] = [];
      const inputIds = new Set<string>();

      for (const t of timelines) {
        if (!t.id) {
          toCreate.push(t);
          continue;
        }

        inputIds.add(t.id);

        const existingItem = existingMap.get(t.id);

        if (!existingItem) {
          throw new EventTimelineNotFoundError(eventId, [t.id]);
        }

        // Only update if changed (optional optimization)
        const hasChanged =
          existingItem.type !== t.type ||
          existingItem.label !== t.label ||
          existingItem.timestamp.getTime() !== new Date(t.timestamp).getTime();

        if (hasChanged) {
          toUpdate.push(t);
        }
      }

      // DELETE = everything in DB not in input
      const toDelete = existing.filter((t) => !inputIds.has(t.id)).map((t) => t.id);

      this.log.debug('Diff result', {
        create: toCreate.length,
        update: toUpdate.length,
        delete: toDelete.length,
      });

      // ─────────────────────────────────────────────
      // 4. TRANSACTION (ATOMIC)
      // ─────────────────────────────────────────────

      await this.prisma.$transaction(async (tx) => {
        // CREATE
        if (toCreate.length) {
          await tx.timeline.createMany({
            data: toCreate.map((t) => ({
              eventId,
              type: t.type,
              timestamp: new Date(t.timestamp),
              label: t.label,
            })),
          });
        }

        // UPDATE
        for (const t of toUpdate) {
          await tx.timeline.update({
            where: { id: t.id },
            data: {
              type: t.type,
              timestamp: new Date(t.timestamp),
              label: t.label,
            },
          });
        }

        // DELETE
        if (toDelete.length) {
          await tx.timeline.deleteMany({
            where: { id: { in: toDelete } },
          });
        }
      });

      // ─────────────────────────────────────────────
      // 5. (OPTIONAL) REALTIME / KAFKA
      // ─────────────────────────────────────────────

      // void this.kafkaProducerService.send({
      //   topic: KafkaTopics.event.timelineUpdated,
      //   payload: {
      //     eventId,
      //     actorId,
      //     created: toCreate.length,
      //     updated: toUpdate.length,
      //     deleted: toDelete.length,
      //   },
      //   meta: this.meta(actorId, 'timeline replace'),
      // });

      return EventMapper.toPayload(event, UserRoleType.ADMIN);
    });
  }

  async recordMilestone(input: EventMilestoneRecordedDTO): Promise<void> {
    await TraceRunner.run('[SERVICE] recordMilestone', async () => {
      const event = await this.prisma.event.findUnique({
        where: { id: input.eventId },
        select: { id: true },
      });
      if (!event) {
        throw new EventNotFoundError(input.eventId);
      }

      await this.prisma.timeline.upsert({
        where: { sourceId: input.milestoneId },
        create: {
          eventId: input.eventId,
          sourceId: input.milestoneId,
          referenceId: input.referenceId,
          type: input.type.toLowerCase().replaceAll('_', '-'),
          timestamp: new Date(input.occurredAt),
          label: input.label,
        },
        update: {},
      });
      this.log.info('Event milestone recorded', {
        eventId: input.eventId,
        milestoneId: input.milestoneId,
        type: input.type,
      });
    });
  }
}

function normalizeTags(tags: readonly string[] | undefined): string[] {
  if (!tags) {
    return [];
  }
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}
