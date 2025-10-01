const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fixInvoiceId() {
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

    // Find the invoice
    const invoicesTable = await prisma.table.findFirst({
      where: { name: 'invoices', databaseId: database.id },
    });

    if (!invoicesTable) {
      console.log("❌ No invoices table found");
      return;
    }

    const invoice = await prisma.row.findFirst({
      where: { tableId: invoicesTable.id },
    });

    if (!invoice) {
      console.log("❌ No invoice found");
      return;
    }

    const invoiceId = invoice.id;
    console.log("📄 Invoice ID:", invoiceId);

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
      console.log("❌ No invoice item found");
      return;
    }

    // Find the invoice_id column
    const invoiceIdColumn = await prisma.column.findFirst({
      where: {
        tableId: invoiceItemsTable.id,
        name: 'invoice_id',
      },
    });

    if (!invoiceIdColumn) {
      console.log("❌ No invoice_id column found");
      return;
    }

    // Check if the cell already exists
    const existingCell = invoiceItem.cells.find(
      cell => cell.column.name === 'invoice_id'
    );

    if (existingCell) {
      console.log("✅ invoice_id cell already exists with value:", existingCell.value);
    } else {
      console.log("❌ invoice_id cell missing, creating it...");

      // Create the missing cell
      await prisma.cell.create({
        data: {
          rowId: invoiceItem.id,
          columnId: invoiceIdColumn.id,
          value: invoiceId.toString(),
        },
      });

      console.log("✅ Created invoice_id cell with value:", invoiceId);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInvoiceId();
