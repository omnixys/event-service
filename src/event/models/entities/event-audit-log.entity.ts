/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EventAuditLog {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  actorId!: string;

  @Field()
  action!: string;

  @Field(() => JsonScalar, { nullable: true })
  data?: Record<string, any>;

  @Field()
  createdAt!: Date;
}
