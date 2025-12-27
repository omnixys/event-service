import type { EventTeamMember } from '../../../prisma/generated/client.js';
import type { EventTeamMemberPayload } from '../payloads/event-team-member.payload.js';

export class EventTeamMapper {
  static toPayload(entity: EventTeamMember): EventTeamMemberPayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      name: entity.name,
      role: entity.role,
      imageUrl: entity.imageUrl ?? undefined,
      order: entity.order,
    };
  }

  static toPayloadList(list: EventTeamMember[]): EventTeamMemberPayload[] {
    return list.map((t) => this.toPayload(t));
  }
}
