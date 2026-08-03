import {
  ArchiveEventRoleInput,
  AssignEventRoleInput,
  CreateEventRoleInput,
  DeleteEventRoleInput,
  RemoveEventRoleInput,
  SetEventRolePermissionsInput,
  UpdateEventRoleInput,
} from '../models/inputs/event-rbac.input.js';
import {
  EventAccessPayload,
  EventPermissionPayload,
  EventRoleDefinitionPayload,
} from '../models/payloads/event-rbac.payload.js';
import { EventRbacService } from '../services/event-rbac.service.js';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EventPermissionKey, RealmRoleType } from '@omnixys/contracts-ts';
import {
  CookieAuthGuard,
  CurrentUser,
  CurrentUserData,
  EventPermissionGuard,
  EventPermissions,
  RoleGuard,
  Roles,
} from '@omnixys/security-ts';

@Resolver()
@UseGuards(CookieAuthGuard, RoleGuard)
@Roles(RealmRoleType.USER)
export class EventRbacResolver {
  constructor(private readonly rbacService: EventRbacService) {}

  @Query(() => [EventPermissionPayload])
  eventPermissions(): Promise<EventPermissionPayload[]> {
    return this.rbacService.getPermissionCatalog();
  }

  @Query(() => [EventRoleDefinitionPayload])
  @UseGuards(EventPermissionGuard)
  @EventPermissions(EventPermissionKey.ViewRoles)
  eventRoles(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true })
    includeArchived?: boolean,
  ): Promise<EventRoleDefinitionPayload[]> {
    return this.rbacService.getRoles(eventId, includeArchived ?? false);
  }

  @Query(() => EventAccessPayload)
  myEventAccess(
    @Args('eventId', { type: () => ID }) eventId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventAccessPayload> {
    return this.rbacService.getAccessForUser(currentUser.id, eventId);
  }

  @Query(() => EventAccessPayload)
  @UseGuards(EventPermissionGuard)
  @EventPermissions(EventPermissionKey.ViewRoles)
  eventAccess(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('userId', { type: () => ID, nullable: true }) userId: string | null,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventAccessPayload> {
    return this.rbacService.getAccessForUser(userId ?? currentUser.id, eventId);
  }

  @Mutation(() => EventRoleDefinitionPayload)
  @UseGuards(EventPermissionGuard)
  @EventPermissions(EventPermissionKey.ManageRoles)
  createEventRole(
    @Args('input') input: CreateEventRoleInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventRoleDefinitionPayload> {
    return this.rbacService.createRole(input, currentUser.id);
  }

  @Mutation(() => EventRoleDefinitionPayload)
  updateEventRole(
    @Args('input') input: UpdateEventRoleInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventRoleDefinitionPayload> {
    return this.rbacService.updateRole(input, currentUser.id);
  }

  @Mutation(() => EventRoleDefinitionPayload)
  archiveEventRole(
    @Args('input') input: ArchiveEventRoleInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventRoleDefinitionPayload> {
    return this.rbacService.archiveRole(input, currentUser.id);
  }

  @Mutation(() => Boolean)
  deleteEventRole(
    @Args('input') input: DeleteEventRoleInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<boolean> {
    return this.rbacService.deleteRole(input, currentUser.id);
  }

  @Mutation(() => EventRoleDefinitionPayload)
  setEventRolePermissions(
    @Args('input') input: SetEventRolePermissionsInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventRoleDefinitionPayload> {
    return this.rbacService.setRolePermissions(input, currentUser.id);
  }

  @Mutation(() => EventAccessPayload)
  @UseGuards(EventPermissionGuard)
  @EventPermissions(EventPermissionKey.ManageRoles)
  assignEventRole(
    @Args('input') input: AssignEventRoleInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventAccessPayload> {
    return this.rbacService.assignRole(input, currentUser.id);
  }

  @Mutation(() => EventAccessPayload)
  @UseGuards(EventPermissionGuard)
  @EventPermissions(EventPermissionKey.ManageRoles)
  removeEventRole(
    @Args('input') input: RemoveEventRoleInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventAccessPayload> {
    return this.rbacService.removeRole(input, currentUser.id);
  }
}
