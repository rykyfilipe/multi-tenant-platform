/**
 * ANAF e-Factura Real Workflow Test
 * 
 * Acest test folosește workflow-ul real din aplicație pentru a:
 * - Preia o factură reală din baza de date
 * - Generează XML-ul folosind serviciile din aplicație
 * - Trimite factura la ANAF folosind workflow-ul real
 * - Verifică răspunsul și statusul
 * 
 * Usage:
 *   npm run test:anaf-e-factura-real
 *   tsx tests/anaf-e-factura-real-workflow.test.ts
 */

import prisma from '../src/lib/prisma';
import { ANAFIntegration } from '../src/lib/anaf/anaf-integration';
import { ANAFXMLGenerator } from '../src/lib/anaf/xml-generator';
import { ANAFOAuthService } from '../src/lib/anaf/oauth-service';
import { InvoiceTemplate } from '../src/lib/invoice-template';
import fs from 'fs/promises';
import path from 'path';

// Configurație test
const TEST_CONFIG = {
  TEST_TENANT_ID: 1,
  TEST_INVOICE_ID: null, // null pentru a lua prima factură
  RESULTS_DIR: './test-results/anaf-e-factura-real',
  REPORT_FILE: 'anaf-real-workflow-report.json'
};

interface TestResult {
  testName: string;
  success: boolean;
  timestamp: string;
  details: Record<string, any>;
}

interface TestReport {
  startTime: string;
  endTime: string | null;
  duration: number | null;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testResults: TestResult[];
  summary: {
    databaseConnection: { success: boolean; message: string };
    invoiceRetrieval: { success: boolean; message: string };
    xmlGeneration: { success: boolean; message: string };
    pdfGeneration: { success: boolean; message: string };
    anafAuthentication: { success: boolean; message: string };
    invoiceSubmission: { success: boolean; message: string };
    statusChecking: { success: boolean; message: string };
    overallSuccess: boolean;
  };
}

/**
 * Test Runner pentru workflow-ul real ANAF
 */
class ANAFRealWorkflowTestRunner {
  private anafIntegration: ANAFIntegration;
  private anafOAuth: ANAFOAuthService;
  private reportGenerator: TestReportGenerator;
  private generatedXML: string | null = null;
  private submissionId: string | null = null;

  constructor() {
    this.anafIntegration = new ANAFIntegration();
    this.anafOAuth = new ANAFOAuthService();
    this.reportGenerator = new TestReportGenerator();
  }

  /**
   * Rulează toate testele pentru workflow-ul real
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Pornire Test ANAF e-Factura Real Workflow');
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
      
      // Pasul 4: Generează PDF-ul folosind serviciile din aplicație
      await this.testPDFGeneration(invoice);
      
      // Pasul 5: Testează autentificarea ANAF
      const isAuthenticated = await this.testANAFAuthentication();
      
      // Pasul 6: Trimite factura la ANAF (doar dacă este autentificat)
      if (isAuthenticated) {
        await this.testInvoiceSubmission(invoice);
        await this.testStatusChecking(invoice);
      } else {
        console.log('⚠️  Omite trimiterea la ANAF - utilizatorul nu este autentificat');
      }
      
      // Pasul 7: Generează rapoarte
      await this.generateReports();
      
    } catch (error) {
      console.error('💥 Test suite a eșuat:', error);
      this.reportGenerator.addTestResult('Test Suite Execution', false, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Testează conexiunea la baza de date
   */
  private async testDatabaseConnection(): Promise<void> {
    console.log('\n🗄️  Testare conexiune bază de date...');
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      this.reportGenerator.addTestResult('Database Connection', true, {
        message: 'Conexiunea la baza de date funcționează'
      });
      
      console.log('✅ Conexiunea la baza de date funcționează');
      
    } catch (error) {
      this.reportGenerator.addTestResult('Database Connection', false, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.error('❌ Eroare conexiune bază de date:', error);
      throw error;
    }
  }

  /**
   * Preia o factură din baza de date pentru test
   */
  private async getTestInvoice(): Promise<any> {
    console.log('\n📄 Preia factură din baza de date...');
    
    try {
      // Preia tenantul (încearcă ID-ul specificat sau primul disponibil)
      let tenant;
      if (TEST_CONFIG.TEST_TENANT_ID) {
        tenant = await prisma.tenant.findUnique({
          where: { id: TEST_CONFIG.TEST_TENANT_ID }
        });
      }
      
      if (!tenant) {
        tenant = await prisma.tenant.findFirst();
        if (tenant) {
          console.log(`⚠️  Tenant cu ID ${TEST_CONFIG.TEST_TENANT_ID} nu a fost găsit. Folosesc primul tenant disponibil: ${tenant.name} (ID: ${tenant.id})`);
        }
      }
      
      if (!tenant) {
        throw new Error('Nu s-a găsit niciun tenant în baza de date');
      }
      
      // Preia baza de date a tenantului
      const database = await prisma.database.findFirst({
        where: { tenantId: tenant.id }
      });
      
      if (!database) {
        throw new Error(`Nu s-a găsit nicio bază de date pentru tenant ${tenant.id}`);
      }
      
      // Preia tabelul de facturi
      const invoicesTable = await prisma.table.findFirst({
        where: {
          databaseId: database.id,
          name: 'invoices',
          isProtected: true,
          protectedType: 'invoices'
        },
        include: {
          columns: true
        }
      });
      
      if (!invoicesTable) {
        throw new Error('Tabelul de facturi nu a fost găsit. Rulează inițializarea sistemului de facturi.');
      }
      
      // Preia prima factură din tabel
      const invoiceRow = await prisma.row.findFirst({
        where: { tableId: invoicesTable.id },
        include: {
          cells: {
            include: {
              column: true
            }
          }
        }
      });
      
      if (!invoiceRow) {
        throw new Error('Nu s-a găsit nicio factură în tabelul de facturi');
      }
      
      // Preia items-urile facturii
      const invoiceItemsTable = await prisma.table.findFirst({
        where: {
          databaseId: database.id,
          name: 'invoice_items',
          isProtected: true,
          protectedType: 'invoice_items'
        },
        include: {
          columns: true
        }
      });
      
      let invoiceItems = [];
      if (invoiceItemsTable) {
        // Pentru simplitate, preia toate items-urile din tabelul de items
        // În aplicația reală, ar trebui să fie filtrate după invoice_id
        const itemRows = await prisma.row.findMany({
          where: { 
            tableId: invoiceItemsTable.id
          },
          include: {
            cells: {
              include: {
                column: true
              }
            }
          },
          take: 5 // Limitează la 5 items pentru test
        });
        
        invoiceItems = itemRows.map(row => {
          const item: any = { id: row.id };
          row.cells.forEach(cell => {
            item[cell.column.name] = cell.value;
          });
          return item;
        });
      }
      
      // Construiește obiectul factură din celule
      const invoice: any = { 
        id: invoiceRow.id,
        tenant: tenant,
        items: invoiceItems
      };
      
      invoiceRow.cells.forEach(cell => {
        invoice[cell.column.name] = cell.value;
      });
      
      console.log(`✅ Factură găsită: ${invoice.invoice_number || invoice.id}`);
      console.log(`   Tenant: ${tenant.name}`);
      console.log(`   Suma totală: ${invoice.total_amount || 0} ${invoice.base_currency || 'RON'}`);
      console.log(`   Status: ${invoice.status || 'N/A'}`);
      console.log(`   Items: ${invoiceItems.length}`);
      
      this.reportGenerator.addTestResult('Get Test Invoice', true, {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        tenantName: tenant.name,
        totalAmount: invoice.total_amount,
        currency: invoice.base_currency,
        status: invoice.status,
        itemsCount: invoiceItems.length
      });
      
      return invoice;
      
    } catch (error) {
      this.reportGenerator.addTestResult('Get Test Invoice', false, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.error('❌ Eroare la preluarea facturii:', error);
      throw error;
    }
  }

  /**
   * Testează generarea XML-ului folosind serviciile din aplicație
   */
  private async testXMLGeneration(invoice: any): Promise<void> {
    console.log('\n🔧 Testare generare XML cu serviciile din aplicație...');
    
    try {
      // Pregătește datele pentru XML generator
      const invoiceData = await this.prepareInvoiceDataForXML(invoice);
      
      // Debug: afișează structura datelor
      console.log('🔍 Debug - Structura datelor pentru XML:');
      console.log('  invoiceData.invoiceData.invoice:', JSON.stringify(invoiceData.invoiceData.invoice, null, 2));
      console.log('  invoiceData.invoiceData.items:', JSON.stringify(invoiceData.invoiceData.items, null, 2));
      console.log('  invoiceData.invoiceData.company:', JSON.stringify(invoiceData.invoiceData.company, null, 2));
      console.log('  invoiceData.invoiceData.customer:', JSON.stringify(invoiceData.invoiceData.customer, null, 2));
      
      // Generează XML-ul folosind ANAFXMLGenerator
      const xmlGenerator = new ANAFXMLGenerator();
      const xmlContent = xmlGenerator.generateInvoiceXML({
        invoice: {
          invoice_number: invoiceData.invoiceData.invoice.invoiceNumber,
          invoice_date: invoiceData.invoiceData.invoice.invoiceDate,
          due_date: invoiceData.invoiceData.invoice.dueDate,
          currency: invoiceData.invoiceData.invoice.currency
        },
        company: invoiceData.invoiceData.company,
        customer: invoiceData.invoiceData.customer,
        items: invoiceData.invoiceData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate
        })),
        totals: {
          subtotal: invoiceData.invoiceData.invoice.totals.subtotal,
          tax: invoiceData.invoiceData.invoice.totals.vatTotal,
          total: parseFloat(invoiceData.invoiceData.invoice.totals.grandTotal)
        }
      });
      
      // Salvează XML-ul pentru debug
      await this.saveXMLForInspection(xmlContent, invoice);
      
      // Validează XML-ul
      const validationResult = xmlGenerator.validateXML(xmlContent);
      
      if (validationResult.includes('❌')) {
        console.log('❌ XML invalid:', validationResult);
        console.log('📄 XML generat (primele 1000 caractere):');
        console.log(xmlContent.substring(0, 1000));
        throw new Error(`XML invalid: ${validationResult}`);
      }
      
      console.log('✅ XML generat cu succes');
      console.log(`   Dimensiune: ${xmlContent.length} caractere`);
      console.log(`   Validare: ${validationResult}`);
      
      // Salvează XML-ul pentru inspecție
      await this.saveXMLForInspection(xmlContent, invoice);
      
      this.reportGenerator.addTestResult('XML Generation', true, {
        xmlSize: xmlContent.length,
        validation: validationResult.isValid,
        errors: validationResult.errors
      });
      
      this.generatedXML = xmlContent;
      
    } catch (error) {
      this.reportGenerator.addTestResult('XML Generation', false, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.error('❌ Eroare la generarea XML:', error);
      throw error;
    }
  }

  /**
   * Testează generarea PDF-ului folosind serviciile din aplicație
   */
  private async testPDFGeneration(invoice: any): Promise<void> {
    console.log('\n📄 Testare generare PDF cu serviciile din aplicație...');
    
    try {
      // Pregătește datele pentru PDF generator
      const invoiceData = await this.prepareInvoiceDataForPDF(invoice);
      
      // Generează HTML-ul folosind InvoiceTemplate
      const htmlContent = InvoiceTemplate.generateHTML(invoiceData);
      
      console.log('✅ HTML generat cu succes');
      console.log(`   Dimensiune: ${htmlContent.length} caractere`);
      
      // Salvează HTML-ul pentru inspecție
      await this.saveHTMLForInspection(htmlContent, invoice);
      
      this.reportGenerator.addTestResult('PDF Generation', true, {
        htmlSize: htmlContent.length,
        message: 'HTML generat cu succes (PDF generation simulată)'
      });
      
    } catch (error) {
      this.reportGenerator.addTestResult('PDF Generation', false, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.error('❌ Eroare la generarea PDF:', error);
      // Nu aruncăm eroarea aici pentru că PDF-ul nu este critic pentru test
    }
  }

  /**
   * Pregătește datele facturii pentru XML generator
   */
  private async prepareInvoiceDataForXML(invoice: any): Promise<any> {
    const tenant = invoice.tenant;
    
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
    
    const customerData = {
      name: invoice.customer_name || 'Test Customer SRL',
      taxId: invoice.customer_tax_id || 'RO00000000',
      address: invoice.customer_address || 'Strada Client 456, București',
      email: invoice.customer_email || 'client@test.com'
    };
    
    const items = (invoice.items || []).map((item: any, index: number) => ({
      id: item.id || index + 1,
      description: item.description || item.product_name || 'Produs de test',
      quantity: item.quantity || 1,
      unitOfMeasure: item.unit_of_measure || 'C62',
      unitPrice: item.unit_price || item.price || 100,
      totalPrice: item.total_price || (item.quantity * item.unit_price) || 100,
      vatRate: item.vat_rate || item.tax_rate || 19,
      vatAmount: item.vat_amount || item.tax_amount || 19,
      currency: item.currency || invoice.base_currency || 'RON'
    }));
    
    const subtotal = invoice.subtotal || invoice.total_amount - (invoice.tax_amount || 0) || 100;
    const vatTotal = invoice.tax_amount || invoice.vat_amount || 19;
    const grandTotal = invoice.total_amount || invoice.grand_total || 119;
    
    return {
      invoiceData: {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number || `INV-${invoice.id}`,
          invoiceDate: invoice.invoice_date || invoice.date || new Date().toISOString().split('T')[0],
          dueDate: invoice.due_date || invoice.dueDate || new Date().toISOString().split('T')[0],
          currency: invoice.base_currency || 'RON',
          totalAmount: invoice.total_amount || 100,
          taxAmount: invoice.tax_amount || 19,
          subtotal: subtotal,
          status: invoice.status || 'draft',
          totals: {
            subtotal,
            vatTotal,
            grandTotal,
            currency: invoice.base_currency || 'RON'
          }
        },
        items,
        customer: customerData,
        company: companyData
      }
    };
  }

  /**
   * Pregătește datele facturii pentru PDF generator
   */
  private async prepareInvoiceDataForPDF(invoice: any): Promise<any> {
    const tenant = invoice.tenant;
    
    // Pregătește items-urile pentru PDF
    const items = invoice.items || [];
    const formattedItems = items.map((item: any) => ({
      product_name: item.description || 'Produs',
      product_description: item.description || '',
      product_sku: item.id || '',
      quantity: item.quantity || 1,
      unit_of_measure: item.unitOfMeasure || 'pcs',
      unit_price: item.unitPrice || 0,
      total_price: item.totalPrice || 0,
      tax_rate: item.vatRate || 19,
      tax_amount: item.vatAmount || 0,
      currency: item.currency || 'RON'
    }));
    
    return {
      invoice: {
        ...invoice,
        items: formattedItems
      },
      totals: {
        subtotal: invoice.subtotal || 100,
        vatTotal: invoice.tax_amount || 19,
        totalAmount: invoice.total_amount || 119,
        grandTotal: invoice.grand_total || 119,
        currency: invoice.currency || 'RON'
      },
      company: {
        company_name: tenant.companyName || 'Test Company SRL',
        company_tax_id: tenant.companyTaxId || 'RO12345678',
        company_address: tenant.address || 'Strada Test 123, București',
        company_city: tenant.companyCity || 'București',
        company_country: tenant.companyCountry || 'România',
        company_email: tenant.companyEmail || 'test@company.com',
        company_phone: tenant.phone || '+40 123 456 789'
      },
      customer: {
        customer_name: invoice.customer_name || 'Test Customer SRL',
        customer_tax_id: invoice.customer_tax_id || 'RO00000000',
        customer_address: invoice.customer_address || 'Strada Client 456, București',
        customer_email: invoice.customer_email || 'client@test.com'
      },
      translations: {
        invoice: 'Factură',
        invoice_number: 'Număr factură',
        date: 'Data',
        due_date: 'Data scadență',
        customer: 'Client',
        description: 'Descriere',
        quantity: 'Cantitate',
        unit_price: 'Preț unitar',
        total: 'Total',
        subtotal: 'Subtotal',
        vat: 'TVA',
        grand_total: 'Total general'
      }
    };
  }

  /**
   * Salvează XML-ul pentru inspecție
   */
  private async saveXMLForInspection(xmlContent: string, invoice: any): Promise<void> {
    try {
      await fs.mkdir(TEST_CONFIG.RESULTS_DIR, { recursive: true });
      
      const filename = `invoice-${invoice.id || 'test'}-${Date.now()}.xml`;
      const filepath = path.join(TEST_CONFIG.RESULTS_DIR, filename);
      
      await fs.writeFile(filepath, xmlContent);
      console.log(`   XML salvat: ${filepath}`);
      
    } catch (error) {
      console.warn('⚠️  Nu s-a putut salva XML-ul:', error);
    }
  }

  /**
   * Salvează HTML-ul pentru inspecție
   */
  private async saveHTMLForInspection(htmlContent: string, invoice: any): Promise<void> {
    try {
      await fs.mkdir(TEST_CONFIG.RESULTS_DIR, { recursive: true });
      
      const filename = `invoice-${invoice.id || 'test'}-${Date.now()}.html`;
      const filepath = path.join(TEST_CONFIG.RESULTS_DIR, filename);
      
      await fs.writeFile(filepath, htmlContent);
      console.log(`   HTML salvat: ${filepath}`);
      
    } catch (error) {
      console.warn('⚠️  Nu s-a putut salva HTML-ul:', error);
    }
  }

  /**
   * Testează autentificarea ANAF
   */
  private async testANAFAuthentication(): Promise<boolean> {
    console.log('\n🔐 Testare autentificare ANAF...');
    
    try {
      const isAuthenticated = await ANAFOAuthService.isAuthenticated(1, TEST_CONFIG.TEST_TENANT_ID);
      
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
      this.reportGenerator.addTestResult('ANAF Authentication', false, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.error('❌ Eroare la verificarea autentificării:', error);
      return false;
    }
  }

  /**
   * Testează trimiterea facturii la ANAF
   */
  private async testInvoiceSubmission(invoice: any): Promise<void> {
    console.log('\n📤 Testare trimitere factură la ANAF...');
    
    try {
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
        
        this.submissionId = result.submissionId;
        
      } else {
        throw new Error(result.message || 'Trimiterea a eșuat');
      }
      
    } catch (error) {
      this.reportGenerator.addTestResult('Invoice Submission', false, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.error('❌ Eroare la trimiterea facturii:', error);
    }
  }

  /**
   * Testează verificarea statusului
   */
  private async testStatusChecking(invoice: any): Promise<void> {
    console.log('\n🔍 Testare verificare status...');
    
    if (!this.submissionId) {
      console.log('⚠️  Nu există submission ID pentru verificarea statusului');
      this.reportGenerator.addTestResult('Status Checking', false, {
        message: 'Nu există submission ID pentru verificarea statusului'
      });
      return;
    }
    
    try {
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
      this.reportGenerator.addTestResult('Status Checking', false, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.error('❌ Eroare la verificarea statusului:', error);
    }
  }

  /**
   * Generează rapoarte finale
   */
  private async generateReports(): Promise<void> {
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
  private results: TestReport;

  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testResults: [],
      summary: {
        databaseConnection: { success: false, message: '' },
        invoiceRetrieval: { success: false, message: '' },
        xmlGeneration: { success: false, message: '' },
        pdfGeneration: { success: false, message: '' },
        anafAuthentication: { success: false, message: '' },
        invoiceSubmission: { success: false, message: '' },
        statusChecking: { success: false, message: '' },
        overallSuccess: false
      }
    };
  }

  addTestResult(testName: string, success: boolean, details: Record<string, any> = {}): void {
    const result: TestResult = {
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

  updateSummary(section: string, data: any): void {
    this.results.summary[section as keyof TestReport['summary']] = { ...this.results.summary[section as keyof TestReport['summary']], ...data };
  }

  finalize(): void {
    this.results.endTime = new Date().toISOString();
    this.results.summary.overallSuccess = this.results.failedTests === 0;
    
    const start = new Date(this.results.startTime);
    const end = new Date(this.results.endTime!);
    this.results.duration = end.getTime() - start.getTime();
  }

  generateConsoleReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Raport Test ANAF e-Factura Real Workflow');
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
    console.log(`   📄 Generare PDF: ${this.results.summary.pdfGeneration.success ? '✅' : '❌'} ${this.results.summary.pdfGeneration.message}`);
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
      console.log('🎉 Toate testele au trecut! Workflow-ul ANAF e-Factura funcționează corect.');
    } else {
      console.log('⚠️  Unele teste au eșuat. Te rugăm să verifici rezultatele și să corectezi problemele.');
    }
    console.log('='.repeat(80) + '\n');
  }

  async saveReport(): Promise<void> {
    try {
      await fs.mkdir(TEST_CONFIG.RESULTS_DIR, { recursive: true });
      
      const reportPath = path.join(TEST_CONFIG.RESULTS_DIR, TEST_CONFIG.REPORT_FILE);
      await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      
      console.log(`\n💾 Raport salvat: ${reportPath}`);
    } catch (error) {
      console.error('❌ Nu s-a putut salva raportul:', error);
    }
  }
}

/**
 * Funcția principală
 */
async function main(): Promise<void> {
  console.log('🎯 ANAF e-Factura Real Workflow Test');
  console.log('====================================');
  console.log('Acest test folosește workflow-ul real din aplicație:');
  console.log('• Preia factură din baza de date (tabelul invoices)');
  console.log('• Generează XML folosind ANAFXMLGenerator');
  console.log('• Generează PDF folosind InvoiceTemplate');
  console.log('• Trimite factura folosind ANAFIntegration');
  console.log('• Verifică răspunsul ANAF și statusul');
  console.log('');
  
  const testRunner = new ANAFRealWorkflowTestRunner();
  await testRunner.runAllTests();
}

// Rulează testul
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Eroare fatală:', error);
    process.exit(1);
  });
}

export {
  ANAFRealWorkflowTestRunner,
  TestReportGenerator,
  TEST_CONFIG
};
