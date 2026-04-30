import { UserRoleType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventAccessService {
  constructor(private readonly prisma: PrismaService) {}

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
}
