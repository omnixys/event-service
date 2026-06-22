import { UserRoleType } from '../../prisma/generated/client.js';
import {
  EventAccessDeniedError,
  EventMediaNotFoundError,
  EventValidationError,
} from '../errors/event-domain.error.js';
import { CreateMediaDto } from '../models/dto/media.dto.js';
import { EventAccessService } from '../services/event-access.service.js';
import { MediaService } from '../services/media.service.js';
import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FILE_STORAGE } from '@omnixys/media';
import type { FileStorage } from '@omnixys/media';
import {
  CookieAuthGuard,
  CurrentUser,
  type CurrentUserData,
} from '@omnixys/security';

@Resolver()
export class MediaResolver {
  constructor(
    private readonly media: MediaService,
    private readonly access: EventAccessService,

    /**
     * WHY:
     * Signed URLs must be generated via storage abstraction
     */
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
  ) {}

  @Mutation(() => String)
  @UseGuards(CookieAuthGuard)
  async createMedia(
    @Args('input') input: CreateMediaDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<string> {
    /**
     * Basic validation (boundary layer)
     */
    if (!input.key) {
      throw new EventValidationError('Media storage key is required');
    }

    if (!input.filename) {
      throw new EventValidationError('Media filename is required');
    }

    if (!input.mimetype) {
      throw new EventValidationError('Media MIME type is required');
    }
    if (!input.key.startsWith(`event/${input.eventId}/`)) {
      throw new EventValidationError('Storage key does not belong to event', {
        eventId: input.eventId,
      });
    }
    await this.assertEventAccess(input.eventId, user.id, true);

    /**
     * WHY:
     * fileUrl MUST match storage path
     */
    const url = this.storage.getPublicUrl({ key: input.key });

    const created = await this.media.create({
      ...input,
      url,
    });

    return created.id;
  }

  @Query(() => String)
  @UseGuards(CookieAuthGuard)
  async mediaUrl(
    @Args('mediaId') mediaId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<string> {
    const media = await this.media.findById(mediaId);

    if (!media) {
      throw new EventMediaNotFoundError(mediaId);
    }
    await this.assertEventAccess(media.eventId, user.id);

    return this.storage.getSignedDownloadUrl({
      key: media.key,
    });
  }

  @Query(() => String)
  @UseGuards(CookieAuthGuard)
  async mediaVariantUrl(
    @Args('mediaId') mediaId: string,
    @Args('width') width: number,
    @Args('format') format: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<string> {
    const variant = await this.media.findVariant(mediaId, width, format);
    const media = await this.media.findById(mediaId);
    if (!media) {
      throw new EventMediaNotFoundError(mediaId);
    }
    await this.assertEventAccess(media.eventId, user.id);

    return this.storage.getSignedDownloadUrl({
      key: variant.key,
    });
  }

  private async assertEventAccess(
    eventId: string,
    actorId: string,
    requireAdmin = false,
  ): Promise<void> {
    const role = await this.access.resolveRole(eventId, actorId);
    if (!role || (requireAdmin && role !== UserRoleType.ADMIN)) {
      throw new EventAccessDeniedError(eventId, 'media-access-forbidden');
    }
  }
}
