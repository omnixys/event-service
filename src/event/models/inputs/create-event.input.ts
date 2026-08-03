import { CreateSettingsInput } from './create-settings.input.js';
import { Field, ID, InputType } from '@nestjs/graphql';
import { EventAddressInput } from '@omnixys/graphql-ts';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

@InputType()
export class CreateEventInput {
  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  parentId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ValidateNested()
  @Field(() => EventAddressInput, { nullable: true })
  @Type(() => EventAddressInput)
  @IsOptional()
  address?: EventAddressInput;

  @ValidateNested()
  @Field(() => CreateSettingsInput)
  @Type(() => CreateSettingsInput)
  @IsOptional()
  settings?: CreateSettingsInput;

  @Field(() => [CreateEventInput], { nullable: true })
  children?: CreateEventInput[];
}
