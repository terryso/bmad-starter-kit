import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { repositoryName: { contains: 'AutoQA' } },
        { githubUrl: { contains: 'AutoQA' } }
      ]
    },
    select: { id: true, repositoryName: true, language: true, githubUrl: true }
  });
  console.log(JSON.stringify(projects, null, 2));
}

main().then(() => prisma.$disconnect());
