// public URL anpassen!!
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

import { EventAccessService } from '../services/event-access.service.js';
import { MediaService } from '../services/media.service.js';
import { FILE_STORAGE } from '@omnixys/media';
import type { FileStorage } from '@omnixys/media';

import { MediaType } from '../../prisma/generated/client.js';
import { UserRoleType } from '../../prisma/generated/client.js';
import { ContextAccessor } from '@omnixys/context';
import type { EventMediaUploadedDTO } from '@omnixys/contracts';
import { KafkaProducerService, KafkaTopics } from '@omnixys/kafka';
import { OmnixysLogger } from '@omnixys/logger';
import { TraceRunner } from '@omnixys/observability';
import { CookieAuthGuard, CurrentUser, CurrentUserData } from '@omnixys/security';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

interface UploadResponse {
  id: string;
  key: string;
  url: string;
  filename: string;
  size: number;
  eventId: string;
}

interface PresignedUrlResponse {
  key: string;
  uploadUrl: string;
  fileUrl: string;
}

interface CompleteUploadResponse {
  id: string;
  url: string;
}

@Controller('media')
export class MediaUploadController {
  private readonly logger;

  constructor(
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
    private readonly mediaService: MediaService,
    private readonly accessService: EventAccessService,
    private readonly producer: KafkaProducerService,
    private readonly loggerService: OmnixysLogger,
  ) {
    this.logger = this.loggerService.log(this.constructor.name);
  }

  @UseGuards(CookieAuthGuard)
  @Post('upload')
  async upload(
    @Req() req: FastifyRequest,
    @Query('eventId') eventId: string,
    @Query('type') type: MediaType,
    @CurrentUser() user: CurrentUserData,
  ): Promise<UploadResponse> {
    return TraceRunner.run('[MEDIA] upload', async () => {
      if (!user?.id) {
        throw new BadRequestException('Not authenticated');
      }

      if (!eventId) {
        throw new BadRequestException('eventId is required');
      }

      await this.assertCanManageMedia(eventId, user.id);

      if (!Object.values(MediaType).includes(type)) {
        throw new BadRequestException('Invalid media type');
      }

      if (!req.isMultipart()) {
        throw new BadRequestException('Expected multipart/form-data');
      }

      const part = await req.file();

      if (!part) {
        throw new BadRequestException('No file uploaded');
      }

      if (!ALLOWED_MIME.has(part.mimetype)) {
        this.logger.warn('Invalid MIME type', {
          mimetype: part.mimetype,
          filename: part.filename,
          actorId: user.id,
        });

        throw new BadRequestException('Invalid file type');
      }

      const safeFilename = part.filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
      if (!safeFilename) {
        throw new BadRequestException('Invalid filename');
      }
      const key = `event/${eventId}/${randomUUID()}-${safeFilename}`;
      let uploaded = false;
      let size = 0;

      try {
        const url = await this.storage.uploadStream({
          key,
          body: countAndLimit(part.file, MAX_FILE_SIZE, (bytes) => {
            size = bytes;
          }),
          contentType: part.mimetype,
        });
        uploaded = true;

        if (part.file.truncated) {
          throw new BadRequestException('File too large');
        }

        const media = await this.mediaService.create({
          key,
          url,
          filename: part.filename,
          mimetype: part.mimetype,
          size,
          eventId,
          type,
        });

        try {
          await this.publishMediaUploaded({
            mediaId: media.id,
            eventId,
            key,
            filename: part.filename,
            mimetype: part.mimetype,
            size,
            type,
          });
        } catch (error) {
          await this.mediaService.delete(media.id).catch((cleanupError: unknown) => {
            this.logger.error('Media compensation failed', {
              mediaId: media.id,
              error: cleanupError,
            });
          });
          throw error;
        }

        this.logger.info('Media upload accepted for async processing', {
          mediaId: media.id,
          eventId,
          size,
          type,
        });

        return {
          id: media.id,
          key,
          url,
          filename: part.filename,
          size,
          eventId,
        };
      } catch (error) {
        if (uploaded) {
          await this.storage.delete({ key }).catch((cleanupError: unknown) => {
            this.logger.error('Storage compensation failed', {
              key,
              error: cleanupError,
            });
          });
        }
        throw error;
      }
    });
  }

  /**
   * -------------------------------------------------------------
   * STEP 1: Get Presigned Upload URL
   * -------------------------------------------------------------
   */
  @UseGuards(CookieAuthGuard)
  @Get('presigned-url')
  async getPresignedUrl(
    @Query('eventId') eventId: string,
    @Query('filename') filename: string,
    @Query('type') type: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<PresignedUrlResponse> {
    return TraceRunner.run('[CONTROLLER] presigned-url', async () => {
      if (!user?.id) {
        throw new BadRequestException('Not authenticated');
      }

      if (!eventId) {
        throw new BadRequestException('eventId is required');
      }

      await this.assertCanManageMedia(eventId, user.id);

      if (!filename) {
        throw new BadRequestException('filename is required');
      }

      if (!ALLOWED_MIME.has(type)) {
        throw new BadRequestException('Invalid MIME type');
      }

      const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const key = `event/${eventId}/${randomUUID()}-${safeFilename}`;

      /**
       * 🔥 THIS MUST COME FROM YOUR STORAGE LAYER
       */
      const result = await this.storage.getSignedUploadUrl({
        key,
        contentType: type,
      });

      return {
        key,
        uploadUrl: result.uploadUrl,
        fileUrl: result.fileUrl,
      };
    });
  }

  @UseGuards(CookieAuthGuard)
  @Post('complete')
  async completeUpload(
    @Body()
    body: {
      key: string;
      filename: string;
      mimetype: string;
      size: number;
      eventId: string;
      type: MediaType;
    },
    @CurrentUser() user: CurrentUserData,
  ): Promise<CompleteUploadResponse> {
    return TraceRunner.run('[MEDIA] complete', async () => {
      if (!user?.id) {
        throw new BadRequestException('Not authenticated');
      }

      if (!body.eventId) {
        throw new BadRequestException('eventId is required');
      }

      await this.assertCanManageMedia(body.eventId, user.id);

      if (!ALLOWED_MIME.has(body.mimetype)) {
        throw new BadRequestException('Invalid MIME type');
      }

      if (!Object.values(MediaType).includes(body.type)) {
        throw new BadRequestException('Invalid media type');
      }

      if (!body.key.startsWith(`event/${body.eventId}/`)) {
        throw new BadRequestException('Storage key does not belong to event');
      }

      try {
        await this.storage.get({ key: body.key });
      } catch {
        throw new BadRequestException('File not found in storage');
      }

      const url = this.storage.getPublicUrl({ key: body.key });

      /**
       * ---------------------------------------------------------
       * CREATE MEDIA ENTRY
       * ---------------------------------------------------------
       */
      const media = await this.mediaService.create({
        key: body.key,
        url,
        filename: body.filename,
        mimetype: body.mimetype,
        size: body.size,
        eventId: body.eventId,
        type: body.type,
      });

      try {
        await this.publishMediaUploaded({
          mediaId: media.id,
          eventId: body.eventId,
          key: body.key,
          filename: body.filename,
          mimetype: body.mimetype,
          size: body.size,
          type: body.type,
        });
      } catch (error) {
        await this.mediaService.delete(media.id).catch((cleanupError: unknown) => {
          this.logger.error('Completed upload compensation failed', {
            mediaId: media.id,
            error: cleanupError,
          });
        });
        throw error;
      }

      return {
        id: media.id,
        url: media.url,
      };
    });
  }

  private async assertCanManageMedia(eventId: string, actorId: string): Promise<void> {
    const role = await this.accessService.resolveRole(eventId, actorId);
    if (role !== UserRoleType.ADMIN) {
      throw new ForbiddenException('Event media management is not authorized');
    }
  }

  private async publishMediaUploaded(payload: EventMediaUploadedDTO): Promise<void> {
    const context = ContextAccessor.get();
    await this.producer.send({
      topic: KafkaTopics.event.mediaUploaded,
      payload,
      meta: {
        version: '1',
        service: 'event-service',
        operation: 'Process Event Media',
        clazz: this.constructor.name,
        type: 'EVENT',
        actorId: context?.principal?.actorId ?? '',
        tenantId: context?.tenant?.tenantId ?? context?.principal?.tenantId ?? '',
      },
    });
  }
}

async function* countAndLimit(
  source: AsyncIterable<Uint8Array>,
  maximumBytes: number,
  updateSize: (bytes: number) => void,
): AsyncGenerator<Uint8Array> {
  let bytes = 0;
  for await (const chunk of source) {
    bytes += chunk.byteLength;
    if (bytes > maximumBytes) {
      throw new BadRequestException('File too large');
    }
    updateSize(bytes);
    yield chunk;
  }
}
