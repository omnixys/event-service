import { CoreHttpModule } from '../core/http.module.js';
import { ScalarsModule } from '../core/scalars/scalar.module.js';
import { UserRoleType } from '../prisma/generated/client.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MediaUploadController } from './controller/media-upload.controller.js';
import { EventAdminQueryResolver } from './resolvers/event-admin-query.resolver.js';
import { EventFieldsResolver } from './resolvers/event-fields.resolver.js';
import { EventMutationResolver } from './resolvers/event-mutation.resolver.js';
import { EventQueryResolver } from './resolvers/event-query.resolver.js';
import { EventRbacResolver } from './resolvers/event-rbac.resolver.js';
import { EventStaffResolver } from './resolvers/event-staff.resolver.js';
import { MediaResolver } from './resolvers/media.resolver.js';
import { EventAccessService } from './services/event-access.service.js';
import { EventRbacService } from './services/event-rbac.service.js';
import { EventReadService } from './services/event-read.service.js';
import { EventStaffService } from './services/event-staff.service.js';
import { EventWriteService } from './services/event-write.service.js';
import { GeocodingService } from './services/geocoding.service.js';
import { ImageService } from './services/image.service.js';
import { MediaProcessingService } from './services/media-processing.service.js';
import { MediaService } from './services/media.service.js';
import { UserProjectionService } from './services/user-projection.service.js';
import { Module } from '@nestjs/common';
import { registerEnumType } from '@nestjs/graphql';
import {
  EventPermissionGuard,
  EventPermissionResolver,
  EventRoleGuard,
  EventRoleResolver,
} from '@omnixys/security';

registerEnumType(UserRoleType, {
  name: 'UserRoleType',
  description: 'Role of a user inside an event',
});

@Module({
  imports: [PrismaModule, ScalarsModule, CoreHttpModule],
  controllers: [MediaUploadController],
  providers: [
    EventAdminQueryResolver,
    EventQueryResolver,
    EventMutationResolver,
    EventRbacResolver,
    EventFieldsResolver,
    EventStaffResolver,
    MediaResolver,

    EventWriteService,
    EventReadService,
    EventAccessService,
    EventRbacService,
    ImageService,
    MediaProcessingService,
    MediaService,
    GeocodingService,
    EventStaffService,
    UserProjectionService,

    EventRoleGuard,
    EventPermissionGuard,
    {
      provide: EventRoleResolver,
      useExisting: EventAccessService,
    },
    {
      provide: EventPermissionResolver,
      useExisting: EventAccessService,
    },
  ],
  exports: [
    EventWriteService,
    EventReadService,
    EventRbacService,
    MediaProcessingService,
    EventAccessService,
    UserProjectionService,
  ],
})
export class EventModule {}
