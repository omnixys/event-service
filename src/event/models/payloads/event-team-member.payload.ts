import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class EventTeamMemberPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  name!: string;

  @Field()
  role!: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => Int)
  order!: number;
}
