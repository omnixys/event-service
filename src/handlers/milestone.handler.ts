import { EventWriteService } from '../event/services/event-write.service.js';
import { Injectable } from '@nestjs/common';
import type { EventMilestoneRecordedDTO } from '@omnixys/contracts-ts';
import { KafkaEvent, KafkaEventHandler, KafkaTopics } from '@omnixys/kafka-ts';
import { OmnixysLogger } from '@omnixys/logger-ts';

@KafkaEventHandler('event-milestones')
@Injectable()
export class MilestoneHandler {
  private readonly logger;

  constructor(
    private readonly events: EventWriteService,
    logger: OmnixysLogger,
  ) {
    this.logger = logger.log(this.constructor.name);
  }

  @KafkaEvent(KafkaTopics.event.milestoneRecorded)
  async handleMilestone(payload: EventMilestoneRecordedDTO): Promise<void> {
    this.logger.info('Kafka event milestone received', {
      eventId: payload.eventId,
      milestoneId: payload.milestoneId,
      type: payload.type,
    });
    await this.events.recordMilestone(payload);
    this.logger.info('Kafka event milestone processed', {
      eventId: payload.eventId,
      milestoneId: payload.milestoneId,
    });
  }
}
