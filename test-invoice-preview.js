const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testInvoicePreview() {
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

    // Extract invoice ID
    let invoiceId = invoice.id;
    console.log("✅ Testing invoice preview for invoice ID:", invoiceId);

    // Now let's simulate what the API endpoint does
    // Get invoice details
    const invoiceData = {};
    invoice.cells.forEach((cell) => {
      invoiceData[cell.column.name] = cell.value;
    });

    console.log("📄 Invoice data:", invoiceData);

    // Get customer
    const customerId = invoiceData.customer_id;
    const customersTable = await prisma.table.findFirst({
      where: { name: 'customers', databaseId: database.id },
    });

    if (!customersTable) {
      console.log("❌ No customers table found");
      return;
    }

    const customer = await prisma.row.findFirst({
      where: {
        id: customerId,
        tableId: customersTable.id,
      },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    const customerData = {};
    if (customer) {
      customer.cells.forEach((cell) => {
        customerData[cell.column.name] = cell.value;
      });
    }

    console.log("👤 Customer data:", customerData);

    // Get invoice items
    const invoiceItemsTable = await prisma.table.findFirst({
      where: { name: 'invoice_items', databaseId: database.id },
    });

    if (!invoiceItemsTable) {
      console.log("❌ No invoice_items table found");
      return;
    }

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

    console.log("🛒 Found", invoiceItems.length, "invoice items");

    const items = [];
    for (const item of invoiceItems) {
      const itemData = {};
      item.cells.forEach((cell) => {
        itemData[cell.column.name] = cell.value;
      });

      console.log("  📦 Item data:", itemData);

      // Try to get product details if product_ref_table and product_ref_id are set
      if (itemData.product_ref_table && itemData.product_ref_id) {
        try {
          // Find the referenced table
          const productTable = await prisma.table.findFirst({
            where: {
              name: itemData.product_ref_table,
              databaseId: database.id,
            },
          });

          if (productTable) {
            const productRow = await prisma.row.findUnique({
              where: { id: Number(itemData.product_ref_id) },
              include: {
                cells: {
                  include: {
                    column: true,
                  },
                },
              },
            });

            if (productRow) {
              // Extract all product information
              const productData = {};
              productRow.cells.forEach((cell) => {
                productData[cell.column.name] = cell.value;
              });

              console.log("    ✅ Found product details:", productData);

              // Merge product details into item data for easy access
              itemData.product_name = productData.name || productData.product_name || productData.title || "Product";
              itemData.product_description = productData.description || productData.product_description || "";
              itemData.product_category = productData.category || productData.product_category || "";
              itemData.product_sku = productData.sku || productData.product_sku || "";
              itemData.product_brand = productData.brand || productData.product_brand || "";
            } else {
              console.log("    ❌ Product row not found");
            }
          } else {
            console.log("    ❌ Product table not found");
          }
        } catch (error) {
          console.log("    ❌ Error fetching product details:", error.message);
        }
      } else {
        console.log("    ⚠️ No product reference information");
      }

      items.push(itemData);
    }

    // Calculate totals (simplified version)
    let subtotal = 0;
    items.forEach(item => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price || item.unit_price) || 0;
      subtotal += quantity * price;
    });

    const vatTotal = 0; // Simplified
    const grandTotal = subtotal + vatTotal;

    console.log("💰 Calculated totals:");
    console.log("  Subtotal:", subtotal);
    console.log("  VAT Total:", vatTotal);
    console.log("  Grand Total:", grandTotal);

    console.log("✅ Invoice preview data is ready!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoicePreview();
