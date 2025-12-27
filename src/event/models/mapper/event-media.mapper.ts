import type { EventMedia } from '../../../prisma/generated/browser.js';
import type { EventMediaPayload } from '../payloads/event-media.payload.js';

export class EventMediaMapper {
  static toPayload(entity: EventMedia): EventMediaPayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      kind: entity.kind,
      url: entity.url,
      alt: entity.alt ?? undefined,
      order: entity.order,
    };
  }

  static toPayloadList(list: EventMedia[]): EventMediaPayload[] {
    return list.map((m) => this.toPayload(m));
  }
}
