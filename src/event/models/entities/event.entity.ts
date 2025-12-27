import { EventAddress } from './event-address.entity.js';
import { EventAuditLog } from './event-audit-log.entity.js';
import { EventDescriptionBlock } from './event-description-block.entity.js';
import { EventFAQ } from './event-faq.model.js';
import { EventMedia } from './event-media.entity.js';
import { EventSettings } from './event-settings.entity.js';
import { EventTeamMember } from './event-team-member.entity.js';
import { EventTheme } from './event-theme.entity.js';
import { EventTimeline } from './event-timeline.entity.js';
import { UserEventRole } from './user-role.entity.js';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Event {
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
  owner!: number;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => [EventAddress], { nullable: true })
  address?: EventAddress[];

  @Field(() => EventSettings, { nullable: true })
  settings?: EventSettings;

  @Field(() => EventTheme, { nullable: true })
  theme?: EventTheme;

  @Field(() => [EventMedia])
  media!: EventMedia[];

  @Field(() => [EventDescriptionBlock])
  fullDescription!: EventDescriptionBlock[];

  @Field(() => [EventFAQ])
  faqs!: EventFAQ[];

  @Field(() => [EventTeamMember])
  team!: EventTeamMember[];

  @Field(() => [EventAuditLog])
  auditLogs!: EventAuditLog[];

  @Field(() => [EventTimeline])
  timeline!: EventTimeline[];

  @Field(() => [UserEventRole])
  userRoles!: UserEventRole[];
}
