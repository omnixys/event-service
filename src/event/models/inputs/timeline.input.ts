import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

@InputType()
export class TimelineInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  type!: string;

  @Field()
  @IsDateString()
  timestamp!: string;

  @Field()
  @IsString()
  label!: string;
}
