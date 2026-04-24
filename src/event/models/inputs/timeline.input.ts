import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsDateString } from 'class-validator';


@InputType()
export class CreateTimelineInput {
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


@InputType()
export class UpdateTimelineInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;

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

@InputType()
export class RemoveTimelineInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}

@InputType()
export class SetTimelineInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @Field(() => [TimelineUpsertInput])
  timelines!: TimelineUpsertInput[];
}

@InputType()
export class TimelineUpsertInput {
  @Field(() => ID, { nullable: true })
  id?: string; // undefined = CREATE

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