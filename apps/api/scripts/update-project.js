const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const githubUrl = 'https://github.com/terryso/polyv-live-cli';
  
  // Check if project exists
  const existing = await prisma.project.findUnique({
    where: { githubUrl }
  });
  
  if (existing) {
    console.log('Found existing project:', existing.id);
    console.log('Before update:', JSON.stringify({ stars: existing.stars, forks: existing.forks, language: existing.language }, null, 2));
    
    // Update with GitHub API data
    const updated = await prisma.project.update({
      where: { githubUrl },
      data: {
        repositoryName: 'polyv-live-cli',
        description: '保利威直播云CLI工具',
        owner: 'terryso',
        stars: 25,
        forks: 4,
        openIssues: 0,
        language: 'TypeScript',
        githubUpdatedAt: new Date('2025-12-16T09:20:46Z'),
        homepageUrl: 'https://help.polyv.net/#/live/api/',
        license: 'MIT',
        category: 'CLI',
        suggestedTags: ['CLI', 'TypeScript', '保利威', '直播']
      }
    });
    
    console.log('Updated successfully!');
    console.log('After update:', JSON.stringify({ stars: updated.stars, forks: updated.forks, language: updated.language }, null, 2));
  } else {
    console.log('Project not found in database');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
