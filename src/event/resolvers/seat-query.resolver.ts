import { Seat } from '../models/entities/seat.entity.js';
import { GuestEventSeatInput } from '../models/inputs/guest-event-seat.input.js';
import { SeatReadService } from '../services/seat-read.service.js';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';

@Resolver(() => Seat)
export class SeatQueryResolver {
  constructor(private readonly readService: SeatReadService) {}

  @Query(() => [Seat], { name: 'seatsByEvent' })
  seatsByEvent(
    @Args('eventId', { type: () => ID }) eventId: string,
  ): Promise<Seat[]> {
    return this.readService.findByEvent(eventId);
  }

  @Query(() => Seat, { name: 'getSeatById', nullable: true })
  getSeatById(@Args('id', { type: () => ID }) id: string): Promise<Seat> {
    return this.readService.findById(id);
  }

  @Query(() => [Seat], { name: 'getSeatByGuest', nullable: true })
  getSeatByGuest(
    @Args('guestId', { type: () => ID }) guestId: string,
  ): Promise<Seat[]> {
    return this.readService.findByGuest(guestId);
  }

  @Query(() => Seat, { name: 'getSeatByGuestAndEvent', nullable: true })
  getSeatByGuestAndEvent(
    @Args('input', { type: () => GuestEventSeatInput })
    input: GuestEventSeatInput,
  ): Promise<Seat> {
    return this.readService.findByGuestAndEvent(input);
  }

  // @Query(() => [Seat], { name: 'getSeats' })
  // getSeats() {
  //   return this.read.findAll();
  // }
}
