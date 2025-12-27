/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '../../prisma/prisma.service.js';
import { extractEventId } from '../utils/extract-event-id.util.js';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // GraphQL Request
    const gqlCtx = context.getArgByIndex(2);
    const req = gqlCtx?.req ?? context.switchToHttp().getRequest();

    const user = req.user;
    if (!user?.id) {
      throw new ForbiddenException('Not authenticated');
    }

    // Try to extract eventId from GraphQL Mutation Args/Input
    const eventId = extractEventId(req);

    if (!eventId) {
      throw new ForbiddenException(
        'EventOwnerGuard: No eventId provided in mutation.',
      );
    }

    // Load event + owner field
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, owner: true },
    });

    if (!event) {
      throw new NotFoundException(`Event not found: ${eventId}`);
    }

    // OWNER CHECK
    if (event.owner !== user.id) {
      throw new ForbiddenException(
        'Only the event owner may perform this action.',
      );
    }

    return true;
  }
}
