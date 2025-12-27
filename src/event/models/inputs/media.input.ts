import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsUrl,
} from 'class-validator';

@InputType()
export class MediaInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  kind!: string;

  @Field()
  @IsUrl()
  url!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  alt?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  order?: number;
}
