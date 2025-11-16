import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Seat {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  eventId!: string;

  @Field(() => String)
  section!: string;

  @Field(() => String)
  table!: string;

  @Field(() => Number)
  number!: number;

  @Field(() => String)
  note!: string;

  @Field(() => String)
  guestId!: string;
}
