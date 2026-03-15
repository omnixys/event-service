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

  @Field({ nullable: true })
  actorId?: string;
}
