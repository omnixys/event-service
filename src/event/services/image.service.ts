import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async generateVariants(stream: NodeJS.ReadableStream) {
    const buffer = await this.streamToBuffer(stream);

    const base = sharp(buffer);

    return Promise.all([
      this.resize(base, 1280),
      this.resize(base, 640),
      this.resize(base, 320),
      this.thumbnail(base),
    ]);
  }

  private async resize(image: sharp.Sharp, width: number) {
    const result = await image.resize(width).webp({ quality: 80 }).toBuffer();

    return {
      buffer: result,
      width,
      format: 'webp',
    };
  }

  private async thumbnail(image: sharp.Sharp) {
    const result = await image.resize(128, 128).webp({ quality: 70 }).toBuffer();

    return {
      buffer: result,
      width: 128,
      format: 'webp',
    };
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream) {
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }
}
