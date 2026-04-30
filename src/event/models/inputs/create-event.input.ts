import { CreateSettingsInput } from './create-settings.input.js';
import { Field, ID, InputType } from '@nestjs/graphql';
import { EventAddressInput } from '@omnixys/graphql';
import { Type } from 'class-transformer';
import {
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
