import { CreateSettingsInput } from './create-settings.input.js';
import { Field, ID, InputType } from '@nestjs/graphql';
import { UserAddressInput } from '@omnixys/graphql';
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

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  owner!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  // Optional nested objects
  @ValidateNested()
  @Field(() => UserAddressInput, { nullable: true })
  @Type(() => UserAddressInput)
  @IsOptional()
  address?: UserAddressInput;

  @ValidateNested()
  @Field(() => CreateSettingsInput)
  @Type(() => CreateSettingsInput)
  @IsOptional()
  settings?: CreateSettingsInput;
}
