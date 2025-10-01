const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function debugInvoiceItems() {
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
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
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

    // Find all invoice items
    const allInvoiceItems = await prisma.row.findMany({
      where: { tableId: invoiceItemsTable.id },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    console.log("🛒 All invoice items in database:");
    allInvoiceItems.forEach((item, index) => {
      const itemData = {};
      item.cells.forEach(cell => {
        itemData[cell.column.name] = cell.value;
      });
      console.log("  Item", index + 1, ":", itemData);
      console.log("    Invoice ID from item:", itemData.invoice_id, "vs expected:", invoiceId);
    });

    // Try to find items for this specific invoice
    const invoiceItems = await prisma.row.findMany({
      where: {
        tableId: invoiceItemsTable.id,
        cells: {
          some: {
            column: {
              name: "invoice_id",
            },
            value: { equals: invoiceId.toString() },
          },
        },
      },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    console.log("🛒 Items found for invoice ID", invoiceId, ":", invoiceItems.length);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugInvoiceItems();
