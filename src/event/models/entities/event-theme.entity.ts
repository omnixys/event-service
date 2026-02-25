/* eslint-disable @typescript-eslint/no-explicit-any */

import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EventTheme {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field(() => JsonScalar, { nullable: true })
  colors?: Record<string, any>;

  @Field(() => JsonScalar, { nullable: true })
  layout?: Record<string, any>;

  @Field(() => JsonScalar, { nullable: true })
  typography?: Record<string, any>;
}
