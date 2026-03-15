import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SettingsPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  allowReEntry!: boolean;

  @Field()
  rotateSeconds!: number;

  @Field()
  maxSeats!: number;

  @Field({ nullable: true })
  dressCode?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
