const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Sample data for generating realistic invoices
const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'PayPal', 'Check'];
const paymentTerms = ['Net 30', 'Net 15', 'Due on Receipt', 'Net 45', 'Net 60'];
const currencies = ['RON', 'EUR', 'USD', 'GBP'];
const statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

async function generateCompleteInvoices() {
  try {
    console.log('🚀 Starting complete invoice generation...\n');

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

    // Get existing tables with all necessary data
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
    function getCellValue(row, columnName, table) {
      const column = table.columns.find(c => c.name === columnName);
      if (!column) {
        return null;
      }
      
      const cell = row.cells.find(c => c.columnId === column.id);
      if (!cell) {
        return null;
      }
      
      // The value is stored in cell.value (JSON field)
      return cell.value;
    }

    // Generate 100 invoices
    const invoicesToCreate = 100;
    let invoiceCount = 0;
    let itemCount = 0;

    console.log(`🔄 Generating ${invoicesToCreate} complete invoices...`);

    for (let i = 0; i < invoicesToCreate; i++) {
      // Select random customer
      const randomCustomer = customersTable.rows[Math.floor(Math.random() * customersTable.rows.length)];
      const customerName = getCellValue(randomCustomer, 'customer_name', customersTable);
      const customerEmail = getCellValue(randomCustomer, 'customer_email', customersTable);
      const customerAddress = getCellValue(randomCustomer, 'customer_address', customersTable);

      // Generate invoice data
      const invoiceNumber = `INV-2025-${String(i + 1).padStart(6, '0')}`;
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 90)); // Random date within last 90 days
      
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from issue date

      const baseCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Create invoice row
      const invoiceRow = await prisma.row.create({
        data: {
          tableId: invoicesTable.id,
        }
      });

      // Generate 1-5 random products for this invoice
      const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items per invoice
      let totalAmount = 0;
      const invoiceItems = [];

      // First, create all invoice items and calculate totals
      for (let j = 0; j < numItems; j++) {
        // Select random product
        const randomProduct = productsTable.rows[Math.floor(Math.random() * productsTable.rows.length)];
        
        // Extract product details manually
        const productDetails = {
          name: getCellValue(randomProduct, 'name', productsTable),
          description: getCellValue(randomProduct, 'description', productsTable),
          price: parseFloat(getCellValue(randomProduct, 'price', productsTable)) || 0,
          vat: parseFloat(getCellValue(randomProduct, 'vat', productsTable)) || 19,
          currency: getCellValue(randomProduct, 'currency', productsTable) || baseCurrency,
          sku: getCellValue(randomProduct, 'sku', productsTable) || `SKU-${randomProduct.id}`,
          unitOfMeasure: getCellValue(randomProduct, 'unit_of_measure', productsTable) || 'pcs'
        };


        const productName = productDetails.name || 'Unknown Product';
        const productDescription = productDetails.description || productName;
        const productPrice = productDetails.price;
        const productVat = productDetails.vat;
        const productCurrency = productDetails.currency;
        const productSku = productDetails.sku;
        const unitOfMeasure = productDetails.unitOfMeasure;

        // Random quantity between 1-10
        const quantity = Math.floor(Math.random() * 10) + 1;
        
        // Calculate prices
        const unitPrice = productPrice;
        const lineTotal = unitPrice * quantity;
        const lineTax = (lineTotal * productVat) / 100;
        const lineTotalWithTax = lineTotal + lineTax;

        totalAmount += lineTotalWithTax;

        // Store item for later creation
        invoiceItems.push({
          productName,
          productDescription,
          productSku,
          quantity,
          unitPrice,
          lineTotal,
          lineTax,
          lineTotalWithTax,
          unitOfMeasure,
          currency: productCurrency
        });
      }

      // Create invoice cells with calculated total
      const invoiceColumns = [
        { name: 'invoice_number', value: invoiceNumber },
        { name: 'date', value: issueDate.toISOString().split('T')[0] },
        { name: 'due_date', value: dueDate.toISOString().split('T')[0] },
        { name: 'customer_id', value: randomCustomer.id },
        { name: 'total_amount', value: totalAmount },
        { name: 'status', value: status }
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

      // Now create all invoice items
      for (const item of invoiceItems) {
        // Create invoice item row
        const itemRow = await prisma.row.create({
          data: {
            tableId: invoiceItemsTable.id,
          }
        });

        // Create invoice item cells with correct column names
        const itemColumns = [
          { name: 'invoice_id', value: invoiceRow.id },
          { name: 'description', value: `${item.productName} - ${item.productDescription}` },
          { name: 'quantity', value: item.quantity },
          { name: 'unit_price', value: item.unitPrice },
          { name: 'total_price', value: item.lineTotalWithTax }
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

      invoiceCount++;
      
      if (invoiceCount % 10 === 0) {
        console.log(`   ✅ Generated ${invoiceCount} invoices...`);
      }
    }

    console.log(`\n🎉 Successfully generated ${invoiceCount} complete invoices with ${itemCount} invoice items!`);
    console.log(`📊 Summary:`);
    console.log(`   - Invoices: ${invoiceCount}`);
    console.log(`   - Invoice Items: ${itemCount}`);
    console.log(`   - Average items per invoice: ${(itemCount / invoiceCount).toFixed(2)}`);

    // Verify the generated data
    console.log('\n🔍 Verifying generated data...');
    
    const sampleInvoice = await prisma.row.findFirst({
      where: { tableId: invoicesTable.id },
      include: {
        cells: {
          include: {
            column: true
          }
        }
      }
    });

    if (sampleInvoice) {
      console.log('📋 Sample Invoice:');
      sampleInvoice.cells.forEach(cell => {
        console.log(`   ${cell.column.name}: ${cell.value}`);
      });

      // Check invoice items for this invoice
      const sampleItems = await prisma.row.findMany({
        where: { 
          tableId: invoiceItemsTable.id
        },
        include: {
          cells: {
            include: {
              column: true
            }
          }
        }
      });

      // Filter items that belong to this invoice
      const invoiceItems = sampleItems.filter(item => {
        const invoiceIdCell = item.cells.find(cell => 
          cell.column.name === 'invoice_id' && 
          cell.value == sampleInvoice.id
        );
        return invoiceIdCell;
      });

      console.log(`\n📦 Sample Invoice Items (${invoiceItems.length}):`);
      invoiceItems.slice(0, 3).forEach((item, index) => {
        console.log(`   Item ${index + 1}:`);
        item.cells.forEach(cell => {
          console.log(`     ${cell.column.name}: ${cell.value}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Error generating invoices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateCompleteInvoices();
