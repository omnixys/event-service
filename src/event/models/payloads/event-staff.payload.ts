import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EventStaffPersonalInfo {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  email?: string;
}

@ObjectType()
export class EventStaffPhoneNumber {
  @Field()
  number!: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  label?: string;

  @Field({ nullable: true })
  isPrimary?: boolean;
}

@ObjectType()
export class EventStaffPayload {
  @Field(() => ID)
  userId!: string;

  @Field({ nullable: true })
  username?: string;

  @Field(() => [String])
  roles!: string[];

  @Field(() => [String])
  permissions!: string[];

  @Field(() => EventStaffPersonalInfo, { nullable: true })
  personalInfo?: EventStaffPersonalInfo;

  @Field(() => [EventStaffPhoneNumber], { nullable: true })
  phoneNumbers?: EventStaffPhoneNumber[];

  @Field({ nullable: true })
  email?: string;
}
