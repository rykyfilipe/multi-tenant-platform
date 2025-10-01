const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testInvoiceSystem() {
  try {
    // Find Bondor's tenant
    const tenant = await prisma.tenant.findFirst({
      where: { name: "Bondor's tenant" },
    });

    if (!tenant) {
      console.log("❌ No Bondor's tenant found");
      return;
    }

    // Find database
    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!database) {
      console.log("❌ No database found for this tenant");
      return;
    }

    // Find invoice_items table
    const invoiceItemsTable = await prisma.table.findFirst({
      where: { name: 'invoice_items', databaseId: database.id },
    });

    if (!invoiceItemsTable) {
      console.log("❌ No invoice_items table found");
      return;
    }

    // Get columns for invoice_items table
    const columns = await prisma.column.findMany({
      where: { tableId: invoiceItemsTable.id },
      orderBy: { order: 'asc' },
    });

    console.log("📋 Current columns in invoice_items table:");
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.name} (type: ${col.type}, order: ${col.order})`);
    });

    // Check if required columns exist
    const requiredColumns = ['invoice_id', 'product_ref_table', 'product_ref_id', 'quantity', 'unit_price', 'total_price'];
    const missingColumns = requiredColumns.filter(colName =>
      !columns.some(col => col.name === colName)
    );

    if (missingColumns.length > 0) {
      console.log("❌ Missing required columns:", missingColumns);
    } else {
      console.log("✅ All required columns exist");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoiceSystem();
