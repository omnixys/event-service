import { UserRoleType } from '../../prisma/generated/client.js';
import { SetMetadata } from '@nestjs/common';

export const EVENT_ROLES_KEY = 'event_roles';

export const EventRoles = (...roles: UserRoleType[]) =>
  SetMetadata(EVENT_ROLES_KEY, roles);
