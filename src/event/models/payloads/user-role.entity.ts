import { UserRole } from '../enums/user-role.enum.js';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserEventRolePayload {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  eventId!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => UserRole)
  role!: UserRole;
}
