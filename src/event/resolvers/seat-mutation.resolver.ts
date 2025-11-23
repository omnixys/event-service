import { Seat } from '../models/entities/seat.entity.js';
import { BulkImportSeatsInput } from '../models/inputs/bulk-import-seats.input.js';
import { CreateSeatInput } from '../models/inputs/create-seat.input.js';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SeatWriteService } from '../services/seat-write.service.js';

@Resolver(() => Seat)
export class SeatMutationResolver {
  constructor(private readonly service: SeatWriteService) {}

  @Mutation(() => Seat, { name: 'createSeat' })
  createSeat(@Args('input') input: CreateSeatInput): Promise<Seat> {
    return this.service.create(input);
  }

  @Mutation(() => [Seat], { name: 'importSeats' })
  importSeats(@Args('input') input: BulkImportSeatsInput): Promise<Seat[]> {
    const { eventId, seats } = input;
    return this.service.bulkImport(eventId, seats);
  }
}
