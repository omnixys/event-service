/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { Event, UserRoleType } from '../../prisma/generated//client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventTimelineMapper } from '../models/mapper/event-timeline.mapper.js';
import { EventMapper } from '../models/mapper/event.mapper.js';
import { mapMedia } from '../models/mapper/media.mapper.js';
import { UserEventRoleMapper } from '../models/mapper/user-event-role.mapper.js';
import { EventTreePayload } from '../models/payloads/event-tree.payload.js';
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
  // TODO opzimieren!!!
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
  async getEventByIdRsvp(id: string) {
    return TraceRunner.run('[SERVICE] getEventById', async () => {
      this.logger.debug('Fetching event for public rsvp eventId=%s', id);

      const event = await this.prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        this.logger.warn('Event not found', { eventId: id });
        throw new NotFoundException(`Event "${id}" not found`);
      }

      return EventMapper.toPayload(event);
    });
  }

  async getChildren(eventId: string): Promise<EventPayload[]> {
    return TraceRunner.run('[SERVICE] getChildren', async () => {
      this.logger.debug('Fetching direct children only', { eventId });

      /**
       * Only direct children
       * - No root
       * - No subtree
       */
      const children = await this.prisma.event.findMany({
        where: {
          parentId: eventId,
        },
        include: {
          settings: true,
        },

        orderBy: { createdAt: 'asc' },
      });

      this.logger.debug('Children resolved', {
        eventId,
        count: children.length,
      });

      return EventMapper.toPayloadList(children);
    });
  }

  async getTree(eventId: string, userId: string): Promise<EventTreePayload> {
    return TraceRunner.run('[SERVICE] getTree', async () => {
      this.logger.debug('Fetching full event tree', { eventId, userId });

      /**
       * 1. Load root
       */
      const root = await this.prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!root) {
        this.logger.warn('Root event not found %s', eventId);
        throw new NotFoundException(`Event "${eventId}" not found`);
      }

      /**
       * 3. Fetch subtree (delimiter-safe)
       */
      const events = await this.prisma.event.findMany({
        where: {
          OR: [
            { id: root.id },
            {
              path: {
                startsWith: root.id,
              },
            },
          ],
        },
        orderBy: [{ depth: 'asc' }, { createdAt: 'asc' }],
      });

      this.logger.debug('Tree resolved %o', {
        rootId: root.id,
        count: events.length,
      });

      /**
       * 4. Resolve roles
       */
      const roles = await this.resolveRolesBatch(events, userId);

      /**
       * 5. Map payload
       */
      const payloads = events.map((event, index) => EventMapper.toPayload(event, roles[index]));

      const rootEvent = payloads.find((e) => e.id === root.id);
      if (!rootEvent) {
        throw new NotFoundException(`Event "${eventId}" not found in tree`);
      }
      const subEvents = payloads.filter((e) => e.id !== root.id);

      return {
        rootEvent,
        subEvents,
      };
    });
  }

  async getPublicTree(eventId: string): Promise<EventTreePayload> {
    return TraceRunner.run('[SERVICE] getTree', async () => {
      this.logger.debug('Fetching full event tree | eventId=%s', eventId);

      /**
       * 1. Load root
       */
      const root = await this.prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!root) {
        this.logger.warn('Root event not found %s', eventId);
        throw new NotFoundException(`Event "${eventId}" not found`);
      }

      /**
       * 3. Fetch subtree (delimiter-safe)
       */
      const events = await this.prisma.event.findMany({
        where: {
          OR: [
            { id: root.id },
            {
              path: {
                startsWith: root.id,
              },
            },
          ],
        },
        orderBy: [{ depth: 'asc' }, { createdAt: 'asc' }],
      });

      this.logger.debug('Tree resolved %o', {
        rootId: root.id,
        count: events.length,
      });

      /**
       * 5. Map payload
       */
      const payloads = events.map((event) => EventMapper.toPayload(event));

      const rootEvent = payloads.find((e) => e.id === root.id);
      if (!rootEvent) {
        throw new NotFoundException(`Event "${eventId}" not found in tree`);
      }
      const subEvents = payloads.filter((e) => e.id !== root.id);

      return {
        rootEvent,
        subEvents,
      };
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
      this.logger.debug('Fetching user events (entry points)', { userId });

      /**
       * 1. Load direct roles
       */
      const directRoles = await this.prisma.role.findMany({
        where: { userId },
        select: { eventId: true },
      });

      if (directRoles.length === 0) {
        return [];
      }

      const eventIds = directRoles.map((r) => r.eventId);

      /**
       * 2. Load ONLY those events (no expansion!)
       */
      const events = await this.prisma.event.findMany({
        where: {
          id: { in: eventIds },
        },
        orderBy: { depth: 'asc' },
        include: {
          settings: true,
        },
      });

      if (events.length === 0) {
        return [];
      }

      /**
       * 3. Detect ROOT access
       *
       * depth === 0 → root node
       */
      const hasRootAccess = events.some((e) => e.depth === 0);

      /**
       * 4. Apply business rule
       */
      let filteredEvents = events;

      if (hasRootAccess) {
        /**
         * If user has ANY root → only show roots
         */
        filteredEvents = events.filter((e) => e.depth === 0);
      }

      this.logger.debug('findMyEvents result=%o', {
        userId,
        total: events.length,
        returned: filteredEvents.length,
        hasRootAccess,
      });

      /**
       * 5. Resolve roles ONLY for filtered set
       */
      const roles = await this.resolveRolesBatch(filteredEvents, userId);
      this.logger.debug('Resolved roles for filtered events %o', { roles });

      return filteredEvents.map((event, index) => EventMapper.toPayload(event, roles[index]));
    });
  }

  async findMyGuests(eventId: string): Promise<string[]> {
    return TraceRunner.run('[SERVICE] findMyGuests', async () => {
      this.logger.debug('Fetching guests for event', { eventId });

      const rows = await this.prisma.role.findMany({
        where: { eventId, role: 'GUEST' },
        select: { userId: true },
      });

      this.logger.debug('Guests resolved', {
        eventId,
        count: rows.length,
      });

      return rows.map((r) => r.userId);
    });
  }

  async getMedia(eventId: string) {
    return TraceRunner.run('[SERVICE] getMedia', async () => {
      this.logger.debug('Fetching media for event', { eventId });

      const media = await this.prisma.media.findMany({
        where: { eventId },
        include: {
          variants: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.debug('Media fetched', {
        eventId,
        count: media.length,
      });

      return media.map(mapMedia);
    });
  }

  async getSingleMedia(mediaId: string | null | undefined, context: string) {
    return TraceRunner.run(`[SERVICE] ${context}`, async () => {
      if (!mediaId) {
        this.logger.debug('No mediaId provided', { context });
        return null;
      }

      this.logger.debug('Fetching single media', {
        mediaId,
        context,
      });

      const media = await this.prisma.media.findUnique({
        where: { id: mediaId },
        include: {
          variants: {
            orderBy: { width: 'asc' },
          },
        },
      });

      if (!media) {
        this.logger.warn('Media not found', { mediaId, context });
        return null;
      }

      this.logger.debug('Media resolved', {
        mediaId,
        variants: media.variants.length,
      });

      return mapMedia(media);
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

      const pathIds = this.getPathIds(event);

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

      if (!event) {
        return undefined;
      }

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

  // TODO Optimieren!! unnötige redundanz
  async resolveRolesBatch(eventList: Event[], userId: string) {
    return TraceRunner.run('[SERVICE] resolveRolesBatch', async () => {
      this.logger.debug('resolveRolesBatch: eventList=%o userId=%s', eventList, userId);
      const allEventIds = new Set<string>();

      for (const event of eventList) {
        const ids = this.getPathIds(event);
        ids.forEach((id) => allEventIds.add(id));
      }

      const roles = await this.prisma.role.findMany({
        where: {
          userId,
          eventId: { in: Array.from(allEventIds) },
        },
      });

      this.logger.debug('Resolved inherited roles %o', { roles });

      const roleMap = new Map(roles.map((r) => [`${r.eventId}`, r.role]));

      return eventList.map((event) => {
        const ids = this.getPathIds(event);

        for (const id of ids) {
          const role = roleMap.get(id);
          if (role) {
            return role;
          }
        }

        return undefined;
      });
    });
  }

  private getPathIds(event: Event): string[] {
    if (!event.path?.trim()) {
      return [event.id];
    }

    return event.path
      .split('.')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }
}
