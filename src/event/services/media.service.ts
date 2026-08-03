import { Media, MediaVariant, Event } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventMediaNotFoundError } from '../errors/event-domain.error.js';
import { CreateMediaDto } from '../models/dto/media.dto.js';
import { Injectable, Inject } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { FILE_STORAGE } from '@omnixys/media-ts';
import type { FileStorage } from '@omnixys/media-ts';

@Injectable()
export class MediaService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly omnixysLogger: OmnixysLogger,

    /**
     * WHY:
     * Storage must be abstracted → no direct MinIO/S3 usage
     */
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
  ) {
    this.logger = this.omnixysLogger.log(this.constructor.name);
  }

  async create(dto: CreateMediaDto): Promise<Media> {
    this.logger.info('media_create', {
      eventId: dto.eventId,
      type: dto.type,
      filename: dto.filename,
    });
    const media = await this.prisma.media.create({
      data: {
        key: dto.key,
        url: dto.url,
        filename: dto.filename,
        mimetype: dto.mimetype,
        size: dto.size,
        eventId: dto.eventId,
        type: dto.type, // COVER | LOGO | GALLERY
      },
    });

    // 🔥 handle special relations
    if (dto.type === 'LOGO') {
      await this.prisma.event.update({
        where: { id: dto.eventId },
        data: {
          logoMedia: {
            connect: { id: media.id },
          },
        },
      });
    }

    if (dto.type === 'COVER') {
      await this.prisma.event.update({
        where: { id: dto.eventId },
        data: {
          coverMedia: {
            connect: { id: media.id },
          },
        },
      });
    }

    this.logger.info('media_create_success', { mediaId: media.id, eventId: dto.eventId });
    return media;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      this.logger.warn('media_delete_not_found', { mediaId: id });
      throw new EventMediaNotFoundError(id);
    }

    /**
     * WHY:
     * Always delete storage first to avoid orphan files
     */
    this.logger.info('media_delete', { mediaId: id, key: media.key, eventId: media.eventId });
    await this.storage.delete({ key: media.key });

    await this.prisma.media.delete({
      where: { id },
    });

    this.logger.info('media_delete_success', { mediaId: id });
    return { success: true };
  }

  async findByEvent(eventId: string): Promise<Media[]> {
    return this.prisma.media.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Media | null> {
    return this.prisma.media.findUnique({
      where: { id },
    });
  }

  async findVariant(mediaId: string, width: number, format: string): Promise<MediaVariant> {
    const variant = await this.prisma.mediaVariant.findUnique({
      where: {
        mediaId_width_format: {
          mediaId,
          width,
          format,
        },
      },
    });

    if (!variant) {
      throw new EventMediaNotFoundError(mediaId, true);
    }

    return variant;
  }

  async setEventCover(eventId: string, mediaId: string): Promise<Event> {
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        coverMediaId: mediaId,
      },
    });
  }

  async setEventLogo(eventId: string, mediaId: string): Promise<Event> {
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        logoMediaId: mediaId,
      },
    });
  }
}
