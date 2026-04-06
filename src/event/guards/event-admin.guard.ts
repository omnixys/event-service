import { UserRoleType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventAccessService } from '../services/event-access.service.js';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class EventAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: EventAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.getArgByIndex(2).req ?? context.switchToHttp().getRequest();

    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Not authenticated');
    }

    const eventId =
      request.body?.variables?.eventId ??
      request.body?.variables?.input?.eventId;

    if (!eventId) {
      throw new ForbiddenException('EventId missing');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { owner: true },
    });

    if (!event) {
      throw new ForbiddenException('Event not found');
    }

    // ✅ OWNER ALWAYS WINS
    if (event.owner === user.id) {
      return true;
    }

    // 🔥 HIERARCHY ROLE CHECK
    const role = await this.accessService.resolveRole(eventId, user.id);

    if (role === UserRoleType.ADMIN) {
      return true;
    }

    throw new ForbiddenException('Not authorized for this event.');
  }
}
