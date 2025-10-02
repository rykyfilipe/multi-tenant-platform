/** @format */

/**
 * Script pentru popularea bazei de date cu customers, produse și invoices
 * 
 * Acest script va crea:
 * - 100 de customers cu detalii complete
 * - 50 de produse cu prețuri și taxe
 * - 50+ invoices cu items și calcule corecte
 * 
 * Rulare: node scripts/seed-invoices-data.js
 */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

// Date pentru generare aleatoare
const firstNames = [
  'Ion', 'Maria', 'Gheorghe', 'Elena', 'Vasile', 'Ana', 'Nicolae', 'Ioana',
  'Alexandru', 'Cristina', 'Mihai', 'Andreea', 'Constantin', 'Alina', 'Dan',
  'Georgiana', 'Adrian', 'Diana', 'Florin', 'Raluca', 'Catalin', 'Monica',
  'Radu', 'Simona', 'Bogdan', 'Laura', 'Marius', 'Daniela', 'Stefan', 'Carmen'
];

const lastNames = [
  'Popescu', 'Ionescu', 'Popa', 'Pop', 'Radu', 'Gheorghe', 'Stan', 'Munteanu',
  'Dumitru', 'Stoica', 'Vasile', 'Nicolae', 'Dobre', 'Dinu', 'Matei',
  'Constantinescu', 'Oprea', 'Barbu', 'Diaconu', 'Mihai', 'Tudor', 'Dumitrescu',
  'Nistor', 'Florea', 'Constantin', 'Petre', 'Andrei', 'Marin', 'Stancu', 'Ene'
];

const companyNames = [
  'Tech Solutions', 'Digital Services', 'Business Pro', 'Smart Tech', 'Global Trade',
  'Modern Solutions', 'Pro Services', 'Elite Business', 'Premium Tech', 'Future Corp',
  'Innovation Hub', 'Strategic Partners', 'Advanced Systems', 'Dynamic Solutions', 'Prime Services',
  'Quantum Technologies', 'Apex Industries', 'Nexus Corporation', 'Vertex Solutions', 'Sigma Group'
];

const cities = [
  'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov',
  'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău',
  'Târgu Mureș', 'Baia Mare', 'Buzău', 'Satu Mare', 'Botoșani'
];

const streets = [
  'Calea Victoriei', 'Strada Republicii', 'Bulevardul Unirii', 'Strada Mihai Eminescu',
  'Calea Dorobanților', 'Strada Aviatorilor', 'Bulevardul Carol I', 'Strada Florilor',
  'Calea Moșilor', 'Strada Libertății', 'Bulevardul Independenței', 'Strada Primăverii'
];

const productCategories = [
  'Electronics', 'Software', 'Hardware', 'Services', 'Consulting',
  'Furniture', 'Office Supplies', 'Equipment', 'Tools', 'Materials'
];

const productNames = {
  'Electronics': ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Webcam', 'Headphones', 'Speaker'],
  'Software': ['License Office', 'Antivirus', 'CRM System', 'ERP Module', 'Cloud Storage'],
  'Hardware': ['Server', 'Router', 'Switch', 'Hard Drive', 'SSD', 'RAM Module'],
  'Services': ['Consulting', 'Installation', 'Maintenance', 'Support', 'Training'],
  'Furniture': ['Desk', 'Chair', 'Cabinet', 'Shelf', 'Meeting Table'],
  'Office Supplies': ['Paper A4', 'Pen Pack', 'Folder', 'Binder', 'Stapler'],
  'Equipment': ['Printer', 'Scanner', 'Projector', 'Whiteboard', 'Shredder'],
  'Tools': ['Screwdriver Set', 'Drill', 'Hammer', 'Pliers', 'Wrench Set'],
  'Materials': ['Cable', 'Connector', 'Adapter', 'Power Supply', 'Battery']
};

const currencies = ['USD', 'EUR', 'RON', 'GBP'];
const paymentMethods = ['Bank Transfer', 'Card', 'Cash', 'Check'];
const paymentTermsOptions = ['Net 15 days', 'Net 30 days', 'Net 45 days', 'Net 60 days', 'Due on receipt'];
const statuses = ['draft', 'issued', 'paid'];

// Funcții helper
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement(array) {
  return array[randomInt(0, array.length - 1)];
}

function generateEmail(name, company) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const cleanCompany = company ? company.toLowerCase().replace(/\s+/g, '') : 'email';
  return `${cleanName}@${cleanCompany}.ro`;
}

function generatePhone() {
  return `+4007${randomInt(10000000, 99999999)}`;
}

function generateTaxId() {
  return `RO${randomInt(10000000, 99999999)}`;
}

function generateRegNumber() {
  return `J${randomInt(10, 40)}/${randomInt(1000, 9999)}/${randomInt(2010, 2024)}`;
}

async function main() {
  console.log('🚀 Starting database seeding...');
  
  // Get tenant ID from command line or use default
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
  
  // Get or create tables
  let customersTable = await prisma.table.findFirst({
    where: {
      databaseId: database.id,
      name: 'customers'
    },
    include: { columns: true }
  });
  
  let productsTable = await prisma.table.findFirst({
    where: {
      databaseId: database.id,
      name: 'products'
    },
    include: { columns: true }
  });
  
  let invoicesTable = await prisma.table.findFirst({
    where: {
      databaseId: database.id,
      name: 'invoices'
    },
    include: { columns: true }
  });
  
  let invoiceItemsTable = await prisma.table.findFirst({
    where: {
      databaseId: database.id,
      name: 'invoice_items'
    },
    include: { columns: true }
  });
  
  // Initialize invoice tables if they don't exist
  if (!customersTable || !invoicesTable || !invoiceItemsTable) {
    console.log('⚠️  Invoice tables not found. Initializing...');
    
    const { InvoiceSystemService } = require('../src/lib/invoice-system.ts');
    
    const tables = await InvoiceSystemService.initializeInvoiceTables(tenantId, database.id);
    
    customersTable = tables.customers;
    invoicesTable = tables.invoices;
    invoiceItemsTable = tables.invoice_items;
    
    // Reload with columns
    customersTable = await prisma.table.findUnique({
      where: { id: customersTable.id },
      include: { columns: true }
    });
    
    invoicesTable = await prisma.table.findUnique({
      where: { id: invoicesTable.id },
      include: { columns: true }
    });
    
    invoiceItemsTable = await prisma.table.findUnique({
      where: { id: invoiceItemsTable.id },
      include: { columns: true }
    });
    
    console.log('✅ Invoice tables initialized');
  }
  
  // Create products table if it doesn't exist
  if (!productsTable) {
    console.log('⚠️  Products table not found. Creating...');
    
    productsTable = await prisma.table.create({
      data: {
        name: 'products',
        description: 'Product catalog',
        databaseId: database.id,
      }
    });
    
    // Create product columns
    const productColumns = [
      { name: 'name', type: 'string', order: 1 },
      { name: 'description', type: 'string', order: 2 },
      { name: 'price', type: 'number', order: 3 },
      { name: 'currency', type: 'string', order: 4 },
      { name: 'sku', type: 'string', order: 5 },
      { name: 'category', type: 'string', order: 6 },
      { name: 'brand', type: 'string', order: 7 },
      { name: 'vat', type: 'number', order: 8 },
      { name: 'unit_of_measure', type: 'string', order: 9 },
      { name: 'stock', type: 'number', order: 10 },
      { name: 'status', type: 'string', order: 11 },
    ];
    
    for (const col of productColumns) {
      await prisma.column.create({
        data: {
          ...col,
          tableId: productsTable.id,
        }
      });
    }
    
    // Reload with columns
    productsTable = await prisma.table.findUnique({
      where: { id: productsTable.id },
      include: { columns: true }
    });
    
    console.log('✅ Products table created');
  }
  
  console.log('✅ All required tables ready');
  
  // Step 1: Create Customers
  console.log('\n📝 Creating 100 customers...');
  const customerIds = [];
  
  for (let i = 0; i < 100; i++) {
    const isCompany = Math.random() > 0.5;
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const customerName = isCompany 
      ? `${randomElement(companyNames)} ${randomElement(['SRL', 'SA', 'PFA'])}`
      : `${firstName} ${lastName}`;
    
    const city = randomElement(cities);
    const street = randomElement(streets);
    
    const customerRow = await prisma.row.create({
      data: { tableId: customersTable.id }
    });
    
    const cells = [];
    for (const column of customersTable.columns) {
      let value = null;
      
      switch (column.name) {
        case 'customer_name':
        case 'name':
          value = customerName;
          break;
        case 'customer_email':
        case 'email':
          value = generateEmail(isCompany ? customerName.split(' ')[0] : `${firstName}.${lastName}`, 'company');
          break;
        case 'customer_phone':
        case 'phone':
          value = generatePhone();
          break;
        case 'customer_address':
        case 'address':
          value = `${street} ${randomInt(1, 200)}`;
          break;
        case 'customer_city':
        case 'city':
          value = city;
          break;
        case 'customer_country':
        case 'country':
          value = 'Romania';
          break;
        case 'customer_postal_code':
        case 'postal_code':
          value = `${randomInt(100000, 999999)}`;
          break;
        case 'customer_tax_id':
        case 'tax_id':
          value = isCompany ? generateTaxId() : null;
          break;
        case 'customer_registration_number':
        case 'registration_number':
          value = isCompany ? generateRegNumber() : null;
          break;
        case 'customer_street':
        case 'street':
          value = street;
          break;
        case 'customer_street_number':
        case 'street_number':
          value = randomInt(1, 200).toString();
          break;
      }
      
      if (value !== null) {
        cells.push({
          rowId: customerRow.id,
          columnId: column.id,
          value: value.toString()
        });
      }
    }
    
    if (cells.length > 0) {
      await prisma.cell.createMany({ data: cells });
    }
    
    customerIds.push(customerRow.id);
    
    if ((i + 1) % 20 === 0) {
      console.log(`  ✓ Created ${i + 1} customers`);
    }
  }
  
  console.log(`✅ Created ${customerIds.length} customers`);
  
  // Step 2: Create Products
  console.log('\n📦 Creating 50 products...');
  const productIds = [];
  
  for (let i = 0; i < 50; i++) {
    const category = randomElement(productCategories);
    const productNameBase = productNames[category] ? randomElement(productNames[category]) : 'Product';
    const productName = `${productNameBase} ${randomElement(['Pro', 'Plus', 'Premium', 'Standard', 'Basic'])}`;
    const currency = randomElement(currencies);
    const price = randomFloat(10, 5000, 2);
    const vat = randomElement([0, 5, 9, 19, 24]);
    
    const productRow = await prisma.row.create({
      data: { tableId: productsTable.id }
    });
    
    const cells = [];
    for (const column of productsTable.columns) {
      let value = null;
      
      switch (column.name) {
        case 'name':
        case 'product_name':
          value = productName;
          break;
        case 'description':
        case 'product_description':
          value = `High quality ${productNameBase.toLowerCase()} for professional use`;
          break;
        case 'price':
        case 'product_price':
          value = price;
          break;
        case 'currency':
        case 'product_currency':
          value = currency;
          break;
        case 'sku':
        case 'product_sku':
          value = `SKU-${category.substring(0, 3).toUpperCase()}-${randomInt(1000, 9999)}`;
          break;
        case 'category':
        case 'product_category':
          value = category;
          break;
        case 'brand':
        case 'product_brand':
          value = randomElement(['TechCorp', 'ProBrand', 'EliteGoods', 'Premium', 'Standard']);
          break;
        case 'vat':
        case 'product_vat':
        case 'tax_rate':
          value = vat;
          break;
        case 'unit_of_measure':
        case 'unit':
          value = randomElement(['pcs', 'box', 'pack', 'unit', 'set']);
          break;
        case 'stock':
        case 'quantity':
          value = randomInt(10, 1000);
          break;
        case 'status':
          value = 'active';
          break;
      }
      
      if (value !== null) {
        cells.push({
          rowId: productRow.id,
          columnId: column.id,
          value: value.toString()
        });
      }
    }
    
    if (cells.length > 0) {
      await prisma.cell.createMany({ data: cells });
    }
    
    productIds.push(productRow.id);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created ${i + 1} products`);
    }
  }
  
  console.log(`✅ Created ${productIds.length} products`);
  
  // Step 3: Create Invoices with Items
  console.log('\n📄 Creating 50 invoices with items...');
  
  let invoiceCounter = 1;
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < 50; i++) {
    const customerId = randomElement(customerIds);
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
    
    // Create invoice row
    const invoiceRow = await prisma.row.create({
      data: { tableId: invoicesTable.id }
    });
    
    // Select random products for this invoice (2-5 products)
    const numProducts = randomInt(2, 5);
    const selectedProducts = [];
    const usedProductIds = new Set();
    
    for (let j = 0; j < numProducts; j++) {
      let productId;
      do {
        productId = randomElement(productIds);
      } while (usedProductIds.has(productId));
      
      usedProductIds.add(productId);
      
      // Get product details
      const productCells = await prisma.cell.findMany({
        where: { rowId: productId },
        include: { column: true }
      });
      
      const productData = {};
      productCells.forEach(cell => {
        productData[cell.column.name] = cell.value;
      });
      
      const quantity = randomFloat(1, 10, 2);
      const unitPrice = parseFloat(productData.price || productData.product_price || 100);
      const productCurrency = productData.currency || productData.product_currency || baseCurrency;
      const vat = parseFloat(productData.vat || productData.product_vat || productData.tax_rate || 19);
      
      // Convert price to base currency if needed (simplified - using fixed rates)
      const exchangeRates = { USD: 1, EUR: 1.1, RON: 0.22, GBP: 1.27 };
      const convertedPrice = productCurrency === baseCurrency 
        ? unitPrice 
        : unitPrice * (exchangeRates[productCurrency] / exchangeRates[baseCurrency]);
      
      const subtotal = quantity * convertedPrice;
      const taxAmount = subtotal * (vat / 100);
      const total = subtotal + taxAmount;
      
      selectedProducts.push({
        productId,
        productData,
        quantity,
        unitPrice: convertedPrice,
        currency: baseCurrency,
        originalCurrency: productCurrency,
        originalPrice: unitPrice,
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
    
    // Create invoice cells
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
          rowId: invoiceRow.id,
          columnId: column.id,
          value: value.toString()
        });
      }
    }
    
    if (invoiceCells.length > 0) {
      await prisma.cell.createMany({ data: invoiceCells });
    }
    
    // Create invoice items
    for (const product of selectedProducts) {
      const itemRow = await prisma.row.create({
        data: { tableId: invoiceItemsTable.id }
      });
      
      const itemCells = [];
      for (const column of invoiceItemsTable.columns) {
        let value = null;
        
        switch (column.name) {
          case 'invoice_id':
            value = [invoiceRow.id]; // Array for reference type
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
      console.log(`  ✓ Created ${i + 1} invoices with ${selectedProducts.length} items each`);
    }
  }
  
  console.log(`✅ Created 50 invoices with items`);
  
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Customers: 100`);
  console.log(`  - Products: 50`);
  console.log(`  - Invoices: 50`);
  console.log(`  - Invoice Items: ~150-250 (2-5 per invoice)`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

