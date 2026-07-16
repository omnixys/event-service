import { SeatColorGroupMatchType } from '../payloads/seat-color-group.payload.js';
import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  Min,
  ArrayMaxSize,
} from 'class-validator';

@InputType()
export class SeatColorGroupStyleInput {
  @Field()
  @IsString()
  background!: string;

  @Field()
  @IsString()
  foreground!: string;

  @Field()
  @IsString()
  border!: string;

  @Field()
  @IsString()
  legendIcon!: string;
}

@InputType()
export class SeatColorGroupInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  id?: string;

  @Field()
  @IsString()
  name!: string;

  @Field(() => SeatColorGroupStyleInput)
  @Type(() => SeatColorGroupStyleInput)
  style!: SeatColorGroupStyleInput;

  @Field(() => SeatColorGroupMatchType)
  matchType!: SeatColorGroupMatchType;

  @Field(() => [String])
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  invitedByValues!: string[];

  @Field(() => Int)
  @IsInt()
  @Min(0)
  priority!: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  order!: number;
}
