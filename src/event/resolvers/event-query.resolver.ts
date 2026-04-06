import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';

import {
  CookieAuthGuard,
  CurrentUser,
  CurrentUserData,
} from '@omnixys/security';

import { EventPayload } from '../models/payloads/event.payload.js';
import { EventReadService } from '../services/event-read.service.js';
import { OmnixysLogger } from '@omnixys/logger';

@Resolver(() => EventPayload)
export class EventQueryResolver {
  private readonly logger;

  constructor(
    private readonly readService: EventReadService,
    private readonly omnixysLogger: OmnixysLogger,
  ) {
    this.logger = this.omnixysLogger.log(this.constructor.name);
  }

  // ─────────────────────────────────────────────
  // SINGLE EVENT
  // ─────────────────────────────────────────────

  @Query(() => EventPayload, { nullable: true })
  @UseGuards(CookieAuthGuard)
  async event(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload> {
    this.logger.debug('Query event requested', {
      eventId: id,
      userId: currentUser?.id,
    });

    if (!currentUser?.id) {
      this.logger.warn('Unauthorized event query attempt', { eventId: id });
      throw new UnauthorizedException('Not authenticated');
    }

    const event = await this.readService.getEventById(id, currentUser.id);

    this.logger.debug('Event query resolved', {
      eventId: id,
      userId: currentUser.id,
    });

    return event;
  }

  @Query(() => [EventPayload])
  @UseGuards(CookieAuthGuard)
  async eventChildren(@Args('eventId', { type: () => ID }) eventId: string) {
    return this.readService.getChildren(eventId);
  }

  @Query(() => [EventPayload])
  @UseGuards(CookieAuthGuard)
  async eventTree(
    @Args('eventId', { type: () => ID }) eventId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.readService.getTree(eventId, user.id);
  }

  // ─────────────────────────────────────────────
  // MY EVENTS
  // ─────────────────────────────────────────────

  @Query(() => [EventPayload], { name: 'myEvents' })
  @UseGuards(CookieAuthGuard)
  async getMyEvents(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload[]> {
    this.logger.debug('Query myEvents requested', {
      userId: currentUser?.id,
    });

    if (!currentUser?.id) {
      this.logger.warn('Unauthorized myEvents query attempt');
      throw new UnauthorizedException('Not authenticated');
    }

    const events = await this.readService.findMyEvents(currentUser.id);

    this.logger.debug('myEvents query resolved', {
      userId: currentUser.id,
      count: events.length,
    });

    return events;
  }

  // ─────────────────────────────────────────────
  // EVENT GUESTS
  // ─────────────────────────────────────────────

  @Query(() => [String], { name: 'eventGuests' })
  @UseGuards(CookieAuthGuard)
  async getEventGuests(
    @Args('eventId', { type: () => ID }) eventId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<string[]> {
    this.logger.debug('Query eventGuests requested', {
      eventId,
      userId: currentUser?.id,
    });

    if (!currentUser?.id) {
      this.logger.warn('Unauthorized eventGuests query attempt', { eventId });
      throw new UnauthorizedException('Not authenticated');
    }

    const guests = await this.readService.findMyGuests(eventId);

    this.logger.debug('eventGuests query resolved', {
      eventId,
      count: guests.length,
    });

    return guests;
  }
}
