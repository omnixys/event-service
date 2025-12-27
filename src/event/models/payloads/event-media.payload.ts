import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class EventMediaPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  kind!: string;

  @Field()
  url!: string;

  @Field({ nullable: true })
  alt?: string;

  @Field(() => Int, { nullable: true })
  order?: number;
}
