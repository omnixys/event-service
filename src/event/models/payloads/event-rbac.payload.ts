import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType()
export class EventPermissionPayload {
  @Field()
  key!: string;

  @Field()
  category!: string;

  @Field()
  label!: string;

  @Field()
  description!: string;

  @Field(() => String, { nullable: true })
  premiumFeatureKey?: string;
}

@ObjectType()
export class EventRoleDefinitionPayload {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  eventId!: string;

  @Field()
  key!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  color?: string;

  @Field(() => String, { nullable: true })
  icon?: string;

  @Field(() => String, { nullable: true })
  systemKey?: string;

  @Field()
  system!: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  archivedAt?: Date;

  @Field(() => [String])
  permissions!: string[];

  @Field(() => Int)
  assignedUserCount!: number;
}

@ObjectType()
export class EventAccessPayload {
  @Field(() => ID)
  eventId!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => [EventRoleDefinitionPayload])
  roles!: EventRoleDefinitionPayload[];

  @Field(() => [String])
  permissions!: string[];
}
