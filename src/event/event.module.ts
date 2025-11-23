import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EventMutationResolver } from './resolvers/event-mutation.resolver.js';
import { EventQueryResolver } from './resolvers/event-query.resolver.js';
import { SeatMutationResolver } from './resolvers/seat-mutation.resolver.js';
import { SeatQueryResolver } from './resolvers/seat-query.resolver.js';
import { EventReadService } from './services/event-read.service.js';
import { EventWriteService } from './services/event-write.service.js';
import { SeatReadService } from './services/seat-read.service.js';
import { SeatWriteService } from './services/seat-write.service.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    EventMutationResolver,
    EventQueryResolver,
    EventWriteService,
    EventReadService,
    SeatMutationResolver,
    SeatQueryResolver,
    SeatWriteService,
    SeatReadService,
  ],
  exports: [
    EventWriteService,
    EventReadService,
    SeatWriteService,
    SeatReadService,
  ],
})
export class EventModule {}
