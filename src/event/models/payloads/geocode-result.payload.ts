import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GeocodeResultPayload {
  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;

  @Field({ nullable: true })
  displayName?: string;
}
