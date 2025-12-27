import type { EventAddress } from '../../../prisma/generated/client.js';
import type { EventAddressPayload } from '../payloads/event-address.payload.js';

export class EventAddressMapper {
  static toPayload(entity: EventAddress): EventAddressPayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      street: entity.street,
      city: entity.city,
      zip: entity.zip,
      country: entity.country,
      latitude: entity.latitude,
      longitude: entity.longitude,
    };
  }

  static toPayloadList(list: EventAddress[]): EventAddressPayload[] {
    return list.map((address) => this.toPayload(address));
  }
}
