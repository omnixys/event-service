import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MediaVariantPayload {
  @Field()
  url!: string;

  @Field()
  key!: string;

  @Field(() => Int)
  width!: number;

  @Field(() => Int)
  height!: number;

  @Field()
  format!: string;
}

@ObjectType()
export class MediaPayload {
  @Field()
  id!: string;

  @Field()
  url!: string;

  @Field()
  key!: string;

  @Field()
  filename!: string;

  @Field()
  mimetype!: string;

  @Field(() => Int, { nullable: true })
  size?: number;

  @Field()
  type!: string;

  @Field(() => [MediaVariantPayload])
  variants!: MediaVariantPayload[];
}
