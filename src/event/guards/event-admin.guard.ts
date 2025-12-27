/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class EventAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.getArgByIndex(2).req ?? context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Not authenticated');
    }

    // Event ID is required, pass via decorator @EventId()
    const eventId =
      request.body?.variables?.eventId ??
      request.body?.variables?.input?.eventId;

    if (!eventId) {
      throw new ForbiddenException('EventId missing for EventAdminGuard');
    }

    // Load event
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { owner: true },
    });

    if (!event) {
      throw new ForbiddenException('Event not found');
    }

    // Owner always allowed
    if (event.owner === user.id) {
      return true;
    }

    // Check if user has ADMIN role
    const role = await this.prisma.userEventRole.findUnique({
      where: { userId_eventId: { userId: user.id, eventId } },
      select: { role: true },
    });

    if (role?.role === 'ADMIN') {
      return true;
    }

    throw new ForbiddenException('Not authorized for this event.');
  }
}
