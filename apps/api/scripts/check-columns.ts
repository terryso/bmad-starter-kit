import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'Project'
    AND column_name IN ('forks', 'openIssues')
    ORDER BY column_name
  ` as Array<{ column_name: string; data_type: string; column_default: string | null }>;
  console.log(JSON.stringify(result, null, 2));
}

main().then(() => prisma.$disconnect());
