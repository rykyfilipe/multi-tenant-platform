/**
 * ANAF Sandbox Test
 * 
 * Testează conectivitatea la sandbox-ul ANAF
 * și verifică dacă rutele de test funcționează
 */

const https = require('https');

const SANDBOX_CONFIG = {
  baseUrl: 'https://api.anaf.ro/test/FCTEL/rest',
  endpoints: {
    health: '/health',
    status: '/api/v1/status',
    invoices: '/api/v1/invoices'
  }
};

class ANAFSandboxTester {
  constructor() {
    this.results = [];
  }

  async testEndpoint(endpoint, description) {
    console.log(`\n🔍 Testare ${description}...`);
    console.log(`   URL: ${SANDBOX_CONFIG.baseUrl}${endpoint}`);
    
    try {
      const response = await this.makeRequest(`${SANDBOX_CONFIG.baseUrl}${endpoint}`);
      
      console.log(`✅ ${description} - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      
      this.results.push({
        endpoint,
        description,
        success: true,
        status: response.status,
        data: response.data
      });
      
    } catch (error) {
      console.log(`❌ ${description} - Eroare: ${error.message}`);
      
      this.results.push({
        endpoint,
        description,
        success: false,
        error: error.message
      });
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'ANAF-Sandbox-Test/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: jsonData
            });
          } catch (parseError) {
            resolve({
              status: res.statusCode,
              data: { raw: data }
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

      req.end();
    });
  }

  async runAllTests() {
    console.log('🚀 Începe testarea sandbox-ului ANAF...');
    console.log(`📍 Base URL: ${SANDBOX_CONFIG.baseUrl}`);
    
    // Testează endpoint-urile de bază
    await this.testEndpoint(SANDBOX_CONFIG.endpoints.health, 'Health Check');
    await this.testEndpoint(SANDBOX_CONFIG.endpoints.status, 'Status Endpoint');
    await this.testEndpoint(SANDBOX_CONFIG.endpoints.invoices, 'Invoices Endpoint');
    
    // Generează raportul
    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RAPORT TEST ANAF SANDBOX');
    console.log('='.repeat(80));
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`\n📈 Rezultate:`);
    console.log(`   Total teste: ${total}`);
    console.log(`   ✅ Reușite: ${successful}`);
    console.log(`   ❌ Eșuate: ${total - successful}`);
    console.log(`   🎯 Rata de succes: ${((successful / total) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 Detalii:`);
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.description}`);
      if (result.success) {
        console.log(`      Status: ${result.status}`);
      } else {
        console.log(`      Eroare: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (successful === total) {
      console.log('🎉 Toate testele au trecut! Sandbox-ul ANAF este accesibil.');
    } else {
      console.log('⚠️  Unele teste au eșuat. Verifică configurația și conectivitatea.');
    }
    
    console.log('='.repeat(80));
  }
}

// Rulează testele
async function main() {
  const tester = new ANAFSandboxTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ANAFSandboxTester;
