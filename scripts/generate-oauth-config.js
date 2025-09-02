#!/usr/bin/env node

/**
 * Script pentru generarea automată a configurației OAuth
 * Folosește: node scripts/generate-oauth-config.js
 */

const fs = require('fs');
const path = require('path');

// Configurații pentru diferite medii
const environments = {
  development: {
    baseUrl: 'http://localhost:3000',
    description: 'Development local'
  },
  production: {
    baseUrl: 'https://yourdomain.com', // Înlocuiește cu domeniul tău
    description: 'Production'
  },
  ngrok: {
    baseUrl: 'https://your-ngrok-url.ngrok.io', // Înlocuiește cu URL-ul tău ngrok
    description: 'Testing cu ngrok'
  },
  lan: {
    baseUrl: 'http://192.168.1.100:3000', // Înlocuiește cu IP-ul tău LAN
    description: 'Testing pe LAN'
  }
};

// Provideri OAuth suportați
const providers = ['google', 'github'];

function generateRedirectUris(environment) {
  const uris = [];
  
  providers.forEach(provider => {
    uris.push(`${environment.baseUrl}/api/auth/callback/${provider}`);
  });
  
  return uris;
}

function generateJavaScriptOrigins(environment) {
  return [environment.baseUrl];
}

function generateEnvConfig(environment) {
  return {
    NEXTAUTH_URL: environment.baseUrl,
    NODE_ENV: environment.baseUrl.startsWith('https') ? 'production' : 'development'
  };
}

function generateProviderConfig() {
  console.log('🔧 Configurația OAuth pentru Multi-Tenant Platform\n');
  
  Object.entries(environments).forEach(([envName, envConfig]) => {
    console.log(`📋 ${envConfig.description.toUpperCase()} (${envName})`);
    console.log('─'.repeat(50));
    
    // Redirect URIs
    console.log('🔗 Redirect URIs (Authorized redirect URIs):');
    const redirectUris = generateRedirectUris(envConfig);
    redirectUris.forEach(uri => {
      console.log(`   • ${uri}`);
    });
    
    // JavaScript Origins
    console.log('\n🌐 JavaScript Origins (Authorized JavaScript origins):');
    const jsOrigins = generateJavaScriptOrigins(envConfig);
    jsOrigins.forEach(origin => {
      console.log(`   • ${origin}`);
    });
    
    // Environment variables
    console.log('\n⚙️  Environment Variables:');
    const envVars = generateEnvConfig(envConfig);
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key}="${value}"`);
    });
    
    console.log('\n');
  });
  
  // Instrucțiuni pentru provideri
  console.log('📝 INSTRUCȚIUNI PENTRU CONFIGURAREA PROVIDERILOR:\n');
  
  console.log('🔵 GOOGLE OAUTH:');
  console.log('1. Mergi la: https://console.developers.google.com/');
  console.log('2. Selectează proiectul tău');
  console.log('3. Activează Google+ API');
  console.log('4. Creează OAuth 2.0 Client ID');
  console.log('5. Adaugă redirect URIs și JavaScript origins de mai sus');
  console.log('6. Copiază Client ID și Client Secret în .env\n');
  
  console.log('⚫ GITHUB OAUTH (opțional):');
  console.log('1. Mergi la: https://github.com/settings/developers');
  console.log('2. Click "New OAuth App"');
  console.log('3. Completează informațiile');
  console.log('4. Adaugă Authorization callback URL de mai sus');
  console.log('5. Copiază Client ID și Client Secret în .env\n');
  
  // Template pentru .env
  console.log('📄 TEMPLATE PENTRU .env:');
  console.log('─'.repeat(50));
  console.log('# NextAuth Configuration');
  console.log('NEXTAUTH_URL="http://localhost:3000"');
  console.log('NEXTAUTH_SECRET="your-strong-secret"');
  console.log('');
  console.log('# Google OAuth');
  console.log('GOOGLE_CLIENT_ID="your-google-client-id"');
  console.log('GOOGLE_CLIENT_SECRET="your-google-client-secret"');
  console.log('');
  console.log('# GitHub OAuth (opțional)');
  console.log('GITHUB_CLIENT_ID="your-github-client-id"');
  console.log('GITHUB_CLIENT_SECRET="your-github-client-secret"');
  console.log('');
  
  // Comenzi utile
  console.log('🛠️  COMENZI UTILE:');
  console.log('─'.repeat(50));
  console.log('# Generează secret puternic pentru NextAuth');
  console.log('openssl rand -base64 32');
  console.log('');
  console.log('# Testează configurația OAuth');
  console.log('curl http://localhost:3000/api/dev/oauth-debug');
  console.log('');
  console.log('# Verifică debug info');
  console.log('curl http://localhost:3000/api/dev/debug');
  console.log('');
  
  // Verificări importante
  console.log('✅ VERIFICĂRI IMPORTANTE:');
  console.log('─'.repeat(50));
  console.log('• Toate redirect URIs sunt configurate în provideri');
  console.log('• JavaScript origins sunt configurate corect');
  console.log('• NEXTAUTH_URL este setat corect pentru mediul tău');
  console.log('• NEXTAUTH_SECRET este generat și setat');
  console.log('• Cookie-urile funcționează pe mobile browsers');
  console.log('• HTTPS este configurat în producție');
  console.log('• Rate limiting nu blochează autentificarea');
  console.log('');
  
  console.log('🚀 Gata! Configurația OAuth este optimizată pentru:');
  console.log('   • Desktop browsers');
  console.log('   • Mobile browsers (iOS Safari, Chrome Mobile)');
  console.log('   • Cross-origin requests');
  console.log('   • Production și development');
  console.log('   • Testing cu ngrok și LAN');
}

// Rulează scriptul
if (require.main === module) {
  generateProviderConfig();
}

module.exports = {
  generateRedirectUris,
  generateJavaScriptOrigins,
  generateEnvConfig,
  environments,
  providers
};
