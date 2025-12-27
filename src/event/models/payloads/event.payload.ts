import { UserRole } from '../enums/user-role.enum.js';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class EventPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  startsAt!: Date;

  @Field()
  endsAt!: Date;

  @Field()
  allowReEntry!: boolean;

  @Field()
  rotateSeconds!: number;

  @Field()
  maxSeats!: number;

  @Field()
  owner!: string;

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

  @Field(() => UserRole, { nullable: true })
  myRole?: UserRole;
}
