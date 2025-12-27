/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class ThemeInput {
  @Field(() => JsonScalar, { nullable: true })
  @IsOptional()
  colors?: Record<string, any>;

  @Field(() => JsonScalar, { nullable: true })
  @IsOptional()
  layout?: Record<string, any>;

  @Field(() => JsonScalar, { nullable: true })
  @IsOptional()
  typography?: Record<string, any>;
}
