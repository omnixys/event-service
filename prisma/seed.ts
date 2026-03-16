/**
 * Root Prisma Seeder
 */

import { PrismaClient } from '../src/prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { seedFutureExperience } from './seed/the-future-experience/future.seed.js';
import { seedWedding } from './seed/wedding/wedding.seed.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Omnixys Event Service Seed');

  await seedFutureExperience(prisma);
  await seedWedding(prisma);

  console.log('🎉 All seeds completed');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
