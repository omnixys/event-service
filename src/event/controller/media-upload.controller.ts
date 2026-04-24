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

import { MediaService } from '../services/media.service.js';
import { OmnixysLogger } from '@omnixys/logger';
import { TraceRunner } from '@omnixys/observability';
import { CookieAuthGuard, CurrentUser, CurrentUserData } from '@omnixys/security';
import { FILE_STORAGE, FileStorage } from '@omnixys/storage';

/* ---------------------------------------------------------------------------
 * Config
 * ------------------------------------------------------------------------- */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Controller('media')
export class MediaUploadController {
  private readonly logger;

  constructor(
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
    private readonly mediaService: MediaService,
    private readonly loggerService: OmnixysLogger,
  ) {
    this.logger = this.loggerService.log(this.constructor.name);
  }

  /**
   * ------------------------------------------------------------------------
   * SECURE MEDIA UPLOAD
   * ------------------------------------------------------------------------
   */
  @UseGuards(CookieAuthGuard)
  @Post('upload')
  async upload(
    @Req() req: FastifyRequest,
    @Query('eventId') eventId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return TraceRunner.run('[MEDIA] upload', async () => {
      /**
       * --------------------------------------------------------------------
       * AUTH VALIDATION
       * --------------------------------------------------------------------
       */
      if (!user?.id) {
        throw new BadRequestException('Not authenticated');
      }

      /**
       * --------------------------------------------------------------------
       * EVENT VALIDATION
       * --------------------------------------------------------------------
       */
      if (!eventId) {
        throw new BadRequestException('eventId is required');
      }

      /**
       * --------------------------------------------------------------------
       * MULTIPART VALIDATION
       * --------------------------------------------------------------------
       */
      if (!req.isMultipart()) {
        throw new BadRequestException('Expected multipart/form-data');
      }

      const part = await req.file();

      if (!part) {
        throw new BadRequestException('No file uploaded');
      }

      /**
       * --------------------------------------------------------------------
       * MIME VALIDATION
       * --------------------------------------------------------------------
       */
      if (!ALLOWED_MIME.has(part.mimetype)) {
        this.logger.warn('Invalid MIME type', {
          mimetype: part.mimetype,
          filename: part.filename,
          actorId: user.id,
        });

        throw new BadRequestException('Only PNG, JPG, WEBP allowed');
      }

      /**
       * --------------------------------------------------------------------
       * BUFFER
       * --------------------------------------------------------------------
       */
      const buffer = await part.toBuffer();

      /**
       * --------------------------------------------------------------------
       * SIZE VALIDATION
       * --------------------------------------------------------------------
       */
      if (buffer.length > MAX_FILE_SIZE) {
        throw new BadRequestException(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }

      /**
       * --------------------------------------------------------------------
       * KEY GENERATION
       * --------------------------------------------------------------------
       *
       * WHY:
       * - Namespaced per event
       * - Prevents collisions
       */
      const key = `event/${eventId}/${randomUUID()}-${part.filename}`;

      /**
       * --------------------------------------------------------------------
       * STORAGE UPLOAD
       * --------------------------------------------------------------------
       */
      const url = await this.storage.upload({
        key,
        buffer,
        contentType: part.mimetype,
      });

      /**
       * --------------------------------------------------------------------
       * DB PERSISTENCE
       * --------------------------------------------------------------------
       */
      const media = await this.mediaService.create({
        key,
        url,
        filename: part.filename,
        mimetype: part.mimetype,
        size: buffer.length,
        eventId,
      });

      this.logger.debug('Media uploaded', {
        mediaId: media.id,
        key,
        actorId: user.id,
      });

      /**
       * --------------------------------------------------------------------
       * RESPONSE
       * --------------------------------------------------------------------
       */
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
