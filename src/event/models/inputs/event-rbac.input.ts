import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreateEventRoleInput {
  @Field(() => ID)
  eventId!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  key?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  color?: string;

  @Field(() => String, { nullable: true })
  icon?: string;
}

@InputType()
export class UpdateEventRoleInput {
  @Field(() => ID)
  eventId!: string;

  @Field(() => ID)
  roleId!: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  color?: string;

  @Field(() => String, { nullable: true })
  icon?: string;
}

@InputType()
export class SetEventRolePermissionsInput {
  @Field(() => ID)
  eventId!: string;

  @Field(() => ID)
  roleId!: string;

  @Field(() => [String])
  permissionKeys!: string[];
}

@InputType()
export class ArchiveEventRoleInput {
  @Field(() => ID)
  eventId!: string;

  @Field(() => ID)
  roleId!: string;
}

@InputType()
export class DeleteEventRoleInput {
  @Field(() => ID)
  eventId!: string;

  @Field(() => ID)
  roleId!: string;
}

@InputType()
export class AssignEventRoleInput {
  @Field(() => ID)
  eventId!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  roleId!: string;
}

@InputType()
export class RemoveEventRoleInput {
  @Field(() => ID)
  eventId!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  roleId!: string;
}
