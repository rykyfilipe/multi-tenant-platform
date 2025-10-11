const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 Verifying created data...\n');

    const tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });

    // Verify Customers
    console.log('═══════════════════════════════════════');
    console.log('👥 CUSTOMERS VERIFICATION');
    console.log('═══════════════════════════════════════');

    const customersTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'customers'
      },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true
          },
          take: 5
        }
      }
    });

    console.log(`Total customers: ${await prisma.row.count({ where: { tableId: customersTable.id } })}`);
    console.log('\nSample customers:');

    customersTable.rows.forEach((row, index) => {
      const getName = () => {
        const nameCol = customersTable.columns.find(c => c.name === 'customer_name');
        const cell = row.cells.find(c => c.columnId === nameCol?.id);
        return cell?.stringValue || 'N/A';
      };

      const getEmail = () => {
        const emailCol = customersTable.columns.find(c => c.name === 'customer_email');
        const cell = row.cells.find(c => c.columnId === emailCol?.id);
        return cell?.stringValue || 'N/A';
      };

      console.log(`  ${index + 1}. ${getName()} - ${getEmail()}`);
    });

    // Verify Products
    console.log('\n═══════════════════════════════════════');
    console.log('📦 PRODUCTS VERIFICATION');
    console.log('═══════════════════════════════════════');

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
          take: 5
        }
      }
    });

    console.log(`Total products: ${await prisma.row.count({ where: { tableId: productsTable.id } })}`);
    console.log('\nSample products with unit_of_measure:');

    productsTable.rows.forEach((row, index) => {
      const getName = () => {
        const nameCol = productsTable.columns.find(c => c.name === 'name');
        const cell = row.cells.find(c => c.columnId === nameCol?.id);
        return cell?.stringValue || 'N/A';
      };

      const getUnitOfMeasure = () => {
        const unitCol = productsTable.columns.find(c => c.name === 'unit_of_measure');
        const cell = row.cells.find(c => c.columnId === unitCol?.id);
        return cell?.stringValue || 'NOT SET';
      };

      const getPrice = () => {
        const priceCol = productsTable.columns.find(c => c.name === 'price');
        const cell = row.cells.find(c => c.columnId === priceCol?.id);
        return cell?.numberValue || 0;
      };

      console.log(`  ${index + 1}. ${getName()} - ${getPrice()} - ${getUnitOfMeasure()}`);
    });

    // Verify Invoices with detailed calculations
    console.log('\n═══════════════════════════════════════');
    console.log('💼 INVOICES VERIFICATION');
    console.log('═══════════════════════════════════════');

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
          take: 3
        }
      }
    });

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
          }
        }
      }
    });

    console.log(`Total invoices: ${await prisma.row.count({ where: { tableId: invoicesTable.id } })}`);
    console.log(`Total invoice items: ${await prisma.row.count({ where: { tableId: invoiceItemsTable.id } })}`);
    console.log('\nDetailed invoice verification (first 3 invoices):\n');

    for (const invoice of invoicesTable.rows) {
      const getInvoiceValue = (columnName) => {
        const col = invoicesTable.columns.find(c => c.name === columnName);
        const cell = invoice.cells.find(c => c.columnId === col?.id);
        return cell?.stringValue || cell?.numberValue || 'N/A';
      };

      const invoiceNumber = getInvoiceValue('invoice_number');
      const totalAmount = parseFloat(getInvoiceValue('total_amount')) || 0;
      const subtotal = parseFloat(getInvoiceValue('subtotal')) || 0;
      const taxAmount = parseFloat(getInvoiceValue('tax_amount')) || 0;
      const discountAmount = parseFloat(getInvoiceValue('discount_amount')) || 0;
      const status = getInvoiceValue('status');

      console.log(`Invoice: ${invoiceNumber}`);
      console.log(`Status: ${status}`);
      console.log(`Subtotal: ${subtotal.toFixed(2)}`);
      console.log(`Discount: ${discountAmount.toFixed(2)}`);
      console.log(`Tax: ${taxAmount.toFixed(2)}`);
      console.log(`Total: ${totalAmount.toFixed(2)}`);

      // Verify calculation
      const calculatedTotal = subtotal + taxAmount;
      const isCorrect = Math.abs(calculatedTotal - totalAmount) < 0.01;
      console.log(`Calculation verification: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      if (!isCorrect) {
        console.log(`  Expected: ${calculatedTotal.toFixed(2)}, Got: ${totalAmount.toFixed(2)}`);
      }

      // Get items for this invoice
      const items = invoiceItemsTable.rows.filter(row => {
        const invoiceIdCol = invoiceItemsTable.columns.find(c => c.name === 'invoice_id');
        const cell = row.cells.find(c => c.columnId === invoiceIdCol?.id);
        return cell?.numberValue === invoice.id;
      });

      console.log(`Items (${items.length}):`);

      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      let calculatedDiscount = 0;

      items.forEach((item, idx) => {
        const getItemValue = (columnName) => {
          const col = invoiceItemsTable.columns.find(c => c.name === columnName);
          const cell = item.cells.find(c => c.columnId === col?.id);
          return cell?.stringValue || cell?.numberValue || 0;
        };

        const description = getItemValue('description');
        const quantity = parseFloat(getItemValue('quantity')) || 0;
        const unitPrice = parseFloat(getItemValue('unit_price')) || 0;
        const itemDiscountRate = parseFloat(getItemValue('discount_rate')) || 0;
        const itemDiscountAmount = parseFloat(getItemValue('discount_amount')) || 0;
        const itemTaxRate = parseFloat(getItemValue('tax_rate')) || 0;
        const itemTaxAmount = parseFloat(getItemValue('tax_amount')) || 0;
        const itemTotal = parseFloat(getItemValue('total_price')) || 0;
        const unitOfMeasure = getItemValue('unit_of_measure');

        // Calculate expected values
        const lineSubtotal = unitPrice * quantity;
        const expectedDiscount = (lineSubtotal * itemDiscountRate) / 100;
        const lineSubtotalAfterDiscount = lineSubtotal - expectedDiscount;
        const expectedTax = (lineSubtotalAfterDiscount * itemTaxRate) / 100;
        const expectedTotal = lineSubtotalAfterDiscount + expectedTax;

        calculatedSubtotal += lineSubtotalAfterDiscount;
        calculatedTax += expectedTax;
        calculatedDiscount += expectedDiscount;

        console.log(`  ${idx + 1}. ${description.substring(0, 30)}...`);
        console.log(`     Quantity: ${quantity} ${unitOfMeasure}, Unit Price: ${unitPrice.toFixed(2)}`);
        console.log(`     Discount: ${itemDiscountRate}% (${itemDiscountAmount.toFixed(2)})`);
        console.log(`     Tax: ${itemTaxRate}% (${itemTaxAmount.toFixed(2)})`);
        console.log(`     Total: ${itemTotal.toFixed(2)}`);

        // Verify item calculations
        const discountCorrect = Math.abs(expectedDiscount - itemDiscountAmount) < 0.01;
        const taxCorrect = Math.abs(expectedTax - itemTaxAmount) < 0.01;
        const totalCorrect = Math.abs(expectedTotal - itemTotal) < 0.01;

        if (!discountCorrect || !taxCorrect || !totalCorrect) {
          console.log(`     ⚠️  Calculation issues detected`);
          if (!discountCorrect) console.log(`        Discount: expected ${expectedDiscount.toFixed(2)}, got ${itemDiscountAmount.toFixed(2)}`);
          if (!taxCorrect) console.log(`        Tax: expected ${expectedTax.toFixed(2)}, got ${itemTaxAmount.toFixed(2)}`);
          if (!totalCorrect) console.log(`        Total: expected ${expectedTotal.toFixed(2)}, got ${itemTotal.toFixed(2)}`);
        }
      });

      // Verify invoice totals match sum of items
      console.log(`\nInvoice totals verification:`);
      console.log(`  Subtotal: ${subtotal.toFixed(2)} (calculated from items: ${calculatedSubtotal.toFixed(2)}) ${Math.abs(subtotal - calculatedSubtotal) < 0.01 ? '✅' : '❌'}`);
      console.log(`  Discount: ${discountAmount.toFixed(2)} (calculated from items: ${calculatedDiscount.toFixed(2)}) ${Math.abs(discountAmount - calculatedDiscount) < 0.01 ? '✅' : '❌'}`);
      console.log(`  Tax: ${taxAmount.toFixed(2)} (calculated from items: ${calculatedTax.toFixed(2)}) ${Math.abs(taxAmount - calculatedTax) < 0.01 ? '✅' : '❌'}`);
      console.log(`  Total: ${totalAmount.toFixed(2)} (calculated: ${(calculatedSubtotal + calculatedTax).toFixed(2)}) ${Math.abs(totalAmount - (calculatedSubtotal + calculatedTax)) < 0.01 ? '✅' : '❌'}`);

      console.log('\n' + '─'.repeat(60) + '\n');
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ Verification Complete!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();

