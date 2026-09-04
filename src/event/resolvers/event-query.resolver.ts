import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';

import {
  CookieAuthGuard,
  CurrentUser,
  CurrentUserData,
} from '@omnixys/security-ts';

import { EventAuthenticationRequiredError } from '../errors/event-domain.error.js';
import { GeocodeAddressInput } from '../models/inputs/geocode-address.input.js';
import { EventTreePayload } from '../models/payloads/event-tree.payload.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { GeocodeResultPayload } from '../models/payloads/geocode-result.payload.js';
import { EventReadService } from '../services/event-read.service.js';
import { GeocodingService } from '../services/geocoding.service.js';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { TraceRunner } from '@omnixys/observability-ts';

@Resolver(() => EventPayload)
export class EventQueryResolver {
  private readonly logger;

  constructor(
    private readonly readService: EventReadService,
    private readonly geocoding: GeocodingService,
    private readonly omnixysLogger: OmnixysLogger,
  ) {
    this.logger = this.omnixysLogger.log(
      this.constructor.name,
      'service:event',
    );
  }

  @Query(() => GeocodeResultPayload, { nullable: true })
  @UseGuards(CookieAuthGuard)
  geocodeAddress(
    @Args('input') input: GeocodeAddressInput,
  ): Promise<GeocodeResultPayload | null> {
    return this.geocoding.geocode(input.address);
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
    this.logger.debug('Query event requested: %o', {
      eventId: id,
      userId: currentUser?.id,
    });

    if (!currentUser?.id) {
      this.logger.warn('Unauthorized event query attempt: %o', { eventId: id });
      throw new EventAuthenticationRequiredError();
    }

    const event = await this.readService.getEventById(id, currentUser.id);

    this.logger.debug('Event query resolved: %o', {
      eventId: id,
      userId: currentUser.id,
    });

    return event;
  }

  @Query(() => EventPayload, { nullable: true })
  async eventRsvp(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EventPayload> {
    return TraceRunner.run('[RESOLVER] eventRsvp', async () => {
      this.logger.debug(
        'Query event requested for public rsvp | eventId=%s',
        id,
      );

      const event = await this.readService.getEventByIdRsvp(id);
      return event;
    });
  }

  @Query(() => [EventPayload])
  async eventChildren(
    @Args('eventId', { type: () => ID }) eventId: string,
  ): Promise<EventPayload[]> {
    return this.readService.getChildren(eventId);
  }

  @Query(() => EventTreePayload)
  @UseGuards(CookieAuthGuard)
  async eventTree(
    @Args('eventId', { type: () => ID }) eventId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<EventTreePayload> {
    return this.readService.getTree(eventId, user.id);
  }

  @Query(() => EventTreePayload)
  async publicEventTree(
    @Args('eventId', { type: () => ID }) eventId: string,
  ): Promise<EventTreePayload> {
    return this.readService.getPublicTree(eventId);
  }

  // ─────────────────────────────────────────────
  // MY EVENTS
  // ─────────────────────────────────────────────
  @Query(() => [EventPayload], { name: 'myEvents' })
  @UseGuards(CookieAuthGuard)
  async getMyEvents(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload[]> {
    this.logger.debug('Query myEvents requested: %o', {
      userId: currentUser?.id,
    });

    if (!currentUser?.id) {
      this.logger.warn('Unauthorized myEvents query attempt');
      throw new EventAuthenticationRequiredError();
    }

    const events = await this.readService.findMyEvents(currentUser.id);

    this.logger.debug('myEvents query resolved %o', {
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
    this.logger.debug('Query eventGuests requested: %o', {
      eventId,
      userId: currentUser?.id,
    });

    if (!currentUser?.id) {
      this.logger.warn('Unauthorized eventGuests query attempt: %o', {
        eventId,
      });
      throw new EventAuthenticationRequiredError();
    }

    const guests = await this.readService.findMyGuests(eventId);

    this.logger.debug('eventGuests query resolved: %o', {
      eventId,
      count: guests.length,
    });

    return guests;
  }
}
