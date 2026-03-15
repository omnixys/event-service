/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { EventTimelinePayload } from '../models/payloads/event-timeline.payload.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { UserRolePayload } from '../models/payloads/user-role.entity.js';
import { EventReadService } from '../services/event-read.service.js';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

@Resolver(() => EventPayload)
export class EventFieldsResolver {
  constructor(private readonly readService: EventReadService) {}

  @ResolveField(() => [EventTimelinePayload])
  async timeline(@Parent() event: EventPayload) {
    return this.readService.getTimeline(event.id);
  }

  @ResolveField(() => [UserRolePayload])
  async userRoles(@Parent() event: EventPayload) {
    return this.readService.getRoles(event.id);
  }
}
