import { Field, ID, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class EventAddress {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  street!: string;

  @Field()
  city!: string;

  @Field()
  zip!: string;

  @Field()
  country!: string;

  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;
}
