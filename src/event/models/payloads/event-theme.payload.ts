/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EventThemePayload {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field(() => JsonScalar, { nullable: true })
  colors?: any;

  @Field(() => JsonScalar, { nullable: true })
  layout?: any;

  @Field(() => JsonScalar, { nullable: true })
  typography?: any;
}
