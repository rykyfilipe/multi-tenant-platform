/** @format */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 2;
  
  const database = await prisma.database.findFirst({
    where: { tenantId }
  });
  
  if (!database) {
    console.log('Database not found');
    return;
  }
  
  const tables = await prisma.table.findMany({
    where: { databaseId: database.id },
    include: {
      _count: {
        select: { rows: true, columns: true }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  console.log('\n📊 Tables in database:');
  console.log('='.repeat(120));
  console.log('ID\tName\t\t\tProtected\tModule\t\tProtType\tModType\t\tRows\tCols');
  console.log('='.repeat(120));
  
  tables.forEach(t => {
    console.log(
      `${t.id}\t${t.name.padEnd(20)}\t${t.isProtected}\t\t${t.isModuleTable}\t\t${(t.protectedType || '-').padEnd(15)}\t${(t.moduleType || '-').padEnd(15)}\t${t._count.rows}\t${t._count.columns}`
    );
  });
  
  console.log('='.repeat(120));
  console.log(`\nTotal: ${tables.length} tables`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

