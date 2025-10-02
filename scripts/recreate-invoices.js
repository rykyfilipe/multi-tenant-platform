/** @format */

/**
 * Script pentru recrearea invoices-urilor cu invoice_items corect
 * 
 * Acest script va:
 * 1. Șterge toate invoice_items
 * 2. Șterge toate invoices
 * 3. Crea 50 de invoices noi cu items corecte
 * 
 * IMPORTANT: invoice_id în invoice_items trebuie să fie array cu ID-ul ROW-ului
 * Exemplu: dacă row-ul din invoices are ID 42, atunci invoice_id = [42]
 * 
 * Rulare: node scripts/recreate-invoices.js <tenantId>
 */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

const currencies = ['USD', 'EUR', 'RON', 'GBP'];
const paymentMethods = ['Bank Transfer', 'Card', 'Cash', 'Check'];
const paymentTermsOptions = ['Net 15 days', 'Net 30 days', 'Net 45 days', 'Net 60 days', 'Due on receipt'];
const statuses = ['draft', 'issued', 'paid'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement(array) {
  return array[randomInt(0, array.length - 1)];
}

async function main() {
  console.log('🚀 Starting invoice recreation...');
  
  const tenantId = process.argv[2] ? parseInt(process.argv[2]) : 2;
  console.log(`📌 Using tenant ID: ${tenantId}`);
  
  // Get tenant and database
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });
  
  if (!tenant) {
    console.error(`❌ Tenant ${tenantId} not found!`);
    process.exit(1);
  }
  
  const database = await prisma.database.findFirst({
    where: { tenantId }
  });
  
  if (!database) {
    console.error(`❌ Database not found for tenant ${tenantId}!`);
    process.exit(1);
  }
  
  console.log(`✅ Found tenant: ${tenant.name}`);
  console.log(`✅ Found database: ${database.name}`);
  
  // Get tables
  const customersTable = await prisma.table.findFirst({
    where: {
      databaseId: database.id,
      name: 'customers'
    },
    include: { columns: true }
  });
  
  const productsTable = await prisma.table.findFirst({
    where: {
      databaseId: database.id,
      name: 'products'
    },
    include: { columns: true }
  });
  
  const invoicesTable = await prisma.table.findFirst({
    where: {
      databaseId: database.id,
      name: 'invoices'
    },
    include: { columns: true }
  });
  
  const invoiceItemsTable = await prisma.table.findFirst({
    where: {
      databaseId: database.id,
      name: 'invoice_items'
    },
    include: { columns: true }
  });
  
  if (!customersTable || !productsTable || !invoicesTable || !invoiceItemsTable) {
    console.error('❌ Required tables not found!');
    process.exit(1);
  }
  
  console.log('✅ All required tables found');
  
  // Step 1: Delete all invoice_items
  console.log('\n🗑️  Deleting all invoice items...');
  const itemRows = await prisma.row.findMany({
    where: { tableId: invoiceItemsTable.id }
  });
  
  for (const row of itemRows) {
    await prisma.cell.deleteMany({
      where: { rowId: row.id }
    });
    await prisma.row.delete({
      where: { id: row.id }
    });
  }
  console.log(`✅ Deleted ${itemRows.length} invoice items`);
  
  // Step 2: Delete all invoices
  console.log('\n🗑️  Deleting all invoices...');
  const invoiceRows = await prisma.row.findMany({
    where: { tableId: invoicesTable.id }
  });
  
  for (const row of invoiceRows) {
    await prisma.cell.deleteMany({
      where: { rowId: row.id }
    });
    await prisma.row.delete({
      where: { id: row.id }
    });
  }
  console.log(`✅ Deleted ${invoiceRows.length} invoices`);
  
  // Step 3: Get existing customers and products
  console.log('\n📊 Getting existing customers and products...');
  const customerRows = await prisma.row.findMany({
    where: { tableId: customersTable.id }
  });
  
  const productRows = await prisma.row.findMany({
    where: { tableId: productsTable.id },
    include: {
      cells: {
        include: { column: true }
      }
    }
  });
  
  console.log(`✅ Found ${customerRows.length} customers and ${productRows.length} products`);
  
  if (customerRows.length === 0 || productRows.length === 0) {
    console.error('❌ No customers or products found! Please run seed-invoices-data.js first.');
    process.exit(1);
  }
  
  // Step 4: Create 50 new invoices
  console.log('\n📄 Creating 50 new invoices...');
  
  let invoiceCounter = 1;
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < 50; i++) {
    const customerId = randomElement(customerRows).id;
    const baseCurrency = randomElement(currencies);
    const status = randomElement(statuses);
    const paymentMethod = randomElement(paymentMethods);
    const paymentTerms = randomElement(paymentTermsOptions);
    
    // Random date in last 6 months
    const daysAgo = randomInt(0, 180);
    const invoiceDate = new Date();
    invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
    
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + randomInt(15, 60));
    
    // Generate invoice number
    const invoiceNumber = `INV-${currentYear}-${invoiceCounter.toString().padStart(6, '0')}`;
    const invoiceSeries = 'INV';
    invoiceCounter++;
    
    // STEP 4.1: Create invoice ROW first
    const invoiceRow = await prisma.row.create({
      data: { tableId: invoicesTable.id }
    });
    
    const invoiceRowId = invoiceRow.id; // This is the ID we'll use in invoice_items
    
    // Select random products (2-5 products)
    const numProducts = randomInt(2, 5);
    const selectedProducts = [];
    const usedProductIndices = new Set();
    
    for (let j = 0; j < numProducts; j++) {
      let productIndex;
      do {
        productIndex = randomInt(0, productRows.length - 1);
      } while (usedProductIndices.has(productIndex));
      
      usedProductIndices.add(productIndex);
      
      const productRow = productRows[productIndex];
      const productData = {};
      productRow.cells.forEach(cell => {
        productData[cell.column.name] = cell.value;
      });
      
      const quantity = randomFloat(1, 10, 2);
      const unitPrice = parseFloat(productData.price || 100);
      const productCurrency = productData.currency || baseCurrency;
      const vat = parseFloat(productData.vat || productData.tax_rate || 19);
      
      // Convert price to base currency (simplified)
      const exchangeRates = { USD: 1, EUR: 1.1, RON: 0.22, GBP: 1.27 };
      const convertedPrice = productCurrency === baseCurrency 
        ? unitPrice 
        : unitPrice * (exchangeRates[productCurrency] / exchangeRates[baseCurrency]);
      
      const subtotal = quantity * convertedPrice;
      const taxAmount = subtotal * (vat / 100);
      const total = subtotal + taxAmount;
      
      selectedProducts.push({
        productId: productRow.id,
        productData,
        quantity,
        unitPrice: convertedPrice,
        currency: baseCurrency,
        vat,
        subtotal,
        taxAmount,
        total
      });
    }
    
    // Calculate invoice totals
    const invoiceSubtotal = selectedProducts.reduce((sum, p) => sum + p.subtotal, 0);
    const invoiceTaxTotal = selectedProducts.reduce((sum, p) => sum + p.taxAmount, 0);
    const invoiceGrandTotal = invoiceSubtotal + invoiceTaxTotal;
    
    // STEP 4.2: Create invoice CELLS
    const invoiceCells = [];
    for (const column of invoicesTable.columns) {
      let value = null;
      
      switch (column.name) {
        case 'invoice_number':
          value = invoiceNumber;
          break;
        case 'invoice_series':
          value = invoiceSeries;
          break;
        case 'customer_id':
          value = customerId;
          break;
        case 'date':
        case 'invoice_date':
          value = invoiceDate.toISOString().split('T')[0];
          break;
        case 'due_date':
        case 'invoice_due_date':
          value = dueDate.toISOString().split('T')[0];
          break;
        case 'status':
        case 'invoice_status':
          value = status;
          break;
        case 'base_currency':
        case 'invoice_base_currency':
          value = baseCurrency;
          break;
        case 'payment_method':
        case 'invoice_payment_method':
          value = paymentMethod;
          break;
        case 'payment_terms':
        case 'invoice_payment_terms':
          value = paymentTerms;
          break;
        case 'subtotal':
        case 'invoice_subtotal':
          value = invoiceSubtotal.toFixed(2);
          break;
        case 'tax_total':
        case 'invoice_tax_total':
          value = invoiceTaxTotal.toFixed(2);
          break;
        case 'total_amount':
        case 'invoice_total_amount':
          value = invoiceGrandTotal.toFixed(2);
          break;
        case 'language':
        case 'invoice_language':
          value = 'en';
          break;
        case 'exchange_rate':
        case 'invoice_exchange_rate':
          value = '1';
          break;
        case 'discount_amount':
        case 'invoice_discount_amount':
          value = '0';
          break;
        case 'discount_rate':
        case 'invoice_discount_rate':
          value = '0';
          break;
        case 'shipping_cost':
        case 'invoice_shipping_cost':
          value = '0';
          break;
        case 'late_fee':
        case 'invoice_late_fee':
          value = '0';
          break;
      }
      
      if (value !== null) {
        invoiceCells.push({
          rowId: invoiceRowId, // Use the created row ID
          columnId: column.id,
          value: value.toString()
        });
      }
    }
    
    if (invoiceCells.length > 0) {
      await prisma.cell.createMany({ data: invoiceCells });
    }
    
    // STEP 4.3: Create invoice ITEMS with correct invoice_id reference
    for (const product of selectedProducts) {
      // Create item row
      const itemRow = await prisma.row.create({
        data: { tableId: invoiceItemsTable.id }
      });
      
      const itemCells = [];
      for (const column of invoiceItemsTable.columns) {
        let value = null;
        
        switch (column.name) {
          case 'invoice_id':
            // IMPORTANT: This must be an array with the invoice ROW ID
            value = [invoiceRowId]; // e.g., [42], [143], etc.
            break;
          case 'product_ref_table':
            value = productsTable.id;
            break;
          case 'product_ref_id':
            value = product.productId;
            break;
          case 'quantity':
            value = product.quantity;
            break;
          case 'unit_price':
            value = product.unitPrice.toFixed(2);
            break;
          case 'total_price':
            value = product.total.toFixed(2);
            break;
          case 'currency':
            value = product.currency;
            break;
          case 'product_vat':
          case 'vat_rate':
          case 'tax_rate':
            value = product.vat;
            break;
          case 'unit_of_measure':
          case 'unit':
            value = product.productData.unit_of_measure || product.productData.unit || 'pcs';
            break;
          case 'description':
            value = product.productData.description || product.productData.product_description || '';
            break;
        }
        
        if (value !== null) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: column.id,
            value: typeof value === 'object' ? JSON.stringify(value) : value.toString()
          });
        }
      }
      
      if (itemCells.length > 0) {
        await prisma.cell.createMany({ data: itemCells });
      }
    }
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created ${i + 1} invoices (last invoice row ID: ${invoiceRowId})`);
    }
  }
  
  console.log('✅ Created 50 invoices with items');
  
  console.log('\n🎉 Invoice recreation completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - Deleted old invoices and items');
  console.log('  - Created 50 new invoices');
  console.log('  - Each invoice has 2-5 products');
  console.log('  - invoice_id in items is stored as array: [row_id]');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

