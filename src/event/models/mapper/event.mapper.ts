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
    return {
      id: event.id,
      name: event.name,
      owner: event.owner,

      parentId: n2u(event.parentId),
      path: n2u(event.path),
      depth: event.depth,

      createdAt: event.createdAt,
      updatedAt: n2u(event.updatedAt),

      myRole: n2u(myRole),

      coverMediaId: n2u(event.coverMediaId),
      logoMediaId: n2u(event.logoMediaId),

      settings: event.settings
        ? {
            id: event.settings.id,

            // 🔧 Core
            allowReEntry: event.settings.allowReEntry,
            rotateSeconds: event.settings.rotateSeconds,
            maxSeats: event.settings.maxSeats,

            // 🌐 RSVP
            allowPublicRsvp: event.settings.allowPublicRsvp,
            allowPublicPlusOne: event.settings.allowPublicPlusOne,
            allowPublicRsvpWebsite: event.settings.allowPublicRsvpWebsite,
            allowPlusOneUpdate: event.settings.allowPlusOneUpdate,

            maxPlusOnes: event.settings.maxPlusOnes,
            requireApprovalForPlusOnes:
              event.settings.requireApprovalForPlusOnes,
            rsvpDeadline: n2u(event.settings.rsvpDeadline),

            // 🔥 Approval
            approvalMode: event.settings.approvalMode,

            // 🪑 Seating
            allowGuestSeatSelection: event.settings.allowGuestSeatSelection,
            allowSeatOverbooking: event.settings.allowSeatOverbooking,

            // 🌍 Visibility
            isActive: event.settings.isActive,
            isPublic: event.settings.isPublic,

            // 🌐 Public
            publicRsvpWebsite: n2u(event.settings.publicRsvpWebsite),

            // 🎨 Content
            dressCode: n2u(event.settings.dressCode),
            description: n2u(event.settings.description),

            // 📅 Time
            startsAt: event.settings.startsAt,
            endsAt: event.settings.endsAt,

            // 📂 Category
            category: event.settings.category,

            // 🧾 Meta
            createdAt: event.settings.createdAt,
            updatedAt: n2u(event.settings.updatedAt),
          }
        : undefined,
    };
  }

  static toPayloadList(list: Event[]): EventPayload[] {
    return list.map((event) => this.toPayload(event));
  }
}
