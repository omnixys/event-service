import {
  EventCategory,
  InvitationApprovalMode,
} from '../../../prisma/generated/enums.js';
import { Field, GraphQLISODateTime, InputType, Int } from '@nestjs/graphql';
import { ArrayMaxSize, IsArray, IsOptional, IsString } from 'class-validator';

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

  @Field(() => Boolean, { nullable: true })
  allowPublicRsvp?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowPublicPlusOne?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowPublicRsvpWebsite?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowPlusOneUpdate?: boolean;

  @Field(() => Int, { nullable: true })
  maxPlusOnes?: number;

  @Field(() => Boolean, { nullable: true })
  requireApprovalForPlusOnes?: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  rsvpDeadline?: Date | null;

  @Field(() => InvitationApprovalMode, { nullable: true })
  approvalMode?: InvitationApprovalMode;

  @Field(() => Boolean, { nullable: true })
  allowGuestSeatSelection?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowSeatOverbooking?: boolean;

  @Field(() => Boolean, { nullable: true })
  isPublic?: boolean;

  @Field(() => String, { nullable: true })
  publicRsvpWebsite?: string | null;

  @Field(() => EventCategory, { nullable: true })
  category?: EventCategory;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsOptional()
  invitedByOptions?: string[];

  @Field(() => String, { nullable: true })
  dressCode?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  ticketReleaseAt?: Date | null;

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

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @Field(() => String, { nullable: true })
  parentId?: string;

  @Field(() => UpdateSettingsInput, { nullable: true })
  settings?: UpdateSettingsInput;
}
