import type { Settings } from '../../../prisma/generated/client.js';
import type { SettingsCreateInput } from '../../../prisma/generated/models.js';
import { EventValidationError } from '../../errors/event-domain.error.js';
import type { CreateSettingsInput } from '../inputs/create-settings.input.js';

/**
 * Maps settings from DTO or parent entity into a valid Prisma create input
 *
 * Important:
 * - Never spread raw Prisma entities
 * - Always normalize shape
 */
export class SettingsCreateMapper {
  static from(input: {
    dto?: CreateSettingsInput;
    parent?: Settings | null;
    eventId: string;
    override?: Partial<SettingsCreateInput>;
  }): SettingsCreateInput {
    const base = input.dto ?? input.parent;

    if (!base) {
      throw new EventValidationError('Settings source is required', {
        eventId: input.eventId,
      });
    }

    return {
      event: {
        connect: { id: input.eventId },
      },

      allowReEntry: base.allowReEntry,
      rotateSeconds: base.rotateSeconds,
      maxSeats: input.override?.maxSeats ?? base.maxSeats,

      allowPublicRsvp: base.allowPublicRsvp,
      allowPublicPlusOne: base.allowPublicPlusOne,
      allowPublicRsvpWebsite: base.allowPublicRsvpWebsite,

      publicRsvpWebsite: base.publicRsvpWebsite ?? null,

      isActive: base.isActive,
      isPublic: base.isPublic,

      dressCode: base.dressCode ?? null,
      description: base.description ?? null,

      startsAt: base.startsAt,
      endsAt: base.endsAt,

      ...input.override,
    };
  }
}
