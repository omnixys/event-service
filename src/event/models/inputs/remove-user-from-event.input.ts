import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class RemoveUserFromEventInput {
  @Field()
  userId!: string;

  @Field()
  eventId!: string;
}
