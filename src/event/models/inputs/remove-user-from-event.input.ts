import { UserRoleType } from '../../../prisma/generated/enums.js';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class RemoveUserFromEventInput {
  @Field()
  userId!: string;

  @Field()
  eventId!: string;

  @Field(() => UserRoleType)
  eventRole!: UserRoleType;
}
