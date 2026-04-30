import type { UserRoleType } from '../../prisma/generated/client.js';
import { SetMetadata } from '@nestjs/common';
import type { CustomDecorator } from '@nestjs/common';

export const EVENT_ROLES_KEY = 'event_roles';

export const EventRoles = (...roles: UserRoleType[]): CustomDecorator<string> =>
  SetMetadata(EVENT_ROLES_KEY, roles);
