/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { LoggerPlusService } from '../../logger/logger-plus.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserRole } from '../models/enums/user-role.enum.js';
import { EventAddressMapper } from '../models/mapper/event-address.mapper.js';
import { EventAuditLogMapper } from '../models/mapper/event-audit-log.mapper.js';
import { EventDescriptionBlockMapper } from '../models/mapper/event-description-block.mapper.js';
import { EventFAQMapper } from '../models/mapper/event-faq.mapper.js';
import { EventMediaMapper } from '../models/mapper/event-media.mapper.js';
import { EventSettingsMapper } from '../models/mapper/event-settings.mapper.js';
import { EventTeamMapper } from '../models/mapper/event-team.mapper.js';
import { EventThemeMapper } from '../models/mapper/event-theme.mapper.js';
import { EventTimelineMapper } from '../models/mapper/event-timeline.mapper.js';
import { EventMapper } from '../models/mapper/event.mapper.js';
import { UserEventRoleMapper } from '../models/mapper/user-event-role.mapper.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class EventReadService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerService: LoggerPlusService,
  ) {
    this.logger = this.loggerService.getLogger(EventReadService.name);
  }

  // ─────────────────────────────────────────────
  // ROOT EVENTS
  // ─────────────────────────────────────────────

  async getEventById(id: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    const role = event.userRoles.find((role) => role.userId === userId)?.role;
    return EventMapper.toPayload(event, role as UserRole);
  }

  async getEventById2(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    return EventMapper.toPayload(event);
  }

  async getAllEvents() {
    const events = await this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return EventMapper.toPayloadList(events);
  }

  // ─────────────────────────────────────────────
  // RELATIONS (Payload Mapped)
  // ─────────────────────────────────────────────

  async getAddress(eventId: string) {
    const entity = await this.prisma.eventAddress.findUnique({
      where: { eventId },
    });
    return entity ? EventAddressMapper.toPayload(entity) : null;
  }

  async getSettings(eventId: string) {
    const entity = await this.prisma.eventSettings.findUnique({
      where: { eventId },
    });
    return entity ? EventSettingsMapper.toPayload(entity) : null;
  }

  async getTheme(eventId: string) {
    const entity = await this.prisma.eventTheme.findUnique({
      where: { eventId },
    });
    return entity ? EventThemeMapper.toPayload(entity) : null;
  }

  async getMedia(eventId: string) {
    const list = await this.prisma.eventMedia.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });

    return EventMediaMapper.toPayloadList(list);
  }

  async getDescriptionBlocks(eventId: string) {
    const list = await this.prisma.eventDescriptionBlock.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });

    return EventDescriptionBlockMapper.toPayloadList(list);
  }

  async getFaqs(eventId: string) {
    const list = await this.prisma.eventFAQ.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });
    return EventFAQMapper.toPayloadList(list);
  }

  async getTeam(eventId: string) {
    const list = await this.prisma.eventTeamMember.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });

    return EventTeamMapper.toPayloadList(list);
  }

  async getAuditLogs(eventId: string) {
    const list = await this.prisma.eventAuditLog.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    return EventAuditLogMapper.toPayloadList(list);
  }

  async getTimeline(eventId: string) {
    const list = await this.prisma.eventTimeline.findMany({
      where: { eventId },
      orderBy: { timestamp: 'asc' },
    });

    return EventTimelineMapper.toPayloadList(list);
  }

  async getUserRoles(eventId: string) {
    const list = await this.prisma.userEventRole.findMany({
      where: { eventId },
    });

    return UserEventRoleMapper.toPayloadList(list);
  }

  /**
   * Liefert alle Events, für die der gegebene Benutzer irgendeine Rolle besitzt.
   * - Liefert EventPayload[] inkl. myRole
   * - Nutzt userRoles-Relation
   * - Sortiert korrekt
   */
  async findMyEvents(userId: string): Promise<EventPayload[]> {
    this.logger.debug(`findMyEvents(${userId})`);

    // 1️⃣ Alle Event-Rollen des Users holen
    const relations = await this.prisma.userEventRole.findMany({
      where: { userId },
      select: {
        eventId: true,
        role: true,
      },
    });

    if (relations.length === 0) {
      return [];
    }

    // Event-IDs extrahieren
    const eventIds = [...new Set(relations.map((r) => r.eventId))];

    // 2️⃣ Events + userRoles für den User holen
    const events = await this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      orderBy: { startsAt: 'asc' },
      include: {
        userRoles: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    // 3️⃣ Payload bauen
    return events.map((evt) => {
      const prismaRole = evt.userRoles[0]?.role;

      return {
        ...EventMapper.toPayload(evt, prismaRole as UserRole),
      };
    });
  }

  async findMyGuests(eventId: string): Promise<string[]> {
    const rows = await this.prisma.userEventRole.findMany({
      where: { eventId },
      select: { userId: true },
    });

    return rows.map((r) => r.userId);
  }
}
