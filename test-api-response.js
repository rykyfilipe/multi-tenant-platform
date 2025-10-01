const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testAPIResponse() {
  try {
    // Find Bondor's tenant
    const tenant = await prisma.tenant.findFirst({
      where: { name: "Bondor's tenant" },
    });

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id },
    });

    // Find invoice_items table
    const invoiceItemsTable = await prisma.table.findFirst({
      where: { name: 'invoice_items', databaseId: database.id },
    });

    // Get invoice items for invoice 104
    const items = await prisma.row.findMany({
      where: {
        tableId: invoiceItemsTable.id,
        cells: {
          some: {
            column: {
              name: "invoice_id",
            },
            value: { equals: 104 },
          },
        },
      },
      include: {
        cells: {
          include: {
            column: true,
          },
        },
      },
    });

    console.log('🔍 Testing API Response for Invoice 104');

    // Simulate what the API does
    const transformedItems = items.map(item => {
      const itemData = {};
      item.cells.forEach((cell) => {
        itemData[cell.column.name] = cell.value;
      });
      return itemData;
    });

    console.log('📋 Items from database:');
    transformedItems.forEach((item, index) => {
      console.log(`  Item ${index + 1}:`, {
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency: item.currency,
        product_vat: item.product_vat,
        product_ref_table: item.product_ref_table,
        product_ref_id: item.product_ref_id
      });
    });

    // Map items like API does
    const mappedItems = transformedItems.map(item => ({
      id: item.id,
      product_ref_table: item.product_ref_table || '',
      product_ref_id: item.product_ref_id || 0,
      quantity: Number(item.quantity) || 0,
      price: Number(item.unit_price || item.price) || 0, // Use unit_price as price
      currency: item.currency || 'USD',
      product_vat: Number(item.product_vat) || 0,
      description: item.description || item.product_description || '',
      unit_of_measure: item.unit_of_measure || 'pcs',
    }));

    console.log('\n📋 Mapped items for calculation:');
    mappedItems.forEach((item, index) => {
      console.log(`  Item ${index + 1}:`, {
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        product_vat: item.product_vat
      });
    });

    // Calculate totals manually like the service does
    let subtotal = 0;
    let vatTotal = 0;
    
    mappedItems.forEach(item => {
      const safePrice = typeof item.price === 'number' && !isNaN(item.price) && isFinite(item.price) && item.price >= 0 ? item.price : 0;
      const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && isFinite(item.quantity) && item.quantity >= 0 ? item.quantity : 0;
      const safeVatRate = typeof item.product_vat === 'number' && !isNaN(item.product_vat) && isFinite(item.product_vat) && item.product_vat >= 0 ? item.product_vat : 0;
      
      const calculatedTotal = safePrice * safeQuantity;
      const itemVat = (calculatedTotal * safeVatRate) / 100;
      
      subtotal += calculatedTotal;
      vatTotal += itemVat;
    });

    const grandTotal = subtotal + vatTotal;
    
    const totals = {
      subtotal,
      vatTotal,
      grandTotal,
      baseCurrency
    };
    
    const baseCurrency = 'USD'; // From invoice
    const totals = await InvoiceCalculationService.calculateInvoiceTotals(
      mappedItems,
      {
        baseCurrency,
        exchangeRates: {},
      },
    );

    console.log('\n💰 API Calculated totals:');
    console.log('  subtotal:', totals.subtotal);
    console.log('  vatTotal:', totals.vatTotal);
    console.log('  grandTotal:', totals.grandTotal);
    console.log('  baseCurrency:', totals.baseCurrency);

    // Simulate API response
    const apiResponse = {
      invoice: {
        invoice_number: 'INV-2025-000001',
        base_currency: 'USD'
      },
      customer: {
        customer_name: 'Test Customer'
      },
      items: transformedItems,
      totals: {
        subtotal: totals.subtotal,
        vat_total: totals.vatTotal,
        grand_total: totals.grandTotal,
        base_currency: totals.baseCurrency,
      },
    };

    console.log('\n📤 API Response totals:');
    console.log('  subtotal:', apiResponse.totals.subtotal);
    console.log('  vat_total:', apiResponse.totals.vat_total);
    console.log('  grand_total:', apiResponse.totals.grand_total);
    console.log('  base_currency:', apiResponse.totals.base_currency);

    // Simulate PDFPreviewModal transformation
    const previewData = {
      items: apiResponse.items.map((item) => ({
        product_name: item.product_name || 'Product',
        description: item.description || item.product_description || '',
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        total: Number(item.total_price) || Number(item.unit_price) * Number(item.quantity) || 0,
        vat_rate: Number(item.product_vat) || 0,
        currency: item.currency || 'USD'
      })),
      totals: {
        subtotal: apiResponse.totals.subtotal || 0,
        vatTotal: apiResponse.totals.vatTotal || apiResponse.totals.vat_total || 0,
        grandTotal: apiResponse.totals.grandTotal || apiResponse.totals.grand_total || 0,
        currency: apiResponse.totals.base_currency || apiResponse.invoice.base_currency || 'USD'
      }
    };

    console.log('\n📱 Preview Data totals:');
    console.log('  subtotal:', previewData.totals.subtotal);
    console.log('  vatTotal:', previewData.totals.vatTotal);
    console.log('  grandTotal:', previewData.totals.grandTotal);
    console.log('  currency:', previewData.totals.currency);

    // Test item totals
    console.log('\n📦 Item totals in preview:');
    previewData.items.forEach((item, index) => {
      console.log(`  Item ${index + 1}:`, {
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        vat_rate: item.vat_rate,
        currency: item.currency
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIResponse();
