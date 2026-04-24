import { MediaService } from '../services/media.service.js';
import { BadRequestException, Inject } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { FILE_STORAGE, FileStorage } from '@omnixys/storage';
import { CreateMediaDto } from '../models/dto/media.dto.js';

@Resolver()
export class MediaResolver {
  constructor(
    private readonly media: MediaService,

    
    /**
     * WHY:
     * Signed URLs must be generated via storage abstraction
     */
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorage,
  ) { }
  

  @Mutation(() => String)
  async createMedia(
    @Args('input') input: CreateMediaDto,
  ): Promise<string> {
    /**
     * Basic validation (boundary layer)
     */
    if (!input.key) {
      throw new BadRequestException('Missing key');
    }

    if (!input.filename) {
      throw new BadRequestException('Missing filename');
    }

    if (!input.mimetype) {
      throw new BadRequestException('Missing mimetype');
    }

    /**
     * WHY:
     * fileUrl MUST match storage path
     */
    const url = `${process.env.S3_PUBLIC_URL}/${input.key}`;

    const created = await this.media.create({
      ...input,
      url,
    });

    return created.id;
  }

  @Query(() => String)
  async mediaUrl(@Args('mediaId') mediaId: string): Promise<string> {
    const media = await this.media.findById(mediaId);

    if (!media) {
      throw new Error('Media not found');
    }

    return this.storage.getSignedDownloadUrl({
      key: media.key,
    });
  }

  @Query(() => String)
  async mediaVariantUrl(
    @Args('mediaId') mediaId: string,
    @Args('width') width: number,
  ): Promise<string> {
    const variant = await this.media.findVariant(mediaId, width);

    return this.storage.getSignedDownloadUrl({
      key: variant.key,
    });
  }
}
