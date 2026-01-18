import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.project.updateMany({
    where: {
      githubUrl: 'https://github.com/terryso/AutoQA-Agent'
    },
    data: {
      stars: 90,
      topics: ['agent-sdk', 'autoqa', 'bmad', 'bmad-method', 'claude-code'],
      license: 'MIT License',
      homepageUrl: 'https://autoqa.lovable.app',
      githubUpdatedAt: '2026-01-16T20:50:47Z',
      suggestedTags: ['testing', 'qa', 'automation', 'ai-agent', 'typescript', 'claude-sdk']
    }
  });

  console.log(`Updated ${result.count} project(s)`);
}

main().then(() => prisma.$disconnect());
