import { UserRoleType } from '../../src/prisma/generated/client.js';

export const users = [
  {
    id: 'dde8114c-2637-462a-90b9-413924fa3f55',
    username: 'admin',
    role: UserRoleType.ADMIN,
  },
  {
    id: '694d2e8e-0932-4c8f-a1c4-e300dc235be4',
    username: 'caleb',
    role: UserRoleType.ADMIN,
  },
  {
    id: 'f9de3f8a-5b79-4f3a-9267-10c1b9ce2a03',
    username: 'rachel',
    role: UserRoleType.ADMIN,
  },
  {
    id: 'ae489d9b-96ce-4942-bcb1-c2e2a0c92e83',
    username: 'guest',
    role: UserRoleType.GUEST,
  },
  {
    id: '20e7e44e-9bcd-4016-bebd-36f8d75357b6',
    username: 'security',
    role: UserRoleType.SECURITY,
  },
];
