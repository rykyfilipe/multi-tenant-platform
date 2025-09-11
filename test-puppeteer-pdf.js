const { PuppeteerPDFGenerator } = require('./src/lib/pdf-puppeteer-generator.ts');

async function testPDFGeneration() {
  try {
    console.log('Testing Puppeteer PDF generation...');
    
    const options = {
      tenantId: '1',
      databaseId: 1,
      invoiceId: 1,
      language: 'en'
    };
    
    const pdfBuffer = await PuppeteerPDFGenerator.generateInvoicePDF(options);
    console.log('PDF generated successfully! Size:', pdfBuffer.length, 'bytes');
    
    // Save to file for testing
    const fs = require('fs');
    fs.writeFileSync('test-invoice.pdf', pdfBuffer);
    console.log('PDF saved as test-invoice.pdf');
    
  } catch (error) {
    console.error('Error testing PDF generation:', error);
  }
}

testPDFGeneration();
