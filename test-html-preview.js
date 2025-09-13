// Test HTML preview generation for ANAF
const { InvoiceTemplate } = require('./src/lib/invoice-template');

async function testHTMLPreview() {
  console.log('🧪 Testing HTML preview generation...\n');
  
  const invoiceTemplate = new InvoiceTemplate();
  
  const mockTranslations = {
    'invoice.title': 'Invoice',
    'invoice.number': 'Invoice Number',
    'invoice.date': 'Date',
    'invoice.dueDate': 'Due Date',
    'invoice.customer': 'Customer',
    'invoice.supplier': 'Supplier',
    'invoice.description': 'Description',
    'invoice.quantity': 'Quantity',
    'invoice.unitPrice': 'Unit Price',
    'invoice.total': 'Total',
    'invoice.subtotal': 'Subtotal',
    'invoice.tax': 'Tax',
    'invoice.totalAmount': 'Total Amount',
    'invoice.taxId': 'Tax ID',
    'invoice.address': 'Address',
    'invoice.email': 'Email',
    'invoice.phone': 'Phone',
    'invoice.currency': 'Currency',
    'invoice.status': 'Status',
    'invoice.issued': 'Issued'
  };
  
  const mockInvoiceData = {
    invoice: {
      invoice_number: 'INV-2024-001',
      date: '2024-01-15',
      due_date: '2024-02-15',
      total_amount: 1000.00,
      base_currency: 'RON',
      status: 'issued'
    },
    customer: {
      customer_name: 'Test Customer SRL',
      customer_email: 'test@customer.com',
      customer_address: 'Strada Test 123, București, România',
      customer_tax_id: 'RO12345678'
    },
    company: {
      company_name: 'Test Company SRL',
      company_email: 'company@test.com',
      company_phone: '+40 123 456 789',
      company_tax_id: 'RO87654321',
      company_address: 'Strada Company 456, București, România'
    },
    items: [
      {
        id: 1,
        description: 'Test Product 1',
        quantity: 2,
        unit_price: 300.00,
        total_price: 600.00,
        tax_rate: 19,
        tax_amount: 114.00
      },
      {
        id: 2,
        description: 'Test Product 2',
        quantity: 1,
        unit_price: 210.00,
        total_price: 210.00,
        tax_rate: 19,
        tax_amount: 39.90
      }
    ],
    totals: {
      subtotal: 810.00,
      taxTotal: 190.00,
      grandTotal: 1000.00,
      currency: 'RON'
    },
    translations: mockTranslations
  };

  try {
    console.log('📄 Generating HTML preview...');
    const html = InvoiceTemplate.generateHTML(mockInvoiceData);
    
    console.log('✅ HTML preview generated successfully');
    console.log('📏 HTML length:', html.length, 'characters');
    
    // Check for required elements
    console.log('\n🔍 Checking preview elements...');
    const requiredElements = [
      'invoice-number',
      'invoice-date',
      'supplier-info',
      'customer-info',
      'invoice-items',
      'invoice-totals'
    ];
    
    let allElementsPresent = true;
    requiredElements.forEach(element => {
      if (!html.includes(element)) {
        console.log('❌ Missing required element:', element);
        allElementsPresent = false;
      } else {
        console.log('✅ Found element:', element);
      }
    });
    
    if (allElementsPresent) {
      console.log('\n🎉 All required preview elements present!');
    } else {
      console.log('\n❌ Some required preview elements missing');
    }
    
    // Check for invoice data
    console.log('\n🔍 Checking invoice data in preview...');
    if (html.includes('INV-2024-001')) {
      console.log('✅ Invoice number found');
    } else {
      console.log('❌ Invoice number missing');
    }
    
    if (html.includes('Test Customer SRL')) {
      console.log('✅ Customer name found');
    } else {
      console.log('❌ Customer name missing');
    }
    
    if (html.includes('Test Company SRL')) {
      console.log('✅ Supplier name found');
    } else {
      console.log('❌ Supplier name missing');
    }
    
    if (html.includes('1000.00')) {
      console.log('✅ Total amount found');
    } else {
      console.log('❌ Total amount missing');
    }
    
    // Save HTML to file
    require('fs').writeFileSync('test-invoice-preview.html', html);
    console.log('\n💾 HTML preview saved to test-invoice-preview.html');
    
    // Show first few lines of HTML
    console.log('\n📄 HTML preview (first 10 lines):');
    const lines = html.split('\n');
    lines.slice(0, 10).forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
    
  } catch (error) {
    console.error('❌ HTML preview generation failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testHTMLPreview();
