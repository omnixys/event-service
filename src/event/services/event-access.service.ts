import { UserRoleType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventRbacService } from './event-rbac.service.js';
import { Injectable } from '@nestjs/common';
import type { EventPermissionKey, EventRoleType } from '@omnixys/contracts-ts';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { EventPermissionResolver, EventRoleResolver } from '@omnixys/security-ts';

function mapToEventRoleType(role: UserRoleType | undefined): EventRoleType | null {
  if (!role) {
    return null;
  }

  switch (role) {
    case UserRoleType.ADMIN:
      return 'ADMIN' as EventRoleType;
    case UserRoleType.SECURITY:
      return 'SECURITY' as EventRoleType;
    case UserRoleType.GUEST:
      return 'GUEST' as EventRoleType;
    case UserRoleType.SUPPORT:
      return 'SUPPORT' as EventRoleType;
    case UserRoleType.DRIVER:
    case UserRoleType.USHER:
      return null;
    default:
      return null;
  }
}

@Injectable()
export class EventAccessService extends EventRoleResolver implements EventPermissionResolver {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: EventRbacService,
    private readonly omnixysLogger: OmnixysLogger,
  ) {
    super();
    this.logger = this.omnixysLogger.log(this.constructor.name);
  }

  async getRoleForUser(userId: string, eventId: string): Promise<EventRoleType | null> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      this.logger.debug('event_not_found_for_role_check', { userId, eventId });
      return null;
    }

    // Owner shortcut: event owner always has ADMIN access
    if (event.owner === userId) {
      this.logger.debug('user_is_owner_admin', { userId, eventId });
      return 'ADMIN' as EventRoleType;
    }

    const role = await this.resolveRole(eventId, userId);
    this.logger.debug('role_resolved', { userId, eventId, role: role ?? 'none' });
    return mapToEventRoleType(role);
  }

  // 🔥 ROOT OVERRIDE LOGIK
  async resolveRole(eventId: string, userId: string): Promise<UserRoleType | undefined> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return undefined;
    }

    const pathIds = event.path?.split('.') ?? [event.id];

    // ROOT → CHILD order
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
        return role.role;
      }
    }

    return undefined;
  }

  // 🔥 Permission Check
  hasRequiredRole(userRole: UserRoleType | undefined, requiredRoles: UserRoleType[]): boolean {
    if (!userRole) {
      return false;
    }

    return requiredRoles.includes(userRole);
  }

  async getPermissionsForUser(
    userId: string,
    eventId: string,
  ): Promise<readonly EventPermissionKey[]> {
    return this.rbacService.getPermissionKeysForUser(userId, eventId);
  }
}
