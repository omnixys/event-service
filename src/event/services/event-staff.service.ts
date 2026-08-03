import { UserRoleType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventStaffPayload } from '../models/payloads/event-staff.payload.js';
import { EventRbacService } from './event-rbac.service.js';
import { UserProjectionService } from './user-projection.service.js';
import { Injectable } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { TraceRunner } from '@omnixys/observability-ts';

@Injectable()
export class EventStaffService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userProjectionService: UserProjectionService,
    private readonly rbacService: EventRbacService,
    private readonly omnixysLogger: OmnixysLogger,
  ) {
    this.logger = this.omnixysLogger.log(this.constructor.name);
  }

  async getStaff(eventId: string, _authToken?: string): Promise<EventStaffPayload[]> {
    return TraceRunner.run('[SERVICE] getEventStaff', async () => {
      this.logger.debug('Fetching staff for event', { eventId });

      const rows = await this.prisma.role.findMany({
        where: {
          eventId,
          role: { not: UserRoleType.GUEST },
        },
        select: { userId: true, role: true },
      });

      this.logger.debug('Staff roles resolved from DB', {
        eventId,
        count: rows.length,
      });

      const grouped = new Map<string, string[]>();
      for (const r of rows) {
        const existing = grouped.get(r.userId) ?? [];
        existing.push(r.role);
        grouped.set(r.userId, existing);
      }

      const userIds = Array.from(grouped.keys());

      await this.userProjectionService.ensureUsers(userIds);

      const projections = await this.userProjectionService.findByIds(userIds);
      const userMap = new Map(projections.map((u) => [u.id, u]));

      const results: EventStaffPayload[] = [];

      for (const [userId, roles] of grouped.entries()) {
        let permissions: string[] = [];
        try {
          const access = await this.rbacService.getAccessForUser(userId, eventId);
          permissions = [...access.permissions];
        } catch {
          this.logger.debug('Could not resolve permissions via RBAC, falling back to empty', {
            userId,
            eventId,
          });
        }

        const projection = userMap.get(userId);
        results.push({
          userId,
          roles,
          permissions,
          personalInfo: projection
            ? {
                firstName: projection.firstName ?? undefined,
                lastName: projection.lastName ?? undefined,
              }
            : undefined,
          email: projection?.email ?? undefined,
          phoneNumbers: projection?.primaryPhone
            ? [
                {
                  number: projection.primaryPhone,
                  type: undefined,
                  label: undefined,
                  isPrimary: true,
                },
              ]
            : undefined,
          username: projection?.username ?? undefined,
        });
      }

      return results;
    });
  }
}
