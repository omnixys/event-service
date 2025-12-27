import type { EventDescriptionBlock } from '../../../prisma/generated/client.js';
import type { EventDescriptionBlockPayload } from '../payloads/event-description-block.payload.js';

export class EventDescriptionBlockMapper {
  static toPayload(
    entity: EventDescriptionBlock,
  ): EventDescriptionBlockPayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      type: entity.type,
      order: entity.order,
      visible: entity.visible,
      props: entity.props,
    };
  }

  static toPayloadList(
    list: EventDescriptionBlock[],
  ): EventDescriptionBlockPayload[] {
    return list.map((b) => this.toPayload(b));
  }
}
