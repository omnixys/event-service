import { EventPayload } from './event.payload.js';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class EventTreePayload {
  @Field(() => EventPayload)
  rootEvent!: EventPayload;
  @Field(() => [EventPayload], { nullable: true })
  subEvents?: EventPayload[];
}
