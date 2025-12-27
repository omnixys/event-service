import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class EventFAQ {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  question!: string;

  @Field()
  answer!: string;

  @Field(() => Int, { nullable: true })
  order?: number;
}
