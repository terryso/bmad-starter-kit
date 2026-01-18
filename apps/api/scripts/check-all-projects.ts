import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      repositoryName: true,
      stars: true,
      forks: true,
      openIssues: true,
    },
    take: 5,
  });
  console.log(JSON.stringify(projects, null, 2));
}

main().then(() => prisma.$disconnect());
