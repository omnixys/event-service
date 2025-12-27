import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsUrl } from 'class-validator';

@InputType()
export class TeamMemberInput {
  @Field()
  @IsString()
  name!: string;

  @Field()
  @IsString()
  role!: string;

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  order?: number;
}
