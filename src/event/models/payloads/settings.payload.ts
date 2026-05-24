import {
  EventCategory,
  InvitationApprovalMode,
} from '../../../prisma/generated/client.js';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';

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
  startsAt!: Date;

  @Field()
  endsAt!: Date;

  @Field()
  allowPublicRsvp!: boolean;

  @Field()
  allowPublicPlusOne!: boolean;

  @Field()
  allowPublicRsvpWebsite!: boolean;

  @Field()
  allowPlusOneUpdate!: boolean;

  @Field()
  maxPlusOnes!: number;

  @Field()
  requireApprovalForPlusOnes!: boolean;

  @Field({ nullable: true })
  rsvpDeadline?: Date;

  @Field(() => InvitationApprovalMode)
  approvalMode!: InvitationApprovalMode;

  @Field()
  allowGuestSeatSelection!: boolean;

  @Field()
  allowSeatOverbooking!: boolean;

  @Field()
  isPublic!: boolean;

  @Field({ nullable: true })
  publicRsvpWebsite?: string;

  @Field(() => EventCategory)
  category!: EventCategory;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
  })
  updatedAt?: Date | undefined;
}
