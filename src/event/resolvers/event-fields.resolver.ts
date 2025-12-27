/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { EventAddressPayload } from '../models/payloads/event-address.payload.js';
import { EventAuditLogPayload } from '../models/payloads/event-audit-log.payload.js';
import { EventDescriptionBlockPayload } from '../models/payloads/event-description-block.payload.js';
import { EventFAQPayload } from '../models/payloads/event-faq.payload.js';
import { EventMediaPayload } from '../models/payloads/event-media.payload.js';
import { EventSettingsPayload } from '../models/payloads/event-settings.payload.js';
import { EventTeamMemberPayload } from '../models/payloads/event-team-member.payload.js';
import { EventThemePayload } from '../models/payloads/event-theme.payload.js';
import { EventTimelinePayload } from '../models/payloads/event-timeline.payload.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { UserEventRolePayload } from '../models/payloads/user-role.entity.js';
import { EventReadService } from '../services/event-read.service.js';
import { Resolver, ResolveField, Parent } from '@nestjs/graphql';

@Resolver(() => EventPayload)
export class EventFieldsResolver {
  constructor(private readonly readService: EventReadService) {}

  @ResolveField(() => EventAddressPayload, { nullable: true })
  async address(@Parent() event: EventPayload) {
    return this.readService.getAddress(event.id);
  }

  @ResolveField(() => EventSettingsPayload, { nullable: true })
  async settings(@Parent() event: EventPayload) {
    return this.readService.getSettings(event.id);
  }

  @ResolveField(() => EventThemePayload, { nullable: true })
  async theme(@Parent() event: EventPayload) {
    return this.readService.getTheme(event.id);
  }

  @ResolveField(() => [EventMediaPayload])
  async media(@Parent() event: EventPayload) {
    return this.readService.getMedia(event.id);
  }

  @ResolveField(() => [EventDescriptionBlockPayload])
  async fullDescription(@Parent() event: EventPayload) {
    return this.readService.getDescriptionBlocks(event.id);
  }

  @ResolveField(() => [EventFAQPayload])
  async faqs(@Parent() event: EventPayload) {
    return this.readService.getFaqs(event.id);
  }

  @ResolveField(() => [EventTeamMemberPayload])
  async team(@Parent() event: EventPayload) {
    return this.readService.getTeam(event.id);
  }

  @ResolveField(() => [EventAuditLogPayload])
  async auditLogs(@Parent() event: EventPayload) {
    return this.readService.getAuditLogs(event.id);
  }

  @ResolveField(() => [EventTimelinePayload])
  async timeline(@Parent() event: EventPayload) {
    return this.readService.getTimeline(event.id);
  }

  @ResolveField(() => [UserEventRolePayload])
  async userRoles(@Parent() event: EventPayload) {
    return this.readService.getUserRoles(event.id);
  }
}
