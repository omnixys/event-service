import { CreateEventInput } from './create-event.input.js';
import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateEventInput extends PartialType(CreateEventInput) {
  @Field({ nullable: false })
  eventId!: string; // Must always be included
}
