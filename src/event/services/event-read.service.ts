/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { Event, UserRoleType } from '../../prisma/generated//client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventTimelineMapper } from '../models/mapper/event-timeline.mapper.js';
import { EventMapper } from '../models/mapper/event.mapper.js';
import { UserEventRoleMapper } from '../models/mapper/user-event-role.mapper.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger';
import { TraceRunner } from '@omnixys/observability';


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
    return TraceRunner.run('[SERVICE] getEventById', async () => {
      this.logger.debug('Fetching event for user', { eventId: id, userId });

      const { event, role } = await this.findEventOrThrow(id, userId);

      this.logger.debug('Resolved user role for event', {
        eventId: id,
        userId,
        role,
      });

      return EventMapper.toPayload(event, role);
    });
  }

  async getChildren(eventId: string): Promise<EventPayload[]> {
    return TraceRunner.run('[SERVICE] getChildren', async () => {
      const list = await this.prisma.event.findMany({
        where: { parentId: eventId },
        orderBy: { createdAt: 'asc' },
      });

      return EventMapper.toPayloadList(list);
    });
  }

  async getTree(eventId: string, userId: string): Promise<EventPayload[]> {
    return TraceRunner.run('[SERVICE] getTree', async () => {
      const root = await this.prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!root) throw new NotFoundException();

      if (!root.path) {
        // fallback → treat as root only
        return EventMapper.toPayloadList([root]);
      }

      const children = await this.prisma.event.findMany({
        where: {
          path: {
            startsWith: root.path,
          },
        },
        orderBy: { depth: 'asc' },
      });

      const roles = await this.resolveRolesBatch(children, userId);
      return children.map((event, index) => EventMapper.toPayload(event, roles[index]));
    });
  }

  async getEventByIdAsAdmin(id: string) {
    return TraceRunner.run('[SERVICE] findEventByIdAsAdmin', async () => {
      this.logger.debug('Fetching event as admin event=%s', id);

      const { event, role } = await this.findEventOrThrow(id, '', true);

      return EventMapper.toPayload(event, role);
    });
  }

  async getAllEvents(userId: string) {
    return TraceRunner.run('[SERVICE] getAllEvents', async () => {
      this.logger.debug('Fetching all events');

      const events = await this.prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
      });

      this.logger.debug('Events fetched count: $s ', events.length);

      const roles = await this.resolveRolesBatch(events, userId);
      return events.map((event, index) => EventMapper.toPayload(event, roles[index]));
    });
  }

  // ─────────────────────────────────────────────
  // RELATIONS (Payload Mapped)
  // ─────────────────────────────────────────────

  async getTimeline(eventId: string) {
    return TraceRunner.run('[SERVICE] getTimeLine', async () => {
      this.logger.debug('Fetching event timeline event=%s', eventId);

      const list = await this.prisma.timeline.findMany({
        where: { eventId },
        orderBy: { timestamp: 'asc' },
      });

      this.logger.debug('Timeline entries fetched count: %s', list.length);

      return EventTimelineMapper.toPayloadList(list);
    });
  }

  async getRoles(eventId: string) {
    return TraceRunner.run('[SERVICE] getRoles', async () => {
      this.logger.debug('Fetching event user roles [event=%s]', eventId);

      const list = await this.prisma.role.findMany({
        where: { eventId },
      });

      this.logger.debug('Roles fetched [count=%s]', list.length);

      return UserEventRoleMapper.toPayloadList(list);
    });
  }

  // ─────────────────────────────────────────────
  // USER CONTEXT
  // ─────────────────────────────────────────────

  async findMyEvents(userId: string): Promise<EventPayload[]> {
    return TraceRunner.run('[SERVICE] findMyEvents', async () => {
      this.logger.debug('Fetching user events (hierarchy)', { userId });

      // 1️⃣ Alle direkten Rollen holen
      const directRoles = await this.prisma.role.findMany({
        where: { userId },
        select: { eventId: true },
      });

      if (directRoles.length === 0) {
        return [];
      }

      const eventIds = directRoles.map((r) => r.eventId);

      // 2️⃣ Hole diese Events (für path)
      const baseEvents = await this.prisma.event.findMany({
        where: {
          id: { in: eventIds },
        },
        select: {
          id: true,
          path: true,
        },
      });

      // 3️⃣ Alle relevanten Paths sammeln
      const paths = baseEvents.map((e) => e.path).filter((p): p is string => !!p);

      if (paths.length === 0) {
        return [];
      }

      // 4️⃣ 🔥 ALLE CHILDREN holen
      const allEvents = await this.prisma.event.findMany({
        where: {
          OR: paths.map((p) => ({
            path: {
              startsWith: p,
            },
          })),
        },
        orderBy: { depth: 'asc' },
      });

      this.logger.debug('Expanded events via hierarchy', {
        userId,
        count: allEvents.length,
      });

      // 5️⃣ Rollen korrekt berechnen (Root Override!)
      const roles = await this.resolveRolesBatch(allEvents, userId);

      return allEvents.map((event, index) => EventMapper.toPayload(event, roles[index]));
    });
  }

  async findMyGuests(eventId: string): Promise<string[]> {
    return TraceRunner.run('[SERVICE] findMyGuests', async () => {
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
    });
  }

  // ─────────────────────────────────────────────
  // INTERNAL
  // ─────────────────────────────────────────────

  private async findEventOrThrow(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<{ event: Event; role?: UserRoleType }> {
    return TraceRunner.run('[SERVICE] findEventOrThrow', async () => {
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

      const pathIds = event.path?.split('.') ?? [event.id];

      for (const id of pathIds) {
        const role = await this.prisma.role.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: id,
            },
          },
        });

        if (role) {
          return { event, role: role.role };
        }
      }

      return { event, role: undefined };
    });
  }

  async resolveRole(eventId: string, userId: string) {
    return TraceRunner.run('[SERVICE] resolveRole', async () => {
      // 1. Lade Event
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) return undefined;

      // 2. Hole gesamten Pfad (root → ... → current)
      const pathIds = event.path?.split('.') ?? [event.id];

      // 🔥 Wichtig: ROOT zuerst prüfen!
      for (const id of pathIds) {
        const role = await this.prisma.role.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: id,
            },
          },
        });

        if (role) {
          return role.role; // ✅ Root gewinnt automatisch
        }
      }

      return undefined;
    });
  }

  async resolveRolesBatch(eventList: Event[], userId: string) {
    return TraceRunner.run('[SERVICE] resolveRolesBatch', async () => {
      const allEventIds = new Set<string>();

      for (const event of eventList) {
        const ids = event.path?.split('.') ?? [event.id];
        ids.forEach((id) => allEventIds.add(id));
      }

      const roles = await this.prisma.role.findMany({
        where: {
          userId,
          eventId: { in: Array.from(allEventIds) },
        },
      });

      const roleMap = new Map(roles.map((r) => [`${r.eventId}`, r.role]));

      return eventList.map((event) => {
        const ids = event.path?.split('.') ?? [event.id];

        for (const id of ids) {
          const role = roleMap.get(id);
          if (role) return role;
        }

        return undefined;
      });
    });
  }
}
