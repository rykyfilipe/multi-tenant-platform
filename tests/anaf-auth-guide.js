/**
 * ANAF Authentication Guide
 * 
 * Ghid complet pentru autentificarea la ANAF sandbox
 */

const https = require('https');

const ANAF_CONFIG = {
  baseUrl: 'https://api.anaf.ro/test/FCTEL/rest',
  clientId: process.env.ANAF_CLIENT_ID || 'YOUR_ANAF_CLIENT_ID',
  clientSecret: process.env.ANAF_CLIENT_SECRET || 'YOUR_ANAF_CLIENT_SECRET',
  redirectUri: process.env.ANAF_REDIRECT_URI || 'https://your-ngrok-url.ngrok.io/api/anaf/oauth/callback'
};

class ANAFAuthGuide {
  constructor() {
    this.step = 1;
  }

  async runGuide() {
    console.log('🚀 GHID COMPLET AUTENTIFICARE ANAF SANDBOX');
    console.log('='.repeat(80));
    
    await this.step1_CheckCredentials();
    await this.step2_GenerateAuthUrl();
    await this.step3_ManualAuth();
    await this.step4_TestWithRealCredentials();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Ghid complet! Urmărește pașii pentru autentificare reală.');
    console.log('='.repeat(80));
  }

  async step1_CheckCredentials() {
    console.log(`\n📋 PASUL ${this.step++}: Verificare credențiale`);
    console.log('-'.repeat(50));
    
    console.log('🔑 Credențiale necesare:');
    console.log(`   ANAF_CLIENT_ID: ${ANAF_CONFIG.clientId}`);
    console.log(`   ANAF_CLIENT_SECRET: ${ANAF_CONFIG.clientSecret}`);
    console.log(`   ANAF_REDIRECT_URI: ${ANAF_CONFIG.redirectUri}`);
    
    if (ANAF_CONFIG.clientId === 'YOUR_ANAF_CLIENT_ID') {
      console.log('\n❌ PROBLEMĂ: Credențialele nu sunt configurate!');
      console.log('\n📝 Pentru a obține credențialele:');
      console.log('   1. Accesează: https://api.anaf.ro/');
      console.log('   2. Înregistrează-te pentru sandbox');
      console.log('   3. Creează o aplicație OAuth');
      console.log('   4. Copiază Client ID și Client Secret');
      console.log('   5. Adaugă în fișierul .env:');
      console.log('      ANAF_CLIENT_ID="your-real-client-id"');
      console.log('      ANAF_CLIENT_SECRET="your-real-client-secret"');
      console.log('      ANAF_REDIRECT_URI="https://your-ngrok-url.ngrok.io/api/anaf/oauth/callback"');
    } else {
      console.log('\n✅ Credențialele sunt configurate');
    }
  }

  async step2_GenerateAuthUrl() {
    console.log(`\n📋 PASUL ${this.step++}: Generare URL autorizare`);
    console.log('-'.repeat(50));
    
    const authUrl = this.generateAuthUrl();
    console.log('🔗 URL-ul de autorizare:');
    console.log(`   ${authUrl}`);
    
    console.log('\n📝 Pași pentru autorizare:');
    console.log('   1. Deschide URL-ul în browser');
    console.log('   2. Autentifică-te cu credențialele ANAF');
    console.log('   3. Autorizează aplicația');
    console.log('   4. Vei fi redirecționat la redirect_uri cu parametrul "code"');
    console.log('   5. Copiază valoarea parametrului "code"');
  }

  generateAuthUrl() {
    const params = new URLSearchParams({
      client_id: ANAF_CONFIG.clientId,
      redirect_uri: ANAF_CONFIG.redirectUri,
      response_type: 'code',
      scope: 'e-factura',
      state: 'auth-state-' + Date.now()
    });

    return `${ANAF_CONFIG.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  async step3_ManualAuth() {
    console.log(`\n📋 PASUL ${this.step++}: Testare manuală`);
    console.log('-'.repeat(50));
    
    console.log('🧪 Pentru a testa manual:');
    console.log('   1. Rulează: npm run test:anaf-complete');
    console.log('   2. Copiază URL-ul de autorizare din output');
    console.log('   3. Deschide în browser și autentifică-te');
    console.log('   4. Copiază codul din redirect_uri');
    console.log('   5. Modifică testul să folosească codul real');
    
    console.log('\n🔧 Sau folosește aplicația web:');
    console.log('   1. Pornește aplicația: npm run dev');
    console.log('   2. Accesează: http://localhost:3000');
    console.log('   3. Mergi la o factură');
    console.log('   4. Apasă "Send to ANAF"');
    console.log('   5. Urmează flow-ul de autentificare');
  }

  async step4_TestWithRealCredentials() {
    console.log(`\n📋 PASUL ${this.step++}: Testare cu credențiale reale`);
    console.log('-'.repeat(50));
    
    if (ANAF_CONFIG.clientId !== 'YOUR_ANAF_CLIENT_ID') {
      console.log('🧪 Testează conectivitatea:');
      console.log('   npm run test:anaf-sandbox');
      
      console.log('\n🧪 Testează OAuth flow:');
      console.log('   npm run test:anaf-complete');
      
      console.log('\n🧪 Testează workflow-ul real:');
      console.log('   npm run test:anaf-e-factura-real');
    } else {
      console.log('⚠️  Configurează mai întâi credențialele reale');
    }
  }

  async testWithRealCode(authCode) {
    console.log('\n🔄 Testare cu cod real de autorizare...');
    
    try {
      const response = await this.exchangeCodeForToken(authCode);
      
      if (response.success) {
        console.log('✅ Token obținut cu succes!');
        console.log(`   Access Token: ${response.access_token.substring(0, 20)}...`);
        console.log(`   Expires in: ${response.expires_in} seconds`);
        
        // Testează API-ul cu token-ul real
        await this.testAPIWithToken(response.access_token);
        
        return true;
      } else {
        console.log(`❌ Eroare la obținerea token-ului: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Eroare: ${error.message}`);
      return false;
    }
  }

  async exchangeCodeForToken(authCode) {
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
  }

  async testAPIWithToken(accessToken) {
    console.log('\n🧪 Testare API cu token real...');
    
    try {
      const response = await this.makeRequest(`${ANAF_CONFIG.baseUrl}/api/v1/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.status === 200) {
        console.log('✅ API funcționează cu token real!');
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        return true;
      } else {
        console.log(`⚠️  API răspunde cu status ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Eroare la testarea API: ${error.message}`);
      return false;
    }
  }

  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'ANAF-Auth-Guide/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: 10000
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

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }
}

// Rulează ghidul
async function main() {
  const guide = new ANAFAuthGuide();
  await guide.runGuide();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ANAFAuthGuide;
