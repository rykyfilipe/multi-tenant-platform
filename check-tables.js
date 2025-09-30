const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    const tables = await prisma.table.findMany({
      where: { databaseId: 1 },
      select: { id: true, name: true, protectedType: true }
    });

    console.log('Tables in database 1:');
    tables.forEach(table => {
      console.log(`- ${table.name} (ID: ${table.id}, Protected: ${table.protectedType || 'none'})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
