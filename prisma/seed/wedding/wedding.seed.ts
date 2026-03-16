import { PrismaClient } from '../../../src/prisma/generated/client.js';
import { users } from '../users.seed.js';
import { weddingTimeline } from './wedding.timeline.js';

export async function seedWedding(prisma: PrismaClient) {
  console.log('🌱 Seeding Wedding C&R...');

    const wedding = await prisma.event.create({
      data: {
        name: 'Wedding C & R',
        owner: users[1].id,
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
  
    const ceremony = await prisma.event.create({
      data: {
        name: 'Wedding Ceremony',
        parentId: wedding.id,
        owner: wedding.owner,
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
  
   const reception = await prisma.event.create({
     data: {
       name: 'Wedding Reception',
       parentId: wedding.id,
       owner: wedding.owner,
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


  await prisma.timeline.createMany({
    data: weddingTimeline.map((t) => ({
      ...t,
      eventId: reception.id,
    })),
  });

  // await prisma.eventDescriptionBlock.createMany({
  //   data: weddingDescription.map((b) => ({
  //     ...b,
  //     eventId: event.id,
  //   })),
  // });

  for (const user of users) {
    await prisma.role.create({
      data: {
        eventId: ceremony.id,
        userId: user.id,
        role: user.role,
      },
    });

    await prisma.role.create({
      data: {
        eventId: reception.id,
        userId: user.id,
        role: user.role,
      },
    });
  }

  console.log('✔ Wedding C&R seeded');
}
