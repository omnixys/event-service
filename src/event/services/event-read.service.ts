// TODO resolve eslint

import { PrismaService } from '../../prisma/prisma.service.js';
import { Event } from '../models/entities/event.entity.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../models/enums/user-role.enum.js';

/**
 * EventReadService
 * -------------------------------------------------------------
 * Provides read-only access to Event entities from the database.
 * Uses Prisma for typed data retrieval.
 */
@Injectable()
export class EventReadService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liefert alle Events, für die der gegebene Benutzer irgendeine Rolle besitzt.
   * - Vollständig typisiert.
   * - Nutzt die Relation userRoles (UserEventRole).
   * - Early-return falls keine Rollen gefunden wurden.
   * - Sortiert Events korrekt nach startsAt.
   */
  async findMyEvents(userId: string): Promise<Event[]> {
    // 1️⃣ Alle Event-Beziehungen des Users holen
    const relations = await this.prisma.userEventRole.findMany({
      where: { userId },
      select: { eventId: true },
    });

    // IDs extrahieren + validieren
    const ids = [
      ...new Set(
        relations
          .map((r) => r.eventId)
          .filter(
            (id): id is string =>
              typeof id === 'string' && id.trim().length > 0,
          ),
      ),
    ];

    // 2️⃣ Wenn keine Events → sofort zurück
    if (ids.length === 0) {
      return [];
    }

    // 3️⃣ Events holen (geordnet)
    return this.prisma.event.findMany({
      where: { id: { in: ids } },
      orderBy: { startsAt: 'asc' },
    });
  }

  // Returns all events, ordered by start date
  async findAll(): Promise<Event[]> {
    return this.prisma.event.findMany({
      orderBy: { startsAt: 'asc' },
    });
  }

  // Returns a single event by its ID or throws if not found
  async findOne(id: string): Promise<Event> {
    const found = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!found) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    return found;
  }

  async findMyEventsByRole(
    userId: string,
    roles: UserRole[],
  ): Promise<Event[]> {
    const rel = await this.prisma.userEventRole.findMany({
      where: { userId, role: { in: roles } },
      select: { eventId: true },
    });

    const ids = [...new Set(rel.map((r) => r.eventId))];
    if (ids.length === 0) {
      return [];
    }

    return this.prisma.event.findMany({
      where: { id: { in: ids } },
      orderBy: { startsAt: 'asc' },
    });
  }
}
