import {
  BadRequestException,
  Controller,
  Post,
  Req,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

import { MediaProcessingService } from '../services/media-processing.service.js';
import { MediaService } from '../services/media.service.js';
import { FILE_STORAGE, FileStorage } from '@omnixys/storage';

import { OmnixysLogger } from '@omnixys/logger';
import { TraceRunner } from '@omnixys/observability';
import { CookieAuthGuard, CurrentUser, CurrentUserData } from '@omnixys/security';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Controller('media')
export class MediaUploadController {
  private readonly logger;

  constructor(
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
    private readonly mediaService: MediaService,
    private readonly processing: MediaProcessingService,
    private readonly loggerService: OmnixysLogger,
  ) {
    this.logger = this.loggerService.log(this.constructor.name);
  }

  @UseGuards(CookieAuthGuard)
  @Post('upload')
  async upload(
    @Req() req: FastifyRequest,
    @Query('eventId') eventId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return TraceRunner.run('[MEDIA] upload', async () => {
      if (!user?.id) {
        throw new BadRequestException('Not authenticated');
      }

      if (!eventId) {
        throw new BadRequestException('eventId is required');
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

      const buffer = await part.toBuffer();

      if (buffer.length > MAX_FILE_SIZE) {
        throw new BadRequestException('File too large');
      }

      const key = `event/${eventId}/${randomUUID()}-${part.filename}`;

      const url = await this.storage.upload({
        key,
        buffer,
        contentType: part.mimetype,
      });

      const media = await this.mediaService.create({
        key,
        url,
        filename: part.filename,
        mimetype: part.mimetype,
        size: buffer.length,
        eventId,
      });

      /**
       * 🔥 NEW: PROCESS VARIANTS
       */
      await this.processing.processImage(media.id, buffer);

      return {
        id: media.id,
        key,
        url,
        filename: part.filename,
        size: buffer.length,
        eventId,
      };
    });
  }
}
