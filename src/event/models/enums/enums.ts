import { UserRoleType } from '../../../prisma/generated/client.js';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(UserRoleType, {
  name: 'UserRoleType',
  description: 'Role of a user inside an event',
});

export { UserRoleType };
