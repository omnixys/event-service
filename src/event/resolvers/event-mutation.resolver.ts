/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { EventAdminGuard } from '../guards/event-admin.guard.js';
import { EventOwnerGuard } from '../guards/event-owner.guard.js';
import { AssignUserRoleInput } from '../models/inputs/assign-user-role.input.js';
import { CreateEventInput } from '../models/inputs/create-event.input.js';
import { RemoveUserFromEventInput } from '../models/inputs/remove-user-from-event.input.js';
import { UpdateEventInput } from '../models/inputs/update-event.input.js';
import { EventPayload } from '../models/payloads/event.payload.js';
import { EventWriteService } from '../services/event-write.service.js';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { CookieAuthGuard, CurrentUser, CurrentUserData } from '@omnixys/auth';

@Resolver(() => Event)
export class EventMutationResolver {
  constructor(private readonly writeService: EventWriteService) {}

  @Mutation(() => EventPayload)
  @UseGuards(CookieAuthGuard)
  async createEvent(
    @Args('input') input: CreateEventInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPayload> {
    return this.writeService.createEvent(input, currentUser.id);
  }

  @Mutation(() => Boolean)
  async updateEvent(
    @Args('input') input: UpdateEventInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<boolean> {
    return this.writeService.updateEvent(input, currentUser.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(CookieAuthGuard)
  async deleteEvent(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<boolean> {
    return this.writeService.deleteEvent(id, currentUser.id);
  }

  @Mutation(() => Boolean)
  async assignUserToEvent(
    @Args('input') input: AssignUserRoleInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<boolean> {
    await this.writeService.assignUserToEvent(input, currentUser.id);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(CookieAuthGuard)
  async removeUserFromEvent(
    @Args('input') input: RemoveUserFromEventInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<boolean> {
    await this.writeService.removeUserFromEvent(input, currentUser.id);
    return true;
  }

  @UseGuards(CookieAuthGuard, EventOwnerGuard)
  @Mutation(() => Boolean)
  async transferEventOwnership(
    @Args('eventId') eventId: string,
    @Args('newOwnerId') newOwnerId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.writeService.transferEventOwnership(
      eventId,
      newOwnerId,
      user.id,
    );
    return true;
  }

  @UseGuards(CookieAuthGuard, EventAdminGuard)
  @Mutation(() => Boolean)
  async activateEvent(
    @Args('eventId') eventId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.writeService.activateEvent(eventId, user.id);
  }

  @UseGuards(CookieAuthGuard, EventAdminGuard)
  @Mutation(() => Boolean)
  async deactivateEvent(
    @Args('eventId') eventId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.writeService.deactivateEvent(eventId, user.id);
  }
}
