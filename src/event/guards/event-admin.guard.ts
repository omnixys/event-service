import { UserRoleType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  EventAccessDeniedError,
  EventAuthenticationRequiredError,
  EventNotFoundError,
  EventValidationError,
} from '../errors/event-domain.error.js';
import { EventAccessService } from '../services/event-access.service.js';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

interface AuthenticatedUser {
  id: string;
}

interface GraphQLRequest {
  user?: AuthenticatedUser;
}

interface GraphQLContext {
  req?: GraphQLRequest;
}

@Injectable()
export class EventAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: EventAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);

    const ctx = gqlCtx.getContext<GraphQLContext>();
    const args = gqlCtx.getArgs<unknown>();

    const user = ctx.req?.user;

    if (!user?.id) {
      throw new EventAuthenticationRequiredError();
    }

    // ─────────────────────────────────────────────
    // 🔍 Extract eventId robustly
    // ─────────────────────────────────────────────

    const eventId = this.extractEventId(args);

    if (!eventId) {
      throw new EventValidationError('Event ID is required');
    }

    // ─────────────────────────────────────────────
    // 🔐 Authorization
    // ─────────────────────────────────────────────

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { owner: true },
    });

    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    // OWNER shortcut
    if (event.owner === user.id) {
      return true;
    }

    const role = await this.accessService.resolveRole(eventId, user.id);

    if (role === UserRoleType.ADMIN) {
      return true;
    }

    throw new EventAccessDeniedError(eventId, 'admin-role-required');
  }

  /**
   * Extracts eventId from GraphQL args in a schema-agnostic way.
   * Supports:
   * - input.eventId
   * - input[].eventId
   * - eventId (root arg)
   */
  private extractEventId(args: unknown): string | null {
    if (!this.isRecord(args)) {
      return null;
    }

    // Case 1: direct
    if (typeof args.eventId === 'string') {
      return args.eventId;
    }

    // Case 2: input object
    if (this.isRecord(args.input) && typeof args.input.eventId === 'string') {
      return args.input.eventId;
    }

    // Case 3: input array
    const input = args.input;
    if (Array.isArray(input)) {
      const first: unknown = input[0];

      if (!this.isRecord(first) || typeof first.eventId !== 'string') {
        return null;
      }

      // 🔥 Ensure all belong to same event (VERY IMPORTANT)
      const allSame = input.every(
        (item) => this.isRecord(item) && item.eventId === first.eventId,
      );

      if (!allSame) {
        throw new EventValidationError(
          'All timelines must belong to the same event',
        );
      }

      return first.eventId;
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
