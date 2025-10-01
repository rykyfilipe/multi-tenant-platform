const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkInvoiceData() {
  try {
    // Find Bondor's tenant
    const tenant = await prisma.tenant.findFirst({
      where: { name: "Bondor's tenant" },
    });

    if (!tenant) {
      console.log("❌ No Bondor's tenant found");
      return;
    }

    console.log("✅ Found tenant:", tenant.name, "(ID:", tenant.id, ")");

    // Find database
    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!database) {
      console.log("❌ No database found for this tenant");
      return;
    }

    console.log("✅ Found database ID:", database.id);

    // Find products table
    const productsTable = await prisma.table.findFirst({
      where: { name: 'Products', databaseId: database.id },
    });

    if (!productsTable) {
      console.log("❌ No Products table found");
      return;
    }

    console.log("✅ Found Products table ID:", productsTable.id);

    // Find products
    const products = await prisma.row.findMany({
      where: { tableId: productsTable.id },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    console.log("📦 Found", products.length, "products:");
    products.forEach((product, index) => {
      const productData = {};
      product.cells.forEach(cell => {
        productData[cell.column.name] = cell.value;
      });
      console.log("  Product", index + 1, ":", productData);
    });

    // Find invoices table
    const invoicesTable = await prisma.table.findFirst({
      where: { name: 'invoices', databaseId: database.id },
    });

    if (!invoicesTable) {
      console.log("❌ No invoices table found");
      return;
    }

    console.log("✅ Found invoices table ID:", invoicesTable.id);

    // Find invoices
    const invoices = await prisma.row.findMany({
      where: { tableId: invoicesTable.id },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    console.log("📄 Found", invoices.length, "invoices:");
    invoices.forEach((invoice, index) => {
      const invoiceData = {};
      invoice.cells.forEach(cell => {
        invoiceData[cell.column.name] = cell.value;
      });
      console.log("  Invoice", index + 1, ":", invoiceData);
    });

    // Find invoice items
    const invoiceItemsTable = await prisma.table.findFirst({
      where: { name: 'invoice_items', databaseId: database.id },
    });

    if (!invoiceItemsTable) {
      console.log("❌ No invoice_items table found");
      return;
    }

    console.log("✅ Found invoice_items table ID:", invoiceItemsTable.id);

    // Find invoice items
    const invoiceItems = await prisma.row.findMany({
      where: { tableId: invoiceItemsTable.id },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    console.log("🛒 Found", invoiceItems.length, "invoice items:");
    invoiceItems.forEach((item, index) => {
      const itemData = {};
      item.cells.forEach(cell => {
        itemData[cell.column.name] = cell.value;
      });
      console.log("  Item", index + 1, ":", itemData);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoiceData();
