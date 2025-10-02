/** @format */

/**
 * Script pentru recrearea corectă a invoices-urilor 
 * Folosește exact aceeași logică ca POST /api/tenants/[tenantId]/invoices
 */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

// SemanticColumnType enum values (copied from src/lib/semantic-types.ts)
const SemanticColumnType = {
  // Invoice fields
  INVOICE_NUMBER: 'invoice_number',
  INVOICE_SERIES: 'invoice_series',
  INVOICE_DATE: 'invoice_date',
  INVOICE_DUE_DATE: 'invoice_due_date',
  INVOICE_CUSTOMER_ID: 'invoice_customer_id',
  INVOICE_STATUS: 'invoice_status',
  INVOICE_PAYMENT_TERMS: 'invoice_payment_terms',
  INVOICE_PAYMENT_METHOD: 'invoice_payment_method',
  INVOICE_BASE_CURRENCY: 'invoice_base_currency',
  INVOICE_TOTAL_AMOUNT: 'invoice_total_amount',
  INVOICE_SUBTOTAL: 'invoice_subtotal',
  INVOICE_TAX_TOTAL: 'invoice_tax_total',
  INVOICE_DISCOUNT_AMOUNT: 'invoice_discount_amount',
  INVOICE_DISCOUNT_RATE: 'invoice_discount_rate',
  INVOICE_LATE_FEE: 'invoice_late_fee',
  INVOICE_EXCHANGE_RATE: 'invoice_exchange_rate',
  INVOICE_SHIPPING_COST: 'invoice_shipping_cost',
  INVOICE_LANGUAGE: 'invoice_language',
  // Product fields
  PRODUCT_REF_TABLE: 'product_ref_table',
  PRODUCT_NAME: 'product_name',
  PRODUCT_DESCRIPTION: 'product_description',
  PRODUCT_CATEGORY: 'product_category',
  PRODUCT_SKU: 'product_sku',
  PRODUCT_BRAND: 'product_brand',
  PRODUCT_VAT: 'product_vat',
  // Item fields
  ID: 'id',
  QUANTITY: 'quantity',
  UNIT_PRICE: 'unit_price',
  TOTAL_PRICE: 'total_price',
  CURRENCY: 'currency',
  UNIT_OF_MEASURE: 'unit_of_measure',
  TAX_RATE: 'tax_rate',
  TAX_AMOUNT: 'tax_amount',
  DISCOUNT_RATE: 'discount_rate',
  DISCOUNT_AMOUNT: 'discount_amount',
};

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

function extractProductDetails(columns, cells) {
  const details = {
    name: null,
    description: null,
    price: null,
    currency: null,
    sku: null,
    category: null,
    brand: null,
    vat: 0,
    unit_of_measure: 'pcs'
  };
  
  cells.forEach(cell => {
    const columnName = cell.column.name;
    switch (columnName) {
      case 'name':
      case 'product_name':
        details.name = cell.value;
        break;
      case 'description':
      case 'product_description':
        details.description = cell.value;
        break;
      case 'price':
      case 'product_price':
        details.price = parseFloat(cell.value);
        break;
      case 'currency':
      case 'product_currency':
        details.currency = cell.value;
        break;
      case 'sku':
      case 'product_sku':
        details.sku = cell.value;
        break;
      case 'category':
      case 'product_category':
        details.category = cell.value;
        break;
      case 'brand':
      case 'product_brand':
        details.brand = cell.value;
        break;
      case 'vat':
      case 'product_vat':
      case 'tax_rate':
        details.vat = parseFloat(cell.value);
        break;
      case 'unit_of_measure':
      case 'unit':
        details.unit_of_measure = cell.value;
        break;
    }
  });
  
  return details;
}

async function main() {
  console.log('🚀 Starting invoice recreation (using POST route logic)...');
  
  const tenantId = process.argv[2] ? parseInt(process.argv[2]) : 2;
  console.log(`📌 Using tenant ID: ${tenantId}`);
  
  const database = await prisma.database.findFirst({
    where: { tenantId }
  });
  
  if (!database) {
    console.error(`❌ Database not found!`);
    process.exit(1);
  }
  
  // Get tables with columns
  const invoicesTable = await prisma.table.findFirst({
    where: { databaseId: database.id, name: 'invoices' },
    include: { columns: true }
  });
  
  const invoiceItemsTable = await prisma.table.findFirst({
    where: { databaseId: database.id, name: 'invoice_items' },
    include: { columns: true }
  });
  
  const productsTable = await prisma.table.findFirst({
    where: { databaseId: database.id, name: 'products' },
    include: { columns: true }
  });
  
  if (!invoicesTable || !invoiceItemsTable || !productsTable) {
    console.error('❌ Required tables not found!');
    process.exit(1);
  }
  
  // Step 1: Delete all invoice_items
  console.log('\n🗑️  Deleting all invoice items...');
  const itemRows = await prisma.row.findMany({
    where: { tableId: invoiceItemsTable.id }
  });
  
  for (const row of itemRows) {
    await prisma.cell.deleteMany({ where: { rowId: row.id } });
    await prisma.row.delete({ where: { id: row.id } });
  }
  console.log(`✅ Deleted ${itemRows.length} invoice items`);
  
  // Step 2: Delete all invoices
  console.log('\n🗑️  Deleting all invoices...');
  const invoiceRows = await prisma.row.findMany({
    where: { tableId: invoicesTable.id }
  });
  
  for (const row of invoiceRows) {
    await prisma.cell.deleteMany({ where: { rowId: row.id } });
    await prisma.row.delete({ where: { id: row.id } });
  }
  console.log(`✅ Deleted ${invoiceRows.length} invoices`);
  
  // Step 3: Get customers and products
  const customerRows = await prisma.row.findMany({
    where: { tableId: (await prisma.table.findFirst({ where: { databaseId: database.id, name: 'customers' } })).id }
  });
  
  const productRows = await prisma.row.findMany({
    where: { tableId: productsTable.id },
    include: { cells: { include: { column: true } } }
  });
  
  console.log(`✅ Found ${customerRows.length} customers and ${productRows.length} products`);
  
  // Step 4: Create 50 invoices using EXACT POST route logic
  console.log('\n📄 Creating 50 invoices using POST route logic...');
  
  let invoiceCounter = 1;
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < 50; i++) {
    await prisma.$transaction(async (tx) => {
      // STEP 1: Create invoice row (exact copy from POST route line 222-226)
      const invoiceRow = await tx.row.create({
        data: {
          tableId: invoicesTable.id,
        },
      });
      
      const invoiceNumber = `INV-${currentYear}-${invoiceCounter.toString().padStart(6, '0')}`;
      const invoiceSeries = 'INV';
      invoiceCounter++;
      
      const customerId = randomElement(customerRows).id;
      const baseCurrency = randomElement(currencies);
      const status = randomElement(statuses);
      const paymentMethod = randomElement(paymentMethods);
      const paymentTerms = randomElement(paymentTermsOptions);
      
      const daysAgo = randomInt(0, 180);
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + randomInt(15, 60));
      
      // STEP 2: Create invoice cells using semantic types (exact copy from POST route line 231-340)
      const invoiceCells = [];
      
      for (const column of invoicesTable.columns) {
        let value = null;
        
        // Use semanticType mapping (exact copy from POST route)
        switch (column.semanticType) {
          case SemanticColumnType.INVOICE_NUMBER:
            value = invoiceNumber;
            break;
          case SemanticColumnType.INVOICE_SERIES:
            value = invoiceSeries;
            break;
          case SemanticColumnType.INVOICE_DATE:
            value = invoiceDate.toISOString();
            break;
          case SemanticColumnType.INVOICE_DUE_DATE:
            value = dueDate.toISOString().split('T')[0];
            break;
          case SemanticColumnType.INVOICE_CUSTOMER_ID:
            value = customerId;
            break;
          case SemanticColumnType.INVOICE_STATUS:
            value = status;
            break;
          case SemanticColumnType.INVOICE_PAYMENT_TERMS:
            value = paymentTerms;
            break;
          case SemanticColumnType.INVOICE_PAYMENT_METHOD:
            value = paymentMethod;
            break;
          case SemanticColumnType.INVOICE_BASE_CURRENCY:
            value = baseCurrency;
            break;
          case SemanticColumnType.INVOICE_TOTAL_AMOUNT:
            value = 0; // Will be calculated later
            break;
          case SemanticColumnType.INVOICE_SUBTOTAL:
            value = 0; // Will be calculated later
            break;
          case SemanticColumnType.INVOICE_TAX_TOTAL:
            value = 0; // Will be calculated later
            break;
          case SemanticColumnType.INVOICE_DISCOUNT_AMOUNT:
            value = 0;
            break;
          case SemanticColumnType.INVOICE_DISCOUNT_RATE:
            value = 0;
            break;
          case SemanticColumnType.INVOICE_LATE_FEE:
            value = 0;
            break;
          case SemanticColumnType.INVOICE_EXCHANGE_RATE:
            value = 1;
            break;
          case SemanticColumnType.INVOICE_SHIPPING_COST:
            value = 0;
            break;
          case SemanticColumnType.INVOICE_LANGUAGE:
            value = 'en';
            break;
        }
        
        if (value !== null && value !== undefined && value !== "") {
          invoiceCells.push({
            rowId: invoiceRow.id,
            columnId: column.id,
            value,
          });
        }
      }
      
      // Remove duplicates
      const uniqueInvoiceCells = invoiceCells.filter((cell, index, self) => 
        index === self.findIndex(c => c.rowId === cell.rowId && c.columnId === cell.columnId)
      );
      
      await tx.cell.createMany({ data: uniqueInvoiceCells });
      
      // STEP 3: Create invoice items (exact copy from POST route line 342-517)
      const numProducts = randomInt(2, 5);
      const selectedProductIndices = new Set();
      let invoiceSubtotal = 0;
      let invoiceTaxTotal = 0;
      
      for (let j = 0; j < numProducts; j++) {
        let productIndex;
        do {
          productIndex = randomInt(0, productRows.length - 1);
        } while (selectedProductIndices.has(productIndex));
        selectedProductIndices.add(productIndex);
        
        const productRow = productRows[productIndex];
        const productDetails = extractProductDetails(productsTable.columns, productRow.cells);
        
        const quantity = randomFloat(1, 10, 2);
        const unitPrice = productDetails.price || 100;
        const productCurrency = productDetails.currency || baseCurrency;
        
        // Convert to base currency (simplified)
        const exchangeRates = { USD: 1, EUR: 1.1, RON: 0.22, GBP: 1.27 };
        const convertedPrice = productCurrency === baseCurrency 
          ? unitPrice 
          : unitPrice * (exchangeRates[productCurrency] / exchangeRates[baseCurrency]);
        
        // Create invoice item row (line 347-351)
        const itemRow = await tx.row.create({
          data: {
            tableId: invoiceItemsTable.id,
          },
        });
        
        const product = {
          product_ref_table: productsTable.name,
          product_ref_id: productRow.id,
          quantity: quantity,
          price: convertedPrice,
          currency: baseCurrency,
          unit_of_measure: productDetails.unit_of_measure || 'pcs'
        };
        
        // Create invoice item cells using semantic types (line 406-514)
        const itemCells = [];
        
        for (const column of invoiceItemsTable.columns) {
          let value = null;
          
          // Handle invoice_id as special case (line 412-418)
          if (column.name === "invoice_id") {
            value = [invoiceRow.id]; // Array with invoice row ID
          } else {
            // Map using semantic types (line 421-494)
            switch (column.semanticType) {
              case SemanticColumnType.PRODUCT_REF_TABLE:
                value = product.product_ref_table;
                break;
              case SemanticColumnType.ID:
                value = product.product_ref_id;
                break;
              case SemanticColumnType.QUANTITY:
                value = product.quantity;
                break;
              case SemanticColumnType.UNIT_PRICE:
                value = product.price;
                break;
              case SemanticColumnType.TOTAL_PRICE:
                value = product.price * product.quantity;
                break;
              case SemanticColumnType.CURRENCY:
                value = product.currency;
                break;
              case SemanticColumnType.UNIT_OF_MEASURE:
                value = product.unit_of_measure;
                break;
              case SemanticColumnType.PRODUCT_NAME:
                value = productDetails.name;
                break;
              case SemanticColumnType.PRODUCT_DESCRIPTION:
                value = productDetails.description;
                break;
              case SemanticColumnType.PRODUCT_CATEGORY:
                value = productDetails.category;
                break;
              case SemanticColumnType.PRODUCT_SKU:
                value = productDetails.sku;
                break;
              case SemanticColumnType.PRODUCT_BRAND:
                value = productDetails.brand;
                break;
              case SemanticColumnType.PRODUCT_VAT:
              case SemanticColumnType.TAX_RATE:
                value = productDetails.vat || 0;
                break;
              case SemanticColumnType.TAX_AMOUNT:
                const totalPrice = product.price * product.quantity;
                const taxRate = productDetails.vat || 0;
                value = totalPrice * (taxRate / 100);
                break;
              case SemanticColumnType.DISCOUNT_RATE:
                value = 0;
                break;
              case SemanticColumnType.DISCOUNT_AMOUNT:
                value = 0;
                break;
            }
          }
          
          if (value !== null && value !== undefined && value !== "") {
            itemCells.push({
              rowId: itemRow.id,
              columnId: column.id,
              value,
            });
          }
        }
        
        const uniqueItemCells = itemCells.filter((cell, index, self) => 
          index === self.findIndex(c => c.rowId === cell.rowId && c.columnId === cell.columnId)
        );
        
        await tx.cell.createMany({ data: uniqueItemCells });
        
        // Calculate totals
        const subtotal = product.price * product.quantity;
        const taxAmount = subtotal * ((productDetails.vat || 0) / 100);
        invoiceSubtotal += subtotal;
        invoiceTaxTotal += taxAmount;
      }
      
      // Update invoice totals
      const invoiceGrandTotal = invoiceSubtotal + invoiceTaxTotal;
      
      for (const column of invoicesTable.columns) {
        if (column.semanticType === SemanticColumnType.INVOICE_SUBTOTAL) {
          await tx.cell.updateMany({
            where: { rowId: invoiceRow.id, columnId: column.id },
            data: { value: invoiceSubtotal.toFixed(2) }
          });
        } else if (column.semanticType === SemanticColumnType.INVOICE_TAX_TOTAL) {
          await tx.cell.updateMany({
            where: { rowId: invoiceRow.id, columnId: column.id },
            data: { value: invoiceTaxTotal.toFixed(2) }
          });
        } else if (column.semanticType === SemanticColumnType.INVOICE_TOTAL_AMOUNT) {
          await tx.cell.updateMany({
            where: { rowId: invoiceRow.id, columnId: column.id },
            data: { value: invoiceGrandTotal.toFixed(2) }
          });
        }
      }
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created ${i + 1} invoices`);
    }
  }
  
  console.log('✅ Created 50 invoices with items');
  console.log('\n🎉 Recreation completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

