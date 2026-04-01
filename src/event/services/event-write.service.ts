import { UserRoleType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AssignUserRoleInput } from '../models/inputs/assign-user-role.input.js';
import { CreateEventInput } from '../models/inputs/create-event.input.js';
import { RemoveUserFromEventInput } from '../models/inputs/remove-user-from-event.input.js';
import { UpdateEventInput } from '../models/inputs/update-event.input.js';
import { EventMapper } from '../models/mapper/event.mapper.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { KafkaProducerService, KafkaTopics } from '@omnixys/kafka';
import { OmnixysLogger } from '@omnixys/logger';

@Injectable()
export class EventWriteService {
  private readonly log;

  constructor(
    private readonly prisma: PrismaService,
    private readonly omnixysLogger: OmnixysLogger,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {
    this.log = this.omnixysLogger.log(this.constructor.name);
  }

  // ─────────────────────────────────────────────
  // CREATE EVENT
  // ─────────────────────────────────────────────

  async createEvent(input: CreateEventInput, actorId: string): Promise<EventPayload> {
    this.log.info('Creating event [actor=%s, name=%s]', actorId, input.name);
    this.log.debug('create input [%o]', input);

    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name: input.name,
          owner: actorId,
          parentId: input.parentId,
        },
      });

      this.log.debug('Event root created [eventId=%s]', event.id);

      // Owner role
      await tx.role.upsert({
        where: { userId_eventId: { userId: actorId, eventId: event.id } },
        create: { userId: actorId, eventId: event.id, role: UserRoleType.ADMIN },
        update: { role: UserRoleType.ADMIN },
      });

      // Settings
      if (input.settings) {
        await tx.settings.create({
          data: {
            eventId: event.id,
            ...input.settings,
          },
        });
      }

      // Timeline: initial entry
      await tx.timeline.create({
        data: {
          eventId: event.id,
          type: 'event-created',
          timestamp: new Date(),
          label: 'Event created',
        },
      });

      // Audit log
      // await tx.eventAuditLog.create({
      //   data: {
      //     eventId: event.id,
      //     actorId,
      //     action: 'EVENT_CREATED',
      //   },
      // });

      return event;
    });

    this.log.info('Event successfully created [eventId=%s actor=%s]', result.id, actorId);

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
        operation: 'Deleting Event Address',
        version: '1',
      },
    });

    if (input.address) {
      void this.kafkaProducerService.send({
        topic: KafkaTopics.address.createEventAddress,
        payload: input.address,
        meta: {
          clazz: this.constructor.name,
          type: 'EVENT',
          service: 'event-service',
          operation: 'Create Event Address',
          version: '1',
        },
      });
    }

    // 🔥 return mapped EventPayload
    return EventMapper.toPayload(result);
  }

  // ─────────────────────────────────────────────
  // UPDATE EVENT
  // ─────────────────────────────────────────────
  async updateEvent(input: UpdateEventInput, actorId: string): Promise<boolean> {
    this.log.info('Updating event %o', { actorId, eventId: input.eventId });
    const exists = await this.prisma.settings.findUnique({
      where: { eventId: input.eventId },
    });

    if (!exists) {
      throw new NotFoundException('Event does not exist');
    }

    if (input?.settings) {
      const { startsAt, endsAt, allowReEntry, rotateSeconds, maxSeats, description, dressCode } =
        input.settings;

      const updated = await this.prisma.settings.update({
        where: { eventId: input.eventId },
        data: {
          startsAt: startsAt ? new Date(startsAt) : undefined,
          endsAt: endsAt ? new Date(endsAt) : undefined,
          allowReEntry: allowReEntry ?? undefined,
          rotateSeconds: rotateSeconds ?? undefined,
          maxSeats: maxSeats ?? undefined,
          dressCode: dressCode ?? undefined,
          description: description ?? undefined,
        },
      });

      this.log.debug('Event Settings updated: settings= %o', updated);
    }
    // ───── Audit Log serialization Fix
    // await this.prisma.eventAuditLog.create({
    //   data: {
    //     eventId: input.id,
    //     actorId,
    //     action: 'event-updated',
    //     data: JSON.parse(JSON.stringify(input)), // → safe JSON
    //   },
    // });

    return true;
  }

  // ─────────────────────────────────────────────
  // DELETE EVENT
  // ─────────────────────────────────────────────
  async deleteEvent(id: string, actorId: string): Promise<boolean> {
    this.log.info('Delete Event %o', { actorId, id });
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { owner: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.owner !== actorId) {
      throw new Error('Only the owner can delete this event');
    }

    await this.prisma.$transaction([
      this.prisma.event.delete({ where: { id } }),
      // this.prisma.eventAuditLog.create({
      //   data: {
      //     eventId: id,
      //     actorId,
      //     action: 'EVENT_DELETED',
      //   },
      // }),
    ]);

    void this.kafkaProducerService.send<typeof KafkaTopics.seat.delete>({
      topic: KafkaTopics.seat.delete,
      payload: {
        eventId: id,
        actorId,
      },
      meta: {
        clazz: this.constructor.name,
        type: 'EVENT',
        service: 'event-service',
        operation: 'Deleting Seats',
        version: '1',
      },
    });

    void this.kafkaProducerService.send({
      topic: KafkaTopics.address.deleteEventAddress,
      payload: {
        eventId: id,
        actorId,
      },
      meta: {
        clazz: this.constructor.name,
        type: 'EVENT',
        service: 'event-service',
        operation: 'Delete Event Address',
        version: '1',
      },
    });

    this.log.warn('Event deleted', { eventId: id, actorId });

    return true;
  }

  /**
   * Assigns a user to an event with the given role.
   * Uses UPSERT for atomic create/update logic.
   */
  async assignUserToEvent(input: AssignUserRoleInput, actorId: string): Promise<void> {
    this.log.info('Assign User to Event %o', { actorId, input });
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
  }

  /**
   * Removes a user from an event.
   * - Prevents removing the event owner
   * - Atomic delete + audit log
   */
  async removeUserFromEvent(input: RemoveUserFromEventInput, actorId: string): Promise<void> {
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
      throw new NotFoundException('Event not found.');
    }

    // Owner check (target)
    if (event.owner === targetUserId) {
      throw new Error('Cannot remove the event owner.');
    }

    // Determine roles
    const targetRole = event.roles.find((r) => r.userId === targetUserId);
    const actorRole = event.roles.find((r) => r.userId === actorId);

    if (!targetRole) {
      throw new NotFoundException('User is not assigned to this event.');
    }

    // 2) Permission Matrix

    // If actor is NOT owner AND tries to remove an admin → forbidden
    if (targetRole.role === UserRoleType.ADMIN && actorId !== event.owner) {
      throw new Error('Only the event owner can remove an admin.');
    }

    // If actor is NOT admin or owner → forbidden
    const isActorAdminOrOwner = actorRole?.role === UserRoleType.ADMIN || actorId === event.owner;
    if (!isActorAdminOrOwner) {
      throw new Error('You are not allowed to remove users from this event.');
    }

    // If actor is admin and tries to remove an admin → forbidden
    if (
      actorRole?.role === UserRoleType.ADMIN &&
      targetRole.role === UserRoleType.ADMIN &&
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
  }

  async activateEvent(eventId: string, actorId: string): Promise<boolean> {
    this.log.info('Activate Event %o', { actorId, eventId });

    await this.prisma.settings.update({
      where: { eventId },
      data: { isActive: true },
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
    await this.prisma.settings.update({
      where: { eventId },
      data: { isActive: false },
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
}
