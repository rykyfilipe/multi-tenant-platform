#!/bin/bash

# Test script for EN16931 compliance validation
# This script tests XML generation, PDF preview, and ANAF integration

echo "🧪 Testing EN16931 Compliance for ANAF e-Factura Integration..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from env.example"
    exit 1
fi

echo "✅ Environment check passed"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run XML validation tests
echo "🔍 Running XML validation tests..."
if npm test tests/anaf/xml-validation.test.ts; then
    echo "✅ XML validation tests passed"
else
    echo "❌ XML validation tests failed"
    exit 1
fi

# Run PDF and preview tests
echo "📄 Running PDF and preview tests..."
if npm test tests/anaf/pdf-en16931-validation.test.ts; then
    echo "✅ PDF and preview tests passed"
else
    echo "❌ PDF and preview tests failed"
    exit 1
fi

# Run end-to-end integration tests
echo "🔄 Running end-to-end integration tests..."
if npm test tests/anaf/e2e-anaf-integration.test.ts; then
    echo "✅ End-to-end integration tests passed"
else
    echo "❌ End-to-end integration tests failed"
    exit 1
fi

# Test XML generation with real data
echo "📋 Testing XML generation with sample data..."
cat > test-xml-generation.js << 'EOF'
const { ANAFXMLGenerator } = require('./src/lib/anaf/xml-generator');

async function testXMLGeneration() {
    const xmlGenerator = new ANAFXMLGenerator();
    
    const mockInvoiceData = {
        id: 1,
        invoice_number: 'INV-2024-001',
        date: '2024-01-15',
        due_date: '2024-02-15',
        total_amount: 1000.00,
        base_currency: 'RON',
        tax_amount: 190.00,
        subtotal: 810.00,
        status: 'issued',
        customer_id: 1,
        customer_name: 'Test Customer SRL',
        customer_email: 'test@customer.com',
        customer_address: 'Strada Test 123, București, România',
        customer_tax_id: 'RO12345678',
        items: [
            {
                id: 1,
                description: 'Test Product 1',
                quantity: 2,
                unit_price: 300.00,
                total_price: 600.00,
                tax_rate: 19,
                tax_amount: 114.00
            }
        ]
    };

    const mockCompanyData = {
        name: 'Test Company SRL',
        legalName: 'Test Company SRL',
        taxId: 'RO87654321',
        address: {
            street: 'Strada Company 456',
            city: 'București',
            postalCode: '010001',
            country: 'România'
        },
        email: 'company@test.com',
        phone: '+40 123 456 789'
    };

    try {
        const xml = await xmlGenerator.generateInvoiceXML(mockInvoiceData, mockCompanyData);
        
        console.log('✅ XML generated successfully');
        console.log('📏 XML length:', xml.length, 'characters');
        
        // Check for required EN16931 elements
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
            }
        });
        
        if (allElementsPresent) {
            console.log('✅ All required EN16931 elements present');
        } else {
            console.log('❌ Some required EN16931 elements missing');
            process.exit(1);
        }
        
        // Save XML to file for inspection
        require('fs').writeFileSync('test-invoice.xml', xml);
        console.log('💾 XML saved to test-invoice.xml');
        
    } catch (error) {
        console.error('❌ XML generation failed:', error.message);
        process.exit(1);
    }
}

testXMLGeneration();
EOF

if node test-xml-generation.js; then
    echo "✅ XML generation test passed"
    rm test-xml-generation.js
else
    echo "❌ XML generation test failed"
    rm test-xml-generation.js
    exit 1
fi

# Test PDF preview generation
echo "📄 Testing PDF preview generation..."
cat > test-pdf-preview.js << 'EOF'
const { InvoiceTemplate } = require('./src/lib/invoice-template');

function testPDFPreview() {
    const invoiceTemplate = new InvoiceTemplate();
    
    const mockInvoiceData = {
        id: 1,
        invoice_number: 'INV-2024-001',
        date: '2024-01-15',
        due_date: '2024-02-15',
        total_amount: 1000.00,
        base_currency: 'RON',
        tax_amount: 190.00,
        subtotal: 810.00,
        status: 'issued',
        customer_id: 1,
        customer_name: 'Test Customer SRL',
        customer_email: 'test@customer.com',
        customer_address: 'Strada Test 123, București, România',
        customer_tax_id: 'RO12345678',
        items: [
            {
                id: 1,
                description: 'Test Product 1',
                quantity: 2,
                unit_price: 300.00,
                total_price: 600.00,
                tax_rate: 19,
                tax_amount: 114.00
            }
        ]
    };

    const mockTenantBranding = {
        name: 'Test Company SRL',
        legalName: 'Test Company SRL',
        taxId: 'RO87654321',
        address: {
            street: 'Strada Company 456',
            city: 'București',
            postalCode: '010001',
            country: 'România'
        },
        email: 'company@test.com',
        phone: '+40 123 456 789',
        logo: null,
        colors: {
            primary: '#3b82f6',
            secondary: '#64748b'
        }
    };

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

    try {
        const html = invoiceTemplate.generateHTML(
            mockInvoiceData,
            mockTenantBranding,
            mockTranslations,
            'en'
        );
        
        console.log('✅ HTML preview generated successfully');
        console.log('📏 HTML length:', html.length, 'characters');
        
        // Check for required elements
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
            }
        });
        
        if (allElementsPresent) {
            console.log('✅ All required preview elements present');
        } else {
            console.log('❌ Some required preview elements missing');
            process.exit(1);
        }
        
        // Save HTML to file for inspection
        require('fs').writeFileSync('test-invoice-preview.html', html);
        console.log('💾 HTML preview saved to test-invoice-preview.html');
        
    } catch (error) {
        console.error('❌ HTML preview generation failed:', error.message);
        process.exit(1);
    }
}

testPDFPreview();
EOF

if node test-pdf-preview.js; then
    echo "✅ PDF preview test passed"
    rm test-pdf-preview.js
else
    echo "❌ PDF preview test failed"
    rm test-pdf-preview.js
    exit 1
fi

# Clean up test files
echo "🧹 Cleaning up test files..."
rm -f test-invoice.xml test-invoice-preview.html

echo ""
echo "🎉 EN16931 Compliance Test Complete!"
echo ""
echo "📋 Test Results Summary:"
echo "   ✅ XML validation tests passed"
echo "   ✅ PDF and preview tests passed"
echo "   ✅ End-to-end integration tests passed"
echo "   ✅ XML generation with sample data passed"
echo "   ✅ PDF preview generation passed"
echo ""
echo "🔧 Next steps:"
echo "   1. Review generated XML and HTML files"
echo "   2. Test with real ANAF credentials"
echo "   3. Deploy to staging environment"
echo "   4. Perform integration testing with ANAF sandbox"
echo ""
echo "📚 For more information, see:"
echo "   - docs/ANAF_INTEGRATION.md"
echo "   - tests/anaf/ directory"
