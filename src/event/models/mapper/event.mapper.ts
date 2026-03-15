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
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      owner: event.owner,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,

      myRole: n2u(myRole),

      settings: event.settings
        ? {
            id: event.settings.id,
            allowReEntry: event.settings.allowReEntry,
            rotateSeconds: event.settings.rotateSeconds,
            maxSeats: event.settings.maxSeats,
            isActive: event.settings.isActive,
            dressCode: n2u(event.settings.dressCode),
            description: n2u(event.settings.description),
            createdAt: event.settings.createdAt,
            updatedAt: event.settings.updatedAt,
          }
        : undefined,
    };
  }

  static toPayloadList(list: Event[]): EventPayload[] {
    return list.map((event) => this.toPayload(event));
  }
}
