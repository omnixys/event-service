import { UserRoleType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventAccessService } from '../services/event-access.service.js';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class EventAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: EventAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);

    const ctx = gqlCtx.getContext();
    const args = gqlCtx.getArgs();

    const request = ctx.req;
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Not authenticated');
    }

    // ─────────────────────────────────────────────
    // 🔍 Extract eventId robustly
    // ─────────────────────────────────────────────

    const eventId = this.extractEventId(args);

    if (!eventId) {
      throw new ForbiddenException('EventId missing');
    }

    // ─────────────────────────────────────────────
    // 🔐 Authorization
    // ─────────────────────────────────────────────

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { owner: true },
    });

    if (!event) {
      throw new ForbiddenException('Event not found');
    }

    // OWNER shortcut
    if (event.owner === user.id) {
      return true;
    }

    const role = await this.accessService.resolveRole(eventId, user.id);

    if (role === UserRoleType.ADMIN) {
      return true;
    }

    throw new ForbiddenException('Not authorized for this event.');
  }

  /**
   * Extracts eventId from GraphQL args in a schema-agnostic way.
   * Supports:
   * - input.eventId
   * - input[].eventId
   * - eventId (root arg)
   */
  private extractEventId(args: any): string | null {
    if (!args) return null;

    // Case 1: direct
    if (args.eventId) return args.eventId;

    // Case 2: input object
    if (args.input?.eventId) return args.input.eventId;

    // Case 3: input array
    if (Array.isArray(args.input)) {
      const first = args.input[0];

      if (!first?.eventId) return null;

      // 🔥 Ensure all belong to same event (VERY IMPORTANT)
      const allSame = args.input.every(
        (item: any) => item.eventId === first.eventId,
      );

      if (!allSame) {
        throw new ForbiddenException(
          'All timelines must belong to the same event',
        );
      }

      return first.eventId;
    }

    return null;
  }
}
