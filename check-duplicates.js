const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkColumnDuplicates() {
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

    console.log("🔍 Checking for duplicate column names...");

    const columnNames = columns.map(col => col.name);
    const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index);

    if (duplicates.length > 0) {
      console.log("❌ Found duplicate column names:", [...new Set(duplicates)]);
    } else {
      console.log("✅ No duplicate column names found");
    }

    console.log("🔍 Checking for price vs unit_price conflicts...");
    const priceColumns = columns.filter(col => col.name.includes('price'));
    console.log("Price-related columns:", priceColumns.map(col => ({ name: col.name, id: col.id, order: col.order })));

    // Check if both 'price' and 'unit_price' exist
    const priceCol = columns.find(col => col.name === 'price');
    const unitPriceCol = columns.find(col => col.name === 'unit_price');

    if (priceCol && unitPriceCol) {
      console.log("❌ Both price and unit_price columns exist!");
      console.log("  Price column:", { id: priceCol.id, order: priceCol.order });
      console.log("  Unit_price column:", { id: unitPriceCol.id, order: unitPriceCol.order });
    } else if (priceCol) {
      console.log("✅ Only price column exists");
    } else if (unitPriceCol) {
      console.log("✅ Only unit_price column exists");
    } else {
      console.log("❌ No price column found!");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumnDuplicates();
