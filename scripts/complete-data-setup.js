const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Mock customer data - real Romanian companies and individuals
const mockCustomers = [
  { name: 'SC ALPHA TECH SRL', email: 'contact@alphatech.ro', address: 'Str. Avram Iancu 15, Cluj-Napoca', phone: '+40264123456', taxId: 'RO12345678', country: 'Romania' },
  { name: 'BETA LOGISTICS SA', email: 'office@betalogistics.ro', address: 'Bd. Unirii 45, București', phone: '+40213456789', taxId: 'RO23456789', country: 'Romania' },
  { name: 'GAMMA CONSULTING SRL', email: 'info@gammaconsulting.ro', address: 'Str. Victoriei 23, Timișoara', phone: '+40256789012', taxId: 'RO34567890', country: 'Romania' },
  { name: 'DELTA INDUSTRIES SA', email: 'sales@deltaindustries.ro', address: 'Calea Dorobanților 100, Iași', phone: '+40232345678', taxId: 'RO45678901', country: 'Romania' },
  { name: 'EPSILON RETAIL SRL', email: 'contact@epsilonretail.ro', address: 'Str. Magheru 8, Brașov', phone: '+40268901234', taxId: 'RO56789012', country: 'Romania' },
  { name: 'ZETA CONSTRUCTION SA', email: 'office@zetaconstruction.ro', address: 'Bd. Revoluției 77, Oradea', phone: '+40259123456', taxId: 'RO67890123', country: 'Romania' },
  { name: 'ETA PHARMA SRL', email: 'info@etapharma.ro', address: 'Str. Republicii 12, Sibiu', phone: '+40269234567', taxId: 'RO78901234', country: 'Romania' },
  { name: 'THETA AUTOMOTIVE SRL', email: 'sales@thetaauto.ro', address: 'Calea Aradului 50, Timișoara', phone: '+40256345678', taxId: 'RO89012345', country: 'Romania' },
  { name: 'IOTA ELECTRONICS SA', email: 'contact@iotaelectronics.ro', address: 'Str. Băicoi 19, București', phone: '+40214567890', taxId: 'RO90123456', country: 'Romania' },
  { name: 'KAPPA FOOD SRL', email: 'office@kappafood.ro', address: 'Bd. Mamaia 200, Constanța', phone: '+40241678901', taxId: 'RO01234567', country: 'Romania' },
  { name: 'LAMBDA SERVICES SA', email: 'info@lambdaservices.ro', address: 'Str. Eroilor 5, Cluj-Napoca', phone: '+40264789012', taxId: 'RO11234568', country: 'Romania' },
  { name: 'MU TRANSPORT SRL', email: 'contact@mutransport.ro', address: 'Calea București 88, Ploiești', phone: '+40244890123', taxId: 'RO21234569', country: 'Romania' },
  { name: 'NU TRADING SA', email: 'sales@nutrading.ro', address: 'Str. Libertății 34, Craiova', phone: '+40251901234', taxId: 'RO31234570', country: 'Romania' },
  { name: 'XI SOFTWARE SRL', email: 'office@xisoftware.ro', address: 'Bd. Carol I 56, Iași', phone: '+40232012345', taxId: 'RO41234571', country: 'Romania' },
  { name: 'OMICRON AGRICULTURE SA', email: 'info@omicronagriculture.ro', address: 'Str. Câmpului 90, Arad', phone: '+40257123456', taxId: 'RO51234572', country: 'Romania' },
  { name: 'PI MEDIA SRL', email: 'contact@pimedia.ro', address: 'Calea Victoriei 120, București', phone: '+40212234567', taxId: 'RO61234573', country: 'Romania' },
  { name: 'RHO ENERGY SA', email: 'office@rhoenergy.ro', address: 'Str. Energiei 45, Pitești', phone: '+40248345678', taxId: 'RO71234574', country: 'Romania' },
  { name: 'SIGMA TELECOM SRL', email: 'sales@sigmatelecom.ro', address: 'Bd. Dacia 67, Bacău', phone: '+40234456789', taxId: 'RO81234575', country: 'Romania' },
  { name: 'TAU FINANCE SA', email: 'info@taufinance.ro', address: 'Str. Banilor 22, Cluj-Napoca', phone: '+40264567890', taxId: 'RO91234576', country: 'Romania' },
  { name: 'UPSILON HEALTH SRL', email: 'contact@upsilonhealth.ro', address: 'Calea Moților 155, Timișoara', phone: '+40256678901', taxId: 'RO02234577', country: 'Romania' },
  { name: 'PHI EDUCATION SA', email: 'office@phieducation.ro', address: 'Str. Școlii 18, Brașov', phone: '+40268789012', taxId: 'RO12234578', country: 'Romania' },
  { name: 'CHI MANUFACTURING SRL', email: 'sales@chimanufacturing.ro', address: 'Zona Industrială 1, Ploiești', phone: '+40244890123', taxId: 'RO22234579', country: 'Romania' },
  { name: 'PSI MARKETING SA', email: 'info@psimarketing.ro', address: 'Bd. Tomis 45, Constanța', phone: '+40241901234', taxId: 'RO32234580', country: 'Romania' },
  { name: 'OMEGA TOURISM SRL', email: 'contact@omegatourism.ro', address: 'Str. Turismului 7, Sinaia', phone: '+40244012345', taxId: 'RO42234581', country: 'Romania' },
  { name: 'ATLAS DISTRIBUTION SA', email: 'office@atlasdistribution.ro', address: 'Calea Națională 200, Brăila', phone: '+40239123456', taxId: 'RO52234582', country: 'Romania' },
  { name: 'APOLLO SECURITY SRL', email: 'sales@apollosecurity.ro', address: 'Str. Siguranței 33, București', phone: '+40213234567', taxId: 'RO62234583', country: 'Romania' },
  { name: 'HERMES COURIER SA', email: 'info@hermescourier.ro', address: 'Bd. Pache Protopopescu 89, București', phone: '+40214345678', taxId: 'RO72234584', country: 'Romania' },
  { name: 'ZEUS INSURANCE SRL', email: 'contact@zeusinsurance.ro', address: 'Str. Asigurărilor 16, Cluj-Napoca', phone: '+40264456789', taxId: 'RO82234585', country: 'Romania' },
  { name: 'HERA BEAUTY SA', email: 'office@herabeauty.ro', address: 'Calea Floreasca 111, București', phone: '+40215567890', taxId: 'RO92234586', country: 'Romania' },
  { name: 'POSEIDON MARINE SRL', email: 'sales@poseidonmarine.ro', address: 'Bd. Marinei 25, Constanța', phone: '+40241678901', taxId: 'RO03234587', country: 'Romania' },
  { name: 'DEMETER ORGANIC SA', email: 'info@demeterorganic.ro', address: 'Str. Naturii 44, Sibiu', phone: '+40269789012', taxId: 'RO13234588', country: 'Romania' },
  { name: 'ARES DEFENSE SRL', email: 'contact@aresdefense.ro', address: 'Calea Plevnei 155, București', phone: '+40216890123', taxId: 'RO23234589', country: 'Romania' },
  { name: 'ARTEMIS FASHION SA', email: 'office@artemisfashion.ro', address: 'Str. Modei 8, Timișoara', phone: '+40256901234', taxId: 'RO33234590', country: 'Romania' },
  { name: 'DIONYSUS WINES SRL', email: 'sales@dionysuswines.ro', address: 'Str. Viticultorilor 50, Craiova', phone: '+40251012345', taxId: 'RO43234591', country: 'Romania' },
  { name: 'HEPHAESTUS METALS SA', email: 'info@hephaestusmetals.ro', address: 'Zona Industrială 5, Galați', phone: '+40236123456', taxId: 'RO53234592', country: 'Romania' },
  { name: 'ATHENA WISDOM SRL', email: 'contact@athenawisdom.ro', address: 'Str. Înțelepciunii 21, Iași', phone: '+40232234567', taxId: 'RO63234593', country: 'Romania' },
  { name: 'APHRODITE COSMETICS SA', email: 'office@aphroditecosmetics.ro', address: 'Bd. Ferdinand 78, Cluj-Napoca', phone: '+40264345678', taxId: 'RO73234594', country: 'Romania' },
  { name: 'KRONOS TIME SRL', email: 'sales@kronostime.ro', address: 'Str. Timpului 10, București', phone: '+40217456789', taxId: 'RO83234595', country: 'Romania' },
  { name: 'GAIA ENVIRONMENT SA', email: 'info@gaiaenvironment.ro', address: 'Calea Ecologiei 95, Brașov', phone: '+40268567890', taxId: 'RO93234596', country: 'Romania' },
  { name: 'PROMETHEUS INNOVATION SRL', email: 'contact@prometheusinnovation.ro', address: 'Str. Inovației 3, Cluj-Napoca', phone: '+40264678901', taxId: 'RO04234597', country: 'Romania' },
  { name: 'HELIOS SOLAR SA', email: 'office@heliossolar.ro', address: 'Bd. Energiei Verzi 60, București', phone: '+40218789012', taxId: 'RO14234598', country: 'Romania' },
  { name: 'SELENE LIGHTING SRL', email: 'sales@selenelighting.ro', address: 'Str. Luminii 27, Timișoara', phone: '+40256890123', taxId: 'RO24234599', country: 'Romania' },
  { name: 'EOS MORNING SA', email: 'info@eosmorning.ro', address: 'Calea Dimineții 14, Iași', phone: '+40232901234', taxId: 'RO34234600', country: 'Romania' },
  { name: 'NIKE SPORTSWEAR SRL', email: 'contact@nikesportswear.ro', address: 'Str. Sportului 99, Brașov', phone: '+40268012345', taxId: 'RO44234601', country: 'Romania' },
  { name: 'IRIS COMMUNICATIONS SA', email: 'office@iriscommunications.ro', address: 'Bd. Comunicării 123, București', phone: '+40219123456', taxId: 'RO54234602', country: 'Romania' },
  { name: 'TYCHE GAMING SRL', email: 'sales@tychegaming.ro', address: 'Str. Norocului 88, Cluj-Napoca', phone: '+40264234567', taxId: 'RO64234603', country: 'Romania' },
  { name: 'NEMESIS LEGAL SA', email: 'info@nemesislegal.ro', address: 'Calea Justiției 41, București', phone: '+40210345678', taxId: 'RO74234604', country: 'Romania' },
  { name: 'MORPHEUS SLEEP SRL', email: 'contact@morpheussleep.ro', address: 'Str. Somnului 55, Timișoara', phone: '+40256456789', taxId: 'RO84234605', country: 'Romania' },
  { name: 'PAN MUSIC SA', email: 'office@panmusic.ro', address: 'Bd. Muzicii 72, Brașov', phone: '+40268567890', taxId: 'RO94234606', country: 'Romania' },
  { name: 'EROS PUBLISHING SRL', email: 'sales@erospublishing.ro', address: 'Str. Cărților 19, Iași', phone: '+40232678901', taxId: 'RO05234607', country: 'Romania' },
];

// Units of measure to use
const unitsOfMeasure = ['buc', 'kg', 'm', 'l', 'mp', 'ml', 'set', 'pereche', 'cutie', 'pachet', 'bax', 'bucată', 'metru', 'litru'];

async function main() {
  try {
    console.log('🚀 Starting complete data setup...\n');

    // Get tenant and database info
    const tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    if (!tenant) {
      throw new Error('Tenant with ID 1 not found. Please run seed.ts first.');
    }

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });

    if (!database) {
      throw new Error('Database not found for tenant');
    }

    console.log(`✅ Found tenant: ${tenant.name}`);
    console.log(`✅ Found database: ${database.name}\n`);

    // ==================== STEP 1: Add 50 Customers ====================
    console.log('📋 STEP 1: Adding 50 customers...');

    const customersTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'customers'
      },
      include: {
        columns: true,
        rows: true
      }
    });

    if (!customersTable) {
      throw new Error('Customers table not found. Please create it first.');
    }

    console.log(`   Found customers table with ${customersTable.columns.length} columns`);
    console.log(`   Current customers: ${customersTable.rows.length}`);

    // Get column mappings
    const customerColumns = {};
    customersTable.columns.forEach(col => {
      customerColumns[col.name] = col;
    });

    let customersAdded = 0;

    for (const customer of mockCustomers) {
      // Create row
      const row = await prisma.row.create({
        data: {
          tableId: customersTable.id,
        }
      });

      // Create cells for each column
      const cells = [];

      if (customerColumns['customer_name']) {
        cells.push({
          rowId: row.id,
          columnId: customerColumns['customer_name'].id,
          value: customer.name,
          stringValue: customer.name
        });
      }

      if (customerColumns['customer_email']) {
        cells.push({
          rowId: row.id,
          columnId: customerColumns['customer_email'].id,
          value: customer.email,
          stringValue: customer.email
        });
      }

      if (customerColumns['customer_address']) {
        cells.push({
          rowId: row.id,
          columnId: customerColumns['customer_address'].id,
          value: customer.address,
          stringValue: customer.address
        });
      }

      if (customerColumns['customer_phone']) {
        cells.push({
          rowId: row.id,
          columnId: customerColumns['customer_phone'].id,
          value: customer.phone,
          stringValue: customer.phone
        });
      }

      if (customerColumns['customer_tax_id']) {
        cells.push({
          rowId: row.id,
          columnId: customerColumns['customer_tax_id'].id,
          value: customer.taxId,
          stringValue: customer.taxId
        });
      }

      if (customerColumns['customer_country']) {
        cells.push({
          rowId: row.id,
          columnId: customerColumns['customer_country'].id,
          value: customer.country,
          stringValue: customer.country
        });
      }

      // Add created_at if exists
      if (customerColumns['created_at']) {
        const now = new Date();
        cells.push({
          rowId: row.id,
          columnId: customerColumns['created_at'].id,
          value: now.toISOString(),
          dateValue: now
        });
      }

      await prisma.cell.createMany({
        data: cells
      });

      customersAdded++;
      
      if (customersAdded % 10 === 0) {
        console.log(`   ✅ Added ${customersAdded} customers...`);
      }
    }

    console.log(`\n🎉 Successfully added ${customersAdded} customers!\n`);

    // ==================== STEP 2: Update Products unit_of_measure ====================
    console.log('📦 STEP 2: Updating Products unit_of_measure...');

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

    if (!productsTable) {
      throw new Error('Products table not found. Please create it first.');
    }

    console.log(`   Found Products table with ${productsTable.rows.length} products`);

    const unitOfMeasureColumn = productsTable.columns.find(col => col.name === 'unit_of_measure');

    if (!unitOfMeasureColumn) {
      throw new Error('unit_of_measure column not found in Products table');
    }

    let productsUpdated = 0;

    for (const row of productsTable.rows) {
      // Check if unit_of_measure already has a value
      const existingCell = row.cells.find(cell => cell.columnId === unitOfMeasureColumn.id);
      
      // Pick a random unit of measure
      const randomUnit = unitsOfMeasure[Math.floor(Math.random() * unitsOfMeasure.length)];

      if (existingCell) {
        // Update existing cell
        await prisma.cell.update({
          where: { id: existingCell.id },
          data: {
            value: randomUnit,
            stringValue: randomUnit
          }
        });
      } else {
        // Create new cell
        await prisma.cell.create({
          data: {
            rowId: row.id,
            columnId: unitOfMeasureColumn.id,
            value: randomUnit,
            stringValue: randomUnit
          }
        });
      }

      productsUpdated++;

      if (productsUpdated % 10 === 0) {
        console.log(`   ✅ Updated ${productsUpdated} products...`);
      }
    }

    console.log(`\n🎉 Successfully updated ${productsUpdated} products with unit_of_measure!\n`);

    // ==================== STEP 3: Generate 100 Invoices ====================
    console.log('💼 STEP 3: Generating 100 invoices with correct calculations...');

    // Get invoice tables
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

    if (!invoicesTable || !invoiceItemsTable) {
      throw new Error('Invoice tables not found. Please create them first.');
    }

    // Refresh customers and products data
    const updatedCustomersTable = await prisma.table.findFirst({
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

    const updatedProductsTable = await prisma.table.findFirst({
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

    console.log(`   Using ${updatedCustomersTable.rows.length} customers and ${updatedProductsTable.rows.length} products`);

    // Helper functions
    function getCellValue(row, columns, columnName) {
      const column = columns.find(c => c.name === columnName);
      if (!column) return null;
      
      const cell = row.cells.find(c => c.columnId === column.id);
      if (!cell) return null;
      
      if (cell.numberValue !== null) return parseFloat(cell.numberValue);
      if (cell.stringValue !== null) return cell.stringValue;
      if (cell.dateValue !== null) return cell.dateValue;
      if (cell.booleanValue !== null) return cell.booleanValue;
      
      return null;
    }

    const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'PayPal', 'Check'];
    const statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    const currencies = ['RON', 'EUR', 'USD'];

    let invoicesCreated = 0;
    let itemsCreated = 0;

    for (let i = 0; i < 100; i++) {
      // Select random customer
      const randomCustomer = updatedCustomersTable.rows[Math.floor(Math.random() * updatedCustomersTable.rows.length)];
      const customerId = randomCustomer.id;

      // Generate invoice data
      const invoiceNumber = `INV-2025-${String(i + 1).padStart(6, '0')}`;
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 90)); // Random date within last 90 days
      
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from issue date

      const baseCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      // Create invoice row
      const invoiceRow = await prisma.row.create({
        data: {
          tableId: invoicesTable.id,
        }
      });

      // Generate 1-8 random products for this invoice
      const numItems = Math.floor(Math.random() * 8) + 1;
      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      const invoiceItems = [];

      for (let j = 0; j < numItems; j++) {
        // Select random product
        const randomProduct = updatedProductsTable.rows[Math.floor(Math.random() * updatedProductsTable.rows.length)];
        
        const productName = getCellValue(randomProduct, updatedProductsTable.columns, 'name');
        const productPrice = parseFloat(getCellValue(randomProduct, updatedProductsTable.columns, 'price')) || 0;
        const productVat = parseFloat(getCellValue(randomProduct, updatedProductsTable.columns, 'vat')) || 19;
        const productCurrency = getCellValue(randomProduct, updatedProductsTable.columns, 'currency') || baseCurrency;
        const productDescription = getCellValue(randomProduct, updatedProductsTable.columns, 'description') || productName;
        const unitOfMeasure = getCellValue(randomProduct, updatedProductsTable.columns, 'unit_of_measure') || 'buc';

        // Random quantity between 1-20
        const quantity = Math.floor(Math.random() * 20) + 1;
        
        // Random discount rate between 0-15%
        const discountRate = Math.floor(Math.random() * 16);
        
        // Calculations
        const unitPrice = productPrice;
        const lineSubtotal = unitPrice * quantity;
        const discountAmount = (lineSubtotal * discountRate) / 100;
        const lineSubtotalAfterDiscount = lineSubtotal - discountAmount;
        const taxAmount = (lineSubtotalAfterDiscount * productVat) / 100;
        const lineTotal = lineSubtotalAfterDiscount + taxAmount;

        subtotal += lineSubtotalAfterDiscount;
        totalTax += taxAmount;
        totalDiscount += discountAmount;

        invoiceItems.push({
          productName,
          productDescription,
          quantity,
          unitPrice,
          unitOfMeasure,
          discountRate,
          discountAmount,
          taxRate: productVat,
          taxAmount,
          lineTotal
        });
      }

      const totalAmount = subtotal + totalTax;

      // Create invoice cells
      const invoiceCells = [];

      const invoiceColumnMap = {};
      invoicesTable.columns.forEach(col => {
        invoiceColumnMap[col.name] = col;
      });

      if (invoiceColumnMap['invoice_number']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['invoice_number'].id,
          value: invoiceNumber,
          stringValue: invoiceNumber
        });
      }

      if (invoiceColumnMap['date']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['date'].id,
          value: issueDate.toISOString().split('T')[0],
          stringValue: issueDate.toISOString().split('T')[0],
          dateValue: issueDate
        });
      }

      if (invoiceColumnMap['due_date']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['due_date'].id,
          value: dueDate.toISOString().split('T')[0],
          stringValue: dueDate.toISOString().split('T')[0],
          dateValue: dueDate
        });
      }

      if (invoiceColumnMap['customer_id']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['customer_id'].id,
          value: customerId,
          numberValue: customerId
        });
      }

      if (invoiceColumnMap['total_amount']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['total_amount'].id,
          value: totalAmount,
          numberValue: totalAmount
        });
      }

      if (invoiceColumnMap['subtotal']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['subtotal'].id,
          value: subtotal,
          numberValue: subtotal
        });
      }

      if (invoiceColumnMap['tax_amount']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['tax_amount'].id,
          value: totalTax,
          numberValue: totalTax
        });
      }

      if (invoiceColumnMap['discount_amount']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['discount_amount'].id,
          value: totalDiscount,
          numberValue: totalDiscount
        });
      }

      if (invoiceColumnMap['status']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['status'].id,
          value: status,
          stringValue: status
        });
      }

      if (invoiceColumnMap['payment_method']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['payment_method'].id,
          value: paymentMethod,
          stringValue: paymentMethod
        });
      }

      if (invoiceColumnMap['base_currency']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['base_currency'].id,
          value: baseCurrency,
          stringValue: baseCurrency
        });
      }

      await prisma.cell.createMany({
        data: invoiceCells
      });

      // Create invoice items
      const itemColumnMap = {};
      invoiceItemsTable.columns.forEach(col => {
        itemColumnMap[col.name] = col;
      });

      for (const item of invoiceItems) {
        const itemRow = await prisma.row.create({
          data: {
            tableId: invoiceItemsTable.id,
          }
        });

        const itemCells = [];

        if (itemColumnMap['invoice_id']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['invoice_id'].id,
            value: invoiceRow.id,
            numberValue: invoiceRow.id
          });
        }

        if (itemColumnMap['description']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['description'].id,
            value: item.productDescription,
            stringValue: item.productDescription
          });
        }

        if (itemColumnMap['quantity']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['quantity'].id,
            value: item.quantity,
            numberValue: item.quantity
          });
        }

        if (itemColumnMap['unit_price']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['unit_price'].id,
            value: item.unitPrice,
            numberValue: item.unitPrice
          });
        }

        if (itemColumnMap['unit_of_measure']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['unit_of_measure'].id,
            value: item.unitOfMeasure,
            stringValue: item.unitOfMeasure
          });
        }

        if (itemColumnMap['discount_rate']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['discount_rate'].id,
            value: item.discountRate,
            numberValue: item.discountRate
          });
        }

        if (itemColumnMap['discount_amount']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['discount_amount'].id,
            value: item.discountAmount,
            numberValue: item.discountAmount
          });
        }

        if (itemColumnMap['tax_rate']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['tax_rate'].id,
            value: item.taxRate,
            numberValue: item.taxRate
          });
        }

        if (itemColumnMap['tax_amount']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['tax_amount'].id,
            value: item.taxAmount,
            numberValue: item.taxAmount
          });
        }

        if (itemColumnMap['total_price']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['total_price'].id,
            value: item.lineTotal,
            numberValue: item.lineTotal
          });
        }

        await prisma.cell.createMany({
          data: itemCells
        });

        itemsCreated++;
      }

      invoicesCreated++;
      
      if (invoicesCreated % 10 === 0) {
        console.log(`   ✅ Created ${invoicesCreated} invoices with ${itemsCreated} items...`);
      }
    }

    console.log(`\n🎉 Successfully created ${invoicesCreated} invoices with ${itemsCreated} invoice items!`);
    console.log(`   Average items per invoice: ${(itemsCreated / invoicesCreated).toFixed(2)}\n`);

    // Final summary
    console.log('═══════════════════════════════════════');
    console.log('✨ COMPLETE DATA SETUP SUMMARY ✨');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Customers added: ${customersAdded}`);
    console.log(`✅ Products updated: ${productsUpdated}`);
    console.log(`✅ Invoices created: ${invoicesCreated}`);
    console.log(`✅ Invoice items created: ${itemsCreated}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during data setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

