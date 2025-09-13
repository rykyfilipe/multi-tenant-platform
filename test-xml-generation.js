// Test XML generation for ANAF
const { ANAFXMLGenerator } = require('./src/lib/anaf/xml-generator');

async function testXMLGeneration() {
  console.log('🧪 Testing ANAF XML generation...\n');
  
  const xmlGenerator = new ANAFXMLGenerator();
  
  const mockInvoiceData = {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    totalAmount: 1000.00,
    currency: 'RON',
    taxAmount: 190.00,
    subtotal: 810.00,
    status: 'issued',
    totals: {
      subtotal: 810.00,
      vatTotal: 190.00,
      totalAmount: 1000.00,
      grandTotal: 1000.00
    },
    customerData: {
      name: 'Test Customer SRL',
      email: 'test@customer.com',
      address: 'Strada Test 123, București, România',
      taxId: 'RO12345678'
    },
    items: [
      {
        id: 1,
        description: 'Test Product 1',
        quantity: 2,
        unitOfMeasure: 'C62',
        unitPrice: 300.00,
        totalPrice: 600.00,
        currency: 'RON',
        taxRate: 19,
        vatRate: 19,
        taxAmount: 114.00,
        vatAmount: 114.00
      },
      {
        id: 2,
        description: 'Test Product 2',
        quantity: 1,
        unitOfMeasure: 'C62',
        unitPrice: 210.00,
        totalPrice: 210.00,
        currency: 'RON',
        taxRate: 19,
        vatRate: 19,
        taxAmount: 39.90,
        vatAmount: 39.90
      }
    ]
  };

  const mockCompanyData = {
    name: 'Test Company SRL',
    legalName: 'Test Company SRL',
    taxId: 'RO87654321',
    address: 'Strada Company 456',
    city: 'București',
    postalCode: '010001',
    country: 'România',
    email: 'company@test.com',
    phone: '+40 123 456 789'
  };

  try {
    console.log('📋 Generating XML...');
    const xml = ANAFXMLGenerator.generateXML({
      invoiceData: mockInvoiceData,
      companyData: mockCompanyData,
      customerData: mockInvoiceData.customerData,
      language: 'en'
    });
    
    console.log('✅ XML generated successfully');
    console.log('📏 XML length:', xml.length, 'characters');
    
    // Check for required EN16931 elements
    console.log('\n🔍 Checking EN16931 compliance...');
    const requiredElements = [
      '<cac:Invoice>',
      '<cbc:ID>',
      '<cbc:IssueDate>',
      '<cac:AccountingSupplierParty>',
      '<cac:AccountingCustomerParty>',
      '<cac:TaxTotal>',
      '<cac:LegalMonetaryTotal>',
      '<cac:InvoiceLine>'
    ];
    
    let allElementsPresent = true;
    requiredElements.forEach(element => {
      if (!xml.includes(element)) {
        console.log('❌ Missing required element:', element);
        allElementsPresent = false;
      } else {
        console.log('✅ Found element:', element);
      }
    });
    
    if (allElementsPresent) {
      console.log('\n🎉 All required EN16931 elements present!');
    } else {
      console.log('\n❌ Some required EN16931 elements missing');
    }
    
    // Check for ANAF specific elements
    console.log('\n🔍 Checking ANAF specific elements...');
    const anafElements = [
      '<cbc:CustomizationID>ANAF</cbc:CustomizationID>',
      '<cbc:ProfileID>electronic</cbc:ProfileID>',
      '<cbc:DocumentCurrencyCode>RON</cbc:DocumentCurrencyCode>',
      '<cbc:TaxCurrencyCode>RON</cbc:TaxCurrencyCode>'
    ];
    
    anafElements.forEach(element => {
      if (xml.includes(element)) {
        console.log('✅ Found ANAF element:', element);
      } else {
        console.log('⚠️  Missing ANAF element:', element);
      }
    });
    
    // Check for invoice data
    console.log('\n🔍 Checking invoice data...');
    if (xml.includes('INV-2024-001')) {
      console.log('✅ Invoice number found');
    } else {
      console.log('❌ Invoice number missing');
    }
    
    if (xml.includes('Test Customer SRL')) {
      console.log('✅ Customer name found');
    } else {
      console.log('❌ Customer name missing');
    }
    
    if (xml.includes('Test Company SRL')) {
      console.log('✅ Supplier name found');
    } else {
      console.log('❌ Supplier name missing');
    }
    
    if (xml.includes('1000.00')) {
      console.log('✅ Total amount found');
    } else {
      console.log('❌ Total amount missing');
    }
    
    // Save XML to file
    require('fs').writeFileSync('test-invoice.xml', xml);
    console.log('\n💾 XML saved to test-invoice.xml');
    
    // Show first few lines of XML
    console.log('\n📄 XML preview (first 10 lines):');
    const lines = xml.split('\n');
    lines.slice(0, 10).forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
    
  } catch (error) {
    console.error('❌ XML generation failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testXMLGeneration();
