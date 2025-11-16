import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { EventReadService } from '../services/event-read.service.js';
import { LoggerPlusService } from '../../logger/logger-plus.service.js';
import { Event } from '../models/entities/event.entity.js';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserData,
} from '../../auth/decorators/current-user.decorator.js';
import { CookieAuthGuard } from '../../auth/guards/cookie-auth.guard.js';

@Resolver(() => Event)
export class EventQueryResolver {
  private readonly logger;

  constructor(
    private readonly loggerService: LoggerPlusService,
    private readonly service: EventReadService,
  ) {
    this.logger = this.loggerService.getLogger(EventQueryResolver.name);
  }

  @Query(() => [Event], { name: 'events' })
  get(): Promise<Event[]> {
    return this.service.findAll();
  }

  @Query(() => Event, { name: 'event' })
  getById(@Args('id', { type: () => ID }) id: string): Promise<Event> {
    this.logger.debug('getById: id=%s', id);
    return this.service.findOne(id);
  }

  @Query(() => [Event], { name: 'getByEventAdmin' })
  @UseGuards(CookieAuthGuard)
  async getMyEvents(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<Event[]> {
    if (!currentUser?.id) {
      throw new UnauthorizedException('Not authenticated');
    }
    return this.service.findMyEvents(currentUser.id);
  }
}
