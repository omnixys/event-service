/**
 * @license GPL-3.0-or-later
 * © 2025 Caleb Gyamfi – Omnixys Technologies
 *
 * Prisma Seeder for Event Service
 * Creates a mock premium event including:
 * - Event root, address, settings, theme
 * - Media blocks
 * - Description blocks (hero, text, gallery, features, timeline, location, team, faq, quote)
 * - Optional minimal seating structure
 */

    import { PrismaClient, UserRole } from '../src/prisma/generated/client.js';
    import { PrismaPg } from '@prisma/adapter-pg';
    import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

  const users: { id: string; username: string; role: UserRole }[] = [
    {
      id: 'dde8114c-2637-462a-90b9-413924fa3f55',
      username: 'admin',
      role: 'ADMIN',
    },
    {
      id: '694d2e8e-0932-4c8f-a1c4-e300dc235be4',
      username: 'caleb',
      role: 'ADMIN',
    },
    {
      id: 'f9de3f8a-5b79-4f3a-9267-10c1b9ce2a03',
      username: 'rachel',
      role: 'ADMIN',
    },
    {
      id: 'ae489d9b-96ce-4942-bcb1-c2e2a0c92e83',
      username: 'guest',
      role: 'GUEST',
    },
    {
      id: '20e7e44e-9bcd-4016-bebd-36f8d75357b6',
      username: 'security',
      role: 'SECURITY',
    },
    {
      id: '9e219f6f-7706-4294-8b5b-a4105999846f',
      username: 'audrey',
      role: 'ADMIN',
    },
    {
      id: '18bbde19-7e76-45dc-b204-f5c397e11362',
      username: 'christabelle',
      role: 'ADMIN',
    },
  ];


async function seed1(){
  console.log('🌱 Seeding Event Service...');

  //
  // 1) Create Event
  //
  const event = await prisma.event.create({
    data: {
      name: 'The Future Experience',
      startsAt: new Date('2025-08-20T18:00:00.000Z'),
      endsAt: new Date('2025-08-21T02:00:00.000Z'),
      allowReEntry: true,
      rotateSeconds: 300,
      maxSeats: 300,
      owner: '23b51749-e8d1-4222-8f3f-d4097c3e55ec',
      dressCode: 'black',
      description: 'keine ahnun eeeyyyy',
    },
  });

  console.log('✔ Event created:', event.id);

  //
  // 2) Address with latitude + longitude
  //
  await prisma.eventAddress.create({
    data: {
      eventId: event.id,
      street: 'Kulturhalle Zenith, Lilienthalallee 29',
      city: 'München',
      zip: '80939',
      country: 'Deutschland',
      latitude: 48.1924,
      longitude: 11.617,
    },
  });

  //
  // 3) Settings (generic JSON)
  //
  await prisma.eventSettings.create({
    data: {
      eventId: event.id,
      data: {
        rsvpRequired: true,
        plusOnesAllowed: true,
        ticketSecurity: 'strict',
        checkInMode: 'dual-gate',
        themeMode: 'vision-pro',
      },
    },
  });

  //
  // 4) Theme (colors, layout, typography)
  //
  await prisma.eventTheme.create({
    data: {
      eventId: event.id,
      colors: {
        primary: '#6A4BBC',
        secondary: '#4E3792',
        accent: '#A3E635',
      },
      layout: {
        radius: 28,
        blur: 22,
        glassOpacity: 0.18,
      },
      typography: {
        heading: 'Poppins',
        body: 'Inter',
      },
    },
  });

  //
  // 5) Media (hero + gallery as preview)
  //
  await prisma.eventMedia.createMany({
    data: [
      {
        eventId: event.id,
        kind: 'hero',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80',
        alt: 'Hero Background',
        order: 0,
      },
      {
        eventId: event.id,
        kind: 'gallery',
        url: 'https://images.unsplash.com/photo-1503264116251-35a269479413?q=80',
        alt: 'Gallery Image 1',
        order: 1,
      },
      {
        eventId: event.id,
        kind: 'gallery',
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80',
        alt: 'Gallery Image 2',
        order: 2,
      },
      {
        eventId: event.id,
        kind: 'gallery',
        url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80',
        alt: 'Gallery Image 3',
        order: 3,
      },
    ],
  });

  //
  // 6) Description Blocks (based on your mock)
  //
  const blocks = [
    {
      id: 'hero-1',
      type: 'hero',
      order: 0,
      visible: true,
      props: {
        title: 'The Future Experience',
        subtitle:
          'Eine exklusive Nacht voller Vision, Technologie und Inspiration.',
        backgroundImage:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80',
        overlayOpacity: 0.32,
        height: '82vh',
      },
    },

    {
      id: 'text-1',
      type: 'text',
      order: 1,
      visible: true,
      props: {
        title: 'Eine Nacht, die du nie vergessen wirst',
        content: `
Willkommen zu einem Erlebnis, das weit über klassische Events hinausgeht.  
Wir bringen Menschen zusammen, die Neues entdecken möchten – durch beeindruckende Visuals, Live-Performances und immersive Installationen.

Tauche ein in eine Welt, in der Technologie und Kreativität miteinander verschmelzen.
        `,
        align: 'left',
      },
    },

    {
      id: 'gallery-1',
      type: 'gallery',
      order: 2,
      visible: true,
      props: {
        images: [
          'https://images.unsplash.com/photo-1503264116251-35a269479413?q=80',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80',
          'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80',
        ],
        aspectRatio: '16:9',
      },
    },

    {
      id: 'features-1',
      type: 'features',
      order: 3,
      visible: true,
      props: {
        items: [
          {
            icon: 'star',
            title: 'Live Performance',
            description:
              'Erlebe internationale Artists in einer spektakulären Show.',
          },
          {
            icon: 'bolt',
            title: 'Immersive Technology',
            description:
              'Interaktive Installationen, AR-Momente und visuelle Highlights.',
          },
          {
            icon: 'groups',
            title: 'Community',
            description:
              'Treffe visionäre Menschen aus Design, Tech, Kunst & Business.',
          },
        ],
      },
    },

    {
      id: 'timeline-1',
      type: 'timeline',
      order: 4,
      visible: true,
      props: {
        steps: [
          {
            time: '18:00',
            title: 'Einlass & Welcome Lounge',
            description:
              'Soft Drinks, Networking, Ambient Sound & Lichtinstallation.',
          },
          {
            time: '19:30',
            title: 'Keynote – The Future Experience',
            description:
              'Inspirierende Opening-Session über Kreativität & Technologie.',
          },
          {
            time: '20:30',
            title: 'Main Show',
            description:
              'Live Performance, audiovisuelles Immersive-Set, Spezialeffekte.',
          },
          {
            time: '22:00',
            title: 'After Lounge',
            description:
              'Chill Vibes, Drinks, Networking und Interaktionen mit Künstlern.',
          },
        ],
      },
    },

    {
      id: 'location-1',
      type: 'location',
      order: 5,
      visible: true,
      props: {
        title: 'Location',
        address: 'Kulturhalle Zenith, Lilienthalallee 29, 80939 München',
        image:
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80',
        mapEmbedUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2663.5135!2d11.617!3d48.1924',
      },
    },

    {
      id: 'team-1',
      type: 'team',
      order: 6,
      visible: true,
      props: {
        members: [
          {
            name: 'Sophia Kramer',
            role: 'Creative Director',
            image:
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80',
            bio: 'Expertin für immersive Experiences & audiovisuelle Kunst.',
          },
          {
            name: 'Luca Benetti',
            role: 'Lead Producer',
            image:
              'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80',
            bio: 'Verantwortlich für Showproduktion & internationale Künstler.',
          },
          {
            name: 'Amina Watanabe',
            role: 'Experience Designer',
            image:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80',
            bio: 'Gestaltet Interaktion & Atmosphären, die unvergesslich bleiben.',
          },
        ],
      },
    },

    {
      id: 'faq-1',
      type: 'faq',
      order: 7,
      visible: true,
      props: {
        items: [
          {
            question: 'Gibt es eine Abendkasse?',
            answer:
              'Ja, jedoch empfehlen wir Tickets im Voraus zu buchen – die Kapazität ist begrenzt.',
          },
          {
            question: 'Gibt es eine Altersbeschränkung?',
            answer:
              'Empfohlen ab 16 Jahren. Minderjährige benötigen Begleitung.',
          },
          {
            question: 'Ist die Location barrierefrei?',
            answer:
              'Ja, alle Bereiche sind vollständig barrierefrei zugänglich.',
          },
        ],
      },
    },

    {
      id: 'quote-1',
      type: 'quote',
      order: 8,
      visible: true,
      props: {
        quote: '“Innovation entsteht dort, wo Technologie auf Emotion trifft.”',
        author: 'The Future Experience Team',
      },
    },
  ];

  await prisma.eventDescriptionBlock.createMany({
    data: blocks.map((b) => ({
      id: b.id,
      eventId: event.id,
      type: b.type,
      order: b.order,
      visible: b.visible,
      props: b.props,
    })),
  });

  // AFTER description blocks
  console.log('✔ Description Blocks inserted');

  //
  // 7) User Roles
  //

  for (const user of users) {
    if (user.username === 'admin' || user.username === 'guest' || user.username === 'security') {
      await prisma.userEventRole.create({
        data: {
          eventId: event.id,
          userId: user.id,
          role: user.role,
        },
      });
    }
  }

  // await prisma.userEventRole.createMany({
  //   data: [
  //     {
  //       eventId: event.id,
  //       userId: '23b51749-e8d1-4222-8f3f-d4097c3e55ec',
  //       role: 'ADMIN',
  //     },
  //     {
  //       eventId: event.id,
  //       userId: 'a3b50666-e26c-44b4-934f-be61bbacac0d',
  //       role: 'SECURITY',
  //     },
  //     {
  //       eventId: event.id,
  //       userId: '3a709c62-9148-4029-8180-943fcb1ded39',
  //       role: 'GUEST',
  //     },
  //   ],
  // });
  console.log('✔ User Roles inserted');

  //
  // 8) Timeline Entries
  //
  await prisma.eventTimeline.createMany({
    data: [
      {
        eventId: event.id,
        type: 'SYSTEM',
        timestamp: new Date(),
        label: 'Event created',
        isActive: true,
      },
      {
        eventId: event.id,
        type: 'ADMIN',
        timestamp: new Date(),
        label: 'Theme configured',
        isActive: true,
      },
      {
        eventId: event.id,
        type: 'ADMIN',
        timestamp: new Date(),
        label: 'Description seeded',
        isActive: true,
      },
    ],
  });
  console.log('✔ Timeline entries inserted');

  //
  // 9) Audit Logs
  //
  await prisma.eventAuditLog.createMany({
    data: [
      {
        eventId: event.id,
        actorId: 'system',
        action: 'EVENT_CREATED',
        data: { name: event.name },
      },
      {
        eventId: event.id,
        actorId: 'system',
        action: 'THEME_INITIALIZED',
        data: { theme: 'vision-pro' },
      },
      {
        eventId: event.id,
        actorId: 'system',
        action: 'DESCRIPTION_SEEDED',
        data: { count: blocks.length },
      },
    ],
  });
  console.log('✔ Audit Logs inserted');

  //
  // 10) FAQ Entries
  //
  await prisma.eventFAQ.createMany({
    data: [
      {
        eventId: event.id,
        question: 'Gibt es Parkplätze?',
        answer: 'Ja, direkt an der Location stehen über 300 Parkplätze bereit.',
        order: 0,
      },
      {
        eventId: event.id,
        question: 'Welche Tickets gibt es?',
        answer: 'Standard, Premium und VIP – abhängig von Verfügbarkeit.',
        order: 1,
      },
      {
        eventId: event.id,
        question: 'Kann ich mein Ticket weitergeben?',
        answer: 'Nein, Tickets sind personalisiert und device-bound.',
        order: 2,
      },
    ],
  });
  console.log('✔ FAQ entries inserted');

  //
  // 11) Team Members 
  //
  await prisma.eventTeamMember.createMany({
    data: [
      {
        eventId: event.id,
        name: 'Sophia Kramer',
        role: 'Creative Director',
        imageUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80',
        order: 0,
      },
      {
        eventId: event.id,
        name: 'Luca Benetti',
        role: 'Lead Producer',
        imageUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80',
        order: 1,
      },
      {
        eventId: event.id,
        name: 'Amina Watanabe',
        role: 'Experience Designer',
        imageUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80',
        order: 2,
      },
    ],
  });

  console.log('✔ Team Members inserted');

  console.log('🎉 Seeding complete!');
}

async function seed2() {
  console.log('🌱 Seeding Wedding C&R...');

  //
  // 1) Event
  //
  const event = await prisma.event.create({
    data: {
      name: 'Wedding C&R',
      description:
        'A three-day wedding celebration bringing family and friends together to honor love, faith, and unity — from civil ceremony to church blessing and an elegant wedding reception.',
      startsAt: new Date('2025-08-14T09:00:00.000Z'), // Thursday
      endsAt: new Date('2025-08-16T23:59:00.000Z'), // Saturday (open end)
      allowReEntry: true,
      rotateSeconds: 300,
      maxSeats: 400,
      owner: '23b51749-e8d1-4222-8f3f-d4097c3e55ec',
      dressCode: 'formal',
    },
  });

  console.log('✔ Wedding Event created:', event.id);

  //
  // 2) Addresses (3 Days)
  //
  await prisma.eventAddress.createMany({
    data: [
      // {
      //   eventId: event.id,
      //   label: 'Civil Ceremony',
      //   street: 'Bürgerbüro Bad Cannstatt',
      //   city: 'Stuttgart',
      //   zip: '70372',
      //   country: 'Deutschland',
      //   latitude: 48.1924,
      // longitude: 11.617,
      // },
      // {
      //   eventId: event.id,
      //   label: 'Church Ceremony',
      //   street: 'Dürrlewangstraße',
      //   city: 'Stuttgart',
      //   country: 'Deutschland',
      //    zip: '70372',
      //   latitude: 48.1924,
      // longitude: 11.617,
      // },
      {
        eventId: event.id,
        label: 'Wedding Reception',
        street: 'White Event Palast',
        city: 'Kirchheim unter Teck',
        country: 'Deutschland',
        zip: '70372',
        latitude: 48.6446145,
        longitude: 9.4298449,
      },
    ],
  });

  //
  // 3) Settings
  //
  await prisma.eventSettings.create({
    data: {
      eventId: event.id,
      data: {
        rsvpRequired: true,
        plusOnesAllowed: true,
        ticketSecurity: 'strict',
        checkInMode: 'single-gate',
        themeMode: 'vision-pro',
      },
    },
  });

  //
  // 4) Theme
  //
  await prisma.eventTheme.create({
    data: {
      eventId: event.id,
      colors: {
        primary: '#C9B27C',
        secondary: '#4A3F2C',
        accent: '#EFE6D8',
      },
      layout: {
        radius: 28,
        blur: 22,
        glassOpacity: 0.18,
      },
      typography: {
        heading: 'Playfair Display',
        body: 'Inter',
      },
    },
  });

  //
  // 5) Media (neutral placeholders)
  //
  await prisma.eventMedia.createMany({
    data: [
      {
        eventId: event.id,
        kind: 'hero',
        url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80',
        alt: 'Wedding Hero',
        order: 0,
      },
      {
        eventId: event.id,
        kind: 'gallery',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80',
        alt: 'Wedding Gallery 1',
        order: 1,
      },
      {
        eventId: event.id,
        kind: 'gallery',
        url: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?q=80',
        alt: 'Wedding Gallery 2',
        order: 2,
      },
    ],
  });

  //
  // 6) Saturday Reception Timeline
  //
  const timeline = [
    ['17:15', 'Arrival of Guests', 'CEREMONY'],
    ['17:40', 'Prayer by Church Official', 'CEREMONY'],
    ['17:45', 'Family Entrance – Bride', 'CEREMONY'],
    ['17:55', 'Family Entrance – Groom', 'CEREMONY'],
    ['18:00', 'Arrival of Bridal Train', 'CEREMONY'],
    ['18:20', 'Arrival of Couple', 'CEREMONY'],
    ['18:25', 'Dance – Couple & Bridal Team', 'ENTERTAINMENT'],
    ['18:40', 'Welcome Speech by Groom', 'SPEECH'],
    ['18:45', 'Dinner & Dessert', 'DINNER'],
    ['19:15', 'Groom Speech & First Dance', 'SPEECH'],
    ['19:25', 'Cutting of Cake', 'CEREMONY'],
    ['19:30', 'Raising of Toast (MOH)', 'SPEECH'],
    ['19:40', 'Dance with Parents', 'ENTERTAINMENT'],
    ['19:50', 'Open Floor', 'ENTERTAINMENT'],
    ['20:30', 'Fun In Christ Dance Group', 'ENTERTAINMENT'],
    ['20:40', 'Bride & Groom Second Entrance', 'CEREMONY'],
    ['20:50', 'Open Floor', 'ENTERTAINMENT'],
    ['21:00', 'Games & Guest Interaction', 'ENTERTAINMENT'],
    ['21:20', 'Open Floor', 'ENTERTAINMENT'],
  ];

  await prisma.eventTimeline.createMany({
    data: timeline.map(([time, label, type]) => ({
      eventId: event.id,
      type,
      timestamp: new Date(`2025-08-16T${time}:00.000Z`),
      label,
      isActive: true,
    })),
  });

  //
  // 8) Roles (Owner only)
  //
  for (const user of users) {
      await prisma.userEventRole.create({
        data: {
          eventId: event.id,
          userId: user.id,
          role: user.role,
        },
      });
  }


  //
  // 9) Audit Logs
  //
  await prisma.eventAuditLog.createMany({
    data: [
      {
        eventId: event.id,
        actorId: 'system',
        action: 'EVENT_CREATED',
      },
      {
        eventId: event.id,
        actorId: 'system',
        action: 'ADDRESSES_ADDED',
      },
      {
        eventId: event.id,
        actorId: 'system',
        action: 'RECEPTION_TIMELINE_SEEDED',
      },
      {
        eventId: event.id,
        actorId: 'system',
        action: 'SEATING_CREATED',
      },
    ],
  });

  //
  // 6) Description Blocks – Wedding C&R
  //
  const descriptionBlocks = [
    {
      id: 'hero-wedding',
      type: 'hero',
      order: 0,
      visible: true,
      props: {
        title: 'Wedding C & R',
        subtitle:
          'Ein Fest der Liebe, des Glaubens und der Gemeinschaft – wir feiern gemeinsam unsere Hochzeit.',
        backgroundImage:
          'https://images.unsplash.com/photo-1519741497674-611481863552?q=80',
        overlayOpacity: 0.35,
        height: '82vh',
      },
    },

    {
      id: 'text-wedding',
      type: 'text',
      order: 1,
      visible: true,
      props: {
        title: 'Willkommen zu unserer Hochzeit',
        content: `
Wir freuen uns von Herzen, diesen besonderen Moment mit euch zu teilen.  
Unsere Hochzeit erstreckt sich über mehrere Tage – vom Standesamt über den kirchlichen Segen bis hin zur gemeinsamen Feier.

Danke, dass ihr Teil unserer Geschichte seid.
      `,
        align: 'left',
      },
    },

    {
      id: 'gallery-wedding',
      type: 'gallery',
      order: 2,
      visible: true,
      props: {
        images: [
          'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80',
          'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?q=80',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80',
        ],
        aspectRatio: '16:9',
      },
    },

    {
      id: 'features-wedding',
      type: 'features',
      order: 3,
      visible: true,
      props: {
        items: [
          {
            icon: 'favorite',
            title: 'Liebe & Bund',
            description:
              'Wir feiern die Verbindung zweier Leben im Kreis von Familie und Freunden.',
          },
          {
            icon: 'church',
            title: 'Glaube',
            description:
              'Der kirchliche Segen steht im Mittelpunkt unseres gemeinsamen Weges.',
          },
          {
            icon: 'celebration',
            title: 'Gemeinschaft',
            description:
              'Ein Fest voller Freude, Tanz, Gespräche und Dankbarkeit.',
          },
        ],
      },
    },

    {
      id: 'timeline-visual-wedding',
      type: 'timeline',
      order: 4,
      visible: true,
      props: {
        steps: [
          {
            time: 'Donnerstag',
            title: 'Standesamtliche Trauung',
            description: 'Zivile Eheschließung im Bürgerbüro Bad Cannstatt.',
          },
          {
            time: 'Freitag',
            title: 'Kirchliche Trauung',
            description:
              'Kirchlicher Segen und gemeinsames Gebet im katholischen Pfarramt.',
          },
          {
            time: 'Samstag',
            title: 'Hochzeitsfeier',
            description:
              'Empfang, Dinner, Tanz und gemeinsames Feiern im White Event Palast.',
          },
        ],
      },
    },

    {
      id: 'location-wedding',
      type: 'location',
      order: 5,
      visible: true,
      props: {
        title: 'Location',
        address: 'Kulturhalle Zenith, Lilienthalallee 29, 80939 München',
        image: '/images/b.jpeg',
        mapEmbedUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5272.374452948911!2d9.4298427!3d48.6445334!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479995eb7f76f565%3A0x35acb6bfdf36da5e!2sWhite%20Event%20Palast%20%7C%20Hochzeitssaal%20Stuttgart!5e0!3m2!1sde!2sde!4v1766230632142!5m2!1sde!2sde'
      },
    },


    {
      id: 'team-wedding',
      type: 'team',
      order: 6,
      visible: true,
      props: {
        members: [
          {
            name: 'Bride',
            role: 'Braut',
            image:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80',
          },
          {
            name: 'Groom',
            role: 'Bräutigam',
            image:
              'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80',
          },
        ],
      },
    },

    {
      id: 'faq-wedding',
      type: 'faq',
      order: 7,
      visible: true,
      props: {
        items: [
          {
            question: 'Gibt es feste Sitzplätze?',
            answer:
              'Ja, am Samstag gibt es eine Tischordnung mit zugewiesenen Plätzen.',
          },
          {
            question: 'Gibt es einen Dresscode?',
            answer: 'Ja – wir bitten um formelle Kleidung.',
          },
          {
            question: 'Kann ich eine Begleitperson mitbringen?',
            answer:
              'Ja, sofern dies in der Einladung angegeben und bestätigt ist.',
          },
        ],
      },
    },

    {
      id: 'quote-wedding',
      type: 'quote',
      order: 8,
      visible: true,
      props: {
        quote: '„Wo Liebe ist, wird das Unmögliche möglich.“',
        author: 'C & R',
      },
    },
  ];

  await prisma.eventDescriptionBlock.createMany({
    data: descriptionBlocks.map((b) => ({
      id: b.id,
      eventId: event.id,
      type: b.type,
      order: b.order,
      visible: b.visible,
      props: b.props,
    })),
  });

  console.log('✔ Wedding description blocks inserted');

  console.log('🎉 Wedding C&R seeded successfully!');
}

async function main() {
  await seed1();
  await seed2();
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
  })
  .finally(() => prisma.$disconnect());
