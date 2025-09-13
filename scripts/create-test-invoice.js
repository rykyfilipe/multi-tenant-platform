/**
 * Create Test Invoice for ANAF Testing
 * 
 * This script creates a test invoice in the invoices table
 * that can be used for ANAF e-Factura testing
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createTestInvoice() {
  console.log('🚀 Creating test invoice for ANAF testing...');
  
  try {
    // Get the first tenant
    const tenant = await prisma.tenant.findFirst({
      where: { name: { not: null } }
    });
    
    if (!tenant) {
      throw new Error('No tenant found. Please create a tenant first.');
    }
    
    console.log(`📋 Using tenant: ${tenant.name} (ID: ${tenant.id})`);
    
    // Get the tenant's database
    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id }
    });
    
    if (!database) {
      throw new Error(`No database found for tenant ${tenant.id}`);
    }
    
    console.log(`🗄️  Using database: ${database.name} (ID: ${database.id})`);
    
    // Get invoice tables
    const invoicesTable = await prisma.table.findFirst({
      where: {
        databaseId: database.id,
        name: 'invoices',
        isProtected: true,
        protectedType: 'invoices'
      },
      include: { columns: true }
    });
    
    const customersTable = await prisma.table.findFirst({
      where: {
        databaseId: database.id,
        name: 'customers',
        isProtected: true,
        protectedType: 'customers'
      },
      include: { columns: true }
    });
    
    const invoiceItemsTable = await prisma.table.findFirst({
      where: {
        databaseId: database.id,
        name: 'invoice_items',
        isProtected: true,
        protectedType: 'invoice_items'
      },
      include: { columns: true }
    });
    
    if (!invoicesTable || !customersTable || !invoiceItemsTable) {
      console.log('⚠️  Invoice tables not found. Initializing invoice system...');
      
      // Initialize invoice system
      const { InvoiceSystemService } = require('../src/lib/invoice-system');
      await InvoiceSystemService.initializeInvoiceTables(tenant.id, database.id);
      
      // Refetch tables
      const updatedInvoicesTable = await prisma.table.findFirst({
        where: {
          databaseId: database.id,
          name: 'invoices',
          isProtected: true,
          protectedType: 'invoices'
        },
        include: { columns: true }
      });
      
      const updatedCustomersTable = await prisma.table.findFirst({
        where: {
          databaseId: database.id,
          name: 'customers',
          isProtected: true,
          protectedType: 'customers'
        },
        include: { columns: true }
      });
      
      const updatedInvoiceItemsTable = await prisma.table.findFirst({
        where: {
          databaseId: database.id,
          name: 'invoice_items',
          isProtected: true,
          protectedType: 'invoice_items'
        },
        include: { columns: true }
      });
      
      if (!updatedInvoicesTable || !updatedCustomersTable || !updatedInvoiceItemsTable) {
        throw new Error('Failed to initialize invoice tables');
      }
      
      console.log('✅ Invoice system initialized successfully');
    }
    
    // Create a test customer first
    console.log('👤 Creating test customer...');
    
    const customerRow = await prisma.row.create({
      data: {
        tableId: customersTable.id
      }
    });
    
    // Add customer data
    const customerData = {
      customer_name: 'Test Customer SRL',
      customer_tax_id: 'RO00000000',
      customer_address: 'Strada Client 456, București',
      customer_city: 'București',
      customer_postal_code: '010002',
      customer_country: 'RO',
      customer_email: 'client@test.com',
      customer_phone: '+40 123 456 789'
    };
    
    for (const [key, value] of Object.entries(customerData)) {
      const column = customersTable.columns.find(c => c.name === key);
      if (column) {
        await prisma.cell.create({
          data: {
            rowId: customerRow.id,
            columnId: column.id,
            value: value
          }
        });
      }
    }
    
    console.log(`✅ Customer created with ID: ${customerRow.id}`);
    
    // Create test invoice
    console.log('📄 Creating test invoice...');
    
    const invoiceRow = await prisma.row.create({
      data: {
        tableId: invoicesTable.id
      }
    });
    
    // Generate invoice number
    const invoiceNumber = `TEST-${Date.now()}`;
    const currentDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Invoice data
    const invoiceData = {
      invoice_number: invoiceNumber,
      invoice_date: currentDate,
      due_date: dueDate,
      customer_id: customerRow.id,
      base_currency: 'RON',
      total_amount: 119.00,
      tax_amount: 19.00,
      subtotal: 100.00,
      status: 'draft',
      payment_terms: '30 days',
      payment_method: 'Bank Transfer',
      notes: 'Test invoice for ANAF integration testing'
    };
    
    // Add invoice data to cells
    for (const [key, value] of Object.entries(invoiceData)) {
      const column = invoicesTable.columns.find(c => c.name === key);
      if (column) {
        await prisma.cell.create({
          data: {
            rowId: invoiceRow.id,
            columnId: column.id,
            value: value
          }
        });
      }
    }
    
    console.log(`✅ Invoice created with ID: ${invoiceRow.id}`);
    console.log(`   Invoice Number: ${invoiceNumber}`);
    console.log(`   Total Amount: ${invoiceData.total_amount} ${invoiceData.base_currency}`);
    
    // Create invoice items
    console.log('📦 Creating invoice items...');
    
    const items = [
      {
        product_name: 'Produs de test 1',
        description: 'Descriere produs de test 1',
        quantity: 2,
        unit_of_measure: 'C62', // pieces
        unit_price: 50.00,
        total_price: 100.00,
        vat_rate: 19,
        vat_amount: 19.00,
        currency: 'RON'
      }
    ];
    
    for (const [index, item] of items.entries()) {
      const itemRow = await prisma.row.create({
        data: {
          tableId: invoiceItemsTable.id
        }
      });
      
      // Add item data
      const itemData = {
        ...item,
        invoice_id: invoiceRow.id,
        product_ref_table: 'products',
        product_ref_id: index + 1,
        original_price: item.unit_price,
        converted_price: item.unit_price
      };
      
      for (const [key, value] of Object.entries(itemData)) {
        const column = invoiceItemsTable.columns.find(c => c.name === key);
        if (column) {
          await prisma.cell.create({
            data: {
              rowId: itemRow.id,
              columnId: column.id,
              value: value
            }
          });
        }
      }
      
      console.log(`   ✅ Item ${index + 1} created: ${item.product_name}`);
    }
    
    console.log('\n🎉 Test invoice created successfully!');
    console.log('='.repeat(50));
    console.log(`📋 Invoice Details:`);
    console.log(`   Invoice ID: ${invoiceRow.id}`);
    console.log(`   Invoice Number: ${invoiceNumber}`);
    console.log(`   Customer: ${customerData.customer_name}`);
    console.log(`   Total Amount: ${invoiceData.total_amount} ${invoiceData.base_currency}`);
    console.log(`   Status: ${invoiceData.status}`);
    console.log(`   Items: ${items.length}`);
    console.log('='.repeat(50));
    console.log('\n💡 You can now run ANAF tests with this invoice:');
    console.log('   npm run test:anaf-e-factura-real');
    console.log('   tsx tests/anaf-e-factura-real-workflow.test.ts');
    
  } catch (error) {
    console.error('❌ Error creating test invoice:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTestInvoice()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestInvoice };
