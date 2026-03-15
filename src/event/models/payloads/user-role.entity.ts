import { UserRoleType } from '../../../prisma/generated/client.js';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserRolePayload {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  eventId!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => UserRoleType)
  role!: UserRoleType;
}
