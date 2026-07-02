import type {
  Event,
  Settings,
  UserRoleType,
} from '../../../prisma/generated/client.js';
import { n2u } from '../../utils/null-to-undefined.js';
import type { EventPayload } from '../payloads/event.payload.js';

type EventWithSettings = Event & {
  settings?: Settings | null;
};

export class EventMapper {
  static toPayload(
    event: EventWithSettings,
    myRole?: UserRoleType,
  ): EventPayload {
    const settings = event.settings;

    return {
      id: event.id,
      name: event.name,
      owner: event.owner,
      tags: event.tags,

      parentId: n2u(event.parentId),
      path: n2u(event.path),
      depth: event.depth,

      createdAt: event.createdAt,
      updatedAt: n2u(event.updatedAt),

      myRole: n2u(myRole),

      coverMediaId: n2u(event.coverMediaId),
      logoMediaId: n2u(event.logoMediaId),

      settings: settings
        ? {
            id: settings.id,

            // 🔧 Core
            allowReEntry: settings.allowReEntry,
            rotateSeconds: settings.rotateSeconds,
            maxSeats: settings.maxSeats,

            // 🌐 RSVP
            allowPublicRsvp: settings.allowPublicRsvp,
            allowPublicPlusOne: settings.allowPublicPlusOne,
            allowPublicRsvpWebsite: settings.allowPublicRsvpWebsite,
            allowPlusOneUpdate: settings.allowPlusOneUpdate,

            maxPlusOnes: settings.maxPlusOnes,
            requireApprovalForPlusOnes: settings.requireApprovalForPlusOnes,
            rsvpDeadline: n2u(settings.rsvpDeadline),

            // 🔥 Approval
            approvalMode: settings.approvalMode,

            // 🪑 Seating
            allowGuestSeatSelection: settings.allowGuestSeatSelection,
            allowSeatOverbooking: settings.allowSeatOverbooking,

            // 🌍 Visibility
            isActive: settings.isActive,
            isPublic: settings.isPublic,

            // 🌐 Public
            publicRsvpWebsite: n2u(settings.publicRsvpWebsite),
            invitedByOptions: settings.invitedByOptions ?? [],

            // 🎨 Content
            dressCode: n2u(settings.dressCode),
            description: n2u(settings.description),

            // 📅 Time
            startsAt: settings.startsAt,
            endsAt: settings.endsAt,

            // 📂 Category
            category: settings.category,

            // 🧾 Meta
            createdAt: settings.createdAt,
            updatedAt: n2u(settings.updatedAt),
          }
        : undefined,
    };
  }

  static toPayloadList(list: Event[]): EventPayload[] {
    return list.map((event) => this.toPayload(event));
  }
}
