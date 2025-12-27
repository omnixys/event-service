import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class FAQInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  question!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  answer!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  order?: number;
}
