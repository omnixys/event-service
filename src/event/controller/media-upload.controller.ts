// public URL anpassen!!
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

import { MediaProcessingService } from '../services/media-processing.service.js';
import { MediaService } from '../services/media.service.js';
import { FILE_STORAGE, FileStorage } from '@omnixys/media';

import { MediaType } from '../../prisma/generated/client.js';
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

      const safeFilename = part.filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const key = `event/${eventId}/${randomUUID()}-${safeFilename}`;

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
        type,
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

      if (!ALLOWED_MIME.has(body.mimetype)) {
        throw new BadRequestException('Invalid MIME type');
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

      /**
       * ---------------------------------------------------------
       * 🔥 OPTIONAL: IMAGE PIPELINE
       * ---------------------------------------------------------
       * NOTE:
       * Hier hast du KEIN buffer mehr!
       * → später async worker (queue) nutzen
       */
      // await this.processing.processImageFromStorage(media.id, body.key);

      return {
        id: media.id,
        url: media.url,
      };
    });
  }
}
