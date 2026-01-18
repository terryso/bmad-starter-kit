const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const githubUrl = 'https://github.com/terryso/bmad-starter-kit';

  // Check if project exists
  const existing = await prisma.project.findUnique({
    where: { githubUrl }
  });

  if (existing) {
    console.log('Found existing project:', existing.id);
    console.log('Before update:', JSON.stringify({ description: existing.description, category: existing.category }, null, 2));

    // Update with correct information from README
    const updated = await prisma.project.update({
      where: { githubUrl },
      data: {
        description: 'A practice project for learning BMAD development workflow. This is a BMAD learning sandbox for practicing the complete BMAD development workflow.',
        category: 'OTHER',
        suggestedTags: ['BMAD', 'Learning', 'Workflow', 'Practice']
      }
    });

    console.log('Updated successfully!');
    console.log('After update:', JSON.stringify({ description: updated.description, category: updated.category }, null, 2));
  } else {
    console.log('Project not found in database');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
