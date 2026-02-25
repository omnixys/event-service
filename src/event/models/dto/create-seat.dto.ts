import type { SeatingConfigInput } from './seating-config.dto.js';

export interface CreateSeatDTO {
  eventId: string;
  config?: SeatingConfigInput;
  maxSeats: number;
  actorId: string;
}
