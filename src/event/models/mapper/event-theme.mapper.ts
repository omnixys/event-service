import type { EventTheme } from '../../../prisma/generated/client.js';
import type { EventThemePayload } from '../payloads/event-theme.payload.js';

export class EventThemeMapper {
  static toPayload(entity: EventTheme): EventThemePayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      colors: entity.colors ?? null,
      layout: entity.layout ?? null,
      typography: entity.typography ?? null,
    };
  }
}
