import type { EventTimeline } from '../../../prisma/generated/client.js';
import type { EventTimelinePayload } from '../payloads/event-timeline.payload.js';

export class EventTimelineMapper {
  static toPayload(entity: EventTimeline): EventTimelinePayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      type: entity.type,
      timestamp: entity.timestamp,
      label: entity.label,
    };
  }

  static toPayloadList(list: EventTimeline[]): EventTimelinePayload[] {
    return list.map((t) => this.toPayload(t));
  }
}
