/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class EventDescriptionBlockPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  type!: string;

  @Field(() => Int)
  order!: number;

  @Field()
  visible!: boolean;

  @Field(() => JsonScalar)
  props!: any;
}
