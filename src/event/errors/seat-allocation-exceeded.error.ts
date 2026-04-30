import { BaseGraphQLError } from './base-graphql.error.js';

/**
 * Thrown when sum of child seats exceeds parent capacity
 */
export class SeatAllocationExceededError extends BaseGraphQLError {
  constructor(parentSeats: number, requestedSeats: number) {
    super(
      'Seat allocation exceeds parent capacity',
      'SEAT_ALLOCATION_EXCEEDED',
      {
        parentSeats,
        requestedSeats,
      },
    );
  }
}
