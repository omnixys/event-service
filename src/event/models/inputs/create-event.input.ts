// TODO resolve eslin t

import { Field, InputType, Int, GraphQLISODateTime } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

@InputType()
export class CreateEventInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => GraphQLISODateTime)
  @IsDateString()
  startsAt!: string;

  @Field(() => GraphQLISODateTime)
  @IsDateString()
  endsAt!: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  allowReEntry?: boolean = true;

  @Field(() => Int, { defaultValue: 50, nullable: true })
  @IsInt()
  @Min(10)
  maxSeats?: number = 50;

  @Field(() => Int, { defaultValue: 300, nullable: true })
  @IsInt()
  @Min(10)
  rotateSeconds?: number = 300;

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  dressCode?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int, { defaultValue: 5, nullable: true })
  defaultSection?: number = 5;

  @Field(() => Int, { defaultValue: 2, nullable: true })
  defaultTable?: number = 2;
}
