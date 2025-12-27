import {
  CurrentUser,
  CurrentUserData,
} from '../../auth/decorators/current-user.decorator.js';
import { CookieAuthGuard } from '../../auth/guards/cookie-auth.guard.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { EventReadService } from '../services/event-read.service.js';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, ID } from '@nestjs/graphql';

@Resolver(() => EventPayload)
export class EventQueryResolver {
  constructor(private readonly readService: EventReadService) {}

  @Query(() => EventPayload, { nullable: true })
  async event2(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EventPayload> {
    return this.readService.getEventById2(id);
  }

  @Query(() => EventPayload, { nullable: true })
  @UseGuards(CookieAuthGuard)
  async event(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload> {
    return this.readService.getEventById(id, currentUser.id);
  }

  @Query(() => [EventPayload])
  async events(): Promise<EventPayload[]> {
    return this.readService.getAllEvents();
  }

  @Query(() => [EventPayload], { name: 'myEvents' })
  @UseGuards(CookieAuthGuard)
  async getMyEvents(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload[]> {
    if (!currentUser?.id) {
      throw new UnauthorizedException('Not authenticated');
    }
    return this.readService.findMyEvents(currentUser.id);
  }

  @Query(() => [String], { name: 'myGuests' })
  async getMyGuests(
    @Args('eventId', { type: () => ID }) eventId: string,
  ): Promise<string[]> {
    return this.readService.findMyGuests(eventId);
  }
}
