/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AssignUserRoleInput } from '../models/inputs/assign-user-role.input.js';
import { CreateEventInput } from '../models/inputs/create-event.input.js';
import { RemoveUserFromEventInput } from '../models/inputs/remove-user-from-event.input.js';
import {
  CreateTimelineInput,
  RemoveTimelineInput,
  SetTimelineInput,
  UpdateTimelineInput,
} from '../models/inputs/timeline.input.js';
import { UpdateEventInput } from '../models/inputs/update-event.input.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { EventWriteService } from '../services/event-write.service.js';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  ID,
  InputType,
  Mutation,
  Resolver,
} from '@nestjs/graphql';
import { EventPermissionKey, RealmRoleType } from '@omnixys/contracts';
import {
  CookieAuthGuard,
  CurrentUser,
  CurrentUserData,
  EventPermissionGuard,
  EventPermissions,
  RoleGuard,
  Roles,
} from '@omnixys/security';

@InputType()
export class TransferInput {
  @Field(() => ID)
  eventId!: string;
  @Field(() => ID)
  newOwnerId!: string;
}

@Resolver(() => Event)
export class EventMutationResolver {
  constructor(private readonly writeService: EventWriteService) {}

  @Mutation(() => EventPayload)
  @UseGuards(CookieAuthGuard, RoleGuard)
  @Roles(RealmRoleType.USER, RealmRoleType.ADMIN)
  async createEvent(
    @Args('input') input: CreateEventInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload> {
    return this.writeService.createEvent(input, {
      id: currentUser.id,
      username: currentUser.username,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
    });
  }

  @Mutation(() => EventPayload)
  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.EditEvent)
  async updateEvent(
    @Args('input') input: UpdateEventInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload> {
    return this.writeService.updateEvent(input, currentUser.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.DeleteEvent)
  async deleteEvent(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<boolean> {
    return this.writeService.deleteEvent(id, currentUser.id);
  }

  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.ManageRoles)
  @Mutation(() => EventPayload)
  async assignUserToEvent(
    @Args('input') input: AssignUserRoleInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload> {
    return this.writeService.assignUserToEvent({
      ...input,
      actorId: currentUser.id,
    });
  }

  @Mutation(() => EventPayload)
  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.ManageRoles)
  async removeUserFromEvent(
    @Args('input') input: RemoveUserFromEventInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload> {
    return this.writeService.removeUserFromEvent(input, currentUser.id);
  }

  @UseGuards(CookieAuthGuard, RoleGuard)
  @Roles(RealmRoleType.USER)
  @Mutation(() => Boolean)
  async transferEventOwnership(
    @Args('input') input: TransferInput,
    @CurrentUser() user: CurrentUserData,
  ) {
    const { newOwnerId, eventId } = input;
    await this.writeService.transferEventOwnership(
      eventId,
      newOwnerId,
      user.id,
    );
    return true;
  }

  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.ManageEventSettings)
  @Mutation(() => Boolean)
  async activateEvent(
    @Args('eventId', { type: () => ID }) eventId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.writeService.activateEvent(eventId, user.id);
  }

  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.ManageEventSettings)
  @Mutation(() => Boolean)
  async deactivateEvent(
    @Args('eventId', { type: () => ID }) eventId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.writeService.deactivateEvent(eventId, user.id);
  }

  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.ManageTimeline)
  @Mutation(() => EventPayload)
  async addTimeLines(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('input', { type: () => [CreateTimelineInput] })
    timelineInputs: CreateTimelineInput[],
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.writeService.addTimelines(eventId, timelineInputs, user.id);
  }

  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.ManageTimeline)
  @Mutation(() => EventPayload)
  async updateTimeLines(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('input', { type: () => [UpdateTimelineInput] })
    input: UpdateTimelineInput[],
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.writeService.updateTimelines(eventId, input, user.id);
  }

  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.ManageTimeline)
  @Mutation(() => EventPayload)
  async removeTimeLines(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('input', { type: () => [RemoveTimelineInput] })
    input: RemoveTimelineInput[],
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.writeService.removeTimelines(eventId, input, user.id);
  }

  @UseGuards(CookieAuthGuard, RoleGuard, EventPermissionGuard)
  @Roles(RealmRoleType.USER)
  @EventPermissions(EventPermissionKey.ManageTimeline)
  @Mutation(() => EventPayload)
  async setTimelines(
    @Args('input') input: SetTimelineInput,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.writeService.setTimelines(input, user.id);
  }
}
