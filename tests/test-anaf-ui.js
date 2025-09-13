/**
 * Test ANAF UI
 * 
 * Testează dacă UI-ul ANAF funcționează corect
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

class ANAFUITester {
  constructor() {
    this.results = [];
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'ANAF-UI-Test/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: 10000
      };

      const req = http.request(url, requestOptions, (res) => {
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

  async testANAFPage() {
    console.log('\n🌐 Testare pagină ANAF UI...');
    
    try {
      const response = await this.makeRequest(`${BASE_URL}/test/anaf`);
      
      if (response.status === 200) {
        console.log('✅ Pagina ANAF UI este accesibilă');
        this.results.push({
          test: 'ANAF Page',
          success: true,
          message: 'Page is accessible'
        });
        return true;
      } else {
        console.log(`❌ Pagina ANAF UI răspunde cu status ${response.status}`);
        this.results.push({
          test: 'ANAF Page',
          success: false,
          message: `HTTP ${response.status}`
        });
        return false;
      }
    } catch (error) {
      console.log(`❌ Eroare la accesarea paginii ANAF: ${error.message}`);
      this.results.push({
        test: 'ANAF Page',
        success: false,
        message: error.message
      });
      return false;
    }
  }

  async testSandboxAPI() {
    console.log('\n🧪 Testare API sandbox...');
    
    try {
      const response = await this.makeRequest(`${BASE_URL}/api/test/anaf/sandbox`);
      
      if (response.status === 200) {
        console.log('✅ API sandbox funcționează');
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        this.results.push({
          test: 'Sandbox API',
          success: true,
          message: 'API is working',
          data: response.data
        });
        return true;
      } else {
        console.log(`❌ API sandbox răspunde cu status ${response.status}`);
        this.results.push({
          test: 'Sandbox API',
          success: false,
          message: `HTTP ${response.status}`
        });
        return false;
      }
    } catch (error) {
      console.log(`❌ Eroare la testarea API sandbox: ${error.message}`);
      this.results.push({
        test: 'Sandbox API',
        success: false,
        message: error.message
      });
      return false;
    }
  }

  async testAuthUrlAPI() {
    console.log('\n🔗 Testare API auth URL...');
    
    try {
      const testConfig = {
        baseUrl: 'https://api.anaf.ro/test/FCTEL/rest',
        clientId: 'test-client-id',
        redirectUri: 'https://test.ngrok.io/api/anaf/oauth/callback'
      };

      const response = await this.makeRequest(`${BASE_URL}/api/test/anaf/auth-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testConfig)
      });
      
      if (response.status === 200) {
        console.log('✅ API auth URL funcționează');
        console.log(`   Auth URL: ${response.data.authUrl}`);
        this.results.push({
          test: 'Auth URL API',
          success: true,
          message: 'API is working',
          data: response.data
        });
        return true;
      } else {
        console.log(`❌ API auth URL răspunde cu status ${response.status}`);
        this.results.push({
          test: 'Auth URL API',
          success: false,
          message: `HTTP ${response.status}`
        });
        return false;
      }
    } catch (error) {
      console.log(`❌ Eroare la testarea API auth URL: ${error.message}`);
      this.results.push({
        test: 'Auth URL API',
        success: false,
        message: error.message
      });
      return false;
    }
  }

  async testGenerateInvoiceAPI() {
    console.log('\n📄 Testare API generate invoice...');
    
    try {
      const response = await this.makeRequest(`${BASE_URL}/api/test/anaf/generate-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ API generate invoice funcționează');
        console.log(`   XML Length: ${response.data.xmlContent.length} characters`);
        this.results.push({
          test: 'Generate Invoice API',
          success: true,
          message: 'API is working',
          data: { xmlLength: response.data.xmlContent.length }
        });
        return true;
      } else {
        console.log(`❌ API generate invoice răspunde cu status ${response.status}`);
        this.results.push({
          test: 'Generate Invoice API',
          success: false,
          message: `HTTP ${response.status}`
        });
        return false;
      }
    } catch (error) {
      console.log(`❌ Eroare la testarea API generate invoice: ${error.message}`);
      this.results.push({
        test: 'Generate Invoice API',
        success: false,
        message: error.message
      });
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Testare ANAF UI...');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    // Testează paginile și API-urile
    await this.testANAFPage();
    await this.testSandboxAPI();
    await this.testAuthUrlAPI();
    await this.testGenerateInvoiceAPI();
    
    const duration = Date.now() - startTime;
    this.generateReport(duration);
  }

  generateReport(duration) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RAPORT TEST ANAF UI');
    console.log('='.repeat(50));
    
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
      console.log(`      ${result.message}`);
      if (result.data) {
        console.log(`      Data: ${JSON.stringify(result.data, null, 6).substring(0, 100)}...`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    
    if (successful === total) {
      console.log('🎉 Toate testele au trecut! ANAF UI funcționează perfect.');
      console.log('\n🌐 Accesează UI-ul la:');
      console.log(`   ${BASE_URL}/test/anaf`);
    } else {
      console.log('⚠️  Unele teste au eșuat. Verifică aplicația.');
    }
    
    console.log('='.repeat(50));
  }
}

// Rulează testele
async function main() {
  const tester = new ANAFUITester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ANAFUITester;
