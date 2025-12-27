import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EventTimeline {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  type!: string;

  @Field()
  timestamp!: Date;

  @Field()
  label!: string;
}
