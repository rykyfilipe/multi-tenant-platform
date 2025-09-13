#!/usr/bin/env node

/**
 * ANAF e-Factura Integrated Test System
 * 
 * Acest test integrat folosește serviciile reale din aplicație pentru a:
 * - Preia o factură reală din baza de date (tabelul invoices)
 * - Generează XML-ul folosind ANAFXMLGenerator din aplicație
 * - Trimite factura folosind ANAFIntegration din aplicație
 * - Verifică răspunsul ANAF și statusul
 * 
 * Usage:
 *   node tests/anaf-e-factura-integrated-test.js
 *   npm run test:anaf-e-factura-integrated
 */

const fs = require('fs').promises;
const path = require('path');

// Import serviciile din aplicație
const { PrismaClient } = require('@prisma/client');
const { ANAFIntegration } = require('../src/lib/anaf/anaf-integration');
const { ANAFXMLGenerator } = require('../src/lib/anaf/xml-generator');
const { ANAFOAuthService } = require('../src/lib/anaf/oauth-service');

// Configurație test
const TEST_CONFIG = {
  // ID-ul tenantului pentru test
  TEST_TENANT_ID: 1,
  
  // ID-ul facturii pentru test (sau null pentru a lua prima factură)
  TEST_INVOICE_ID: null,
  
  // Rezultate test
  RESULTS_DIR: './test-results/anaf-e-factura-integrated',
  REPORT_FILE: 'anaf-integrated-test-report.json'
};

/**
 * Test Runner Integrat
 * Folosește serviciile reale din aplicație
 */
class ANAFIntegratedTestRunner {
  constructor() {
    this.prisma = new PrismaClient();
    this.anafIntegration = new ANAFIntegration();
    this.anafOAuth = new ANAFOAuthService();
    this.reportGenerator = new TestReportGenerator();
  }

  /**
   * Rulează toate testele integrate
   */
  async runAllTests() {
    console.log('🚀 Pornire Test Suite ANAF e-Factura Integrat');
    console.log('='.repeat(60));
    
    try {
      // Pasul 1: Verifică conexiunea la baza de date
      await this.testDatabaseConnection();
      
      // Pasul 2: Preia factura din baza de date
      const invoice = await this.getTestInvoice();
      
      if (!invoice) {
        throw new Error('Nu s-a găsit nicio factură pentru test');
      }
      
      // Pasul 3: Generează XML-ul folosind serviciile din aplicație
      await this.testXMLGeneration(invoice);
      
      // Pasul 4: Testează autentificarea ANAF
      await this.testANAFAuthentication();
      
      // Pasul 5: Trimite factura la ANAF
      await this.testInvoiceSubmission(invoice);
      
      // Pasul 6: Verifică statusul
      await this.testStatusChecking(invoice);
      
      // Pasul 7: Generează rapoarte
      await this.generateReports();
      
    } catch (error) {
      console.error('💥 Test suite a eșuat:', error.message);
      this.reportGenerator.addTestResult('Test Suite Execution', false, { error: error.message });
    } finally {
      // Închide conexiunea la baza de date
      await this.prisma.$disconnect();
    }
  }

  /**
   * Testează conexiunea la baza de date
   */
  async testDatabaseConnection() {
    console.log('\n🗄️  Testare conexiune bază de date...');
    
    try {
      // Testează conexiunea prin query simplu
      await this.prisma.$queryRaw`SELECT 1`;
      
      this.reportGenerator.addTestResult('Database Connection', true, {
        message: 'Conexiunea la baza de date funcționează'
      });
      
      console.log('✅ Conexiunea la baza de date funcționează');
      
    } catch (error) {
      this.reportGenerator.addTestResult('Database Connection', false, { error: error.message });
      console.error('❌ Eroare conexiune bază de date:', error.message);
      throw error;
    }
  }

  /**
   * Preia o factură din baza de date pentru test
   */
  async getTestInvoice() {
    console.log('\n📄 Preia factură din baza de date...');
    
    try {
      let invoice;
      
      if (TEST_CONFIG.TEST_INVOICE_ID) {
        // Preia factura specificată
        invoice = await this.prisma.invoice.findUnique({
          where: { id: TEST_CONFIG.TEST_INVOICE_ID },
          include: {
            tenant: true,
            items: true
          }
        });
      } else {
        // Preia prima factură disponibilă
        invoice = await this.prisma.invoice.findFirst({
          where: {
            tenantId: TEST_CONFIG.TEST_TENANT_ID
          },
          include: {
            tenant: true,
            items: true
          }
        });
      }
      
      if (!invoice) {
        throw new Error('Nu s-a găsit nicio factură în baza de date');
      }
      
      console.log(`✅ Factură găsită: ${invoice.invoice_number || invoice.id}`);
      console.log(`   Tenant: ${invoice.tenant?.name || 'N/A'}`);
      console.log(`   Suma totală: ${invoice.total_amount || 0} ${invoice.currency || 'RON'}`);
      console.log(`   Status: ${invoice.status || 'N/A'}`);
      console.log(`   Items: ${invoice.items?.length || 0}`);
      
      this.reportGenerator.addTestResult('Get Test Invoice', true, {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        tenantName: invoice.tenant?.name,
        totalAmount: invoice.total_amount,
        currency: invoice.currency,
        status: invoice.status,
        itemsCount: invoice.items?.length || 0
      });
      
      return invoice;
      
    } catch (error) {
      this.reportGenerator.addTestResult('Get Test Invoice', false, { error: error.message });
      console.error('❌ Eroare la preluarea facturii:', error.message);
      throw error;
    }
  }

  /**
   * Testează generarea XML-ului folosind serviciile din aplicație
   */
  async testXMLGeneration(invoice) {
    console.log('\n🔧 Testare generare XML cu serviciile din aplicație...');
    
    try {
      // Pregătește datele pentru XML generator
      const invoiceData = await this.prepareInvoiceDataForXML(invoice);
      
      // Generează XML-ul folosind ANAFXMLGenerator
      const xmlContent = await ANAFXMLGenerator.generateXML(invoiceData);
      
      // Validează XML-ul
      const validationResult = ANAFXMLGenerator.validateXML(xmlContent);
      
      if (!validationResult.isValid) {
        throw new Error(`XML invalid: ${validationResult.errors.join(', ')}`);
      }
      
      console.log('✅ XML generat cu succes');
      console.log(`   Dimensiune: ${xmlContent.length} caractere`);
      console.log(`   Validare: ${validationResult.isValid ? 'Valid' : 'Invalid'}`);
      
      // Salvează XML-ul pentru inspecție
      await this.saveXMLForInspection(xmlContent, invoice);
      
      this.reportGenerator.addTestResult('XML Generation', true, {
        xmlSize: xmlContent.length,
        validation: validationResult.isValid,
        errors: validationResult.errors
      });
      
      // Stochează XML-ul pentru următorul pas
      this.generatedXML = xmlContent;
      
    } catch (error) {
      this.reportGenerator.addTestResult('XML Generation', false, { error: error.message });
      console.error('❌ Eroare la generarea XML:', error.message);
      throw error;
    }
  }

  /**
   * Pregătește datele facturii pentru XML generator
   */
  async prepareInvoiceDataForXML(invoice) {
    // Preia datele tenantului
    const tenant = invoice.tenant;
    
    // Pregătește datele companiei (supplier)
    const companyData = {
      name: tenant.companyName || 'Test Company SRL',
      taxId: tenant.companyTaxId || 'RO12345678',
      address: tenant.address || 'Strada Test 123, București',
      city: tenant.companyCity || 'București',
      postalCode: tenant.companyPostalCode || '010001',
      country: tenant.companyCountry || 'RO',
      email: tenant.companyEmail || 'test@company.com',
      phone: tenant.phone || '+40 123 456 789'
    };
    
    // Pregătește datele clientului
    const customerData = {
      name: invoice.customer_name || 'Test Customer SRL',
      taxId: invoice.customer_tax_id || 'RO00000000',
      address: invoice.customer_address || 'Strada Client 456, București',
      email: invoice.customer_email || 'client@test.com'
    };
    
    // Pregătește items-urile
    const items = (invoice.items || []).map((item, index) => ({
      id: item.id || index + 1,
      description: item.description || item.product_name || 'Produs de test',
      quantity: item.quantity || 1,
      unitOfMeasure: item.unit_of_measure || 'C62',
      unitPrice: item.unit_price || item.price || 100,
      totalPrice: item.total_price || item.quantity * item.unit_price || 100,
      vatRate: item.vat_rate || item.tax_rate || 19,
      vatAmount: item.vat_amount || item.tax_amount || 19,
      currency: item.currency || invoice.currency || 'RON'
    }));
    
    // Calculează totalurile
    const subtotal = invoice.subtotal || invoice.total_amount - (invoice.tax_amount || 0) || 100;
    const vatTotal = invoice.tax_amount || invoice.vat_amount || 19;
    const grandTotal = invoice.total_amount || invoice.grand_total || 119;
    
    return {
      invoice: {
        ...invoice,
        totals: {
          subtotal,
          vatTotal,
          grandTotal,
          currency: invoice.currency || 'RON'
        }
      },
      items,
      customer: customerData,
      company: companyData
    };
  }

  /**
   * Salvează XML-ul pentru inspecție
   */
  async saveXMLForInspection(xmlContent, invoice) {
    try {
      await fs.mkdir(TEST_CONFIG.RESULTS_DIR, { recursive: true });
      
      const filename = `invoice-${invoice.id || 'test'}-${Date.now()}.xml`;
      const filepath = path.join(TEST_CONFIG.RESULTS_DIR, filename);
      
      await fs.writeFile(filepath, xmlContent);
      console.log(`   XML salvat: ${filepath}`);
      
    } catch (error) {
      console.warn('⚠️  Nu s-a putut salva XML-ul:', error.message);
    }
  }

  /**
   * Testează autentificarea ANAF
   */
  async testANAFAuthentication() {
    console.log('\n🔐 Testare autentificare ANAF...');
    
    try {
      // Verifică dacă utilizatorul este autentificat
      const isAuthenticated = await this.anafOAuth.isAuthenticated(TEST_CONFIG.TEST_TENANT_ID);
      
      if (!isAuthenticated) {
        console.log('⚠️  Utilizatorul nu este autentificat cu ANAF');
        console.log('   Pentru test complet, autentifică-te prin interfața web');
        
        this.reportGenerator.addTestResult('ANAF Authentication', false, {
          message: 'Utilizatorul nu este autentificat cu ANAF'
        });
        
        return false;
      }
      
      console.log('✅ Utilizatorul este autentificat cu ANAF');
      
      this.reportGenerator.addTestResult('ANAF Authentication', true, {
        message: 'Utilizatorul este autentificat cu ANAF'
      });
      
      return true;
      
    } catch (error) {
      this.reportGenerator.addTestResult('ANAF Authentication', false, { error: error.message });
      console.error('❌ Eroare la verificarea autentificării:', error.message);
      return false;
    }
  }

  /**
   * Testează trimiterea facturii la ANAF
   */
  async testInvoiceSubmission(invoice) {
    console.log('\n📤 Testare trimitere factură la ANAF...');
    
    try {
      // Folosește ANAFIntegration pentru a trimite factura
      const result = await this.anafIntegration.submitInvoice(invoice.id, TEST_CONFIG.TEST_TENANT_ID, {
        submissionType: 'test',
        language: 'ro'
      });
      
      if (result.success) {
        console.log('✅ Factura a fost trimisă cu succes la ANAF');
        console.log(`   Submission ID: ${result.submissionId}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Mesaj: ${result.message}`);
        
        this.reportGenerator.addTestResult('Invoice Submission', true, {
          submissionId: result.submissionId,
          status: result.status,
          message: result.message
        });
        
        // Stochează submission ID pentru verificarea statusului
        this.submissionId = result.submissionId;
        
      } else {
        throw new Error(result.message || 'Trimiterea a eșuat');
      }
      
    } catch (error) {
      this.reportGenerator.addTestResult('Invoice Submission', false, { error: error.message });
      console.error('❌ Eroare la trimiterea facturii:', error.message);
      
      // Pentru test, continuă chiar dacă trimiterea a eșuat
      console.log('⚠️  Testul continuă fără trimiterea efectivă la ANAF');
    }
  }

  /**
   * Testează verificarea statusului
   */
  async testStatusChecking(invoice) {
    console.log('\n🔍 Testare verificare status...');
    
    if (!this.submissionId) {
      console.log('⚠️  Nu există submission ID pentru verificarea statusului');
      this.reportGenerator.addTestResult('Status Checking', false, {
        message: 'Nu există submission ID pentru verificarea statusului'
      });
      return;
    }
    
    try {
      // Folosește ANAFIntegration pentru a verifica statusul
      const statusResult = await this.anafIntegration.getInvoiceStatus(invoice.id, TEST_CONFIG.TEST_TENANT_ID);
      
      if (statusResult.success) {
        console.log('✅ Status verificat cu succes');
        console.log(`   Status: ${statusResult.status}`);
        console.log(`   Mesaj: ${statusResult.message}`);
        
        this.reportGenerator.addTestResult('Status Checking', true, {
          status: statusResult.status,
          message: statusResult.message
        });
        
      } else {
        throw new Error(statusResult.message || 'Verificarea statusului a eșuat');
      }
      
    } catch (error) {
      this.reportGenerator.addTestResult('Status Checking', false, { error: error.message });
      console.error('❌ Eroare la verificarea statusului:', error.message);
    }
  }

  /**
   * Generează rapoarte finale
   */
  async generateReports() {
    console.log('\n📊 Generare rapoarte finale...');
    
    this.reportGenerator.finalize();
    this.reportGenerator.generateConsoleReport();
    await this.reportGenerator.saveReport();
  }
}

/**
 * Generator de rapoarte pentru test
 */
class TestReportGenerator {
  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testResults: [],
      summary: {
        databaseConnection: { success: false, message: '' },
        invoiceRetrieval: { success: false, message: '' },
        xmlGeneration: { success: false, message: '' },
        anafAuthentication: { success: false, message: '' },
        invoiceSubmission: { success: false, message: '' },
        statusChecking: { success: false, message: '' },
        overallSuccess: false
      }
    };
  }

  addTestResult(testName, success, details = {}) {
    const result = {
      testName,
      success,
      timestamp: new Date().toISOString(),
      details
    };
    
    this.results.testResults.push(result);
    this.results.totalTests++;
    
    if (success) {
      this.results.passedTests++;
    } else {
      this.results.failedTests++;
    }
  }

  updateSummary(section, data) {
    this.results.summary[section] = { ...this.results.summary[section], ...data };
  }

  finalize() {
    this.results.endTime = new Date().toISOString();
    this.results.summary.overallSuccess = this.results.failedTests === 0;
    
    const start = new Date(this.results.startTime);
    const end = new Date(this.results.endTime);
    this.results.duration = end - start;
  }

  generateConsoleReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Raport Test ANAF e-Factura Integrat');
    console.log('='.repeat(80));
    
    console.log(`\n⏱️  Durata test: ${this.results.duration}ms`);
    console.log(`📈 Total teste: ${this.results.totalTests}`);
    console.log(`✅ Reușite: ${this.results.passedTests}`);
    console.log(`❌ Eșuate: ${this.results.failedTests}`);
    console.log(`🎯 Rata de succes: ${((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Rezumat:');
    console.log(`   🗄️  Conexiune bază de date: ${this.results.summary.databaseConnection.success ? '✅' : '❌'} ${this.results.summary.databaseConnection.message}`);
    console.log(`   📄 Preluare factură: ${this.results.summary.invoiceRetrieval.success ? '✅' : '❌'} ${this.results.summary.invoiceRetrieval.message}`);
    console.log(`   🔧 Generare XML: ${this.results.summary.xmlGeneration.success ? '✅' : '❌'} ${this.results.summary.xmlGeneration.message}`);
    console.log(`   🔐 Autentificare ANAF: ${this.results.summary.anafAuthentication.success ? '✅' : '❌'} ${this.results.summary.anafAuthentication.message}`);
    console.log(`   📤 Trimitere factură: ${this.results.summary.invoiceSubmission.success ? '✅' : '❌'} ${this.results.summary.invoiceSubmission.message}`);
    console.log(`   🔍 Verificare status: ${this.results.summary.statusChecking.success ? '✅' : '❌'} ${this.results.summary.statusChecking.message}`);
    
    console.log('\n📝 Rezultate detaliate:');
    this.results.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.testName}`);
      if (result.details.message) {
        console.log(`      ${result.details.message}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (this.results.summary.overallSuccess) {
      console.log('🎉 Toate testele au trecut! Integrarea ANAF e-Factura funcționează corect.');
    } else {
      console.log('⚠️  Unele teste au eșuat. Te rugăm să verifici rezultatele și să corectezi problemele.');
    }
    console.log('='.repeat(80) + '\n');
  }

  async saveReport() {
    try {
      await fs.mkdir(TEST_CONFIG.RESULTS_DIR, { recursive: true });
      
      const reportPath = path.join(TEST_CONFIG.RESULTS_DIR, TEST_CONFIG.REPORT_FILE);
      await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      
      console.log(`\n💾 Raport salvat: ${reportPath}`);
    } catch (error) {
      console.error('❌ Nu s-a putut salva raportul:', error.message);
    }
  }
}

/**
 * Funcția principală
 */
async function main() {
  console.log('🎯 ANAF e-Factura Test Integrat');
  console.log('=================================');
  console.log('Acest test folosește serviciile reale din aplicație:');
  console.log('• Preia factură din baza de date (tabelul invoices)');
  console.log('• Generează XML folosind ANAFXMLGenerator');
  console.log('• Trimite factura folosind ANAFIntegration');
  console.log('• Verifică răspunsul ANAF și statusul');
  console.log('');
  
  const testRunner = new ANAFIntegratedTestRunner();
  await testRunner.runAllTests();
}

// Rulează testul
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Eroare fatală:', error);
    process.exit(1);
  });
}

module.exports = {
  ANAFIntegratedTestRunner,
  TestReportGenerator,
  TEST_CONFIG
};
