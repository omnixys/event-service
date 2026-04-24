import { Field, GraphQLISODateTime, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
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

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  allowPublicRsvp!: boolean;

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  allowPublicPlusOne!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  allowPublicRsvpWebsite!: boolean;

    @Field(() => String, {nullable: true})
  @IsString()
  @IsOptional()
  publicRsvpWebsite?: string

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  isActive!: boolean;
  
  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  isPublic!: boolean;


  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  coverImageUrl?: string

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  logoUrl?: string

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dressCode!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsISO8601()
  startsAt!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsISO8601()
  endsAt!: Date;
}
