/* eslint-disable @typescript-eslint/no-explicit-any */

import { JsonScalar } from '../../../core/scalars/json.scalar.js';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsObject } from 'class-validator';

@InputType()
export class SettingsInput {
  @Field(() => JsonScalar)
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
