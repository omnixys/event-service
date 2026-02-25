/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { KafkaProducerService } from '../../kafka/kafka-producer.service.js';
import { LoggerPlusService } from '../../logger/logger-plus.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { withSpan } from '../../trace/utils/span.utils.js';
import { UserRole } from '../models/enums/user-role.enum.js';
import { AssignUserRoleInput } from '../models/inputs/assign-user-role.input.js';
import { CreateEventInput } from '../models/inputs/create-event.input.js';
import { RemoveUserFromEventInput } from '../models/inputs/remove-user-from-event.input.js';
import { UpdateEventInput } from '../models/inputs/update-event.input.js';
import { EventMapper } from '../models/mapper/event.mapper.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { withAutoOrder } from '../utils/auto-order.util.js';
import { geocodeAddress } from '../utils/geocoding.util.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { trace, Tracer } from '@opentelemetry/api';

@Injectable()
export class EventWriteService {
  private readonly logger;
  private readonly tracer: Tracer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerService: LoggerPlusService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {
    this.logger = this.loggerService.getLogger(EventWriteService.name);
    this.tracer = trace.getTracer(EventWriteService.name);
  }

  // ─────────────────────────────────────────────
  // CREATE EVENT
  // ─────────────────────────────────────────────

  async createEvent(input: CreateEventInput, actorId: string): Promise<EventPayload> {
    return withSpan(this.tracer, this.logger, 'ticket.createTicket', async (span) => {
      // 1) Create event root
      const event = await this.prisma.event.create({
        data: {
          name: input.name,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          allowReEntry: input.allowReEntry,
          rotateSeconds: input.rotateSeconds,
          maxSeats: input.maxSeats,
          owner: actorId,
        },
      });

      this.logger.debug('createEvent: eventId: %s', event.id);

      // OPTIONAL: Grant ADMIN role to owner
      await this.prisma.userEventRole.upsert({
        where: { userId_eventId: { userId: actorId, eventId: event.id } },
        create: { userId: actorId, eventId: event.id, role: UserRole.ADMIN },
        update: { role: UserRole.ADMIN },
      });

      // 2) Address (Geocoding via OSM)
      if (input.address) {
        const { street, zip, city, country } = input.address;

        // vollständige Adresse bilden
        const fullAddress = [street, zip, city, country].filter(Boolean).join(' ');

        // Geocoding anfragen
        const geo = await geocodeAddress(fullAddress);

        await this.prisma.eventAddress.create({
          data: {
            eventId: event.id,
            street,
            zip,
            city,
            country,
            latitude: geo.lat,
            longitude: geo.lon,
          },
        });
      }

      // 3) Settings
      if (input.settings) {
        await this.prisma.eventSettings.create({
          data: {
            eventId: event.id,
            data: input.settings.data ?? {},
          },
        });
      }

      // 4) Theme
      if (input.theme) {
        await this.prisma.eventTheme.create({
          data: { eventId: event.id, ...input.theme },
        });
      }

      // 5) Media
      if (input.media?.length) {
        const mediaWithOrder = withAutoOrder(
          input.media.map((m) => ({
            eventId: event.id,
            ...m,
          })),
        );

        await this.prisma.eventMedia.createMany({
          data: mediaWithOrder,
        });
      }

      // 6) Description blocks
      if (input.description?.length) {
        const blocksWithOrder = withAutoOrder(
          input.description.map((b) => ({
            eventId: event.id,
            ...b,
          })),
        );

        await this.prisma.eventDescriptionBlock.createMany({
          data: blocksWithOrder,
        });
      }

      // 7) FAQ
      if (input.faqs?.length) {
        const faqsWithOrder = withAutoOrder(
          input.faqs.map((f) => ({
            eventId: event.id,
            ...f,
          })),
        );

        await this.prisma.eventFAQ.createMany({
          data: faqsWithOrder,
        });
      }

      // 8) Team
      if (input.timeline?.length) {
        const timelineWithOrder = withAutoOrder(
          input.timeline.map((t) => ({
            eventId: event.id,
            ...t,
          })),
        );

        await this.prisma.eventTimeline.createMany({
          data: timelineWithOrder,
        });
      }

      // 9) Timeline entry
      await this.prisma.eventTimeline.create({
        data: {
          eventId: event.id,
          type: 'event-created',
          timestamp: new Date(),
          label: 'Event erstellt',
        },
      });

      if (input.team?.length) {
        const teamWithOrder = withAutoOrder(
          input.team.map((t) => ({
            eventId: event.id,
            ...t,
          })),
        );

        await this.prisma.eventTeamMember.createMany({
          data: teamWithOrder,
        });
      }

      // 11)  Audit Log
      await this.prisma.eventAuditLog.create({
        data: {
          eventId: event.id,
          actorId,
          action: 'EVENT_CREATED',
        },
      });

      const sc = span.spanContext();

      void this.kafkaProducerService.generateSeats(
        {
          eventId: event.id,
          config: input.config,
          maxSeats: input.maxSeats,
          actorId,
        },
        'event.write-service',
        { traceId: sc.traceId, spanId: sc.spanId },
      );

      // 🔥 return mapped EventPayload
      return EventMapper.toPayload(event);
    });
  }

  // ─────────────────────────────────────────────
  // UPDATE EVENT
  // ─────────────────────────────────────────────

  async updateEvent(input: UpdateEventInput, actorId: string): Promise<EventPayload> {
    const exists = await this.prisma.event.findUnique({
      where: { id: input.id },
    });

    if (!exists) {
      throw new NotFoundException('Event does not exist');
    }

    const updated = await this.prisma.event.update({
      where: { id: input.id },
      data: {
        name: input.name ?? undefined,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        allowReEntry: input.allowReEntry ?? undefined,
        rotateSeconds: input.rotateSeconds ?? undefined,
        maxSeats: input.maxSeats ?? undefined,
      },
    });

    // ───── Audit Log serialization Fix
    await this.prisma.eventAuditLog.create({
      data: {
        eventId: input.id,
        actorId,
        action: 'event-updated',
        data: JSON.parse(JSON.stringify(input)), // → safe JSON
      },
    });

    return EventMapper.toPayload(updated);
  }

  // ─────────────────────────────────────────────
  // DELETE EVENT
  // ─────────────────────────────────────────────

  async deleteEvent(id: string, actorId: string): Promise<boolean> {
    const exists = await this.prisma.event.findUnique({
      where: { id, owner: actorId },
    });
    if (!exists) {
      throw new NotFoundException('Event does not exist');
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Assigns a user to an event with the given role.
   * Uses UPSERT for atomic create/update logic.
   */
  async assignUserToEvent(input: AssignUserRoleInput, actorId: string): Promise<void> {
    const { userId, eventId, eventRole: role } = input;

    // Ensure event exists (optional but recommended)
    const eventExists = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!eventExists) {
      throw new Error('Event not found');
    }

    await this.prisma.$transaction([
      this.prisma.userEventRole.upsert({
        where: { userId_eventId: { userId, eventId } },
        create: { userId, eventId, role },
        update: { role },
      }),
      this.prisma.eventAuditLog.create({
        data: {
          eventId,
          actorId,
          action: 'USER_ROLE_ASSIGNED',
          data: { targetUserId: userId, role },
        },
      }),
    ]);
  }

  /**
   * Removes a user from an event.
   * - Prevents removing the event owner
   * - Atomic delete + audit log
   */
  async removeUserFromEvent(input: RemoveUserFromEventInput, actorId: string): Promise<void> {
    const { userId: targetUserId, eventId } = input;

    // 1) Load event and both roles (actor + target)
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        owner: true,
        userRoles: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    // Owner check (target)
    if (event.owner === targetUserId) {
      throw new Error('Cannot remove the event owner.');
    }

    // Determine roles
    const targetRole = event.userRoles.find((r) => r.userId === targetUserId);
    const actorRole = event.userRoles.find((r) => r.userId === actorId);

    if (!targetRole) {
      throw new NotFoundException('User is not assigned to this event.');
    }

    // 2) Permission Matrix

    // If actor is NOT owner AND tries to remove an admin → forbidden
    if (targetRole.role === UserRole.ADMIN && actorId !== event.owner) {
      throw new Error('Only the event owner can remove an admin.');
    }

    // If actor is NOT admin or owner → forbidden
    const isActorAdminOrOwner = actorRole?.role === UserRole.ADMIN || actorId === event.owner;
    if (!isActorAdminOrOwner) {
      throw new Error('You are not allowed to remove users from this event.');
    }

    // If actor is admin and tries to remove an admin → forbidden
    if (
      actorRole?.role === UserRole.ADMIN &&
      targetRole.role === UserRole.ADMIN &&
      actorId !== event.owner
    ) {
      throw new Error('Admins cannot remove other admins.');
    }

    // Owner removing owner (self removal) is forbidden
    if (actorId === event.owner && targetUserId === event.owner) {
      throw new Error('The event owner cannot remove themselves.');
    }

    // 3) Execute deletion + audit log
    await this.prisma.$transaction([
      this.prisma.userEventRole.delete({
        where: { userId_eventId: { userId: targetUserId, eventId } },
      }),

      this.prisma.eventAuditLog.create({
        data: {
          eventId,
          actorId,
          action: 'USER_ROLE_REMOVED',
          data: { targetUserId, actorId },
        },
      }),
    ]);
  }

  async transferEventOwnership(
    eventId: string,
    newOwnerId: string,
    actorId: string,
  ): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { owner: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only current owner can transfer ownership
    if (event.owner !== actorId) {
      throw new Error('Only the event owner can transfer ownership.');
    }

    // Owner cannot transfer to themselves
    if (newOwnerId === event.owner) {
      throw new Error('User is already owner of this event.');
    }

    await this.prisma.$transaction([
      // 1️⃣ new owner gets ADMIN rights
      this.prisma.userEventRole.upsert({
        where: { userId_eventId: { userId: newOwnerId, eventId } },
        create: { userId: newOwnerId, eventId, role: UserRole.ADMIN },
        update: { role: UserRole.ADMIN },
      }),

      // 2️⃣ old owner stays ADMIN or becomes ADMIN? Up to your business logic.
      // recommended: stay ADMIN
      this.prisma.userEventRole.upsert({
        where: { userId_eventId: { userId: event.owner, eventId } },
        create: { userId: event.owner, eventId, role: UserRole.ADMIN },
        update: { role: UserRole.ADMIN },
      }),

      // 3️⃣ update owner field
      this.prisma.event.update({
        where: { id: eventId },
        data: { owner: newOwnerId },
      }),

      // 4️⃣ audit log
      this.prisma.eventAuditLog.create({
        data: {
          eventId,
          actorId,
          action: 'OWNER_TRANSFERRED',
          data: { oldOwner: event.owner, newOwner: newOwnerId },
        },
      }),
    ]);
  }

  async activateEvent(eventId: string, actorId: string): Promise<boolean> {
    await this.prisma.event.update({
      where: { id: eventId },
      data: { isActive: true },
    });

    await this.prisma.eventAuditLog.create({
      data: {
        eventId,
        actorId,
        action: 'EVENT_ACTIVATED',
      },
    });

    return true;
  }

  async deactivateEvent(eventId: string, actorId: string): Promise<boolean> {
    await this.prisma.event.update({
      where: { id: eventId },
      data: { isActive: false },
    });

    await this.prisma.eventAuditLog.create({
      data: {
        eventId,
        actorId,
        action: 'EVENT_DEACTIVATED',
      },
    });

    return true;
  }
}
