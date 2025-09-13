/**
 * ANAF Complete Test - OAuth + Invoice Submission
 * 
 * Test complet pentru:
 * 1. Autentificare OAuth la ANAF sandbox
 * 2. Generare XML factură
 * 3. Trimitere factură la ANAF
 * 4. Verificare status
 * 5. Download răspuns
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config();

const ANAF_CONFIG = {
  baseUrl: process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest',
  clientId: process.env.ANAF_CLIENT_ID || 'test-client-id',
  clientSecret: process.env.ANAF_CLIENT_SECRET || 'test-client-secret',
  redirectUri: process.env.ANAF_REDIRECT_URI || 'https://your-ngrok-url.ngrok.io/api/anaf/oauth/callback',
  environment: process.env.ANAF_ENVIRONMENT || 'sandbox'
};

class ANAFCompleteTester {
  constructor() {
    this.results = [];
    this.accessToken = null;
    this.refreshToken = null;
    this.submissionId = null;
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'ANAF-Complete-Test/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: 30000
      };

      const req = https.request(url, requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData,
              raw: data
            });
          } catch (parseError) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: { raw: data },
              raw: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  async testOAuthFlow() {
    console.log('\n🔐 Testare OAuth Flow...');
    
    try {
      // 1. Generează URL-ul de autorizare
      const authUrl = this.generateAuthUrl();
      console.log(`✅ URL autorizare generat: ${authUrl}`);
      
      // 2. Simulează autorizarea (în realitate utilizatorul ar face click)
      console.log('⚠️  Pentru test complet, deschide URL-ul în browser și autentifică-te');
      console.log(`   ${authUrl}`);
      
      // 3. Simulează primirea codului de autorizare
      const authCode = await this.simulateAuthCode();
      
      if (!authCode) {
        throw new Error('Nu s-a putut obține codul de autorizare');
      }
      
      // 4. Exchange code for token
      const tokenResponse = await this.exchangeCodeForToken(authCode);
      
      if (tokenResponse.success) {
        this.accessToken = tokenResponse.access_token;
        this.refreshToken = tokenResponse.refresh_token;
        
        console.log('✅ Token obținut cu succes');
        console.log(`   Access Token: ${this.accessToken.substring(0, 20)}...`);
        console.log(`   Expires in: ${tokenResponse.expires_in} seconds`);
        
        this.results.push({
          test: 'OAuth Flow',
          success: true,
          data: {
            accessToken: this.accessToken.substring(0, 20) + '...',
            expiresIn: tokenResponse.expires_in
          }
        });
        
        return true;
      } else {
        throw new Error(tokenResponse.error || 'Eroare la obținerea token-ului');
      }
      
    } catch (error) {
      console.log(`❌ OAuth Flow eșuat: ${error.message}`);
      this.results.push({
        test: 'OAuth Flow',
        success: false,
        error: error.message
      });
      return false;
    }
  }

  generateAuthUrl() {
    const params = new URLSearchParams({
      client_id: ANAF_CONFIG.clientId,
      redirect_uri: ANAF_CONFIG.redirectUri,
      response_type: 'code',
      scope: 'e-factura',
      state: 'test-state-' + Date.now()
    });

    return `${ANAF_CONFIG.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  async simulateAuthCode() {
    // În test real, ar trebui să primești codul din callback
    // Pentru test, simulez un cod
    console.log('⚠️  Simulare cod de autorizare pentru test...');
    return 'test-auth-code-' + Date.now();
  }

  async exchangeCodeForToken(authCode) {
    console.log('🔄 Exchange code for token...');
    
    try {
      const response = await this.makeRequest(`${ANAF_CONFIG.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: ANAF_CONFIG.clientId,
          client_secret: ANAF_CONFIG.clientSecret,
          redirect_uri: ANAF_CONFIG.redirectUri,
          code: authCode
        }).toString()
      });

      if (response.status === 200) {
        return {
          success: true,
          ...response.data
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.data.message || 'Unknown error'}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateTestInvoiceXML() {
    const invoiceNumber = 'TEST-' + Date.now();
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${currentDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>RON</cbc:DocumentCurrencyCode>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>RO12345678</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>Test Company SRL</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Strada Test 123</cbc:StreetName>
        <cbc:CityName>București</cbc:CityName>
        <cbc:PostalZone>010001</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode listID="ISO3166-1:Alpha2">RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:ElectronicMail>test@company.com</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>RO00000000</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>Test Customer SRL</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Strada Client 456</cbc:StreetName>
        <cbc:CityName>București</cbc:CityName>
        <cbc:PostalZone>010002</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode listID="ISO3166-1:Alpha2">RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:ElectronicMail>client@test.com</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity>1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>100.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>Produs de test</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount>100.00</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
  
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="RON">19.00</cbc:TaxAmount>
  </cac:TaxTotal>
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="RON">100.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="RON">100.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="RON">119.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="RON">119.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
  }

  async testInvoiceSubmission() {
    console.log('\n📄 Testare trimitere factură...');
    
    if (!this.accessToken) {
      console.log('❌ Nu există access token. Rulează mai întâi OAuth flow.');
      this.results.push({
        test: 'Invoice Submission',
        success: false,
        error: 'No access token'
      });
      return false;
    }

    try {
      const xmlContent = this.generateTestInvoiceXML();
      console.log(`✅ XML generat (${xmlContent.length} caractere)`);
      
      // Salvează XML-ul pentru debug
      await this.saveXMLForDebug(xmlContent);
      
      // Trimite factura la ANAF
      const response = await this.makeRequest(`${ANAF_CONFIG.baseUrl}/api/v1/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/xml'
        },
        body: xmlContent
      });

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Factura trimisă cu succes');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        // Extrage submission ID din răspuns
        this.submissionId = response.data.submissionId || response.data.id || 'unknown';
        
        this.results.push({
          test: 'Invoice Submission',
          success: true,
          data: {
            status: response.status,
            submissionId: this.submissionId,
            response: response.data
          }
        });
        
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.data.message || response.raw}`);
      }
      
    } catch (error) {
      console.log(`❌ Trimitere factură eșuată: ${error.message}`);
      this.results.push({
        test: 'Invoice Submission',
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async testStatusCheck() {
    console.log('\n🔍 Testare verificare status...');
    
    if (!this.submissionId) {
      console.log('❌ Nu există submission ID. Rulează mai întâi trimiterea facturii.');
      this.results.push({
        test: 'Status Check',
        success: false,
        error: 'No submission ID'
      });
      return false;
    }

    try {
      const response = await this.makeRequest(`${ANAF_CONFIG.baseUrl}/api/v1/invoices/${this.submissionId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.status === 200) {
        console.log('✅ Status verificat cu succes');
        console.log(`   Status: ${response.data.status || 'unknown'}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        this.results.push({
          test: 'Status Check',
          success: true,
          data: response.data
        });
        
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`❌ Verificare status eșuată: ${error.message}`);
      this.results.push({
        test: 'Status Check',
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async saveXMLForDebug(xmlContent) {
    try {
      const debugDir = 'test-results/anaf-complete';
      await fs.mkdir(debugDir, { recursive: true });
      
      const filename = `invoice-${Date.now()}.xml`;
      const filepath = path.join(debugDir, filename);
      
      await fs.writeFile(filepath, xmlContent, 'utf-8');
      console.log(`   XML salvat: ${filepath}`);
    } catch (error) {
      console.warn('⚠️  Nu s-a putut salva XML-ul:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Începe testarea completă ANAF...');
    console.log(`📍 Sandbox URL: ${ANAF_CONFIG.baseUrl}`);
    console.log(`🔑 Client ID: ${ANAF_CONFIG.clientId}`);
    
    const startTime = Date.now();
    
    // 1. OAuth Flow
    const oauthSuccess = await this.testOAuthFlow();
    
    if (oauthSuccess) {
      // 2. Invoice Submission
      await this.testInvoiceSubmission();
      
      // 3. Status Check
      await this.testStatusCheck();
    }
    
    const duration = Date.now() - startTime;
    this.generateReport(duration);
  }

  generateReport(duration) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RAPORT TEST COMPLET ANAF');
    console.log('='.repeat(80));
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`\n⏱️  Durata: ${duration}ms`);
    console.log(`📈 Rezultate:`);
    console.log(`   Total teste: ${total}`);
    console.log(`   ✅ Reușite: ${successful}`);
    console.log(`   ❌ Eșuate: ${total - successful}`);
    console.log(`   🎯 Rata de succes: ${((successful / total) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 Detalii:`);
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.test}`);
      if (result.success && result.data) {
        console.log(`      Data: ${JSON.stringify(result.data, null, 6).substring(0, 100)}...`);
      } else if (result.error) {
        console.log(`      Eroare: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (successful === total) {
      console.log('🎉 Toate testele au trecut! ANAF integration funcționează perfect.');
    } else {
      console.log('⚠️  Unele teste au eșuat. Verifică configurația și credențialele.');
    }
    
    console.log('='.repeat(80));
  }
}

// Rulează testele
async function main() {
  const tester = new ANAFCompleteTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ANAFCompleteTester;
