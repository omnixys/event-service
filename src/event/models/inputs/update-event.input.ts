import { Field, GraphQLISODateTime, InputType, Int } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

// @InputType()
// export class UpdateEventInput extends PartialType(CreateEventInput) {
//   @Field({ nullable: false })
//   eventId!: string; // Must always be included
// }




@InputType()
export class UpdateSettingsInput {
  @Field(() => Boolean, { nullable: true })
  allowReEntry?: boolean;

  @Field(() => Int, { nullable: true })
  rotateSeconds?: number;

  @Field(() => Int, { nullable: true })
  maxSeats?: number;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @Field(() => String, { nullable: true })
  dressCode?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  startsAt?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  endsAt?: Date;
}

@InputType()
export class UpdateEventInput {
  @Field(() => String)
  eventId!: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  parentId?: string;

  @Field(() => UpdateSettingsInput, { nullable: true })
  settings?: UpdateSettingsInput;
}
