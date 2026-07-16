import {
  EventCategory,
  EventVisibleTab,
  InvitationApprovalMode,
} from '../../../prisma/generated/enums.js';
import {
  Field,
  GraphQLISODateTime,
  InputType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';

import {
  ArrayMaxSize,
  IsBoolean,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsDate,
  IsUrl,
  ValidateNested,
} from 'class-validator';

import { SeatColorGroupInput } from './seat-color-group.input.js';
import { Type } from 'class-transformer';

// ✅ Register enums ONCE
registerEnumType(EventCategory, { name: 'EventCategory' });
registerEnumType(EventVisibleTab, { name: 'EventVisibleTab' });
registerEnumType(InvitationApprovalMode, { name: 'InvitationApprovalMode' });

const DEFAULT_VISIBLE_TABS = [
  EventVisibleTab.TIMELINE,
  EventVisibleTab.DETAILS,
  EventVisibleTab.MAP,
];

@InputType()
export class CreateSettingsInput {
  // 🔧 Core
  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  allowReEntry!: boolean;

  @Field(() => Int, { defaultValue: 300 })
  @IsInt()
  @Min(30)
  @Max(3600)
  rotateSeconds!: number;

  @Field(() => Int, { defaultValue: 50 })
  @IsInt()
  @Min(1)
  maxSeats!: number;

  // 🌐 RSVP
  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  allowPublicRsvp!: boolean;

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  allowPublicPlusOne!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowPublicRsvpWebsite!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowPlusOneUpdate!: boolean;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  maxPlusOnes!: number;

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  requireApprovalForPlusOnes!: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  rsvpDeadline?: Date;

  // 🔥 Approval
  @Field(() => InvitationApprovalMode, {
    defaultValue: InvitationApprovalMode.MANUAL,
  })
  approvalMode!: InvitationApprovalMode;

  // 🪑 Seating
  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowGuestSeatSelection!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowSeatOverbooking!: boolean;

  // 🌍 Visibility
  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  isActive!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  isPublic!: boolean;

  // 🌐 Public
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  publicRsvpWebsite?: string;

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  invitedByOptions!: string[];

  @Field(() => [EventVisibleTab], { defaultValue: DEFAULT_VISIBLE_TABS })
  @IsArray()
  @ArrayMaxSize(10)
  visibleTabs!: EventVisibleTab[];

  @Field(() => [SeatColorGroupInput], { nullable: true })
  @ValidateNested({ each: true })
  @Type(() => SeatColorGroupInput)
  @IsOptional()
  seatColorGroups?: SeatColorGroupInput[];

  // 🎨 Content
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  dressCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  // 🎫 Ticket Release
  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  scheduleTicketRelease!: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  ticketReleaseAt?: Date;

  // 📅 Time
  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt!: Date;

  // 📂 Category
  @Field(() => EventCategory)
  category!: EventCategory;
}
