import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class EventFAQPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  question!: string;

  @Field()
  answer!: string;

  @Field(() => Int)
  order!: number;
}
