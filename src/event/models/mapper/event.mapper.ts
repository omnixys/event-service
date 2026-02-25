import type { Event } from '../../../prisma/generated/client.js';
import { n2u } from '../../utils/null-to-undefined.js';
import type { UserRole } from '../enums/user-role.enum.js';
import type { EventPayload } from '../payloads/event.payload.js';

export class EventMapper {
  static toPayload(event: Event, myRole?: UserRole): EventPayload {
    return {
      id: event.id,
      name: event.name,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      allowReEntry: event.allowReEntry,
      rotateSeconds: event.rotateSeconds,
      maxSeats: event.maxSeats,
      owner: event.owner,
      description: n2u(event.description),
      dressCode: n2u(event.dressCode),
      isActive: event.isActive,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,

      myRole: myRole === null ? undefined : myRole,
    };
  }

  static toPayloadList(list: Event[]): EventPayload[] {
    return list.map((event) => this.toPayload(event));
  }
}
