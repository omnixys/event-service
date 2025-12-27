import type { EventSettings } from '../../../prisma/generated/client.js';
import type { EventSettingsPayload } from '../payloads/event-settings.payload.js';

export class EventSettingsMapper {
  static toPayload(entity: EventSettings): EventSettingsPayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      data: entity.data,
    };
  }
}
