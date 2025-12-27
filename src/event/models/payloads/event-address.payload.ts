import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class EventAddressPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field({ nullable: true })
  street!: string;

  @Field({ nullable: true })
  city!: string;

  @Field({ nullable: true })
  zip!: string;

  @Field({ nullable: true })
  country!: string;

  @Field(() => Float, { nullable: true })
  latitude!: number;

  @Field(() => Float, { nullable: true })
  longitude!: number;
}
