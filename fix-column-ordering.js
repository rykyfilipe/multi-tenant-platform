const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fixColumnOrdering() {
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

    // Get all columns for invoice_items table
    const columns = await prisma.column.findMany({
      where: { tableId: invoiceItemsTable.id },
      orderBy: { order: 'asc' },
    });

    console.log("📋 Current columns before fix:");
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.name} (order: ${col.order})`);
    });

    // Define the correct column order
    const correctOrder = [
      { name: "invoice_id", order: 1 },
      { name: "product_ref_table", order: 2 },
      { name: "product_ref_id", order: 3 },
      { name: "quantity", order: 4 },
      { name: "unit_of_measure", order: 5 },
      { name: "unit_price", order: 6 },
      { name: "total_price", order: 7 },
      { name: "currency", order: 8 },
      { name: "tax_rate", order: 9 },
      { name: "tax_amount", order: 10 },
      { name: "product_name", order: 11 },
      { name: "product_description", order: 12 },
      { name: "product_category", order: 13 },
      { name: "product_sku", order: 14 },
      { name: "product_brand", order: 15 },
      { name: "product_weight", order: 16 },
      { name: "product_dimensions", order: 17 },
      { name: "product_vat", order: 18 },
      { name: "discount_rate", order: 19 },
      { name: "discount_amount", order: 20 },
      { name: "description", order: 21 },
    ];

    // Update column orders
    for (const colOrder of correctOrder) {
      const column = columns.find(col => col.name === colOrder.name);
      if (column && column.order !== colOrder.order) {
        await prisma.column.update({
          where: { id: column.id },
          data: { order: colOrder.order },
        });
        console.log(`✅ Updated ${colOrder.name} order from ${column.order} to ${colOrder.order}`);
      }
    }

    // Check for duplicate columns and remove them
    const columnNames = columns.map(col => col.name);
    const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index);

    if (duplicates.length > 0) {
      console.log("🔍 Found duplicate columns:", [...new Set(duplicates)]);

      for (const duplicateName of [...new Set(duplicates)]) {
        const duplicateColumns = columns.filter(col => col.name === duplicateName);
        if (duplicateColumns.length > 1) {
          // Keep the first one, remove the rest
          for (let i = 1; i < duplicateColumns.length; i++) {
            await prisma.column.delete({
              where: { id: duplicateColumns[i].id },
            });
            console.log(`🗑️ Removed duplicate column: ${duplicateName} (ID: ${duplicateColumns[i].id})`);
          }
        }
      }
    }

    // Handle specific case: if both 'price' and 'unit_price' exist, keep 'unit_price' and remove 'price'
    const priceCol = columns.find(col => col.name === 'price');
    const unitPriceCol = columns.find(col => col.name === 'unit_price');

    if (priceCol && unitPriceCol) {
      await prisma.column.delete({
        where: { id: priceCol.id },
      });
      console.log(`🗑️ Removed old 'price' column, keeping 'unit_price'`);
    }

    // Verify the fix
    const updatedColumns = await prisma.column.findMany({
      where: { tableId: invoiceItemsTable.id },
      orderBy: { order: 'asc' },
    });

    console.log("📋 Columns after fix:");
    updatedColumns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.name} (order: ${col.order})`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixColumnOrdering();
