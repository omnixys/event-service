import { PrismaClient } from '../../../src/prisma/generated/client.js';
import { users } from '../users.seed.js';
import { weddingTimeline } from './wedding.timeline.js';

export async function seedWedding(prisma: PrismaClient) {
  console.log('🌱 Seeding Wedding C&R...');

  /**
   * -------------------------------------------------------------
   * ROOT EVENT
   * -------------------------------------------------------------
   */
  const wedding = await prisma.event.create({
    data: {
      name: 'Wedding C & R',
      owner: users[1].id,
      path: '',
      depth: 0,
    },
  });

  await prisma.settings.create({
    data: {
      eventId: wedding.id,
      dressCode: 'formal',
      startsAt: new Date('2026-11-21T10:00:00Z'),
      endsAt: new Date('2026-11-21T23:00:00Z'),
    },
  });

  console.log('✔ Wedding Root:', wedding.id);

  /**
   * -------------------------------------------------------------
   * CEREMONY
   * -------------------------------------------------------------
   */
  const ceremony = await prisma.event.create({
    data: {
      name: 'Wedding Ceremony',
      parentId: wedding.id,
      owner: wedding.owner,
      path: wedding.id,
      depth: 1,
    },
  });

  await prisma.settings.create({
    data: {
      eventId: ceremony.id,
      allowReEntry: true,
      rotateSeconds: 300,
      maxSeats: 100,
      dressCode: 'formal',
      startsAt: new Date('2026-11-21T16:00:00Z'),
      endsAt: new Date('2026-11-21T17:00:00Z'),
    },
  });

  console.log('✔ Ceremony:', ceremony.id);

  /**
   * -------------------------------------------------------------
   * RECEPTION
   * -------------------------------------------------------------
   */
  const reception = await prisma.event.create({
    data: {
      name: 'Wedding Reception',
      parentId: wedding.id,
      owner: wedding.owner,
      path: wedding.id,
      depth: 1,
    },
  });

  await prisma.settings.create({
    data: {
      eventId: reception.id,
      allowReEntry: true,
      rotateSeconds: 300,
      maxSeats: 400,
      dressCode: 'high class',
      startsAt: new Date('2026-11-21T17:30:00Z'),
      endsAt: new Date('2026-11-21T23:00:00Z'),
    },
  });

  console.log('✔ Reception:', reception.id);

  /**
   * -------------------------------------------------------------
   * TIMELINE (RECEPTION)
   * -------------------------------------------------------------
   */
  await prisma.timeline.createMany({
    data: weddingTimeline.map((t) => ({
      ...t,
      eventId: reception.id,
    })),
  });

  /**
   * -------------------------------------------------------------
   * ROLE ASSIGNMENT LOGIC
   * -------------------------------------------------------------
   */

  for (const user of users) {
    /**
     * ROOT → alle
     */
    await prisma.role.create({
      data: {
        eventId: wedding.id,
        userId: user.id,
        role: user.role,
      },
    });

    /**
     * CEREMONY → alle außer audrey
     */
    if (user.username !== 'audrey') {
      await prisma.role.create({
        data: {
          eventId: ceremony.id,
          userId: user.id,
          role: user.role,
        },
      });
    }

    /**
     * RECEPTION → alle außer christabelle
     */
    if (user.username !== 'christabelle') {
      await prisma.role.create({
        data: {
          eventId: reception.id,
          userId: user.id,
          role: user.role,
        },
      });
    }
  }

  console.log('✔ Wedding C&R seeded');
}
  // await prisma.eventDescriptionBlock.createMany({
  //   data: weddingDescription.map((b) => ({
  //     ...b,
  //     eventId: event.id,
  //   })),
  // });
