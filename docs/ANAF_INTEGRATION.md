# ANAF e-Factura Integration

Integrare completă cu sistemul ANAF e-Factura pentru trimiterea automată și manuală a facturilor către autoritatea fiscală română.

## 🚀 Caracteristici

- **OAuth 2.0 Authentication** - Autentificare securizată cu ANAF
- **Digital Signature** - Semnătură electronică pentru facturi
- **XML Generation** - Generare XML conform EN16931/UBL
- **Status Tracking** - Urmărire status trimitere facturi
- **Response Download** - Descărcare răspunsuri ANAF
- **Multi-language Support** - Suport pentru română și engleză
- **Scalable Architecture** - Arhitectură extensibilă pentru alte sisteme e-Factura

## 📋 Cerințe

- Node.js 18+
- PostgreSQL
- ngrok (pentru dezvoltare locală)
- Cont ANAF pentru dezvoltare

## 🔧 Configurare

### 1. Variabile de Mediu

Adaugă în `.env`:

```env
# ANAF e-Factura Integration
ANAF_CLIENT_ID="your-anaf-client-id"
ANAF_CLIENT_SECRET="your-anaf-client-secret"
# For development with ngrok (required by ANAF - localhost not allowed)
ANAF_REDIRECT_URI="https://your-ngrok-url.ngrok.io/api/anaf/oauth/callback"
# For production
# ANAF_REDIRECT_URI="https://yourdomain.com/api/anaf/oauth/callback"
ANAF_BASE_URL="https://api.anaf.ro"
ANAF_ENVIRONMENT="sandbox"
```

### 2. Instalare ngrok

```bash
# macOS
brew install ngrok/ngrok/ngrok

# Ubuntu
snap install ngrok

# Windows
choco install ngrok
```

### 3. Autentificare ngrok

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
# Obține authtoken de la: https://dashboard.ngrok.com/get-started/your-authtoken
```

### 4. Configurare ANAF OAuth App

1. Accesează portalul ANAF pentru dezvoltatori
2. Creează o aplicație OAuth
3. Configurează redirect URI: `https://your-ngrok-url.ngrok.io/api/anaf/oauth/callback`
4. Obține Client ID și Client Secret

## 🚀 Dezvoltare Locală

### Pornire cu ngrok

```bash
# Pornește ngrok și configurează .env automat
./scripts/setup-ngrok-anaf.sh

# În alt terminal, pornește aplicația
npm run dev
```

### Testare

```bash
# Testează integrarea ANAF
./scripts/test-anaf-integration.sh
```

### Oprire ngrok

```bash
./scripts/stop-ngrok.sh
```

## 📚 API Endpoints

### OAuth

- `GET /api/anaf/oauth/callback` - Callback pentru OAuth

### Invoice Management

- `POST /api/anaf/send-invoice` - Trimite factură la ANAF
- `GET /api/anaf/invoice-status/[invoiceId]` - Verifică status factură
- `GET /api/anaf/download-response/[invoiceId]` - Descarcă răspuns ANAF

## 🏗️ Arhitectură

### Interfețe

```typescript
interface InvoiceSubmissionProvider {
  submitInvoice(invoiceId: number, tenantId: number): Promise<InvoiceSubmissionResult>;
  getInvoiceStatus(submissionId: string, tenantId: number): Promise<InvoiceStatusResult>;
  downloadResponse(submissionId: string, tenantId: number): Promise<DownloadResult>;
  // ... alte metode
}
```

### Servicii

- `ANAFIntegration` - Implementare principală ANAF
- `ANAFOAuthService` - Gestionare OAuth
- `ANAFXMLGenerator` - Generare XML EN16931/UBL
- `ANAFSignatureService` - Semnătură digitală

### Componente UI

- `ANAFIntegrationToggle` - Toggle pentru activare/dezactivare
- `ANAFInvoiceActions` - Acțiuni pentru facturi (trimite, verifică status, descarcă)

## 🔄 Flux de Lucru

1. **Autentificare**: Utilizatorul se autentifică cu ANAF prin OAuth
2. **Configurare**: Se activează trimiterea automată (opțional)
3. **Creare Factură**: Factura se creează în sistem
4. **Trimitere**: Dacă activată, factura se trimite automat la ANAF
5. **Urmărire**: Status-ul se verifică periodic
6. **Răspuns**: Răspunsul ANAF se descarcă când este disponibil

## 🧪 Testare

### Teste Unitare

```bash
npm test tests/anaf/
```

### Teste Integration

```bash
# Testează cu ngrok
./scripts/test-anaf-integration.sh
```

### Teste E2E

```bash
# Testează fluxul complet
npm run test:e2e -- --grep "ANAF"
```

## 🔒 Securitate

- **OAuth 2.0** - Autentificare securizată
- **Token Refresh** - Reîmprospătare automată token-uri
- **State Validation** - Validare state pentru OAuth
- **HTTPS Only** - Toate comunicările prin HTTPS
- **Input Validation** - Validare strictă input-uri

## 🌍 Scalabilitate Internațională

Arhitectura permite adăugarea altor sisteme e-Factura:

```typescript
// Pentru alte țări
class GermanELSTERIntegration implements InvoiceSubmissionProvider {
  // Implementare pentru Germania
}

class FrenchChorusIntegration implements InvoiceSubmissionProvider {
  // Implementare pentru Franța
}

// Registru provideri
InvoiceSubmissionProviderRegistry.register('anaf', new ANAFIntegration());
InvoiceSubmissionProviderRegistry.register('elster', new GermanELSTERIntegration());
```

## 📊 Monitorizare

- **Logs** - Loguri detaliate pentru debugging
- **Metrics** - Metrici pentru performanță
- **Alerts** - Alerte pentru erori
- **Retry Logic** - Logică de retry pentru eșecuri

## 🐛 Debugging

### Logs

```bash
# Verifică logurile ngrok
tail -f ngrok.log

# Verifică logurile aplicației
npm run dev 2>&1 | grep -i anaf
```

### Dashboard ngrok

Accesează http://localhost:4040 pentru a vedea cererile HTTP.

## 📝 Notițe Importante

1. **ngrok Required**: ANAF nu acceptă localhost pentru OAuth redirect
2. **HTTPS Only**: Toate comunicările trebuie să fie prin HTTPS
3. **Sandbox First**: Testează întotdeauna în sandbox înainte de producție
4. **Token Expiry**: Token-urile ANAF au expirare limitată
5. **Rate Limiting**: Respectă limitele de rate ale ANAF

## 🤝 Contribuții

1. Fork repository-ul
2. Creează o branch pentru feature: `git checkout -b feature/anaf-improvement`
3. Commit modificările: `git commit -m 'Add ANAF improvement'`
4. Push la branch: `git push origin feature/anaf-improvement`
5. Creează Pull Request

## 📄 Licență

Acest modul este parte din platforma multi-tenant și urmează aceeași licență.
