import { EventPayload } from '../models/payloads/event.payload.js';
import { EventReadService } from '../services/event-read.service.js';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { EventRoleType, RealmRoleType } from '@omnixys/contracts';
import {
  CookieAuthGuard,
  CurrentUser,
  CurrentUserData,
  EventRoleGuard,
  EventRoles,
  RoleGuard,
  Roles,
} from '@omnixys/security';

@Resolver(() => EventPayload)
@UseGuards(CookieAuthGuard, RoleGuard, EventRoleGuard)
@Roles(RealmRoleType.USER)
@EventRoles(EventRoleType.ADMIN)
export class EventAdminQueryResolver {
  constructor(private readonly readService: EventReadService) {}

  @Query(() => EventPayload, { nullable: true, name: 'adminGetEvent' })
  async event(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EventPayload> {
    return this.readService.getEventByIdAsAdmin(id);
  }

  @Query(() => [EventPayload], { name: 'adminEvents' })
  async events(@CurrentUser() user: CurrentUserData): Promise<EventPayload[]> {
    return this.readService.getAllEvents(user.id);
  }
}
