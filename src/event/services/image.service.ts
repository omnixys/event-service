import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

interface Variant {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

@Injectable()
export class ImageService {
  /**
   * WHY:
   * We operate fully in-memory (Buffer-based pipeline)
   * → avoids stream complexity and improves performance for small images
   */
  async generateVariants(buffer: Buffer): Promise<Variant[]> {
    const base = sharp(buffer);

    return Promise.all([
      this.resize(base.clone(), 1280),
      this.resize(base.clone(), 640),
      this.resize(base.clone(), 320),
      this.thumbnail(base.clone()),
    ]);
  }

  private async resize(image: sharp.Sharp, width: number): Promise<Variant> {
    const { data, info } = await image
      .resize(width)
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      format: 'webp',
    };
  }

  private async thumbnail(image: sharp.Sharp): Promise<Variant> {
    const { data, info } = await image
      .resize(128, 128, { fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      format: 'webp',
    };
  }
}
