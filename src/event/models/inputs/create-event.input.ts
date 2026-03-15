import { CreateSettingsInput } from './create-settings.input.js';
import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import { UserAddressInput } from '@omnixys/graphql';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
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

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsDate()
  startsAt!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsDate()
  endsAt!: Date;

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
