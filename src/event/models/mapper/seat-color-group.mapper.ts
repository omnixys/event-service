import type { SeatColorGroup } from '../../../prisma/generated/client.js';
import type { SeatColorGroupPayload } from '../payloads/seat-color-group.payload.js';

export class SeatColorGroupMapper {
  static toPayload(group: SeatColorGroup): SeatColorGroupPayload {
    const style = group.style as {
      background: string;
      foreground: string;
      border: string;
      legendIcon: string;
    };
    const invitedByValues = group.invitedByValues as string[];

    return {
      id: group.id,
      name: group.name,
      style: {
        background: style.background,
        foreground: style.foreground,
        border: style.border,
        legendIcon: style.legendIcon,
      },
      matchType: group.matchType as SeatColorGroupPayload['matchType'],
      invitedByValues,
      priority: group.priority,
      order: group.order,
      isOrphaned: group.isOrphaned,
    };
  }

  static toPayloadList(groups: SeatColorGroup[]): SeatColorGroupPayload[] {
    return groups.map((g) => SeatColorGroupMapper.toPayload(g));
  }
}
