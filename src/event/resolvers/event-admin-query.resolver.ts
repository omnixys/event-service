import { EventPayload } from '../models/payloads/event.payload.js';
import { EventReadService } from '../services/event-read.service.js';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';

@Resolver(() => EventPayload)
export class EventQueryResolver {
  constructor(private readonly readService: EventReadService) {}

  @Query(() => EventPayload, { nullable: true, name: 'admin-getEvent' })
  async event(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EventPayload> {
    return this.readService.getEventByIdAsAdmin(id);
  }

  @Query(() => [EventPayload], { name: 'admin-events' })
  async events(): Promise<EventPayload[]> {
    return this.readService.getAllEvents();
  }
}
