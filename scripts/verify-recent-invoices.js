const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function verifyRecentInvoices() {
  try {
    console.log('🔍 Verifying recently created invoices...\n');

    const tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });

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
          take: 5 // Get last 5 invoices
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

    console.log('═══════════════════════════════════════');
    console.log('💼 LAST 5 INVOICES VERIFICATION');
    console.log('═══════════════════════════════════════\n');

    for (const invoice of invoicesTable.rows) {
      const getInvoiceValue = (columnName) => {
        const col = invoicesTable.columns.find(c => c.name === columnName);
        const cell = invoice.cells.find(c => c.columnId === col?.id);
        if (cell?.numberValue !== null && cell?.numberValue !== undefined) {
          return parseFloat(cell.numberValue);
        }
        return cell?.stringValue || 'N/A';
      };

      const invoiceNumber = getInvoiceValue('invoice_number');
      const totalAmount = getInvoiceValue('total_amount');
      const subtotal = getInvoiceValue('subtotal');
      const taxAmount = getInvoiceValue('tax_amount');
      const discountAmount = getInvoiceValue('discount_amount');
      const status = getInvoiceValue('status');
      const currency = getInvoiceValue('base_currency');
      const paymentMethod = getInvoiceValue('payment_method');

      console.log(`📄 Invoice: ${invoiceNumber}`);
      console.log(`   Status: ${status} | Currency: ${currency} | Payment: ${paymentMethod}`);
      console.log(`   Subtotal: ${typeof subtotal === 'number' ? subtotal.toFixed(2) : subtotal} ${currency}`);
      console.log(`   Discount: ${typeof discountAmount === 'number' ? discountAmount.toFixed(2) : discountAmount} ${currency}`);
      console.log(`   Tax: ${typeof taxAmount === 'number' ? taxAmount.toFixed(2) : taxAmount} ${currency}`);
      console.log(`   Total: ${typeof totalAmount === 'number' ? totalAmount.toFixed(2) : totalAmount} ${currency}`);

      // Get items for this invoice
      const items = invoiceItemsTable.rows.filter(row => {
        const invoiceIdCol = invoiceItemsTable.columns.find(c => c.name === 'invoice_id');
        const cell = row.cells.find(c => c.columnId === invoiceIdCol?.id);
        return cell?.numberValue === invoice.id;
      });

      console.log(`   Items: ${items.length}`);

      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      let calculatedDiscount = 0;

      items.forEach((item, idx) => {
        const getItemValue = (columnName) => {
          const col = invoiceItemsTable.columns.find(c => c.name === columnName);
          const cell = item.cells.find(c => c.columnId === col?.id);
          if (cell?.numberValue !== null && cell?.numberValue !== undefined) {
            return parseFloat(cell.numberValue);
          }
          return cell?.stringValue || 0;
        };

        const description = getItemValue('description');
        const quantity = getItemValue('quantity');
        const unitPrice = getItemValue('unit_price');
        const itemDiscountRate = getItemValue('discount_rate');
        const itemDiscountAmount = getItemValue('discount_amount');
        const itemTaxRate = getItemValue('tax_rate');
        const itemTaxAmount = getItemValue('tax_amount');
        const itemTotal = getItemValue('total_price');
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

        const desc = typeof description === 'string' ? description.substring(0, 40) : description;
        console.log(`     ${idx + 1}. ${desc}... (${quantity} ${unitOfMeasure} × ${unitPrice.toFixed(2)} ${currency})`);
        
        // Verify item calculations
        const discountCorrect = Math.abs(expectedDiscount - itemDiscountAmount) < 0.01;
        const taxCorrect = Math.abs(expectedTax - itemTaxAmount) < 0.01;
        const totalCorrect = Math.abs(expectedTotal - itemTotal) < 0.01;

        if (discountCorrect && taxCorrect && totalCorrect) {
          console.log(`        ✅ Calculations correct (Disc: ${itemDiscountRate}%, Tax: ${itemTaxRate}%, Total: ${itemTotal.toFixed(2)})`);
        } else {
          console.log(`        ❌ Calculation issues:`);
          if (!discountCorrect) console.log(`           Discount: expected ${expectedDiscount.toFixed(2)}, got ${itemDiscountAmount.toFixed(2)}`);
          if (!taxCorrect) console.log(`           Tax: expected ${expectedTax.toFixed(2)}, got ${itemTaxAmount.toFixed(2)}`);
          if (!totalCorrect) console.log(`           Total: expected ${expectedTotal.toFixed(2)}, got ${itemTotal.toFixed(2)}`);
        }
      });

      // Verify invoice totals
      if (items.length > 0 && typeof subtotal === 'number' && typeof totalAmount === 'number') {
        const subtotalCorrect = Math.abs(subtotal - calculatedSubtotal) < 0.01;
        const discountCorrect = Math.abs(discountAmount - calculatedDiscount) < 0.01;
        const taxCorrect = Math.abs(taxAmount - calculatedTax) < 0.01;
        const totalCorrect = Math.abs(totalAmount - (calculatedSubtotal + calculatedTax)) < 0.01;

        console.log(`\n   📊 Invoice Totals Verification:`);
        console.log(`      Subtotal: ${subtotalCorrect ? '✅' : '❌'} ${subtotal.toFixed(2)} (expected: ${calculatedSubtotal.toFixed(2)})`);
        console.log(`      Discount: ${discountCorrect ? '✅' : '❌'} ${discountAmount.toFixed(2)} (expected: ${calculatedDiscount.toFixed(2)})`);
        console.log(`      Tax: ${taxCorrect ? '✅' : '❌'} ${taxAmount.toFixed(2)} (expected: ${calculatedTax.toFixed(2)})`);
        console.log(`      Total: ${totalCorrect ? '✅' : '❌'} ${totalAmount.toFixed(2)} (expected: ${(calculatedSubtotal + calculatedTax).toFixed(2)})`);

        if (subtotalCorrect && discountCorrect && taxCorrect && totalCorrect) {
          console.log(`\n   🎉 All calculations are CORRECT!`);
        } else {
          console.log(`\n   ⚠️  Some calculations have issues!`);
        }
      }

      console.log('\n' + '═'.repeat(60) + '\n');
    }

    // Overall statistics
    const totalInvoices = await prisma.row.count({ where: { tableId: invoicesTable.id } });
    const totalItems = await prisma.row.count({ where: { tableId: invoiceItemsTable.id } });

    console.log('📊 OVERALL STATISTICS');
    console.log('═══════════════════════════════════════');
    console.log(`Total Invoices: ${totalInvoices}`);
    console.log(`Total Invoice Items: ${totalItems}`);
    console.log(`Average Items per Invoice: ${(totalItems / totalInvoices).toFixed(2)}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRecentInvoices();

