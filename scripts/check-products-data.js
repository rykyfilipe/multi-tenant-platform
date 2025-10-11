const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    console.log('🔍 Checking Products data...\n');

    const tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });

    const productsTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'Products'
      },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true
          },
          take: 5
        }
      }
    });

    console.log('═══════════════════════════════════════');
    console.log('📦 PRODUCTS TABLE COLUMNS');
    console.log('═══════════════════════════════════════');
    productsTable.columns.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.name} (${col.type}) - ${col.semanticType || 'no semantic type'}`);
    });

    console.log('\n═══════════════════════════════════════');
    console.log('📋 SAMPLE PRODUCTS (first 5)');
    console.log('═══════════════════════════════════════\n');

    productsTable.rows.forEach((row, idx) => {
      console.log(`Product ${idx + 1} (Row ID: ${row.id}):`);
      row.cells.forEach(cell => {
        const column = productsTable.columns.find(c => c.id === cell.columnId);
        const value = cell.stringValue || cell.numberValue || cell.dateValue || cell.booleanValue || 'NULL';
        console.log(`  ${column?.name}: ${value}`);
      });
      console.log('');
    });

    // Count total products
    const totalProducts = await prisma.row.count({ where: { tableId: productsTable.id } });
    console.log(`Total products: ${totalProducts}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();

