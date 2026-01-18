import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add forks column
  await prisma.$executeRaw`
    ALTER TABLE "Project"
    ADD COLUMN IF NOT EXISTS "forks" INTEGER NOT NULL DEFAULT 0
  `;
  console.log('Added forks column');

  // Add openIssues column
  await prisma.$executeRaw`
    ALTER TABLE "Project"
    ADD COLUMN IF NOT EXISTS "openIssues" INTEGER NOT NULL DEFAULT 0
  `;
  console.log('Added openIssues column');
}

main().then(() => prisma.$disconnect());
