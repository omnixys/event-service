import { PrismaService } from '../../prisma/prisma.service.js';
import { EventMediaNotFoundError } from '../errors/event-domain.error.js';
import { ImageService } from './image.service.js';
import { Inject, Injectable } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { FILE_STORAGE } from '@omnixys/media-ts';
import type { FileStorage } from '@omnixys/media-ts';

interface ProcessedImageVariant {
  mediaId: string;
  key: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

@Injectable()
export class MediaProcessingService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly image: ImageService,
    private readonly loggerService: OmnixysLogger,

    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
  ) {
    this.logger = this.loggerService.log(this.constructor.name, 'service:event');
  }

  /**
   * ------------------------------------------------------------------------
   * PROCESS IMAGE → GENERATE VARIANTS
   * ------------------------------------------------------------------------
   */
  async processImage(mediaId: string, buffer: Buffer): Promise<ProcessedImageVariant[]> {
    this.logger.debug('Processing image variants: %o', { mediaId });

    const variants = await this.image.generateVariants(buffer);

    const uploads = await Promise.all(
      variants.map(async (variant) => {
        const key = `variants/${mediaId}-${variant.width}.webp`;

        const url = await this.storage.upload({
          key,
          buffer: variant.buffer,
          contentType: 'image/webp',
        });

        return {
          mediaId,
          key,
          url,
          width: variant.width,
          height: variant.height,
          format: variant.format,
        };
      }),
    );

    await this.prisma.$transaction(
      uploads.map((variant) =>
        this.prisma.mediaVariant.upsert({
          where: {
            mediaId_width_format: {
              mediaId,
              width: variant.width,
              format: variant.format,
            },
          },
          create: variant,
          update: {
            key: variant.key,
            url: variant.url,
            height: variant.height,
          },
        }),
      ),
    );

    this.logger.debug('Variants created: %o', {
      mediaId,
      count: uploads.length,
    });

    return uploads;
  }

  async processFromStorage(mediaId: string, key: string): Promise<ProcessedImageVariant[]> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, key: true },
    });
    if (media?.key !== key) {
      this.logger.warn('media_key_mismatch: %o', {
        mediaId,
        expectedKey: key,
        actualKey: media?.key,
      });
      throw new EventMediaNotFoundError(mediaId);
    }

    this.logger.info('process_from_storage: %o', { mediaId, key });
    const buffer = await this.storage.get({ key });
    return this.processImage(mediaId, buffer);
  }
}
