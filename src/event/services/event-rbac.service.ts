import {
  EventSystemRoleKey as PrismaEventSystemRoleKey,
  type Prisma,
  UserRoleType,
} from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  EventAccessDeniedError,
  EventNotFoundError,
  EventValidationError,
} from '../errors/event-domain.error.js';
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
import { UserProjectionService } from './user-projection.service.js';
import { Injectable } from '@nestjs/common';
import {
  EVENT_PERMISSION_DEFINITIONS,
  EVENT_PERMISSION_KEYS,
  EventPermissionKey,
  EventRoleType,
  type EventAccessDTO,
  type EventPermissionDefinition,
  type EventSystemRoleKey as ContractEventSystemRoleKey,
  getDefaultPermissionsForEventRole,
  getDefaultPermissionsForSystemRole,
  uniqueEventPermissions,
} from '@omnixys/contracts';
import {
  KafkaProducerService,
  KafkaTopics,
  type EventType,
  type KafkaMetaInfo,
} from '@omnixys/kafka';
import { OmnixysLogger } from '@omnixys/logger';

type RbacClient = Prisma.TransactionClient | PrismaService;

interface RoleRecord {
  id: string;
  eventId: string;
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  systemKey: string | null;
  archivedAt: Date | null;
  permissions?: Array<{ permissionKey: string }>;
  _count?: { assignments: number };
}

const SYSTEM_ROLE_META: Record<
  ContractEventSystemRoleKey,
  {
    key: string;
    name: string;
    description: string;
    color: string;
    icon: string;
  }
> = {
  [PrismaEventSystemRoleKey.ADMIN]: {
    key: 'admin',
    name: 'Admin',
    description: 'Full event administration access.',
    color: '#2563eb',
    icon: 'shield',
  },
  [PrismaEventSystemRoleKey.SECURITY]: {
    key: 'security',
    name: 'Security',
    description: 'Ticket scanning and guest check-in access.',
    color: '#059669',
    icon: 'qr-code',
  },
  [PrismaEventSystemRoleKey.GUEST]: {
    key: 'guest',
    name: 'Guest',
    description: 'Guest self-service access.',
    color: '#7c3aed',
    icon: 'ticket',
  },
};

const SUPPORT_ROLE_META = {
  key: 'support',
  name: 'Support',
  description: 'Support conversation access.',
  color: '#db2777',
  icon: 'message-circle',
} as const;

@Injectable()
export class EventRbacService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly omnixysLogger: OmnixysLogger,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly userProjectionService: UserProjectionService,
  ) {
    this.logger = this.omnixysLogger.log(this.constructor.name);
  }

  async getPermissionCatalog(): Promise<EventPermissionPayload[]> {
    this.logger.debug('Fetching event permission catalog');
    await this.seedPermissionCatalog(this.prisma);

    const rows = await this.prisma.eventPermissionDefinition.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return rows.map((row) => ({
      key: row.key,
      category: row.category,
      label: row.label,
      description: row.description,
      premiumFeatureKey: row.premiumFeatureKey ?? undefined,
    }));
  }

  async getRoles(eventId: string, includeArchived = false): Promise<EventRoleDefinitionPayload[]> {
    await this.ensureSystemRoles(eventId);

    const roles = await this.prisma.eventRoleDefinition.findMany({
      where: {
        eventId,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      include: {
        permissions: { select: { permissionKey: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: [{ systemKey: 'asc' }, { name: 'asc' }],
    });

    return roles.map((role) => this.toRolePayload(role));
  }

  async getAccessForUser(userId: string, eventId: string): Promise<EventAccessPayload> {
    await this.ensureSystemRoles(eventId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, owner: true, path: true },
    });

    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    if (event.owner === userId) {
      const admin = await this.prisma.eventRoleDefinition.findUnique({
        where: {
          eventId_key: {
            eventId,
            key: SYSTEM_ROLE_META[PrismaEventSystemRoleKey.ADMIN].key,
          },
        },
        include: {
          permissions: { select: { permissionKey: true } },
          _count: { select: { assignments: true } },
        },
      });

      return {
        eventId,
        userId,
        roles: admin ? [this.toRolePayload(admin)] : [],
        permissions: [...EVENT_PERMISSION_KEYS],
      };
    }

    const pathIds = this.getPathIds(event);

    const assignments = await this.prisma.eventUserRoleAssignment.findMany({
      where: {
        userId,
        eventId: { in: pathIds },
        role: { archivedAt: null },
      },
      include: {
        role: {
          include: {
            permissions: { select: { permissionKey: true } },
            _count: { select: { assignments: true } },
          },
        },
      },
    });

    if (assignments.length > 0) {
      const roles = assignments.map((assignment) => this.toRolePayload(assignment.role));
      return {
        eventId,
        userId,
        roles,
        permissions: uniqueEventPermissions(roles.flatMap((role) => role.permissions)),
      };
    }

    return this.getLegacyAccessForUser(userId, eventId, pathIds);
  }

  async getPermissionKeysForUser(
    userId: string,
    eventId: string,
  ): Promise<readonly EventPermissionKey[]> {
    const access = await this.getAccessForUser(userId, eventId);
    return uniqueEventPermissions(access.permissions);
  }

  async publishCurrentAccess(
    eventId: string,
    userId: string,
    actorId: string,
  ): Promise<EventAccessPayload> {
    const access = await this.getAccessForUser(userId, eventId);
    await this.publishAccessChanged(access, actorId);
    return access;
  }

  async createRole(
    input: CreateEventRoleInput,
    actorId: string,
  ): Promise<EventRoleDefinitionPayload> {
    await this.ensureSystemRoles(input.eventId);

    const role = await this.prisma.eventRoleDefinition.create({
      data: {
        eventId: input.eventId,
        key: this.normalizeRoleKey(input.key ?? input.name),
        name: input.name.trim(),
        description: input.description?.trim() ?? null,
        color: input.color?.trim() ?? null,
        icon: input.icon?.trim() ?? null,
      },
      include: {
        permissions: { select: { permissionKey: true } },
        _count: { select: { assignments: true } },
      },
    });

    this.publishRoleDefinitionChanged(input.eventId, actorId).catch((err) =>
      this.logger.error('Failed to publish role definition change', err),
    );
    return this.toRolePayload(role);
  }

  async updateRole(
    input: UpdateEventRoleInput,
    actorId: string,
  ): Promise<EventRoleDefinitionPayload> {
    const existing = await this.getRoleForScopedMutation(input, actorId);

    const role = await this.prisma.eventRoleDefinition.update({
      where: { id: input.roleId },
      data: {
        name: input.name?.trim() ?? undefined,
        description:
          input.description === undefined ? undefined : (input.description.trim() ?? null),
        color: input.color === undefined ? undefined : (input.color.trim() ?? null),
        icon: input.icon === undefined ? undefined : (input.icon.trim() ?? null),
      },
      include: {
        permissions: { select: { permissionKey: true } },
        _count: { select: { assignments: true } },
      },
    });

    this.publishRoleDefinitionChanged(existing.eventId, actorId).catch((err) =>
      this.logger.error('Failed to publish role definition change', err),
    );
    return this.toRolePayload(role);
  }

  async archiveRole(
    input: ArchiveEventRoleInput,
    actorId: string,
  ): Promise<EventRoleDefinitionPayload> {
    const existing = await this.getRoleForScopedMutation(input, actorId);
    this.assertMutableCustomRole(existing);

    const role = await this.prisma.eventRoleDefinition.update({
      where: { id: input.roleId },
      data: { archivedAt: new Date() },
      include: {
        permissions: { select: { permissionKey: true } },
        _count: { select: { assignments: true } },
      },
    });

    this.publishRoleDefinitionChanged(existing.eventId, actorId).catch((err) =>
      this.logger.error('Failed to publish role definition change', err),
    );
    await this.publishAccessChangedForRoleUsers(existing.eventId, input.roleId, actorId);
    return this.toRolePayload(role);
  }

  async deleteRole(input: DeleteEventRoleInput, actorId: string): Promise<boolean> {
    const existing = await this.getRoleForScopedMutation(input, actorId);
    this.assertMutableCustomRole(existing);

    const assignments = await this.prisma.eventUserRoleAssignment.count({
      where: { roleId: input.roleId },
    });

    if (assignments > 0) {
      throw new EventValidationError('Event role is still assigned', {
        roleId: input.roleId,
        assignments,
      });
    }

    await this.prisma.eventRoleDefinition.delete({ where: { id: input.roleId } });
    this.publishRoleDefinitionChanged(existing.eventId, actorId).catch((err) =>
      this.logger.error('Failed to publish role definition change', err),
    );
    return true;
  }

  async setRolePermissions(
    input: SetEventRolePermissionsInput,
    actorId: string,
  ): Promise<EventRoleDefinitionPayload> {
    const existing = await this.getRoleForScopedMutation(input, actorId);

    if (existing.systemKey === PrismaEventSystemRoleKey.ADMIN) {
      throw new EventAccessDeniedError(existing.eventId, 'admin-role-is-locked');
    }

    await this.seedPermissionCatalog(this.prisma);
    await this.setRolePermissionsTx(this.prisma, input.roleId, input.permissionKeys);

    const role = await this.getRoleOrThrow(input.roleId);
    this.publishRoleDefinitionChanged(existing.eventId, actorId).catch((err) =>
      this.logger.error('Failed to publish role definition change', err),
    );
    await this.publishAccessChangedForRoleUsers(existing.eventId, input.roleId, actorId);
    return this.toRolePayload(role);
  }

  async assignRole(input: AssignEventRoleInput, actorId: string): Promise<EventAccessPayload> {
    const role = await this.getRoleOrThrow(input.roleId);

    if (role.eventId !== input.eventId) {
      throw new EventValidationError('Role does not belong to event', {
        eventId: input.eventId,
        roleId: input.roleId,
      });
    }

    if (role.archivedAt) {
      throw new EventValidationError('Archived roles cannot be assigned', {
        roleId: input.roleId,
      });
    }

    await this.userProjectionService.requireUsers([input.userId]);

    await this.prisma.eventUserRoleAssignment.upsert({
      where: {
        eventId_userId_roleId: {
          eventId: input.eventId,
          userId: input.userId,
          roleId: input.roleId,
        },
      },
      create: {
        eventId: input.eventId,
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: actorId,
      },
      update: {
        assignedBy: actorId,
      },
    });

    const access = await this.getAccessForUser(input.userId, input.eventId);
    await this.publishAccessChanged(access, actorId);
    return access;
  }

  async removeRole(input: RemoveEventRoleInput, actorId: string): Promise<EventAccessPayload> {
    await this.prisma.eventUserRoleAssignment.deleteMany({
      where: {
        eventId: input.eventId,
        userId: input.userId,
        roleId: input.roleId,
      },
    });

    const access = await this.computeRemainingAccess(input.eventId, input.userId);
    await this.publishAccessChanged(access, actorId);
    return access;
  }

  async syncLegacyRoleAssignment(
    eventId: string,
    userId: string,
    role: UserRoleType,
    actorId: string,
  ): Promise<void> {
    await this.ensureSystemRoles(eventId, this.prisma, role === UserRoleType.SUPPORT);

    const roleDefinition = await this.prisma.eventRoleDefinition.findUnique({
      where: {
        eventId_key: {
          eventId,
          key: this.legacyRoleKey(role),
        },
      },
      select: { id: true },
    });

    if (!roleDefinition) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.eventUserRoleAssignment.deleteMany({
        where: { eventId, userId },
      }),
      this.prisma.eventUserRoleAssignment.create({
        data: {
          eventId,
          userId,
          roleId: roleDefinition.id,
          assignedBy: actorId,
        },
      }),
    ]);

    const access = await this.getAccessForUser(userId, eventId);
    await this.publishAccessChanged(access, actorId);
  }

  async removeAllRolesForUser(eventId: string, userId: string, actorId: string): Promise<void> {
    await this.prisma.eventUserRoleAssignment.deleteMany({
      where: { eventId, userId },
    });

    const access = await this.computeRemainingAccess(eventId, userId);
    await this.publishAccessChanged(access, actorId);
  }

  private async computeRemainingAccess(
    eventId: string,
    userId: string,
  ): Promise<EventAccessPayload> {
    const remaining = await this.prisma.eventUserRoleAssignment.findMany({
      where: {
        userId,
        eventId,
        role: { archivedAt: null },
      },
      include: {
        role: {
          include: {
            permissions: { select: { permissionKey: true } },
            _count: { select: { assignments: true } },
          },
        },
      },
    });

    if (remaining.length === 0) {
      return { eventId, userId, roles: [], permissions: [] };
    }

    const roles = remaining.map((a) => this.toRolePayload(a.role));
    return {
      eventId,
      userId,
      roles,
      permissions: uniqueEventPermissions(roles.flatMap((r) => r.permissions)),
    };
  }

  async ensureSystemRoles(
    eventId: string,
    client: RbacClient = this.prisma,
    includeSupport = false,
  ): Promise<void> {
    await this.seedPermissionCatalog(client);

    for (const [systemKey, meta] of Object.entries(SYSTEM_ROLE_META) as Array<
      [ContractEventSystemRoleKey, (typeof SYSTEM_ROLE_META)[ContractEventSystemRoleKey]]
    >) {
      const role = await client.eventRoleDefinition.upsert({
        where: {
          eventId_key: {
            eventId,
            key: meta.key,
          },
        },
        create: {
          eventId,
          key: meta.key,
          name: meta.name,
          description: meta.description,
          color: meta.color,
          icon: meta.icon,
          systemKey,
        },
        update: {
          name: meta.name,
          description: meta.description,
          systemKey,
        },
      });

      await this.setRolePermissionsTx(
        client,
        role.id,
        getDefaultPermissionsForSystemRole(systemKey),
      );
    }

    if (includeSupport) {
      const role = await client.eventRoleDefinition.upsert({
        where: {
          eventId_key: {
            eventId,
            key: SUPPORT_ROLE_META.key,
          },
        },
        create: {
          eventId,
          key: SUPPORT_ROLE_META.key,
          name: SUPPORT_ROLE_META.name,
          description: SUPPORT_ROLE_META.description,
          color: SUPPORT_ROLE_META.color,
          icon: SUPPORT_ROLE_META.icon,
        },
        update: {
          name: SUPPORT_ROLE_META.name,
          description: SUPPORT_ROLE_META.description,
        },
      });

      await this.setRolePermissionsTx(
        client,
        role.id,
        getDefaultPermissionsForEventRole(EventRoleType.SUPPORT),
      );
    }
  }

  async seedPermissionCatalog(client: RbacClient): Promise<void> {
    await Promise.all(
      EVENT_PERMISSION_DEFINITIONS.map((definition) =>
        client.eventPermissionDefinition.upsert({
          where: { key: definition.key },
          create: this.permissionDefinitionToCreate(definition),
          update: this.permissionDefinitionToCreate(definition),
        }),
      ),
    );
  }

  private async getLegacyAccessForUser(
    userId: string,
    eventId: string,
    pathIds: string[],
  ): Promise<EventAccessPayload> {
    const roles = await this.prisma.role.findMany({
      where: {
        userId,
        eventId: { in: pathIds },
      },
    });

    const roleByEventId = new Map(roles.map((role) => [role.eventId, role.role]));
    const legacyRole = pathIds
      .map((id) => roleByEventId.get(id))
      .find((role): role is UserRoleType => Boolean(role));

    if (!legacyRole) {
      return {
        eventId,
        userId,
        roles: [],
        permissions: [],
      };
    }

    await this.ensureSystemRoles(eventId, this.prisma, legacyRole === UserRoleType.SUPPORT);

    const role = await this.prisma.eventRoleDefinition.findUnique({
      where: {
        eventId_key: {
          eventId,
          key: this.legacyRoleKey(legacyRole),
        },
      },
      include: {
        permissions: { select: { permissionKey: true } },
        _count: { select: { assignments: true } },
      },
    });

    return {
      eventId,
      userId,
      roles: role ? [this.toRolePayload(role)] : [],
      permissions: getDefaultPermissionsForEventRole(legacyRole),
    };
  }

  private async getRoleOrThrow(roleId: string): Promise<RoleRecord> {
    const role = await this.prisma.eventRoleDefinition.findUnique({
      where: { id: roleId },
      include: {
        permissions: { select: { permissionKey: true } },
        _count: { select: { assignments: true } },
      },
    });

    if (!role) {
      throw new EventValidationError('Event role not found', { roleId });
    }

    return role;
  }

  private async getRoleForScopedMutation(
    input: { eventId: string; roleId: string },
    actorId: string,
  ): Promise<RoleRecord> {
    const role = await this.getRoleOrThrow(input.roleId);

    if (role.eventId !== input.eventId) {
      throw new EventValidationError('Role does not belong to event', {
        eventId: input.eventId,
        roleEventId: role.eventId,
        roleId: input.roleId,
      });
    }

    const permissions = await this.getPermissionKeysForUser(actorId, role.eventId);
    if (!permissions.includes(EventPermissionKey.ManageRoles)) {
      throw new EventAccessDeniedError(role.eventId, 'event-permission-mismatch');
    }

    return role;
  }

  private async setRolePermissionsTx(
    client: RbacClient,
    roleId: string,
    permissionKeys: Iterable<string>,
  ): Promise<void> {
    const validPermissions = uniqueEventPermissions(permissionKeys);

    await client.eventRolePermission.deleteMany({
      where: { roleId },
    });

    if (validPermissions.length === 0) {
      return;
    }

    await client.eventRolePermission.createMany({
      data: validPermissions.map((permissionKey) => ({
        roleId,
        permissionKey,
      })),
      skipDuplicates: true,
    });
  }

  private toRolePayload(role: RoleRecord): EventRoleDefinitionPayload {
    return {
      id: role.id,
      eventId: role.eventId,
      key: role.key,
      name: role.name,
      description: role.description ?? undefined,
      color: role.color ?? undefined,
      icon: role.icon ?? undefined,
      systemKey: role.systemKey ?? undefined,
      system: Boolean(role.systemKey),
      archivedAt: role.archivedAt ?? undefined,
      permissions: uniqueEventPermissions(
        role.permissions?.map((permission) => permission.permissionKey) ?? [],
      ),
      assignedUserCount: role._count?.assignments ?? 0,
    };
  }

  private permissionDefinitionToCreate(
    definition: EventPermissionDefinition,
  ): Prisma.EventPermissionDefinitionUncheckedCreateInput {
    return {
      key: definition.key,
      category: definition.category,
      label: definition.label,
      description: definition.description,
      premiumFeatureKey: definition.premiumFeatureKey ?? null,
    };
  }

  private normalizeRoleKey(value: string): string {
    const key = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!key) {
      throw new EventValidationError('Event role key is required', { value });
    }

    return key;
  }

  private legacyRoleKey(role: UserRoleType): string {
    return role.toLowerCase();
  }

  private assertMutableCustomRole(role: RoleRecord): void {
    if (role.systemKey) {
      throw new EventAccessDeniedError(role.eventId, 'system-role-is-locked');
    }
  }

  private getPathIds(event: { id: string; path: string | null }): string[] {
    if (!event.path?.trim()) {
      return [event.id];
    }

    return event.path
      .split('.')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  private publishRoleDefinitionChanged(eventId: string, actorId: string): Promise<void> {
    return this.kafkaProducerService.send({
      topic: KafkaTopics.event.roleDefinitionChanged,
      payload: {
        eventId,
        occurredAt: new Date().toISOString(),
      },
      meta: this.meta(actorId, 'Event Role Definition Changed'),
    });
  }

  private publishAccessChanged(access: EventAccessPayload, actorId: string): Promise<void> {
    const payload = {
      eventId: access.eventId,
      userId: access.userId,
      roles: access.roles.map((role) => ({
        eventId: role.eventId,
        roleId: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        color: role.color,
        icon: role.icon,
        systemKey: role.systemKey ? (role.systemKey as ContractEventSystemRoleKey) : undefined,
        archivedAt: role.archivedAt?.toISOString(),
        permissionKeys: uniqueEventPermissions(role.permissions),
      })),
      permissions: uniqueEventPermissions(access.permissions),
      occurredAt: new Date().toISOString(),
    } satisfies EventAccessDTO;

    return this.kafkaProducerService.send({
      topic: KafkaTopics.event.userAccessChanged,
      payload,
      meta: this.meta(actorId, 'Event User Access Changed'),
    });
  }

  private async publishAccessChangedForRoleUsers(
    eventId: string,
    roleId: string,
    actorId: string,
  ): Promise<void> {
    const assignments = await this.prisma.eventUserRoleAssignment.findMany({
      where: { eventId, roleId },
      select: { userId: true },
    });

    await Promise.all(
      assignments.map(async ({ userId }) => {
        const access = await this.computeRemainingAccess(eventId, userId);
        await this.publishAccessChanged(access, actorId);
      }),
    );
  }

  private meta(actorId: string, operation: string): KafkaMetaInfo {
    const type: EventType = 'EVENT';
    return {
      actorId,
      tenantId: 'omnixys',
      service: 'event-service',
      operation,
      version: '2',
      type,
    };
  }
}
