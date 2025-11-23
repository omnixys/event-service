import { LoggerPlusService } from '../../logger/logger-plus.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Seat } from '../models/entities/seat.entity.js';
import { GuestEventSeatInput } from '../models/inputs/guest-event-seat.input.js';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class SeatReadService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerService: LoggerPlusService,
  ) {
    this.logger = this.loggerService.getLogger(SeatReadService.name);
  }

  findByEvent(eventId: string): Promise<Seat[]> {
    return this.prisma.seat.findMany({
      where: { eventId },
      orderBy: [{ section: 'asc' }, { table: 'asc' }, { number: 'asc' }],
    });
  }

  async findById(id: string): Promise<Seat> {
    const found = await this.prisma.seat.findUnique({
      where: { id },
    });

    if (!found) {
      throw new NotFoundException(`Seat with ID "${id}" not found`);
    }

    this.logger.debug('');
    return found;
  }

  async findByGuest(guestId: string): Promise<Seat[]> {
    this.logger.debug('Finding seats for guestId: %s', guestId);
    const found = await this.prisma.seat.findMany({
      where: { guestId },
    });

    return found;
  }

  async findByGuestAndEvent(input: GuestEventSeatInput): Promise<Seat> {
    const { guestId, eventId } = input;
    const found = await this.prisma.seat.findUnique({
      where: {
        guestId_eventId: {
          guestId,
          eventId,
        },
      },
    });

    if (!found) {
      throw new NotFoundException(
        `Seat with GuestId "${guestId}" and EventId "${eventId}" not found`,
      );
    }

    return found;
  }
}
