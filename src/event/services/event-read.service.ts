/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { PrismaService } from '../../prisma/prisma.service.js';
import { EventTimelineMapper } from '../models/mapper/event-timeline.mapper.js';
import { EventMapper } from '../models/mapper/event.mapper.js';
import { UserEventRoleMapper } from '../models/mapper/user-event-role.mapper.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger';

@Injectable()
export class EventReadService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly omnixysLogger: OmnixysLogger,
  ) {
    this.logger = this.omnixysLogger.log(this.constructor.name);
  }

  // ─────────────────────────────────────────────
  // EVENT
  // ─────────────────────────────────────────────

  async getEventById(id: string, userId: string) {
    this.logger.debug('Fetching event for user', { eventId: id, userId });

    const event = await this.findEventOrThrow(id, userId);

    const role = event.roles.find((r) => r.userId === userId)?.role;

    this.logger.debug('Resolved user role for event', {
      eventId: id,
      userId,
      role,
    });

    return EventMapper.toPayload(event, role);
  }

  async getEventByIdAsAdmin(id: string) {
    this.logger.debug('Fetching event as admin event=%s', id);

    const event = await this.findEventOrThrow(id, '', true);

    return EventMapper.toPayload(event);
  }

  async getAllEvents() {
    this.logger.debug('Fetching all events');

    const events = await this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    });

    this.logger.debug('Events fetched count: $s ', events.length);

    return EventMapper.toPayloadList(events);
  }

  // ─────────────────────────────────────────────
  // RELATIONS (Payload Mapped)
  // ─────────────────────────────────────────────

  async getTimeline(eventId: string) {
    this.logger.debug('Fetching event timeline event=%s', eventId);

    const list = await this.prisma.timeline.findMany({
      where: { eventId },
      orderBy: { timestamp: 'asc' },
    });

    this.logger.debug('Timeline entries fetched count: %s', list.length);

    return EventTimelineMapper.toPayloadList(list);
  }

  async getRoles(eventId: string) {
    this.logger.debug('Fetching event user roles [event=%s]', eventId);

    const list = await this.prisma.role.findMany({
      where: { eventId },
    });

    this.logger.debug('Roles fetched [count=%s]', list.length);

    return UserEventRoleMapper.toPayloadList(list);
  }

  // ─────────────────────────────────────────────
  // USER CONTEXT
  // ─────────────────────────────────────────────

  async findMyEvents(userId: string): Promise<EventPayload[]> {
    this.logger.debug('Fetching user events', { userId });

    const events = await this.prisma.event.findMany({
      where: {
        roles: {
          some: { userId },
        },
      },
      include: {
        roles: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    this.logger.debug('User events resolved', {
      userId,
      count: events.length,
    });

    return events.map((evt) => {
      const role = evt.roles[0]?.role;

      return EventMapper.toPayload(evt, role);
    });
  }

  async findMyGuests(eventId: string): Promise<string[]> {
    this.logger.debug('Fetching guests for event', { eventId });

    const rows = await this.prisma.role.findMany({
      where: { eventId },
      select: { userId: true },
    });

    this.logger.debug('Guests resolved', {
      eventId,
      count: rows.length,
    });

    return rows.map((r) => r.userId);
  }

  // ─────────────────────────────────────────────
  // INTERNAL
  // ─────────────────────────────────────────────

  private async findEventOrThrow(id: string, userId: string, isAdmin: boolean = false) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        roles: isAdmin
          ? true
          : {
              where: { userId },
              take: 1,
            },
        settings: true,
      },
    });

    if (!event) {
      this.logger.warn('Event not found', { eventId: id });
      throw new NotFoundException(`Event "${id}" not found`);
    }

    if (!isAdmin && event.roles.length === 0) {
      this.logger.warn('User tried to access event without role', {
        eventId: id,
        userId,
      });

      throw new ForbiddenException('You are not part of this event');
    }

    return event;
  }
}
