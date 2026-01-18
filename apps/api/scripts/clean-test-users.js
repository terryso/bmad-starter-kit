const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 查找所有名字包含 "Test" 的用户
  const testUsers = await prisma.user.findMany({
    where: {
      name: {
        contains: 'Test'
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  console.log(`找到 ${testUsers.length} 个测试用户:`);
  testUsers.forEach(u => {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
  });

  if (testUsers.length === 0) {
    console.log('没有找到测试数据，退出。');
    return;
  }

  // 删除这些用户
  const result = await prisma.user.deleteMany({
    where: {
      name: {
        contains: 'Test'
      }
    }
  });

  console.log(`✅ 已删除 ${result.count} 个测试用户`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
