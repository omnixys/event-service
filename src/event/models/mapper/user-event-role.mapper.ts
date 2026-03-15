import type { Role } from '../../../prisma/generated/client.js';
import type { UserRolePayload } from '../payloads/user-role.entity.js';

export class UserEventRoleMapper {
  static toPayload(entity: Role): UserRolePayload {
    return {
      id: entity.id,
      userId: entity.userId,
      eventId: entity.eventId,
      role: entity.role,
    };
  }

  static toPayloadList(list: Role[]): UserRolePayload[] {
    return list.map((u) => this.toPayload(u));
  }
}
