import { PrismaService } from '../../prisma/prisma.service.js';
import { ImageService } from './image.service.js';
import { Injectable, Inject } from '@nestjs/common';
import { FILE_STORAGE, FileStorage } from '@omnixys/storage';

@Injectable()
export class MediaProcessingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly image: ImageService,

    /**
     * WHY:
     * Use abstraction instead of direct S3
     */
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
  ) {}

  async processImage(mediaId: string, stream: NodeJS.ReadableStream) {
    const variants = await this.image.generateVariants(stream);

    const uploads = await Promise.all(
      variants.map(async (variant) => {
        const key = `variants/${mediaId}-${variant.width}.webp`;

        const url = await this.storage.upload({
          key,
          buffer: variant.buffer,
          contentType: 'image/webp',
        });

        return {
          key,
          url,
          width: variant.width,
          height: 0,
          format: variant.format,
        };
      }),
    );

    await this.prisma.mediaVariant.createMany({
      data: uploads.map((v) => ({
        mediaId,
        ...v,
      })),
    });

    return uploads;
  }
}
