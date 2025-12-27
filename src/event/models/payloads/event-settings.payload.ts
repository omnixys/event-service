/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class EventSettingsPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field(() => JsonScalar)
  data!: any;
}
