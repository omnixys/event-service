import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Seat {
  @Field(() => ID)
  id!: string;

  // eventId is required in Prisma, so it must NOT be nullable
  @Field(() => String)
  eventId!: string;

  // Optional string values → nullable: true + correct TS type: string | null
  @Field(() => String, { nullable: true })
  section?: string | null;

  @Field(() => String, { nullable: true })
  table?: string | null;

  // In Prisma: number is String?, NOT number => must be string | null
  @Field(() => Number, { nullable: true })
  number?: number | null;

  @Field(() => String, { nullable: true })
  note?: string | null;

  @Field(() => String, { nullable: true })
  guestId?: string | null;
}
