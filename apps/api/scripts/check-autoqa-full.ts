import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: {
      githubUrl: 'https://github.com/terryso/AutoQA-Agent'
    }
  });
  console.log(JSON.stringify(project, null, 2));
}

main().then(() => prisma.$disconnect());
