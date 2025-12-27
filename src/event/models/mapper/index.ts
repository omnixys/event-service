// export class HydratedEventMapper {
//   static toPayload(entity: PrismaEventFull): EventPayloadFull {
//     return {
//       ...EventMapper.toPayload(entity),

//       address: entity.address
//         ? EventAddressMapper.toPayload(entity.address)
//         : null,
//       settings: entity.settings
//         ? EventSettingsMapper.toPayload(entity.settings)
//         : null,
//       theme: entity.theme ? EventThemeMapper.toPayload(entity.theme) : null,

//       media: EventMediaMapper.toPayloadList(entity.media),
//       description: EventDescriptionBlockMapper.toPayloadList(
//         entity.description,
//       ),
//       faqs: EventFAQMapper.toPayloadList(entity.faqs),
//       team: EventTeamMapper.toPayloadList(entity.team),
//       timeline: EventTimelineMapper.toPayloadList(entity.timeline),
//       auditLogs: EventAuditLogMapper.toPayloadList(entity.auditLogs),

//       roles: UserEventRoleMapper.toPayloadList(entity.userRoles),
//     };
//   }
// }
