const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('🔍 Checking invoice tables schema...\n');

    const tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });

    // Check invoices table
    const invoicesTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'invoices'
      },
      include: {
        columns: true
      }
    });

    console.log('═══════════════════════════════════════');
    console.log('💼 INVOICES TABLE COLUMNS');
    console.log('═══════════════════════════════════════');
    invoicesTable.columns.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.name} (${col.type}) - ${col.semanticType || 'no semantic type'}`);
    });

    // Check invoice_items table
    const invoiceItemsTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'invoice_items'
      },
      include: {
        columns: true
      }
    });

    console.log('\n═══════════════════════════════════════');
    console.log('📦 INVOICE_ITEMS TABLE COLUMNS');
    console.log('═══════════════════════════════════════');
    invoiceItemsTable.columns.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.name} (${col.type}) - ${col.semanticType || 'no semantic type'}`);
    });

    // Check a specific invoice and its items
    console.log('\n═══════════════════════════════════════');
    console.log('🔎 CHECKING SPECIFIC INVOICE');
    console.log('═══════════════════════════════════════');

    const specificInvoice = await prisma.row.findFirst({
      where: {
        tableId: invoicesTable.id
      },
      include: {
        cells: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    if (specificInvoice) {
      console.log(`\nInvoice ID: ${specificInvoice.id}`);
      console.log('Cells:');
      specificInvoice.cells.forEach(cell => {
        const column = invoicesTable.columns.find(c => c.id === cell.columnId);
        const value = cell.stringValue || cell.numberValue || cell.dateValue || cell.booleanValue || 'NULL';
        console.log(`  ${column?.name}: ${value}`);
      });
    }

    // Check invoice items for this invoice
    const itemsForInvoice = await prisma.row.findMany({
      where: {
        tableId: invoiceItemsTable.id
      },
      include: {
        cells: true
      },
      take: 3
    });

    console.log(`\n═══════════════════════════════════════`);
    console.log(`📋 SAMPLE INVOICE ITEMS (first 3)`);
    console.log(`═══════════════════════════════════════`);

    itemsForInvoice.forEach((item, idx) => {
      console.log(`\nItem ${idx + 1} (Row ID: ${item.id}):`);
      item.cells.forEach(cell => {
        const column = invoiceItemsTable.columns.find(c => c.id === cell.columnId);
        const value = cell.stringValue || cell.numberValue || cell.dateValue || cell.booleanValue || 'NULL';
        console.log(`  ${column?.name}: ${value}`);
      });
    });

    // Count rows
    console.log('\n═══════════════════════════════════════');
    console.log('📊 ROW COUNTS');
    console.log('═══════════════════════════════════════');
    const invoiceCount = await prisma.row.count({ where: { tableId: invoicesTable.id } });
    const itemCount = await prisma.row.count({ where: { tableId: invoiceItemsTable.id } });
    console.log(`Invoices: ${invoiceCount}`);
    console.log(`Invoice Items: ${itemCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();

