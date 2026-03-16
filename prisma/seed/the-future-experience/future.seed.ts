import { PrismaClient } from '../../../src/prisma/generated/client.js';
import { users } from '../users.seed.js';

export async function seedFutureExperience(prisma: PrismaClient) {
  console.log('🌱 Seeding "The Future Experience"...');

  const event = await prisma.event.create({
    data: {
      name: 'The Future Experience',
      owner: users[0].id,
    },
  });

  console.log('✔ Event created', event.id);

  await prisma.settings.create({
    data: {
      eventId: event.id,
      allowReEntry: true,
      rotateSeconds: 300,
      maxSeats: 300,
      dressCode: 'black',
      description: 'Immersive future tech experience',
      startsAt: new Date('2025-08-20T18:00:00.000Z'),
      endsAt: new Date('2025-08-21T02:00:00.000Z'),
    },
  });

  // await prisma.eventDescriptionBlock.createMany({
  //   data: futureDescription.map((b) => ({
  //     ...b,
  //     eventId: event.id,
  //   })),
  // });

  for (const user of users) {
    await prisma.role.create({
      data: {
        eventId: event.id,
        userId: user.id,
        role: user.role,
      },
    });
  }

  console.log('✔ Future Experience seeded');
}
