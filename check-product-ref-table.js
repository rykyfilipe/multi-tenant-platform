const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkProductRefTable() {
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

    // Find invoice items table
    const invoiceItemsTable = await prisma.table.findFirst({
      where: { name: 'invoice_items', databaseId: database.id },
    });

    if (!invoiceItemsTable) {
      console.log("❌ No invoice_items table found");
      return;
    }

    // Find the invoice item
    const invoiceItem = await prisma.row.findFirst({
      where: { tableId: invoiceItemsTable.id },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    if (!invoiceItem) {
      console.log("❌ No invoice items found");
      return;
    }

    console.log("🔍 Current invoice item data:");
    const currentItemData = {};
    invoiceItem.cells.forEach(cell => {
      currentItemData[cell.column.name] = cell.value;
    });
    console.log(currentItemData);

    // Check if product_ref_table is set correctly
    const productRefTableCell = invoiceItem.cells.find(
      cell => cell.column.name === 'product_ref_table'
    );

    if (productRefTableCell) {
      console.log("✅ product_ref_table is:", productRefTableCell.value);
    } else {
      console.log("❌ product_ref_table cell not found");

      // Find the column for product_ref_table
      const productRefTableColumn = await prisma.column.findFirst({
        where: {
          tableId: invoiceItemsTable.id,
          name: 'product_ref_table'
        },
      });

      if (productRefTableColumn) {
        // Create the missing cell
        await prisma.cell.create({
          data: {
            rowId: invoiceItem.id,
            columnId: productRefTableColumn.id,
            value: 'Products', // The correct table name
          },
        });
        console.log("✅ Created missing product_ref_table cell with value: Products");
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductRefTable();
