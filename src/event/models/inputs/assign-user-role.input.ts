import { UserRole } from '../enums/user-role.enum.js';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AssignUserRoleInput {
  @Field()
  eventId!: string;

  @Field()
  userId!: string;

  @Field(() => UserRole)
  eventRole!: UserRole;

  @Field({ nullable: true })
  actorId?: string;
}
