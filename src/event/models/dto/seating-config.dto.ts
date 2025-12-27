import { ShapeType } from '../enums/shape.enum.js';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class SimpleSeatingConfigInput {
  @Field(() => Int)
  sections!: number;

  @Field(() => Int)
  tables!: number;

  @Field(() => Int, { nullable: true })
  seats?: number; // optional → auto distribute if missing
}

@InputType()
export class CustomSectionConfigInput {
  @Field()
  name!: string;

  @Field(() => Int)
  tables!: number;
}

@InputType()
export class CustomTableConfigInput {
  @Field()
  name!: string;

  @Field(() => Int, { nullable: true })
  seats?: number; // optional, defaults to auto-calculated
}

@InputType()
export class SeatingConfigInput {
  // ========== SIMPLE MODE ==========
  @Field(() => SimpleSeatingConfigInput, { nullable: true })
  simple?: SimpleSeatingConfigInput;

  // ========== CUSTOM MODE ==========
  @Field(() => [CustomSectionConfigInput], { nullable: true })
  sections?: CustomSectionConfigInput[];

  @Field(() => [CustomTableConfigInput], { nullable: true })
  tables?: CustomTableConfigInput[];

  // ========== SHAPE ==========
  @Field(() => ShapeType, { nullable: true, defaultValue: ShapeType.CIRCLE })
  form?: ShapeType;
}
