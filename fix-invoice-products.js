const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fixInvoiceProducts() {
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

    // Find products table
    const productsTable = await prisma.table.findFirst({
      where: { name: 'Products', databaseId: database.id },
    });

    if (!productsTable) {
      console.log("❌ No Products table found");
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

    // Get the first product (should be ID 101)
    const firstProduct = await prisma.row.findFirst({
      where: { tableId: productsTable.id },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    if (!firstProduct) {
      console.log("❌ No products found");
      return;
    }

    // Extract product name from cells
    let productName = "Product";
    let productDescription = "";
    let productSku = "";
    let productCategory = "";
    let productBrand = "";

    firstProduct.cells.forEach(cell => {
      switch (cell.column.name) {
        case 'name':
          productName = cell.value;
          break;
        case 'description':
          productDescription = cell.value;
          break;
        case 'sku':
          productSku = cell.value;
          break;
        case 'category':
          productCategory = cell.value;
          break;
        case 'brand':
          productBrand = cell.value;
          break;
      }
    });

    console.log("✅ Found first product:", productName, "(ID:", firstProduct.id, ")");

    // Find the invoice item that needs fixing
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

    // Update the product_ref_id to point to the actual first product (ID 101)
    // Find the product_ref_id cell and update it
    const productRefIdCell = invoiceItem.cells.find(
      cell => cell.column.name === 'product_ref_id'
    );

    if (productRefIdCell) {
      await prisma.cell.update({
        where: { id: productRefIdCell.id },
        data: { value: firstProduct.id.toString() },
      });
      console.log("✅ Updated product_ref_id from", currentItemData.product_ref_id, "to", firstProduct.id);
    }

    // Update the product_name cell to use the actual product name
    const productNameCell = invoiceItem.cells.find(
      cell => cell.column.name === 'product_name'
    );

    if (productNameCell) {
      await prisma.cell.update({
        where: { id: productNameCell.id },
        data: { value: productName },
      });
      console.log("✅ Updated product_name to:", productName);
    }

    // Update the product_description cell
    const productDescriptionCell = invoiceItem.cells.find(
      cell => cell.column.name === 'product_description'
    );

    if (productDescriptionCell) {
      await prisma.cell.update({
        where: { id: productDescriptionCell.id },
        data: { value: productDescription },
      });
      console.log("✅ Updated product_description to:", productDescription);
    }

    // Update the product_sku cell
    const productSkuCell = invoiceItem.cells.find(
      cell => cell.column.name === 'product_sku'
    );

    if (productSkuCell) {
      await prisma.cell.update({
        where: { id: productSkuCell.id },
        data: { value: productSku },
      });
      console.log("✅ Updated product_sku to:", productSku);
    }

    // Update the product_category cell
    const productCategoryCell = invoiceItem.cells.find(
      cell => cell.column.name === 'product_category'
    );

    if (productCategoryCell) {
      await prisma.cell.update({
        where: { id: productCategoryCell.id },
        data: { value: productCategory },
      });
      console.log("✅ Updated product_category to:", productCategory);
    }

    // Update the product_brand cell
    const productBrandCell = invoiceItem.cells.find(
      cell => cell.column.name === 'product_brand'
    );

    if (productBrandCell) {
      await prisma.cell.update({
        where: { id: productBrandCell.id },
        data: { value: productBrand },
      });
      console.log("✅ Updated product_brand to:", productBrand);
    }

    console.log("✅ Invoice item updated successfully!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInvoiceProducts();
