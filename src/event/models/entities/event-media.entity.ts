import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class EventMedia {
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

  @Field(() => Int)
  order!: number;
}
