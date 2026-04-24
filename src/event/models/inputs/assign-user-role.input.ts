import { UserRoleType } from '../../../prisma/generated/client.js';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AssignUserRoleInput {
  @Field()
  eventId!: string;

  @Field()
  userId!: string;

  @Field(() => UserRoleType)
  eventRole!: UserRoleType;
}

export interface AssignUserRoleDTO {
  eventId: string;
  userId: string;
  eventRole: UserRoleType;
  actorId: string
}

