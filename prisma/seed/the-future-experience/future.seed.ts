import {
  PrismaClient,
  UserRoleType,
  EventCategory,
  InvitationApprovalMode,
} from '../../../src/prisma/generated/client.js';
import { users } from '../users.seed.js';

export async function seedFutureExperience(prisma: PrismaClient) {
  console.log('🌱 Seeding "The Future Experience"...');

  /**
   * -------------------------------------------------------------
   * EVENT
   * -------------------------------------------------------------
   */
  const event = await prisma.event.create({
    data: {
      name: 'The Future Experience',
      owner: users[0].id,
      path: '',   // root event
      depth: 0,
    },
  });

  console.log('✔ Event created', event.id);

  /**
   * -------------------------------------------------------------
   * SETTINGS (FULLY EXPLICIT)
   * -------------------------------------------------------------
   */
  await prisma.settings.create({
    data: {
      eventId: event.id,

      // Access & Security
      allowReEntry: true,
      rotateSeconds: 300,
      maxSeats: 300,

      // Public behavior
      allowPublicRsvp: true,
      allowPublicPlusOne: true,
      allowPublicRsvpWebsite: false,
      allowPlusOneUpdate: false,

      // Approval
      approvalMode: InvitationApprovalMode.MANUAL,
      allowGuestSeatSelection: true,

      // Plus Ones
      maxPlusOnes: 2,
      requireApprovalForPlusOnes: true,

      // Booking
      allowSeatOverbooking: false,

      // Visibility
      isActive: true,
      isPublic: false,

      // Meta
      dressCode: 'Black Tie',
      description: 'Immersive future tech experience',

      // Timing (REQUIRED)
      startsAt: new Date('2025-08-20T18:00:00.000Z'),
      endsAt: new Date('2025-08-21T02:00:00.000Z'),

      // Enum (IMPORTANT)
      category: EventCategory.GENERAL,

      // Optional
      publicRsvpWebsite: null,
      rsvpDeadline: null,
    },
  });

  /**
   * -------------------------------------------------------------
   * ANALYTICS SNAPSHOT (IMPORTANT FOR DASHBOARD)
   * -------------------------------------------------------------
   */
  await prisma.analytics.create({
    data: {
      eventId: event.id,
      totalInvites: 0,
      accepted: 0,
      declined: 0,
      checkedIn: 0,
      inside: 0,
      outside: 0,
    },
  });

  /**
   * -------------------------------------------------------------
   * TIMELINE (BASIC AGENDA)
   * -------------------------------------------------------------
   */
  await prisma.timeline.createMany({
    data: [
      {
        eventId: event.id,
        type: 'OPENING',
        timestamp: new Date('2025-08-20T18:00:00.000Z'),
        label: 'Doors Open',
      },
      {
        eventId: event.id,
        type: 'MAIN',
        timestamp: new Date('2025-08-20T20:00:00.000Z'),
        label: 'Main Experience',
      },
      {
        eventId: event.id,
        type: 'CLOSING',
        timestamp: new Date('2025-08-21T02:00:00.000Z'),
        label: 'Closing',
      },
    ],
  });

  /**
   * -------------------------------------------------------------
   * ROLES
   * -------------------------------------------------------------
   */
  for (const user of [
    {
      id: 'dde8114c-2637-462a-90b9-413924fa3f55',
      role: UserRoleType.ADMIN,
    },
    {
      id: '694d2e8e-0932-4c8f-a1c4-e300dc235be4',
      role: UserRoleType.GUEST,
    },
    {
      id: '20e7e44e-9bcd-4016-bebd-36f8d75357b6',
      role: UserRoleType.SECURITY,
    },
  ]) {
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

  // await prisma.eventDescriptionBlock.createMany({
  //   data: futureDescription.map((b) => ({
  //     ...b,
  //     eventId: event.id,
  //   })),
  // });
