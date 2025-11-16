import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '../enums/user-role.enum.js';

@ObjectType()
export class UserEventRole {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  eventId!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => UserRole)
  role!: UserRole;
}
