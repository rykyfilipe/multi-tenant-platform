/**
 * ANAF OAuth Real Test
 * 
 * Testează OAuth flow-ul cu credențialele reale
 */

require('dotenv').config();
const https = require('https');

const ANAF_CONFIG = {
  baseUrl: process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest',
  clientId: process.env.ANAF_CLIENT_ID,
  clientSecret: process.env.ANAF_CLIENT_SECRET,
  redirectUri: process.env.ANAF_REDIRECT_URI,
  environment: process.env.ANAF_ENVIRONMENT || 'sandbox'
};

class ANAFOAuthRealTester {
  constructor() {
    this.results = [];
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'ANAF-OAuth-Real-Test/1.0',
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

  async testCredentials() {
    console.log('\n🔑 Testare credențiale...');
    
    if (!ANAF_CONFIG.clientId || !ANAF_CONFIG.clientSecret) {
      console.log('❌ Credențialele nu sunt configurate!');
      return false;
    }
    
    console.log(`✅ Client ID: ${ANAF_CONFIG.clientId.substring(0, 20)}...`);
    console.log(`✅ Client Secret: ${ANAF_CONFIG.clientSecret ? 'SET' : 'NOT SET'}`);
    console.log(`✅ Redirect URI: ${ANAF_CONFIG.redirectUri}`);
    console.log(`✅ Base URL: ${ANAF_CONFIG.baseUrl}`);
    
    return true;
  }

  async testAuthUrl() {
    console.log('\n🔗 Testare URL autorizare...');
    
    const authUrl = this.generateAuthUrl();
    console.log(`URL: ${authUrl}`);
    
    try {
      const response = await this.makeRequest(authUrl);
      
      if (response.status === 200) {
        console.log('✅ URL de autorizare funcționează');
        console.log(`   Response: ${response.raw.substring(0, 200)}...`);
        return true;
      } else if (response.status === 302 || response.status === 301) {
        console.log('✅ URL de autorizare redirecționează (normal pentru OAuth)');
        console.log(`   Location: ${response.headers.location || 'N/A'}`);
        return true;
      } else {
        console.log(`⚠️  URL răspunde cu status ${response.status}`);
        console.log(`   Response: ${response.raw.substring(0, 200)}...`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Eroare la testarea URL-ului: ${error.message}`);
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

  async testTokenEndpoint() {
    console.log('\n🔄 Testare endpoint token...');
    
    try {
      // Testează cu un cod fals pentru a vedea dacă endpoint-ul răspunde
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
          code: 'test-code'
        }).toString()
      });

      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      if (response.status === 400) {
        console.log('✅ Endpoint token funcționează (400 = cod invalid, normal)');
        return true;
      } else if (response.status === 401) {
        console.log('✅ Endpoint token funcționează (401 = credențiale invalide, normal)');
        return true;
      } else {
        console.log(`⚠️  Status neașteptat: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Eroare la testarea endpoint-ului token: ${error.message}`);
      return false;
    }
  }

  async testAPIEndpoints() {
    console.log('\n🧪 Testare endpoint-uri API...');
    
    const endpoints = [
      { path: '/api/v1/status', name: 'Status' },
      { path: '/api/v1/invoices', name: 'Invoices' },
      { path: '/health', name: 'Health' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${ANAF_CONFIG.baseUrl}${endpoint.path}`);
        
        if (response.status === 401) {
          console.log(`✅ ${endpoint.name} endpoint funcționează (401 = necesită autentificare)`);
        } else if (response.status === 200) {
          console.log(`✅ ${endpoint.name} endpoint funcționează (200 = OK)`);
        } else {
          console.log(`⚠️  ${endpoint.name} endpoint răspunde cu ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} endpoint eșuat: ${error.message}`);
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Testare OAuth ANAF cu credențiale reale...');
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    // 1. Testează credențialele
    const credentialsOk = await this.testCredentials();
    
    if (credentialsOk) {
      // 2. Testează URL-ul de autorizare
      await this.testAuthUrl();
      
      // 3. Testează endpoint-ul token
      await this.testTokenEndpoint();
      
      // 4. Testează endpoint-urile API
      await this.testAPIEndpoints();
    }
    
    const duration = Date.now() - startTime;
    this.generateReport(duration);
  }

  generateReport(duration) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPORT TEST OAuth ANAF REAL');
    console.log('='.repeat(60));
    
    console.log(`\n⏱️  Durata: ${duration}ms`);
    console.log(`🔑 Credențiale: ${ANAF_CONFIG.clientId ? 'CONFIGURATE' : 'LIPSEȘTE'}`);
    console.log(`🌐 Base URL: ${ANAF_CONFIG.baseUrl}`);
    console.log(`🔗 Redirect URI: ${ANAF_CONFIG.redirectUri}`);
    
    console.log('\n📝 Următorii pași:');
    console.log('   1. Deschide URL-ul de autorizare în browser');
    console.log('   2. Autentifică-te cu credențialele ANAF');
    console.log('   3. Autorizează aplicația');
    console.log('   4. Copiază codul din redirect_uri');
    console.log('   5. Folosește codul pentru a obține access token');
    
    console.log('\n🔗 URL de autorizare:');
    console.log(`   ${this.generateAuthUrl()}`);
    
    console.log('\n' + '='.repeat(60));
  }
}

// Rulează testele
async function main() {
  const tester = new ANAFOAuthRealTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ANAFOAuthRealTester;
