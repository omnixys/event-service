import {
  EventCategory,
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
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsDate,
  IsUrl,
} from 'class-validator';

import { Type } from 'class-transformer';

// ✅ Register enums ONCE
registerEnumType(EventCategory, { name: 'EventCategory' });
registerEnumType(InvitationApprovalMode, { name: 'InvitationApprovalMode' });

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

  // 🎨 Content
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  dressCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

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
