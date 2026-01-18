import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fix the AutoQA-Agent project language
  const result = await prisma.project.updateMany({
    where: {
      githubUrl: 'https://github.com/terryso/AutoQA-Agent'
    },
    data: {
      language: 'TypeScript'
    }
  });

  console.log(`Updated ${result.count} project(s)`);
}

main().then(() => prisma.$disconnect());
