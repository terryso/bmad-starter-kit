const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const githubUrl = 'https://github.com/terryso/bmad-starter-kit';

  const existing = await prisma.project.findUnique({
    where: { githubUrl },
    select: { id: true, stars: true, forks: true, openIssues: true }
  });

  console.log('Before update:', existing);

  const updated = await prisma.project.update({
    where: { githubUrl },
    data: {
      stars: 5,
      forks: 1,
      openIssues: 0,
    },
    select: { id: true, stars: true, forks: true, openIssues: true }
  });

  console.log('After update:', updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
