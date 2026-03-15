import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateSettingsInput {
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

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dressCode!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description!: string;
}
