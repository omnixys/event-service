import type { EventFAQ } from '../../../prisma/generated/client.js';
import type { EventFAQPayload } from '../payloads/event-faq.payload.js';

export class EventFAQMapper {
  static toPayload(entity: EventFAQ): EventFAQPayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      question: entity.question,
      answer: entity.answer,
      order: entity.order,
    };
  }

  static toPayloadList(list: EventFAQ[]): EventFAQPayload[] {
    return list.map((f) => this.toPayload(f));
  }
}
