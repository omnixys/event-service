// TODO resolve eslint

import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSeatDTO } from '../models/dto/create-seat.dto.js';
import { Event } from '../models/entities/event.entity.js';
import { CreateEventInput } from '../models/inputs/create-event.input.js';
import { UpdateEventInput } from '../models/inputs/update-event.input.js';
import { SeatWriteService } from './seat-write.service.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client'; // wichtig

@Injectable()
export class EventWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seatWriteService: SeatWriteService,
  ) {}

  async create(data: CreateEventInput, userId: string): Promise<Event> {
    // 1️⃣ Event erstellen
    const event = await this.prisma.event.create({
      data: {
        name: data.name,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        allowReEntry: data.allowReEntry ?? true,
        rotateSeconds: data.rotateSeconds,
        maxSeats: data.maxSeats,
        location: data.location,
        dressCode: data.dressCode,
        description: data.description,
        defaultSection: data.defaultSection,
        defaultTable: data.defaultTable,
      },
    });

    // 2️⃣ Dem User ADMIN-Rolle für dieses Event geben
    await this.prisma.userEventRole.create({
      data: {
        userId,
        eventId: event.id,
        role: UserRole.ADMIN,
      },
    });

    await this.generateDefaultSeats(
      event.id,
      data.maxSeats,
      data.defaultSection,
      data.defaultTable,
    );

    return event;
  }

  async update(input: UpdateEventInput): Promise<Event> {
    const { id, ...patch } = input;

    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Event nicht gefunden');
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...patch,
        startsAt: patch.startsAt ? new Date(String(patch.startsAt)) : undefined,
        endsAt: patch.endsAt ? new Date(String(patch.endsAt)) : undefined,
      },
    });
  }

  async remove(id: string): Promise<boolean> {
    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Event nicht gefunden');
    }

    // event.delete() cascade-löscht auch Seats & UserEventRole (wegen Prisma)
    await this.prisma.event.delete({ where: { id } });
    return true;
  }

  private async generateDefaultSeats(
    eventId: string,
    maxSeats: number = 50,
    sections: number = 5,
    tables: number = 2,
  ): Promise<void> {
    if (!sections || !tables || sections <= 0 || tables <= 0) {
      return;
    }

    const totalTables = sections * tables;
    const baseSeatsPerTable = Math.floor(maxSeats / totalTables);
    let remaining = maxSeats % totalTables;

    const seatCreates: CreateSeatDTO[] = [];

    for (let s = 1; s <= sections; s++) {
      for (let t = 1; t <= tables; t++) {
        // seats for this table
        const seatCount = baseSeatsPerTable + (remaining > 0 ? 1 : 0);
        if (remaining > 0) {
          remaining--;
        }

        for (let seatNum = 1; seatNum <= seatCount; seatNum++) {
          seatCreates.push({
            eventId,
            section: String(s),
            table: String(t),
            number: seatNum,
          });
        }
      }
    }

    // Perform bulk insert
    await this.seatWriteService.bulkImport2(seatCreates);
  }
}
