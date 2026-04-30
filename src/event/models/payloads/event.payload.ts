import { UserRoleType } from '../../../prisma/generated/client.js';
import { SettingsPayload } from './settings.payload.js';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class EventPayload {
  @Field(() => ID)
  id!: string;
  @Field()
  name!: string;
  @Field()
  owner!: string;

  @Field(() => ID, { nullable: true })
  coverMediaId?: string;
  @Field(() => ID, { nullable: true })
  logoMediaId?: string;

  @Field(() => String, { nullable: true })
  parentId?: string;
  @Field(() => String, { nullable: true })
  path?: string;
  @Field(() => Int)
  depth!: number;

  @Field()
  createdAt!: Date;
  @Field()
  updatedAt!: Date;

  @Field(() => UserRoleType, { nullable: true })
  myRole?: UserRoleType;
  @Field(() => SettingsPayload, { nullable: true })
  settings?: SettingsPayload;
}
