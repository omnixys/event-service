import { AuthModule } from '../auth/auth.module.js';
import { ScalarsModule } from '../core/scalars/scalar.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EventFieldsResolver } from './resolvers/event-fields.resolver.js';
import { EventMutationResolver } from './resolvers/event-mutation.resolver.js';
import { EventQueryResolver } from './resolvers/event-query.resolver.js';
import { EventReadService } from './services/event-read.service.js';
import { EventWriteService } from './services/event-write.service.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule, ScalarsModule],
  providers: [
    EventQueryResolver,
    EventMutationResolver,
    EventFieldsResolver,
    EventWriteService,
    EventReadService,
  ],
  exports: [EventWriteService, EventReadService],
})
export class EventModule {}
