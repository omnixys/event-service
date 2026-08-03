import { UserProjectionService } from '../event/services/user-projection.service.js';
import { Injectable } from '@nestjs/common';
import { UserProjectionChangedDTO } from '@omnixys/contracts-ts';
import {
  IKafkaEventContext,
  KafkaEvent,
  KafkaEventHandler,
  KafkaTopics,
} from '@omnixys/kafka-ts';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { TraceRunner } from '@omnixys/observability-ts';

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
      this.logger.debug('User projection update received', {
        userId: payload.id,
      });

      await this.userProjectionService.upsertFromKafka(payload);
    });
  }
}
