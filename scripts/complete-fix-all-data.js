const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Real product data with Romanian products
const realProducts = [
  { name: 'Laptop Dell Latitude 7420', sku: 'DELL-LAT-7420', price: 4599.00, category: 'Electronice', vat: 19, description: 'Laptop business Dell Latitude 7420, Intel Core i7, 16GB RAM, 512GB SSD', brand: 'Dell', currency: 'RON' },
  { name: 'Monitor LG UltraWide 34"', sku: 'LG-UW-34', price: 2199.00, category: 'Electronice', vat: 19, description: 'Monitor LG UltraWide 34 inch, rezoluție 2560x1080, IPS', brand: 'LG', currency: 'RON' },
  { name: 'Tastatură mecanică Logitech MX Keys', sku: 'LOG-MXK-BLK', price: 549.00, category: 'Accesorii', vat: 19, description: 'Tastatură mecanică wireless Logitech MX Keys, iluminare LED', brand: 'Logitech', currency: 'RON' },
  { name: 'Mouse Logitech MX Master 3', sku: 'LOG-MXM3-BLK', price: 449.00, category: 'Accesorii', vat: 19, description: 'Mouse wireless ergonomic Logitech MX Master 3, 7 butoane', brand: 'Logitech', currency: 'RON' },
  { name: 'Scaun ergonomic Herman Miller Aeron', sku: 'HM-AERON-B', price: 6499.00, category: 'Mobilier', vat: 19, description: 'Scaun de birou ergonomic Herman Miller Aeron, suport lombar', brand: 'Herman Miller', currency: 'RON' },
  { name: 'Birou reglabil electric IKEA Bekant', sku: 'IKEA-BEK-160', price: 2299.00, category: 'Mobilier', vat: 19, description: 'Birou reglabil pe înălțime electric IKEA Bekant 160x80cm', brand: 'IKEA', currency: 'RON' },
  { name: 'Imprimantă HP LaserJet Pro M404dn', sku: 'HP-LJ-M404', price: 1299.00, category: 'Electronice', vat: 19, description: 'Imprimantă laser alb-negru HP LaserJet Pro M404dn, duplex', brand: 'HP', currency: 'RON' },
  { name: 'Router Wireless TP-Link Archer AX73', sku: 'TPL-AX73', price: 649.00, category: 'Rețea', vat: 19, description: 'Router wireless TP-Link Archer AX73, WiFi 6, AX5400', brand: 'TP-Link', currency: 'RON' },
  { name: 'Switch Cisco SG350-28', sku: 'CISCO-SG350-28', price: 1899.00, category: 'Rețea', vat: 19, description: 'Switch managed Cisco SG350-28, 28 porturi Gigabit', brand: 'Cisco', currency: 'RON' },
  { name: 'Telefon iPhone 15 Pro 256GB', sku: 'APPL-IP15P-256', price: 6299.00, category: 'Telefoane', vat: 19, description: 'iPhone 15 Pro 256GB, Titanium Black, A17 Pro', brand: 'Apple', currency: 'RON' },
  { name: 'Tabletă Samsung Galaxy Tab S9', sku: 'SAMS-TABS9-128', price: 3499.00, category: 'Tablete', vat: 19, description: 'Tabletă Samsung Galaxy Tab S9, 11 inch, 128GB', brand: 'Samsung', currency: 'RON' },
  { name: 'Căști Sony WH-1000XM5', sku: 'SONY-WH1000XM5', price: 1799.00, category: 'Audio', vat: 19, description: 'Căști wireless Sony WH-1000XM5, noise cancelling', brand: 'Sony', currency: 'RON' },
  { name: 'Boxe Logitech Z625', sku: 'LOG-Z625', price: 899.00, category: 'Audio', vat: 19, description: 'Sistem de boxe 2.1 Logitech Z625, 400W RMS', brand: 'Logitech', currency: 'RON' },
  { name: 'Webcam Logitech Brio 4K', sku: 'LOG-BRIO-4K', price: 899.00, category: 'Video', vat: 19, description: 'Webcam Logitech Brio, rezoluție 4K, autofocus', brand: 'Logitech', currency: 'RON' },
  { name: 'Microfon Blue Yeti USB', sku: 'BLUE-YETI-BLK', price: 699.00, category: 'Audio', vat: 19, description: 'Microfon USB Blue Yeti, condensator, 4 pattern-uri', brand: 'Blue', currency: 'RON' },
  { name: 'Hard disk extern WD My Passport 5TB', sku: 'WD-MP-5TB', price: 599.00, category: 'Stocare', vat: 19, description: 'Hard disk extern WD My Passport 5TB, USB 3.2', brand: 'Western Digital', currency: 'RON' },
  { name: 'SSD Samsung 980 Pro 2TB', sku: 'SAMS-980P-2TB', price: 899.00, category: 'Stocare', vat: 19, description: 'SSD NVMe Samsung 980 Pro 2TB, PCIe 4.0', brand: 'Samsung', currency: 'RON' },
  { name: 'Memorie RAM Kingston Fury 32GB', sku: 'KING-FURY-32', price: 549.00, category: 'Componente', vat: 19, description: 'Memorie RAM Kingston Fury Beast 32GB DDR4 3200MHz', brand: 'Kingston', currency: 'RON' },
  { name: 'Placă video NVIDIA RTX 4070', sku: 'NV-RTX4070', price: 3299.00, category: 'Componente', vat: 19, description: 'Placă video NVIDIA GeForce RTX 4070, 12GB GDDR6X', brand: 'NVIDIA', currency: 'RON' },
  { name: 'Procesor AMD Ryzen 7 7800X3D', sku: 'AMD-R7-7800X3D', price: 2199.00, category: 'Componente', vat: 19, description: 'Procesor AMD Ryzen 7 7800X3D, 8 core, 16 thread', brand: 'AMD', currency: 'RON' },
  { name: 'Placă de bază ASUS ROG Strix B650-E', sku: 'ASUS-B650E', price: 1599.00, category: 'Componente', vat: 19, description: 'Placă de bază ASUS ROG Strix B650-E Gaming WiFi', brand: 'ASUS', currency: 'RON' },
  { name: 'Sursă modulară Corsair RM850x', sku: 'CORS-RM850X', price: 699.00, category: 'Componente', vat: 19, description: 'Sursă modulară Corsair RM850x, 850W, 80+ Gold', brand: 'Corsair', currency: 'RON' },
  { name: 'Carcasă Fractal Design Meshify 2', sku: 'FD-MESH2', price: 649.00, category: 'Componente', vat: 19, description: 'Carcasă Fractal Design Meshify 2, ATX, tempered glass', brand: 'Fractal Design', currency: 'RON' },
  { name: 'Cooler CPU Noctua NH-D15', sku: 'NOCT-NHD15', price: 499.00, category: 'Cooling', vat: 19, description: 'Cooler CPU Noctua NH-D15, dual tower, 2 ventilatoare', brand: 'Noctua', currency: 'RON' },
  { name: 'Ventilator carcasă Noctua NF-A12x25', sku: 'NOCT-A12X25', price: 149.00, category: 'Cooling', vat: 19, description: 'Ventilator carcasă Noctua NF-A12x25, 120mm, PWM', brand: 'Noctua', currency: 'RON' },
  { name: 'Cablu HDMI 2.1 Ultra High Speed 3m', sku: 'CBL-HDMI21-3M', price: 149.00, category: 'Cabluri', vat: 19, description: 'Cablu HDMI 2.1 Ultra High Speed, 3 metri, 8K@60Hz', brand: 'Premium', currency: 'RON' },
  { name: 'Cablu USB-C la USB-C 2m', sku: 'CBL-USBC-2M', price: 99.00, category: 'Cabluri', vat: 19, description: 'Cablu USB-C la USB-C, 2 metri, USB 3.2 Gen 2', brand: 'Anker', currency: 'RON' },
  { name: 'Hub USB-C Anker 7-in-1', sku: 'ANK-HUB7', price: 349.00, category: 'Accesorii', vat: 19, description: 'Hub USB-C Anker 7-in-1, HDMI, USB 3.0, card reader', brand: 'Anker', currency: 'RON' },
  { name: 'Încărcător wireless Anker PowerWave', sku: 'ANK-PWV-10W', price: 149.00, category: 'Accesorii', vat: 19, description: 'Încărcător wireless Anker PowerWave, 10W, Qi', brand: 'Anker', currency: 'RON' },
  { name: 'Baterie externă Anker PowerCore 26800', sku: 'ANK-PC-26800', price: 299.00, category: 'Accesorii', vat: 19, description: 'Baterie externă Anker PowerCore 26800mAh, USB-C', brand: 'Anker', currency: 'RON' },
  { name: 'Lampă de birou LED Xiaomi Mi', sku: 'XIAO-LAMP-LED', price: 199.00, category: 'Iluminat', vat: 19, description: 'Lampă de birou LED Xiaomi Mi, reglabilă, WiFi', brand: 'Xiaomi', currency: 'RON' },
  { name: 'Suport laptop reglabil', sku: 'SUPT-LAPTOP-ADJ', price: 149.00, category: 'Accesorii', vat: 19, description: 'Suport laptop reglabil pe înălțime, aluminium', brand: 'Generic', currency: 'RON' },
  { name: 'Mouse pad XXL gaming', sku: 'MPAD-XXL-BLK', price: 79.00, category: 'Accesorii', vat: 19, description: 'Mouse pad XXL gaming, 90x40cm, anti-slip', brand: 'SteelSeries', currency: 'RON' },
  { name: 'Filtru de privaitate pentru monitor 24"', sku: 'FILT-PRIV-24', price: 249.00, category: 'Accesorii', vat: 19, description: 'Filtru de privacy pentru monitor 24 inch, anti-glare', brand: '3M', currency: 'RON' },
  { name: 'Kit de curățare pentru electronice', sku: 'KIT-CLEAN-ELEC', price: 89.00, category: 'Consumabile', vat: 19, description: 'Kit complet de curățare pentru electronice', brand: 'Emtec', currency: 'RON' },
  { name: 'Spray aer comprimat 400ml', sku: 'SPRAY-AIR-400', price: 35.00, category: 'Consumabile', vat: 19, description: 'Spray cu aer comprimat pentru curățare, 400ml', brand: 'Emtec', currency: 'RON' },
  { name: 'Pasta termică Arctic MX-4', sku: 'ARCT-MX4-4G', price: 49.00, category: 'Consumabile', vat: 19, description: 'Pasta termică Arctic MX-4, 4 grame', brand: 'Arctic', currency: 'RON' },
  { name: 'Baterii Duracell AA set 12 buc', sku: 'DUR-AA-12', price: 45.00, category: 'Consumabile', vat: 19, description: 'Set 12 baterii alcaline Duracell AA', brand: 'Duracell', currency: 'RON' },
  { name: 'Hârtie copiator A4 500 coli', sku: 'HAR-A4-500', price: 25.00, category: 'Consumabile', vat: 19, description: 'Hârtie copiator A4, 80g/mp, 500 coli', brand: 'Double A', currency: 'RON' },
  { name: 'Cartus toner HP 85A negru', sku: 'HP-85A-BLK', price: 399.00, category: 'Consumabile', vat: 19, description: 'Cartus toner original HP 85A negru', brand: 'HP', currency: 'RON' },
  { name: 'Aparat de cafea Philips LatteGo', sku: 'PHIL-LATTE-3200', price: 2499.00, category: 'Electrocasnice', vat: 19, description: 'Aparat de cafea automat Philips 3200 LatteGo', brand: 'Philips', currency: 'RON' },
  { name: 'Fierbător electric Bosch 1.7L', sku: 'BOSCH-FIERB-17', price: 199.00, category: 'Electrocasnice', vat: 19, description: 'Fierbător electric Bosch, 1.7L, 2400W, inox', brand: 'Bosch', currency: 'RON' },
  { name: 'Aspirator robot Roborock S7', sku: 'ROBO-S7', price: 2799.00, category: 'Electrocasnice', vat: 19, description: 'Aspirator robot Roborock S7, mop sonic, navigație laser', brand: 'Roborock', currency: 'RON' },
  { name: 'Purificator aer Xiaomi Mi 3H', sku: 'XIAO-AIR-3H', price: 899.00, category: 'Electrocasnice', vat: 19, description: 'Purificator de aer Xiaomi Mi 3H, HEPA, WiFi', brand: 'Xiaomi', currency: 'RON' },
  { name: 'Umidificator Levoit LV600HH', sku: 'LEV-600HH', price: 549.00, category: 'Electrocasnice', vat: 19, description: 'Umidificator ultrasonic Levoit LV600HH, 6L', brand: 'Levoit', currency: 'RON' },
  { name: 'Prelungitor Brennenstuhl 3m 8 prize', sku: 'BREN-PREL-3M-8', price: 149.00, category: 'Electrice', vat: 19, description: 'Prelungitor Brennenstuhl Premium-Line, 3m, 8 prize', brand: 'Brennenstuhl', currency: 'RON' },
  { name: 'Stabilizator tensiune 1000VA', sku: 'STAB-AVR-1000', price: 449.00, category: 'Electrice', vat: 19, description: 'Stabilizator de tensiune AVR 1000VA', brand: 'Powercom', currency: 'RON' },
  { name: 'UPS APC Back-UPS 950VA', sku: 'APC-BX950', price: 599.00, category: 'Electrice', vat: 19, description: 'UPS APC Back-UPS BX950UI, 950VA, AVR', brand: 'APC', currency: 'RON' },
  { name: 'Multifuncțional Epson EcoTank L3250', sku: 'EPS-L3250', price: 1099.00, category: 'Electronice', vat: 19, description: 'Multifuncțional Epson EcoTank L3250, inkjet, WiFi', brand: 'Epson', currency: 'RON' },
  { name: 'Scanner Epson DS-730N', sku: 'EPS-DS730N', price: 2799.00, category: 'Electronice', vat: 19, description: 'Scanner Epson WorkForce DS-730N, duplex, rețea', brand: 'Epson', currency: 'RON' },
];

async function fixAllData() {
  try {
    console.log('🚀 Starting complete data fix...\n');

    const tenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });

    // ==================== STEP 1: Update Products with Real Data ====================
    console.log('═══════════════════════════════════════');
    console.log('📦 STEP 1: Updating Products with real data...');
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
          }
        }
      }
    });

    console.log(`Found ${productsTable.rows.length} products`);

    const productColumnMap = {};
    productsTable.columns.forEach(col => {
      productColumnMap[col.name] = col;
    });

    let productsUpdated = 0;

    for (let i = 0; i < productsTable.rows.length && i < realProducts.length; i++) {
      const row = productsTable.rows[i];
      const productData = realProducts[i];

      // Delete existing cells for this row (except unit_of_measure which we keep)
      const cellsToDelete = row.cells.filter(cell => {
        const col = productsTable.columns.find(c => c.id === cell.columnId);
        return col && col.name !== 'unit_of_measure';
      });

      for (const cell of cellsToDelete) {
        await prisma.cell.delete({ where: { id: cell.id } });
      }

      // Create new cells with real data
      const cellsToCreate = [];

      if (productColumnMap['name']) {
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['name'].id,
          value: productData.name,
          stringValue: productData.name
        });
      }

      if (productColumnMap['sku']) {
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['sku'].id,
          value: productData.sku,
          stringValue: productData.sku
        });
      }

      if (productColumnMap['price']) {
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['price'].id,
          value: productData.price,
          numberValue: productData.price
        });
      }

      if (productColumnMap['category']) {
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['category'].id,
          value: productData.category,
          stringValue: productData.category
        });
      }

      if (productColumnMap['vat']) {
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['vat'].id,
          value: productData.vat,
          numberValue: productData.vat
        });
      }

      if (productColumnMap['description']) {
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['description'].id,
          value: productData.description,
          stringValue: productData.description
        });
      }

      if (productColumnMap['brand']) {
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['brand'].id,
          value: productData.brand,
          stringValue: productData.brand
        });
      }

      if (productColumnMap['currency']) {
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['currency'].id,
          value: [productData.currency],
          stringValue: productData.currency
        });
      }

      if (productColumnMap['created_at']) {
        const now = new Date();
        cellsToCreate.push({
          rowId: row.id,
          columnId: productColumnMap['created_at'].id,
          value: now.toISOString(),
          dateValue: now
        });
      }

      await prisma.cell.createMany({
        data: cellsToCreate
      });

      productsUpdated++;
      
      if (productsUpdated % 10 === 0) {
        console.log(`   ✅ Updated ${productsUpdated} products...`);
      }
    }

    console.log(`\n🎉 Successfully updated ${productsUpdated} products!\n`);

    // ==================== STEP 2: Delete Bad Invoices ====================
    console.log('═══════════════════════════════════════');
    console.log('🗑️  STEP 2: Deleting incorrectly generated invoices...');
    console.log('═══════════════════════════════════════\n');

    const invoicesTable = await prisma.table.findFirst({
      where: { 
        databaseId: database.id,
        name: 'invoices'
      },
      include: {
        columns: true,
        rows: true
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

    // Find invoices with INV-2025 prefix (generated by my script)
    const invoicesToDelete = [];
    
    for (const row of invoicesTable.rows) {
      const invoiceNumberCol = invoicesTable.columns.find(c => c.name === 'invoice_number');
      if (invoiceNumberCol) {
        const cell = await prisma.cell.findFirst({
          where: {
            rowId: row.id,
            columnId: invoiceNumberCol.id
          }
        });
        
        if (cell && cell.stringValue && cell.stringValue.startsWith('INV-2025')) {
          invoicesToDelete.push(row.id);
        }
      }
    }

    console.log(`Found ${invoicesToDelete.length} invoices to delete`);

    // Delete invoice items first
    let itemsDeleted = 0;
    const invoiceIdCol = invoiceItemsTable.columns.find(c => c.name === 'invoice_id');
    
    if (invoiceIdCol) {
      for (const invoiceId of invoicesToDelete) {
        const itemsToDelete = invoiceItemsTable.rows.filter(row => {
          const cell = row.cells.find(c => c.columnId === invoiceIdCol.id);
          return cell && cell.numberValue === invoiceId;
        });

        for (const item of itemsToDelete) {
          await prisma.row.delete({ where: { id: item.id } });
          itemsDeleted++;
        }
      }
    }

    // Delete invoices
    for (const invoiceId of invoicesToDelete) {
      await prisma.row.delete({ where: { id: invoiceId } });
    }

    console.log(`   ✅ Deleted ${invoicesToDelete.length} invoices and ${itemsDeleted} invoice items\n`);

    // ==================== STEP 3: Generate Correct Invoices ====================
    console.log('═══════════════════════════════════════');
    console.log('💼 STEP 3: Generating 100 correct invoices...');
    console.log('═══════════════════════════════════════\n');

    // Refresh data
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

    console.log(`Using ${updatedCustomersTable.rows.length} customers and ${updatedProductsTable.rows.length} products`);

    function getCellValue(row, columns, columnName) {
      const column = columns.find(c => c.name === columnName);
      if (!column) return null;
      
      const cell = row.cells.find(c => c.columnId === column.id);
      if (!cell) return null;
      
      if (cell.numberValue !== null && cell.numberValue !== undefined) return parseFloat(cell.numberValue);
      if (cell.stringValue !== null) return cell.stringValue;
      if (cell.dateValue !== null) return cell.dateValue;
      if (cell.booleanValue !== null) return cell.booleanValue;
      
      return null;
    }

    const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'PayPal', 'Check'];
    const paymentTerms = ['Net 30', 'Net 15', 'Due on Receipt', 'Net 45', 'Net 60'];
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
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 90));
      
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);

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

      // Generate 1-8 random products for this invoice
      const numItems = Math.floor(Math.random() * 8) + 1;
      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      const invoiceItems = [];

      for (let j = 0; j < numItems; j++) {
        const randomProduct = updatedProductsTable.rows[Math.floor(Math.random() * updatedProductsTable.rows.length)];
        
        const productId = randomProduct.id;
        const productName = getCellValue(randomProduct, updatedProductsTable.columns, 'name') || 'Unknown Product';
        const productPrice = parseFloat(getCellValue(randomProduct, updatedProductsTable.columns, 'price')) || 100;
        const productVat = parseFloat(getCellValue(randomProduct, updatedProductsTable.columns, 'vat')) || 19;
        const productCurrency = getCellValue(randomProduct, updatedProductsTable.columns, 'currency') || baseCurrency;
        const productDescription = getCellValue(randomProduct, updatedProductsTable.columns, 'description') || productName;
        const productCategory = getCellValue(randomProduct, updatedProductsTable.columns, 'category') || 'General';
        const productSku = getCellValue(randomProduct, updatedProductsTable.columns, 'sku') || `SKU-${productId}`;
        const productBrand = getCellValue(randomProduct, updatedProductsTable.columns, 'brand') || 'Generic';
        const unitOfMeasure = getCellValue(randomProduct, updatedProductsTable.columns, 'unit_of_measure') || 'buc';

        const quantity = Math.floor(Math.random() * 20) + 1;
        const discountRate = Math.floor(Math.random() * 16);
        
        // Exchange rate (simplified - assume 1 for same currency)
        let exchangeRate = 1;
        if (productCurrency !== baseCurrency) {
          if (baseCurrency === 'RON' && productCurrency === 'EUR') exchangeRate = 4.97;
          else if (baseCurrency === 'RON' && productCurrency === 'USD') exchangeRate = 4.55;
          else if (baseCurrency === 'EUR' && productCurrency === 'RON') exchangeRate = 0.20;
          else if (baseCurrency === 'EUR' && productCurrency === 'USD') exchangeRate = 0.92;
          else if (baseCurrency === 'USD' && productCurrency === 'RON') exchangeRate = 0.22;
          else if (baseCurrency === 'USD' && productCurrency === 'EUR') exchangeRate = 1.09;
        }

        const unitPrice = productPrice * exchangeRate;
        const lineSubtotal = unitPrice * quantity;
        const discountAmount = (lineSubtotal * discountRate) / 100;
        const lineSubtotalAfterDiscount = lineSubtotal - discountAmount;
        const taxAmount = (lineSubtotalAfterDiscount * productVat) / 100;
        const lineTotal = lineSubtotalAfterDiscount + taxAmount;

        subtotal += lineSubtotalAfterDiscount;
        totalTax += taxAmount;
        totalDiscount += discountAmount;

        invoiceItems.push({
          productId,
          productName,
          productDescription,
          productCategory,
          productSku,
          productBrand,
          productVat,
          quantity,
          unitPrice,
          unitOfMeasure,
          discountRate,
          discountAmount,
          taxRate: productVat,
          taxAmount,
          lineTotal,
          currency: baseCurrency
        });
      }

      const totalAmount = subtotal + totalTax;

      // Create invoice cells - ALL COLUMNS
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

      if (invoiceColumnMap['tax_total']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['tax_total'].id,
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

      if (invoiceColumnMap['discount_rate']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['discount_rate'].id,
          value: 0,
          numberValue: 0
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

      if (invoiceColumnMap['payment_terms']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['payment_terms'].id,
          value: paymentTerm,
          stringValue: paymentTerm
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

      if (invoiceColumnMap['notes']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['notes'].id,
          value: 'Vă mulțumim pentru achiziție!',
          stringValue: 'Vă mulțumim pentru achiziție!'
        });
      }

      if (invoiceColumnMap['invoice_series']) {
        invoiceCells.push({
          rowId: invoiceRow.id,
          columnId: invoiceColumnMap['invoice_series'].id,
          value: 'INV',
          stringValue: 'INV'
        });
      }

      await prisma.cell.createMany({
        data: invoiceCells
      });

      // Create invoice items - ALL COLUMNS
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

        if (itemColumnMap['product_ref_table']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['product_ref_table'].id,
            value: 'Products',
            stringValue: 'Products'
          });
        }

        if (itemColumnMap['product_ref_id']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['product_ref_id'].id,
            value: item.productId,
            numberValue: item.productId
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

        if (itemColumnMap['product_name']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['product_name'].id,
            value: item.productName,
            stringValue: item.productName
          });
        }

        if (itemColumnMap['product_description']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['product_description'].id,
            value: item.productDescription,
            stringValue: item.productDescription
          });
        }

        if (itemColumnMap['product_category']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['product_category'].id,
            value: item.productCategory,
            stringValue: item.productCategory
          });
        }

        if (itemColumnMap['product_sku']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['product_sku'].id,
            value: item.productSku,
            stringValue: item.productSku
          });
        }

        if (itemColumnMap['product_brand']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['product_brand'].id,
            value: item.productBrand,
            stringValue: item.productBrand
          });
        }

        if (itemColumnMap['product_vat']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['product_vat'].id,
            value: item.productVat,
            numberValue: item.productVat
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

        if (itemColumnMap['currency']) {
          itemCells.push({
            rowId: itemRow.id,
            columnId: itemColumnMap['currency'].id,
            value: item.currency,
            stringValue: item.currency
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
    console.log('✨ COMPLETE DATA FIX SUMMARY ✨');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Products updated: ${productsUpdated}`);
    console.log(`✅ Bad invoices deleted: ${invoicesToDelete.length}`);
    console.log(`✅ New invoices created: ${invoicesCreated}`);
    console.log(`✅ Invoice items created: ${itemsCreated}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during data fix:', error);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAllData();

