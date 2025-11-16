import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateSeatInput {
  @Field(() => ID)
  eventId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  section?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  table?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsString()
  number?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}
