import type { UserEventRole } from '../../../prisma/generated/client.js';
import type { UserEventRolePayload } from '../payloads/user-role.entity.js';

export class UserEventRoleMapper {
  static toPayload(entity: UserEventRole): UserEventRolePayload {
    return {
      id: entity.id,
      userId: entity.userId,
      eventId: entity.eventId,
      role: entity.role,
    };
  }

  static toPayloadList(list: UserEventRole[]): UserEventRolePayload[] {
    return list.map((u) => this.toPayload(u));
  }
}
