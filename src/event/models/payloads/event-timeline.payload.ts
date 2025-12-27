import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class EventTimelinePayload {
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
