const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function finalVerification() {
  try {
    console.log('🔍 Final verification of all data...\n');

    const tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });

    // ==================== PRODUCTS VERIFICATION ====================
    console.log('═══════════════════════════════════════');
    console.log('📦 PRODUCTS VERIFICATION');
    console.log('═══════════════════════════════════════\n');

    const productsTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'Products'
      },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true
          },
          take: 3
        }
      }
    });

    console.log(`Total products: ${await prisma.row.count({ where: { tableId: productsTable.id } })}\n`);
    console.log('Sample products (first 3):\n');

    productsTable.rows.forEach((row, idx) => {
      console.log(`Product ${idx + 1} (Row ID: ${row.id}):`);
      
      const getCellValue = (columnName) => {
        const col = productsTable.columns.find(c => c.name === columnName);
        const cell = row.cells.find(c => c.columnId === col?.id);
        if (!cell) return 'NULL';
        return cell.stringValue || cell.numberValue || cell.dateValue || 'NULL';
      };

      console.log(`  Name: ${getCellValue('name')}`);
      console.log(`  SKU: ${getCellValue('sku')}`);
      console.log(`  Price: ${getCellValue('price')}`);
      console.log(`  Category: ${getCellValue('category')}`);
      console.log(`  VAT: ${getCellValue('vat')}%`);
      console.log(`  Brand: ${getCellValue('brand')}`);
      console.log(`  Unit: ${getCellValue('unit_of_measure')}`);
      console.log(`  Description: ${getCellValue('description').substring(0, 50)}...`);
      console.log('');
    });

    // ==================== CUSTOMERS VERIFICATION ====================
    console.log('═══════════════════════════════════════');
    console.log('👥 CUSTOMERS VERIFICATION');
    console.log('═══════════════════════════════════════\n');

    const customersTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'customers'
      }
    });

    const totalCustomers = await prisma.row.count({ where: { tableId: customersTable.id } });
    console.log(`Total customers: ${totalCustomers}\n`);

    // ==================== INVOICES VERIFICATION ====================
    console.log('═══════════════════════════════════════');
    console.log('💼 INVOICES VERIFICATION');
    console.log('═══════════════════════════════════════\n');

    const invoicesTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'invoices'
      },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true
          },
          orderBy: {
            id: 'desc'
          },
          take: 2
        }
      }
    });

    const totalInvoices = await prisma.row.count({ where: { tableId: invoicesTable.id } });
    console.log(`Total invoices: ${totalInvoices}\n`);
    console.log('Sample invoices (last 2):\n');

    for (const invoice of invoicesTable.rows) {
      console.log(`Invoice Row ID: ${invoice.id}`);
      
      const getCellValue = (columnName) => {
        const col = invoicesTable.columns.find(c => c.name === columnName);
        const cell = invoice.cells.find(c => c.columnId === col?.id);
        if (!cell) return 'NULL';
        return cell.stringValue || cell.numberValue || cell.dateValue || 'NULL';
      };

      console.log(`  Number: ${getCellValue('invoice_number')}`);
      console.log(`  Date: ${getCellValue('date')}`);
      console.log(`  Due Date: ${getCellValue('due_date')}`);
      console.log(`  Customer ID: ${getCellValue('customer_id')}`);
      console.log(`  Status: ${getCellValue('status')}`);
      console.log(`  Payment Method: ${getCellValue('payment_method')}`);
      console.log(`  Payment Terms: ${getCellValue('payment_terms')}`);
      console.log(`  Currency: ${getCellValue('base_currency')}`);
      console.log(`  Subtotal: ${getCellValue('subtotal')}`);
      console.log(`  Tax Total: ${getCellValue('tax_total')}`);
      console.log(`  Discount: ${getCellValue('discount_amount')}`);
      console.log(`  Total: ${getCellValue('total_amount')}`);
      console.log(`  Series: ${getCellValue('invoice_series')}`);
      console.log(`  Notes: ${getCellValue('notes')}`);

      // Count cells
      const emptyColumns = invoicesTable.columns.filter(col => {
        const cell = invoice.cells.find(c => c.columnId === col.id);
        return !cell;
      });

      console.log(`  Empty columns: ${emptyColumns.length}/${invoicesTable.columns.length}`);
      if (emptyColumns.length > 0) {
        console.log(`  Missing: ${emptyColumns.map(c => c.name).join(', ')}`);
      }
      console.log('');
    }

    // ==================== INVOICE ITEMS VERIFICATION ====================
    console.log('═══════════════════════════════════════');
    console.log('📋 INVOICE ITEMS VERIFICATION');
    console.log('═══════════════════════════════════════\n');

    const invoiceItemsTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'invoice_items'
      },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true
          },
          orderBy: {
            id: 'desc'
          },
          take: 3
        }
      }
    });

    const totalItems = await prisma.row.count({ where: { tableId: invoiceItemsTable.id } });
    console.log(`Total invoice items: ${totalItems}\n`);
    console.log('Sample invoice items (last 3):\n');

    for (const item of invoiceItemsTable.rows) {
      console.log(`Item Row ID: ${item.id}`);
      
      const getCellValue = (columnName) => {
        const col = invoiceItemsTable.columns.find(c => c.name === columnName);
        const cell = item.cells.find(c => c.columnId === col?.id);
        if (!cell) return 'NULL';
        return cell.stringValue || cell.numberValue || cell.dateValue || 'NULL';
      };

      console.log(`  Invoice ID: ${getCellValue('invoice_id')}`);
      console.log(`  Product Ref Table: ${getCellValue('product_ref_table')}`);
      console.log(`  Product Ref ID: ${getCellValue('product_ref_id')}`);
      console.log(`  Product Name: ${getCellValue('product_name')}`);
      console.log(`  Product SKU: ${getCellValue('product_sku')}`);
      console.log(`  Product Brand: ${getCellValue('product_brand')}`);
      console.log(`  Product Category: ${getCellValue('product_category')}`);
      console.log(`  Description: ${getCellValue('description').toString().substring(0, 50)}...`);
      console.log(`  Quantity: ${getCellValue('quantity')}`);
      console.log(`  Unit: ${getCellValue('unit_of_measure')}`);
      console.log(`  Unit Price: ${getCellValue('unit_price')}`);
      console.log(`  Currency: ${getCellValue('currency')}`);
      console.log(`  Discount Rate: ${getCellValue('discount_rate')}%`);
      console.log(`  Discount Amount: ${getCellValue('discount_amount')}`);
      console.log(`  Tax Rate: ${getCellValue('tax_rate')}%`);
      console.log(`  Tax Amount: ${getCellValue('tax_amount')}`);
      console.log(`  Total Price: ${getCellValue('total_price')}`);
      console.log(`  Product VAT: ${getCellValue('product_vat')}%`);

      // Count cells
      const emptyColumns = invoiceItemsTable.columns.filter(col => {
        const cell = item.cells.find(c => c.columnId === col.id);
        return !cell;
      });

      console.log(`  Empty columns: ${emptyColumns.length}/${invoiceItemsTable.columns.length}`);
      if (emptyColumns.length > 0) {
        console.log(`  Missing: ${emptyColumns.map(c => c.name).join(', ')}`);
      }
      console.log('');
    }

    // ==================== CALCULATIONS VERIFICATION ====================
    console.log('═══════════════════════════════════════');
    console.log('🧮 CALCULATIONS VERIFICATION');
    console.log('═══════════════════════════════════════\n');

    // Get one complete invoice with its items
    const testInvoice = await prisma.row.findFirst({
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

    if (testInvoice) {
      const getInvoiceValue = (columnName) => {
        const col = invoicesTable.columns.find(c => c.name === columnName);
        const cell = testInvoice.cells.find(c => c.columnId === col?.id);
        if (!cell) return null;
        if (cell.numberValue !== null) return parseFloat(cell.numberValue);
        return cell.stringValue;
      };

      const invoiceNumber = getInvoiceValue('invoice_number');
      const invoiceSubtotal = getInvoiceValue('subtotal') || 0;
      const invoiceTax = getInvoiceValue('tax_total') || 0;
      const invoiceDiscount = getInvoiceValue('discount_amount') || 0;
      const invoiceTotal = getInvoiceValue('total_amount') || 0;

      console.log(`Testing invoice: ${invoiceNumber}`);
      console.log(`Invoice totals: Subtotal=${invoiceSubtotal}, Tax=${invoiceTax}, Discount=${invoiceDiscount}, Total=${invoiceTotal}\n`);

      // Get all items for this invoice
      const invoiceIdCol = invoiceItemsTable.columns.find(c => c.name === 'invoice_id');
      const itemsForThisInvoice = await prisma.row.findMany({
        where: {
          tableId: invoiceItemsTable.id,
          cells: {
            some: {
              columnId: invoiceIdCol?.id,
              numberValue: testInvoice.id
            }
          }
        },
        include: {
          cells: true
        }
      });

      console.log(`Found ${itemsForThisInvoice.length} items for this invoice\n`);

      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      let calculatedDiscount = 0;

      itemsForThisInvoice.forEach((item, idx) => {
        const getItemValue = (columnName) => {
          const col = invoiceItemsTable.columns.find(c => c.name === columnName);
          const cell = item.cells.find(c => c.columnId === col?.id);
          if (!cell) return 0;
          if (cell.numberValue !== null) return parseFloat(cell.numberValue);
          return cell.stringValue;
        };

        const quantity = getItemValue('quantity') || 0;
        const unitPrice = getItemValue('unit_price') || 0;
        const discountRate = getItemValue('discount_rate') || 0;
        const discountAmount = getItemValue('discount_amount') || 0;
        const taxAmount = getItemValue('tax_amount') || 0;
        const totalPrice = getItemValue('total_price') || 0;
        const productName = getItemValue('product_name');

        // Calculate expected
        const lineSubtotal = unitPrice * quantity;
        const lineSubtotalAfterDiscount = lineSubtotal - discountAmount;

        calculatedSubtotal += lineSubtotalAfterDiscount;
        calculatedTax += taxAmount;
        calculatedDiscount += discountAmount;

        console.log(`  Item ${idx + 1}: ${productName}`);
        console.log(`    ${quantity} × ${unitPrice.toFixed(2)} = ${lineSubtotal.toFixed(2)}`);
        console.log(`    Discount: ${discountRate}% (${discountAmount.toFixed(2)})`);
        console.log(`    After discount: ${lineSubtotalAfterDiscount.toFixed(2)}`);
        console.log(`    Tax: ${taxAmount.toFixed(2)}`);
        console.log(`    Total: ${totalPrice.toFixed(2)}`);
      });

      const calculatedTotal = calculatedSubtotal + calculatedTax;

      console.log(`\n📊 Verification Results:`);
      console.log(`  Subtotal: Invoice=${invoiceSubtotal.toFixed(2)}, Calculated=${calculatedSubtotal.toFixed(2)} ${Math.abs(invoiceSubtotal - calculatedSubtotal) < 0.01 ? '✅' : '❌'}`);
      console.log(`  Discount: Invoice=${invoiceDiscount.toFixed(2)}, Calculated=${calculatedDiscount.toFixed(2)} ${Math.abs(invoiceDiscount - calculatedDiscount) < 0.01 ? '✅' : '❌'}`);
      console.log(`  Tax: Invoice=${invoiceTax.toFixed(2)}, Calculated=${calculatedTax.toFixed(2)} ${Math.abs(invoiceTax - calculatedTax) < 0.01 ? '✅' : '❌'}`);
      console.log(`  Total: Invoice=${invoiceTotal.toFixed(2)}, Calculated=${calculatedTotal.toFixed(2)} ${Math.abs(invoiceTotal - calculatedTotal) < 0.01 ? '✅' : '❌'}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ FINAL VERIFICATION COMPLETE!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();

