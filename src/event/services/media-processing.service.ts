import { PrismaService } from '../../prisma/prisma.service.js';
import { ImageService } from './image.service.js';
import { Inject, Injectable } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger';
import { FILE_STORAGE } from '@omnixys/media';
import type { FileStorage } from '@omnixys/media';

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
    this.logger = this.loggerService.log(this.constructor.name);
  }

  /**
   * ------------------------------------------------------------------------
   * PROCESS IMAGE → GENERATE VARIANTS
   * ------------------------------------------------------------------------
   */
  async processImage(mediaId: string, buffer: Buffer): Promise<ProcessedImageVariant[]> {
    this.logger.debug('Processing image variants', { mediaId });

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
          height: 0,
          format: variant.format,
        };
      }),
    );

    await this.prisma.mediaVariant.createMany({
      data: uploads,
    });

    this.logger.debug('Variants created', {
      mediaId,
      count: uploads.length,
    });

    return uploads;
  }
}
