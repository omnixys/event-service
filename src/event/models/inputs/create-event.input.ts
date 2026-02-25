import { SeatingConfigInput } from '../dto/seating-config.dto.js';
import { EventAddressInput } from './address.input.js';
import { DescriptionBlockInput } from './description-block.input.js';
import { FAQInput } from './faq.input.js';
import { MediaInput } from './media.input.js';
import { SettingsInput } from './settings.input.js';
import { TeamMemberInput } from './team-member.input.js';
import { ThemeInput } from './theme.input.js';
import { TimelineInput } from './timeline.input.js';
import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateEventInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsDateString()
  startsAt!: string;

  @Field()
  @IsDateString()
  endsAt!: string;

  @Field()
  @IsBoolean()
  allowReEntry!: boolean;

  @Field()
  @IsInt()
  @Min(30)
  @Max(3600)
  rotateSeconds!: number;

  @Field()
  @IsInt()
  @Min(1)
  maxSeats!: number;

  // Optional nested objects

  @Field(() => [EventAddressInput], { nullable: true })
  @Type(() => EventAddressInput)
  @IsOptional()
  address?: EventAddressInput;

  @Field(() => SettingsInput, { nullable: true })
  @Type(() => SettingsInput)
  @IsOptional()
  settings?: SettingsInput;

  @Field(() => ThemeInput, { nullable: true })
  @Type(() => ThemeInput)
  @IsOptional()
  theme?: ThemeInput;

  @Field(() => [MediaInput], { nullable: true })
  @Type(() => MediaInput)
  @IsOptional()
  media?: MediaInput[];

  @Field(() => [DescriptionBlockInput], { nullable: true })
  @Type(() => DescriptionBlockInput)
  @IsOptional()
  description?: DescriptionBlockInput[];

  @Field(() => [FAQInput], { nullable: true })
  @Type(() => FAQInput)
  @IsOptional()
  faqs?: FAQInput[];

  @Field(() => [TeamMemberInput], { nullable: true })
  @Type(() => TeamMemberInput)
  @IsOptional()
  team?: TeamMemberInput[];

  @Field(() => [TimelineInput], { nullable: true })
  @Type(() => TimelineInput)
  @IsOptional()
  timeline?: TimelineInput[];

  @Field(() => SeatingConfigInput, { nullable: true })
  config?: SeatingConfigInput;
}
