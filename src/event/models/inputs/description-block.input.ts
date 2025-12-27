/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class DescriptionBlockInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  type!: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  order?: number;

  @Field()
  @IsBoolean()
  visible!: boolean;

  @Field(() => JsonScalar)
  props!: Record<string, any>;
}
