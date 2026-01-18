import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrphanedProjects() {
  console.log('Finding orphaned Project records...');

  // Get all distinct submittedBy values from Projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      repositoryName: true,
      submittedBy: true,
    },
  });

  // Get all existing user IDs
  const users = await prisma.user.findMany({
    select: { id: true },
  });
  const userIds = new Set(users.map((u: { id: string }) => u.id));

  console.log(`Total projects: ${projects.length}`);
  console.log(`Total users: ${users.length}`);

  // Find orphaned projects (submittedBy not in userIds)
  const orphanedProjects = projects.filter(
    (p: { id: string; repositoryName: string; submittedBy: string }) => !userIds.has(p.submittedBy)
  );

  console.log(`Orphaned projects found: ${orphanedProjects.length}`);

  if (orphanedProjects.length === 0) {
    console.log('No orphaned projects found. Database is clean.');
    return;
  }

  // Display orphaned projects
  console.log('\nOrphaned projects:');
  orphanedProjects.forEach((p: { id: string; repositoryName: string; submittedBy: string }) => {
    console.log(`  - ${p.id} (${p.repositoryName}): submittedBy=${p.submittedBy}`);
  });

  // Find a valid user to reassign projects to (prefer an admin)
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.error('\nNo admin user found to reassign projects!');
    // Find any user as fallback
    const anyUser = users[0];
    if (anyUser) {
      console.log(`Using user ${anyUser.id} for reassignment...`);
      await reassignProjects(orphanedProjects.map((p) => p.id), anyUser.id);
    } else {
      console.error('No users found at all! Cannot fix orphaned projects.');
    }
  } else {
    console.log(`\nReassigning orphaned projects to admin user: ${adminUser.id}`);
    await reassignProjects(orphanedProjects.map((p) => p.id), adminUser.id);
  }
}

async function reassignProjects(projectIds: string[], userId: string) {
  const result = await prisma.project.updateMany({
    where: {
      id: { in: projectIds },
    },
    data: {
      submittedBy: userId,
    },
  });

  console.log(`Updated ${result.count} projects.`);
}

async function main() {
  try {
    await fixOrphanedProjects();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
