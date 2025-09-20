const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Sample data for generating realistic invoices
const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'PayPal', 'Check'];
const paymentTerms = ['Net 30', 'Net 15', 'Due on Receipt', 'Net 45', 'Net 60'];
const currencies = ['RON', 'EUR', 'USD', 'GBP'];
const statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
const invoiceSeries = ['INV', 'FACT', 'BILL'];

async function generateInvoices() {
  try {
    console.log('🚀 Starting invoice generation...\n');

    // Get tenant and database info
    const tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    if (!tenant) {
      throw new Error('Tenant with ID 1 not found');
    }

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });

    if (!database) {
      throw new Error('Database not found for tenant');
    }

    // Get existing tables
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

    const invoicesTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'invoices'
      },
      include: {
        columns: true
      }
    });

    const invoiceItemsTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'invoice_items'
      },
      include: {
        columns: true
      }
    });

    if (!productsTable || !customersTable || !invoicesTable || !invoiceItemsTable) {
      throw new Error('Required tables not found');
    }

    console.log(`📊 Found ${productsTable.rows.length} products and ${customersTable.rows.length} customers`);
    console.log(`📋 Invoice tables ready: invoices (${invoicesTable.columns.length} cols), invoice_items (${invoiceItemsTable.columns.length} cols)\n`);

    // Helper function to get cell value by column name
    function getCellValue(row, columnName) {
      const column = productsTable.columns.find(c => c.name === columnName);
      if (!column) return null;
      
      const cell = row.cells.find(c => c.columnId === column.id);
      if (!cell) return null;
      
      return cell.stringValue || cell.numberValue || cell.dateValue || cell.booleanValue;
    }

    function getCustomerCellValue(row, columnName) {
      const column = customersTable.columns.find(c => c.name === columnName);
      if (!column) return null;
      
      const cell = row.cells.find(c => c.columnId === column.id);
      if (!cell) return null;
      
      return cell.stringValue || cell.numberValue || cell.dateValue || cell.booleanValue;
    }

    // Generate 100 invoices
    const invoicesToCreate = 100;
    let invoiceCount = 0;
    let itemCount = 0;

    console.log(`🔄 Generating ${invoicesToCreate} invoices...`);

    for (let i = 0; i < invoicesToCreate; i++) {
      // Select random customer
      const randomCustomer = customersTable.rows[Math.floor(Math.random() * customersTable.rows.length)];
      const customerName = getCustomerCellValue(randomCustomer, 'customer_name');
      const customerEmail = getCustomerCellValue(randomCustomer, 'customer_email');
      const customerAddress = getCustomerCellValue(randomCustomer, 'customer_address');

      // Generate invoice data
      const invoiceNumber = `INV-2025-${String(i + 1).padStart(6, '0')}`;
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 90)); // Random date within last 90 days
      
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from issue date

      const baseCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const paymentTerm = paymentTerms[Math.floor(Math.random() * paymentTerms.length)];

      // Create invoice row
      const invoiceRow = await prisma.row.create({
        data: {
          tableId: invoicesTable.id,
        }
      });

      // Create invoice cells
      const invoiceColumns = [
        { name: 'invoice_number', value: invoiceNumber },
        { name: 'customer_id', value: randomCustomer.id },
        { name: 'customer_name', value: customerName },
        { name: 'customer_email', value: customerEmail },
        { name: 'customer_address', value: customerAddress },
        { name: 'issue_date', value: issueDate.toISOString().split('T')[0] },
        { name: 'due_date', value: dueDate.toISOString().split('T')[0] },
        { name: 'base_currency', value: baseCurrency },
        { name: 'status', value: status },
        { name: 'payment_method', value: paymentMethod },
        { name: 'payment_terms', value: paymentTerm },
        { name: 'notes', value: `Invoice ${invoiceNumber} - Generated for testing` },
        { name: 'subtotal', value: 0 }, // Will be calculated
        { name: 'tax_amount', value: 0 }, // Will be calculated
        { name: 'total_amount', value: 0 }, // Will be calculated
        { name: 'created_at', value: new Date().toISOString() }
      ];

      for (const colData of invoiceColumns) {
        const column = invoicesTable.columns.find(c => c.name === colData.name);
        if (column) {
          await prisma.cell.create({
            data: {
              rowId: invoiceRow.id,
              columnId: column.id,
              value: colData.value,
              stringValue: typeof colData.value === 'string' ? colData.value : null,
              numberValue: typeof colData.value === 'number' ? colData.value : null,
              dateValue: colData.name.includes('date') ? new Date(colData.value) : null,
              booleanValue: typeof colData.value === 'boolean' ? colData.value : null
            }
          });
        }
      }

      // Generate 1-5 random products for this invoice
      const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items per invoice
      let subtotal = 0;
      let taxAmount = 0;

      for (let j = 0; j < numItems; j++) {
        // Select random product
        const randomProduct = productsTable.rows[Math.floor(Math.random() * productsTable.rows.length)];
        const productName = getCellValue(randomProduct, 'name');
        const productPrice = parseFloat(getCellValue(randomProduct, 'price')) || 0;
        const productVat = parseFloat(getCellValue(randomProduct, 'vat')) || 19; // Default 19% VAT
        const productCurrency = getCellValue(randomProduct, 'currency') || baseCurrency;
        const productSku = getCellValue(randomProduct, 'sku') || `SKU-${randomProduct.id}`;
        const productDescription = getCellValue(randomProduct, 'description') || productName;

        // Random quantity between 1-10
        const quantity = Math.floor(Math.random() * 10) + 1;
        
        // Calculate prices
        const originalPrice = productPrice;
        const convertedPrice = originalPrice; // For now, no conversion
        const lineTotal = convertedPrice * quantity;
        const lineTax = (lineTotal * productVat) / 100;
        const lineTotalWithTax = lineTotal + lineTax;

        subtotal += lineTotal;
        taxAmount += lineTax;

        // Create invoice item row
        const itemRow = await prisma.row.create({
          data: {
            tableId: invoiceItemsTable.id,
          }
        });

        // Create invoice item cells
        const itemColumns = [
          { name: 'invoice_id', value: invoiceRow.id },
          { name: 'product_ref_table', value: 'Products' },
          { name: 'product_ref_id', value: randomProduct.id },
          { name: 'product_name', value: productName },
          { name: 'product_sku', value: productSku },
          { name: 'product_description', value: productDescription },
          { name: 'quantity', value: quantity },
          { name: 'unit_of_measure', value: getCellValue(randomProduct, 'unit_of_measure') || 'pcs' },
          { name: 'currency', value: productCurrency },
          { name: 'original_price', value: originalPrice },
          { name: 'converted_price', value: convertedPrice },
          { name: 'vat_rate', value: productVat },
          { name: 'line_total', value: lineTotal },
          { name: 'line_tax', value: lineTax },
          { name: 'line_total_with_tax', value: lineTotalWithTax }
        ];

        for (const colData of itemColumns) {
          const column = invoiceItemsTable.columns.find(c => c.name === colData.name);
          if (column) {
            await prisma.cell.create({
              data: {
                rowId: itemRow.id,
                columnId: column.id,
                value: colData.value,
                stringValue: typeof colData.value === 'string' ? colData.value : null,
                numberValue: typeof colData.value === 'number' ? colData.value : null,
                dateValue: colData.name.includes('date') ? new Date(colData.value) : null,
                booleanValue: typeof colData.value === 'boolean' ? colData.value : null
              }
            });
          }
        }

        itemCount++;
      }

      // Update invoice totals
      const totalAmount = subtotal + taxAmount;

      // Update subtotal
      const subtotalColumn = invoicesTable.columns.find(c => c.name === 'subtotal');
      if (subtotalColumn) {
        await prisma.cell.updateMany({
          where: {
            rowId: invoiceRow.id,
            columnId: subtotalColumn.id
          },
          data: {
            value: subtotal,
            numberValue: subtotal
          }
        });
      }

      // Update tax amount
      const taxColumn = invoicesTable.columns.find(c => c.name === 'tax_amount');
      if (taxColumn) {
        await prisma.cell.updateMany({
          where: {
            rowId: invoiceRow.id,
            columnId: taxColumn.id
          },
          data: {
            value: taxAmount,
            numberValue: taxAmount
          }
        });
      }

      // Update total amount
      const totalColumn = invoicesTable.columns.find(c => c.name === 'total_amount');
      if (totalColumn) {
        await prisma.cell.updateMany({
          where: {
            rowId: invoiceRow.id,
            columnId: totalColumn.id
          },
          data: {
            value: totalAmount,
            numberValue: totalAmount
          }
        });
      }

      invoiceCount++;
      
      if (invoiceCount % 10 === 0) {
        console.log(`   ✅ Generated ${invoiceCount} invoices...`);
      }
    }

    console.log(`\n🎉 Successfully generated ${invoiceCount} invoices with ${itemCount} invoice items!`);
    console.log(`📊 Summary:`);
    console.log(`   - Invoices: ${invoiceCount}`);
    console.log(`   - Invoice Items: ${itemCount}`);
    console.log(`   - Average items per invoice: ${(itemCount / invoiceCount).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error generating invoices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateInvoices();
