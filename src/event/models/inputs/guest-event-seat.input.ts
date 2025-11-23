import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class GuestEventSeatInput {
  @Field(() => ID)
  guestId!: string;

  @Field(() => ID)
  eventId!: string;
}
