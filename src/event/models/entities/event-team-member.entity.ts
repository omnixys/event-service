import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class EventTeamMember {
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
