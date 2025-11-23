// TODO resolve eslint

/* eslint-disable @typescript-eslint/consistent-type-definitions */
// import { LoggerPlusService } from '../../logger/logger-plus.service.js';
// import { KafkaProducerService } from '../../messaging/kafka-producer.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
// import { withSpan } from '../../trace/utils/span.utils.js';
import { CreateSeatDTO } from '../models/dto/create-seat.dto.js';
import { Seat } from '../models/entities/seat.entity.js';
import { SeatReadService } from './seat-read.service.js';
import { Injectable } from '@nestjs/common';
import { trace, Tracer } from '@opentelemetry/api';

export type ReserveSeatArgs = {
  id?: string;
  guestId: string;
  eventId: string;
};

@Injectable()
export class SeatWriteService {
  readonly tracer: Tracer;
  // private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    // private readonly loggerService: LoggerPlusService,
    private readonly seatReadService: SeatReadService,
    // private readonly kafka: KafkaProducerService,
  ) {
    // this.logger = this.loggerService.getLogger(SeatWriteService.name);
    this.tracer = trace.getTracer(SeatWriteService.name);
  }

  create(input: {
    eventId: string;
    section?: string;
    table?: string;
    number?: number;
    note?: string;
  }): Promise<Seat> {
    return this.prisma.seat.create({ data: input });
  }

  async bulkImport(
    eventId: string,
    seats: Array<{
      section?: string;
      table?: string;
      number?: number;
      note?: string;
    }>,
  ): Promise<Seat[]> {
    if (!seats?.length) {
      return [];
    }

    await this.prisma.seat.createMany({
      data: seats.map((s) => ({ eventId, ...s })),
      skipDuplicates: true,
    });

    return this.seatReadService.findByEvent(eventId);
  }

  async bulkImport2(seats: CreateSeatDTO[]): Promise<void> {
    if (!seats?.length) {
      return;
    }

    await this.prisma.seat.createMany({
      data: seats,
    });
  }

  /**
   * Reserviert einen Sitzplatz.
   * 1) Wenn id → reserviere genau diesen Seat (wenn frei)
   * 2) Wenn ohne id → finde zufälligen freien Seat
   * 3) updateMany schützt gegen Race-Conditions
   */
  // async reserveSeat({ id, guestId, eventId }: ReserveSeatArgs): Promise<Seat> {
  //   return withSpan(this.tracer, this.logger, 'seat.reserve', async (span) => {
  //     this.logger.debug('reserveSeat.input=%o', { id, guestId, eventId });

  //     // -------------------------------------------------------------------
  //     // 1️⃣ Expliziten Seat reservieren
  //     // -------------------------------------------------------------------
  //     if (id) {
  //       const { count } = await this.prisma.seat.updateMany({
  //         where: { id, eventId, note: null },
  //         data: { note: guestId },
  //       });

  //       if (count !== 1) {
  //         throw new Error(
  //           'Seat ist bereits vergeben oder gehört nicht zu diesem Event.',
  //         );
  //       }

  //       const seat = await this.prisma.seat.findUnique({ where: { id } });

  //       // Kafka Event
  //       const ctx = span.spanContext();
  //       void this.kafka.addSeatID(
  //         { guestProfileId: guestId, eventId, seatId: id },
  //         'seat.write-service',
  //         { traceId: ctx.traceId, spanId: ctx.spanId },
  //       );

  //       return seat!;
  //     }

  //     // -------------------------------------------------------------------
  //     // 2️⃣ Zufälligen freien Seat reservieren
  //     // -------------------------------------------------------------------
  //     const baseWhere = { eventId, note: null } as const;

  //     let free = await this.prisma.seat.count({ where: baseWhere });
  //     if (free === 0) {
  //       throw new Error('Keine freien Plätze verfügbar.');
  //     }

  //     const MAX_RETRIES = 5;

  //     for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  //       const skip = Math.floor(Math.random() * free);

  //       const candidate = await this.prisma.seat.findFirst({
  //         where: baseWhere,
  //         orderBy: { id: 'asc' },
  //         skip,
  //         take: 1,
  //         select: { id: true },
  //       });

  //       if (!candidate) {
  //         free = await this.prisma.seat.count({ where: baseWhere });
  //         if (free === 0 || attempt === MAX_RETRIES) {
  //           throw new Error('Keine freien Plätze mehr verfügbar.');
  //         }
  //         continue;
  //       }

  //       const { count } = await this.prisma.seat.updateMany({
  //         where: { id: candidate.id, note: null },
  //         data: { note: guestId },
  //       });

  //       if (count === 1) {
  //         const seat = await this.prisma.seat.findUnique({
  //           where: { id: candidate.id },
  //         });

  //         // Kafka Event senden
  //         const ctx = span.spanContext();
  //         void this.kafka.addSeatID(
  //           { guestProfileId: guestId, eventId, seatId: candidate.id },
  //           'seat.write-service',
  //           { traceId: ctx.traceId, spanId: ctx.spanId },
  //         );

  //         return seat!;
  //       }

  //       free = await this.prisma.seat.count({ where: baseWhere });
  //       if (free === 0 || attempt === MAX_RETRIES) {
  //         throw new Error(
  //           'Reservierung fehlgeschlagen (Parallelzugriff). Bitte erneut versuchen.',
  //         );
  //       }
  //     }

  //     throw new Error('Unerwarteter Reservierungsfehler.');
  //   });
  // }

  async addGuestId({
    guestId,
    seatId,
  }: {
    guestId: string;
    seatId: string;
  }): Promise<void> {
    await this.prisma.seat.update({
      where: { id: seatId },
      data: {
        guestId,
      },
    });
  }
}
