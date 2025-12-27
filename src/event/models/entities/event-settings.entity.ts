/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EventSettings {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field(() => JsonScalar)
  data!: Record<string, any>;
}
