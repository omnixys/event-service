import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType()
export class Event {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => GraphQLISODateTime)
  startsAt!: Date;

  @Field(() => GraphQLISODateTime)
  endsAt!: Date;

  @Field(() => String)
  allowReEntry!: boolean;

  @Field(() => Number)
  maxSeats!: number;

  @Field(() => Number)
  rotateSeconds!: number;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  dressCode?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  defaultSection?: number;

  @Field(() => Int)
  defaultTable?: number;
}
