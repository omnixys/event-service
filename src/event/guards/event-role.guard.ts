import { UserRoleType } from '../../prisma/generated/client.js';
import { EVENT_ROLES_KEY } from '../decorators/event-roles.decorator.js';
import {
  EventAccessDeniedError,
  EventAuthenticationRequiredError,
  EventValidationError,
} from '../errors/event-domain.error.js';
import { EventAccessService } from '../services/event-access.service.js';
import { extractEventId } from '../utils/extract-event-id.util.js';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
export class EventRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessService: EventAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleType[]>(
      EVENT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext<GraphQLContext>();

    const req = ctx.req;
    const user = req?.user;
    if (!user) {
      throw new EventAuthenticationRequiredError();
    }

    const eventId = extractEventId(req);

    if (!eventId) {
      throw new EventValidationError('Event ID is required');
    }

    const role = await this.accessService.resolveRole(eventId, user.id);

    const allowed = this.accessService.hasRequiredRole(role, requiredRoles);

    if (!allowed) {
      throw new EventAccessDeniedError(eventId, 'required-event-role-missing');
    }

    return true;
  }
}
