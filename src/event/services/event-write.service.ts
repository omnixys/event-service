// TODO resolve eslint

import { PrismaService } from '../../prisma/prisma.service.js';
import { Event } from '../models/entities/event.entity.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client'; // wichtig
import { UpdateEventInput } from '../models/inputs/update-event.input.js';

@Injectable()
export class EventWriteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: {
      name: string;
      startsAt: string;
      endsAt: string;
      allowReEntry?: boolean;
      rotateSeconds?: number;
      maxSeats?: number;
    },
    userId: string,
  ): Promise<Event> {
    // 1️⃣ Event erstellen
    const event = await this.prisma.event.create({
      data: {
        name: data.name,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        allowReEntry: data.allowReEntry ?? true,
        rotateSeconds: data.rotateSeconds ?? 300,
        maxSeats: data.maxSeats ?? 300,
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
}
