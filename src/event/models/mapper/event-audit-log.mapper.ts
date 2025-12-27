import type { EventAuditLog } from '../../../prisma/generated/client.js';
import type { EventAuditLogPayload } from '../payloads/event-audit-log.payload.js';

export class EventAuditLogMapper {
  static toPayload(entity: EventAuditLog): EventAuditLogPayload {
    return {
      id: entity.id,
      eventId: entity.eventId,
      actorId: entity.actorId,
      action: entity.action,
      data: entity.data ?? null,
      createdAt: entity.createdAt,
    };
  }

  static toPayloadList(list: EventAuditLog[]): EventAuditLogPayload[] {
    return list.map((l) => this.toPayload(l));
  }
}
