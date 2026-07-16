import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';

import {
  CookieAuthGuard,
  CurrentUser,
  CurrentUserData,
} from '@omnixys/security';

import { EventStaffPayload } from '../models/payloads/event-staff.payload.js';
import { EventStaffService } from '../services/event-staff.service.js';

@Resolver(() => EventStaffPayload)
export class EventStaffResolver {
  constructor(private readonly staffService: EventStaffService) {}

  @Query(() => [EventStaffPayload], { name: 'eventStaff' })
  @UseGuards(CookieAuthGuard)
  async getEventStaff(
    @Args('eventId', { type: () => ID }) eventId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventStaffPayload[]> {
    return this.staffService.getStaff(eventId, currentUser?.access_token);
  }
}
