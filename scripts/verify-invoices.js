const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function verifyInvoices() {
  try {
    console.log('🔍 Verifying generated invoices...\n');

    // Get database and tables
    const database = await prisma.database.findFirst({
      where: { tenantId: 1 }
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
          }
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
          }
        }
      }
    });

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
          }
        }
      }
    });

    console.log(`📊 Database Summary:`);
    console.log(`   - Products: ${productsTable.rows.length} rows`);
    console.log(`   - Customers: ${customersTable.rows.length} rows`);
    console.log(`   - Invoices: ${invoicesTable.rows.length} rows`);
    console.log(`   - Invoice Items: ${invoiceItemsTable.rows.length} rows\n`);

    // Helper functions
    function getCellValue(row, columnName, table) {
      const column = table.columns.find(c => c.name === columnName);
      if (!column) return null;
      
      const cell = row.cells.find(c => c.columnId === column.id);
      if (!cell) return null;
      
      return cell.stringValue || cell.numberValue || cell.dateValue || cell.booleanValue;
    }

    // Show sample invoices
    console.log('📋 Sample Invoices:');
    const sampleInvoices = invoicesTable.rows.slice(0, 3);
    
    for (let i = 0; i < sampleInvoices.length; i++) {
      const invoice = sampleInvoices[i];
      console.log(`\n   Invoice ${i + 1}:`);
      console.log(`     Number: ${getCellValue(invoice, 'invoice_number', invoicesTable)}`);
      console.log(`     Customer: ${getCellValue(invoice, 'customer_name', invoicesTable)}`);
      console.log(`     Status: ${getCellValue(invoice, 'status', invoicesTable)}`);
      console.log(`     Currency: ${getCellValue(invoice, 'base_currency', invoicesTable)}`);
      console.log(`     Issue Date: ${getCellValue(invoice, 'issue_date', invoicesTable)}`);
      console.log(`     Due Date: ${getCellValue(invoice, 'due_date', invoicesTable)}`);
      console.log(`     Subtotal: ${getCellValue(invoice, 'subtotal', invoicesTable)}`);
      console.log(`     Tax: ${getCellValue(invoice, 'tax_amount', invoicesTable)}`);
      console.log(`     Total: ${getCellValue(invoice, 'total_amount', invoicesTable)}`);

      // Show invoice items for this invoice
      const invoiceId = invoice.id;
      const items = invoiceItemsTable.rows.filter(item => 
        getCellValue(item, 'invoice_id', invoiceItemsTable) === invoiceId
      );

      console.log(`     Items (${items.length}):`);
      for (const item of items) {
        console.log(`       - ${getCellValue(item, 'product_name', invoiceItemsTable)} (${getCellValue(item, 'quantity', invoiceItemsTable)}x) - ${getCellValue(item, 'line_total_with_tax', invoiceItemsTable)} ${getCellValue(item, 'currency', invoiceItemsTable)}`);
      }
    }

    // Statistics
    console.log('\n📈 Statistics:');
    
    // Status distribution
    const statusCounts = {};
    invoicesTable.rows.forEach(invoice => {
      const status = getCellValue(invoice, 'status', invoicesTable);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('   Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     ${status}: ${count} invoices`);
    });

    // Currency distribution
    const currencyCounts = {};
    invoicesTable.rows.forEach(invoice => {
      const currency = getCellValue(invoice, 'base_currency', invoicesTable);
      currencyCounts[currency] = (currencyCounts[currency] || 0) + 1;
    });
    
    console.log('\n   Currency Distribution:');
    Object.entries(currencyCounts).forEach(([currency, count]) => {
      console.log(`     ${currency}: ${count} invoices`);
    });

    // Items per invoice distribution
    const itemsPerInvoice = {};
    invoicesTable.rows.forEach(invoice => {
      const invoiceId = invoice.id;
      const itemCount = invoiceItemsTable.rows.filter(item => 
        getCellValue(item, 'invoice_id', invoiceItemsTable) === invoiceId
      ).length;
      itemsPerInvoice[itemCount] = (itemsPerInvoice[itemCount] || 0) + 1;
    });
    
    console.log('\n   Items per Invoice:');
    Object.entries(itemsPerInvoice).forEach(([count, invoices]) => {
      console.log(`     ${count} items: ${invoices} invoices`);
    });

    // Total amounts
    let totalInvoices = 0;
    let totalAmount = 0;
    let totalTax = 0;
    
    invoicesTable.rows.forEach(invoice => {
      const amount = parseFloat(getCellValue(invoice, 'total_amount', invoicesTable)) || 0;
      const tax = parseFloat(getCellValue(invoice, 'tax_amount', invoicesTable)) || 0;
      totalInvoices++;
      totalAmount += amount;
      totalTax += tax;
    });

    console.log('\n   Financial Summary:');
    console.log(`     Total Invoices: ${totalInvoices}`);
    console.log(`     Total Amount: ${totalAmount.toFixed(2)}`);
    console.log(`     Total Tax: ${totalTax.toFixed(2)}`);
    console.log(`     Average Invoice: ${(totalAmount / totalInvoices).toFixed(2)}`);

    console.log('\n✅ Invoice verification completed successfully!');

  } catch (error) {
    console.error('❌ Error verifying invoices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyInvoices();
