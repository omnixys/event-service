import { UserRoleType } from '../../../prisma/generated/client.js';
import { SettingsPayload } from './settings.payload.js';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class EventPayload {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  owner!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => UserRoleType, { nullable: true })
  myRole?: UserRoleType;

  @Field(() => SettingsPayload)
  settings?: SettingsPayload;
}
