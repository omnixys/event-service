import { MediaProcessingService } from '../event/services/media-processing.service.js';
import { Injectable } from '@nestjs/common';
import type { EventMediaUploadedDTO } from '@omnixys/contracts-ts';
import { KafkaEvent, KafkaEventHandler, KafkaTopics } from '@omnixys/kafka-ts';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { TraceRunner } from '@omnixys/observability-ts';

@KafkaEventHandler('event-media')
@Injectable()
export class MediaHandler {
  private readonly logger;

  constructor(
    private readonly processing: MediaProcessingService,
    logger: OmnixysLogger,
  ) {
    this.logger = logger.log(this.constructor.name);
  }

  @KafkaEvent(KafkaTopics.event.mediaUploaded)
  async handleMediaUploaded(payload: EventMediaUploadedDTO): Promise<void> {
    return TraceRunner.run('[HANDLER] event.media.uploaded', async () => {
      this.logger.info('Kafka media processing started: %o', {
        mediaId: payload.mediaId,
        eventId: payload.eventId,
      });

      try {
        const variants = await this.processing.processFromStorage(
          payload.mediaId,
          payload.key,
        );
        this.logger.info('Kafka media processing finished: %o', {
          mediaId: payload.mediaId,
          eventId: payload.eventId,
          variants: variants.length,
        });
      } catch (error) {
        this.logger.error('Kafka media processing failed: %o', {
          mediaId: payload.mediaId,
          eventId: payload.eventId,
          error,
        });
        throw error;
      }
    });
  }
}
