import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.project.updateMany({
    where: {
      githubUrl: 'https://github.com/terryso/AutoQA-Agent'
    },
    data: {
      forks: 24,
      openIssues: 2
    }
  });

  console.log(`Updated ${result.count} project(s)`);
}

main().then(() => prisma.$disconnect());
