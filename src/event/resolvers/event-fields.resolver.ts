/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  EventAccessPayload,
  EventRoleDefinitionPayload,
} from '../models/payloads/event-rbac.payload.js';
import { EventTimelinePayload } from '../models/payloads/event-timeline.payload.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { MediaPayload } from '../models/payloads/media.payload.js';
import { UserRolePayload } from '../models/payloads/user-role.entity.js';
import { EventRbacService } from '../services/event-rbac.service.js';
import { EventReadService } from '../services/event-read.service.js';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUser, type CurrentUserData } from '@omnixys/security-ts';

@Resolver(() => EventPayload)
export class EventFieldsResolver {
  constructor(
    private readonly readService: EventReadService,
    private readonly rbacService: EventRbacService,
  ) {}

  @ResolveField(() => [EventTimelinePayload])
  async timeline(@Parent() event: EventPayload) {
    return this.readService.getTimeline(event.id);
  }

  @ResolveField(() => [UserRolePayload])
  async userRoles(@Parent() event: EventPayload) {
    return this.readService.getRoles(event.id);
  }

  @ResolveField(() => [EventRoleDefinitionPayload])
  async roleDefinitions(@Parent() event: EventPayload) {
    return this.rbacService.getRoles(event.id);
  }

  @ResolveField(() => EventAccessPayload, { nullable: true })
  async myAccess(
    @Parent() event: EventPayload,
    @CurrentUser() currentUser: CurrentUserData | null,
  ) {
    if (!currentUser?.id) {
      return null;
    }

    return this.rbacService.getAccessForUser(currentUser.id, event.id);
  }

  @ResolveField(() => [MediaPayload])
  async media(@Parent() event: EventPayload) {
    return this.readService.getMedia(event.id);
  }

  @ResolveField(() => MediaPayload, { nullable: true })
  async coverMedia(@Parent() event: EventPayload) {
    return this.readService.getSingleMedia(event.coverMediaId, 'coverMedia');
  }

  @ResolveField(() => MediaPayload, { nullable: true })
  async logoMedia(@Parent() event: EventPayload) {
    return this.readService.getSingleMedia(event.logoMediaId, 'logoMedia');
  }
}
