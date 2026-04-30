import type { Media, MediaVariant } from '../../../prisma/generated/client.js';
import type {
  MediaPayload,
  MediaVariantPayload,
} from '../payloads/media.payload.js';

/**
 * -------------------------------------------------------------
 * Variant Mapper
 * -------------------------------------------------------------
 */
export function mapMediaVariant(variant: MediaVariant): MediaVariantPayload {
  return {
    url: variant.url,
    key: variant.key,
    width: variant.width,
    height: variant.height,
    format: variant.format,
  };
}

/**
 * -------------------------------------------------------------
 * Media Mapper
 * -------------------------------------------------------------
 */
export function mapMedia(
  media: Media & { variants?: MediaVariant[] },
): MediaPayload {
  return {
    id: media.id,
    url: media.url,
    key: media.key,
    filename: media.filename,
    mimetype: media.mimetype,
    size: media.size ?? undefined,
    type: media.type,
    variants: media.variants?.map(mapMediaVariant) ?? [],
  };
}
