import { ScalarsModule } from '../core/scalars/scalar.module.js';
import { UserRoleType } from '../prisma/generated/client.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EventAdminQueryResolver } from './resolvers/event-admin-query.resolver.js';
import { EventFieldsResolver } from './resolvers/event-fields.resolver.js';
import { EventMutationResolver } from './resolvers/event-mutation.resolver.js';
import { EventQueryResolver } from './resolvers/event-query.resolver.js';
import { EventAccessService } from './services/event-access.service.js';
import { EventReadService } from './services/event-read.service.js';
import { EventWriteService } from './services/event-write.service.js';
import { Module } from '@nestjs/common';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(UserRoleType, {
  name: 'UserRoleType',
  description: 'Role of a user inside an event',
});

@Module({
  imports: [PrismaModule, ScalarsModule],
  providers: [
    EventAdminQueryResolver,
    EventQueryResolver,
    EventMutationResolver,
    EventFieldsResolver,
    EventWriteService,
    EventReadService,
    EventAccessService,
  ],
  exports: [EventWriteService, EventReadService],
})
export class EventModule {}
