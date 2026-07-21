import { UserProjectionService } from '../event/services/user-projection.service.js';
import { Injectable } from '@nestjs/common';
import { UserProjectionChangedDTO } from '@omnixys/contracts';
import {
  IKafkaEventContext,
  KafkaEvent,
  KafkaEventHandler,
  KafkaTopics,
} from '@omnixys/kafka';
import { OmnixysLogger } from '@omnixys/logger';
import { TraceRunner } from '@omnixys/observability';

@KafkaEventHandler('user')
@Injectable()
export class UserProjectionHandler {
  private readonly logger;

  constructor(
    loggerService: OmnixysLogger,
    private readonly userProjectionService: UserProjectionService,
  ) {
    this.logger = loggerService.log(this.constructor.name);
  }

  @KafkaEvent(KafkaTopics.user.changedProjection)
  async handleUserChangedProjection(
    payload: UserProjectionChangedDTO,
    _context: IKafkaEventContext,
  ): Promise<void> {
    return TraceRunner.run('[HANDLER] user.changed.projection', async () => {
      this.logger.debug('User projection update received', { userId: payload.id });

      await this.userProjectionService.upsertFromKafka(payload);
    });
  }
}
