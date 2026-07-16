import { PrismaClient, InvitationStatus } from '../src/prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const events = await prisma.event.count();
  const settings = await prisma.settings.count();
  const roles = await prisma.role.count();
  const timelines = await prisma.timeline.count();
  const seatColorGroups = await prisma.seatColorGroup.count();

  // Check that every role references existing users (local only)
  const rolesWithUsers = await prisma.role.count({
    where: { userId: { not: undefined } },
  });

  // Check ceremony and reception exist
  const weddingRoot = await prisma.event.findFirst({ where: { name: 'Wedding C & R' } });
  const ceremony = weddingRoot
    ? await prisma.event.findFirst({ where: { parentId: weddingRoot.id, name: 'Wedding Ceremony' } })
    : null;
  const reception = weddingRoot
    ? await prisma.event.findFirst({ where: { parentId: weddingRoot.id, name: 'Wedding Reception' } })
    : null;

  const result = {
    service: 'event',
    checks: [
      { name: 'Events', ok: events > 0, count: events },
      { name: 'Event Settings', ok: settings > 0, count: settings },
      { name: 'Event Roles', ok: roles > 0, count: roles },
      { name: 'Timeline Entries', ok: timelines > 0, count: timelines },
      { name: 'SeatColorGroups', ok: seatColorGroups > 0, count: seatColorGroups },
      { name: 'Ceremony Event', ok: !!ceremony, count: ceremony ? 1 : 0 },
      { name: 'Reception Event', ok: !!reception, count: reception ? 1 : 0 },
    ],
  };

  console.log('VALIDATE_JSON:' + JSON.stringify(result));
}

main()
  .catch((e) => {
    console.error('❌ Validate failed', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
