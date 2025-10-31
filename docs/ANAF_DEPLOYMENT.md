# ANAF e-Factura Integration - Production Deployment Guide

## 📋 Verificare Pre-Deployment

### ✅ 1. Database Schema

- [x] ANAFOAuthToken model
- [x] ANAFCertificate model
- [x] ANAFSubmission model
- [x] ANAFAuditLog model
- [x] ANAFRateLimit model
- [x] Migrări Prisma aplicate (`npx prisma db push`)

### ✅ 2. Servicii Backend

- [x] ANAFCertificateService (certificat digital PKCS#12)
- [x] ANAFIntegration (submisie facturi)
- [x] ANAFOAuthService (OAuth2 flow)
- [x] ANAFAPIService (comunicare cu ANAF API)
- [x] ANAFRateLimiter (1000 req/min)
- [x] XMLGenerator (generare XML facturi)
- [x] SignatureService (semnare digitală)

### ✅ 3. API Routes

- [x] GET /api/anaf/auth/status - Verifică OAuth status
- [x] GET /api/anaf/auth/login - Inițiază OAuth2 flow
- [x] POST /api/anaf/auth/logout - Deconectare OAuth
- [x] POST /api/anaf/certificate/upload - Upload certificat digital
- [x] GET /api/anaf/certificate/info - Info certificat
- [x] POST /api/anaf/certificate/revoke - Revocă certificat
- [x] POST /api/anaf/invoice/upload - Trimite factură la ANAF
- [x] GET /api/anaf/invoice/status/[id] - Status factură
- [x] GET /api/anaf/invoice/download/[id] - Download răspuns ANAF
- [x] GET /api/anaf/callback - OAuth2 callback

### ✅ 4. Componente UI

- [x] ANAFAuthManager - Setup complet (OAuth2 + Certificate)
- [x] ANAFInvoiceActions - Acțiuni pe facturi (send/status/download)
- [x] Integrare în Invoice Page (tab "ANAF Setup")
- [x] Integrare în InvoiceList (acțiuni pe fiecare factură)

### ✅ 5. Hooks

- [x] useANAF - Auth status și management
- [x] useSilentANAF - Background authentication

---

## 🔧 Configurare Environment Variables

### Variables obligatorii în `.env`:

```bash
# ANAF OAuth2 Credentials
ANAF_CLIENT_ID="your-anaf-client-id"
ANAF_CLIENT_SECRET="your-anaf-client-secret"
ANAF_REDIRECT_URI="https://yourdomain.com/api/anaf/callback"

# ANAF Environment (sandbox sau production)
ANAF_ENVIRONMENT="sandbox"
ANAF_BASE_URL="https://api.anaf.ro/test/FCTEL/rest"
# Pentru production:
# ANAF_ENVIRONMENT="production"
# ANAF_BASE_URL="https://api.anaf.ro/prod/FCTEL/rest"

# ANAF OAuth URLs
ANAF_AUTH_URL="https://logincert.anaf.ro/anaf-oauth2/v1/authorize"
ANAF_TOKEN_URL="https://logincert.anaf.ro/anaf-oauth2/v1/token"

# ANAF Security
ANAF_JWT_SECRET="your-anaf-jwt-secret-key-here"
ANAF_CERTIFICATE_ENCRYPTION_KEY="your-64-char-hex-encryption-key-here"
```

### Generare chei:

```bash
# Generare JWT Secret
openssl rand -base64 32

# Generare Certificate Encryption Key (AES-256 requires 32 bytes = 64 hex chars)
openssl rand -hex 32
```

---

## 🚀 Workflow Utilizator

### Pasul 1: Conectare OAuth2

1. User accesează tab "ANAF Setup" în pagina de facturi
2. Click pe "Conectare cu ANAF"
3. Redirect la `https://logincert.anaf.ro` pentru autentificare
4. ANAF redirect înapoi la `/api/anaf/callback`
5. Token-uri salvate în `ANAFOAuthToken`

### Pasul 2: Upload Certificat Digital

1. User selectează fișier .pfx sau .p12
2. Introduce parola certificatului
3. Backend validează și parsează certificatul cu node-forge
4. Certificat criptat cu AES-256-GCM
5. Salvat în `ANAFCertificate` (parola NU este salvată)

### Pasul 3: Trimitere Factură

1. User selectează o factură din listă
2. Click "Trimite la ANAF" din ANAFInvoiceActions
3. Backend:
   - Verifică OAuth token valid
   - Verifică certificat valid
   - Generează XML conformă EN16931
   - Semnează digital XML-ul
   - Trimite către ANAF API
4. Status salvat în `ANAFSubmission`

### Pasul 4: Verificare Status

1. Click "Verifică Status" din ANAFInvoiceActions
2. Backend poll către ANAF API pentru submission ID
3. Update status în `ANAFSubmission`
4. UI arată badge: pending/processing/accepted/rejected

### Pasul 5: Download Răspuns

1. După ce status = "accepted"
2. Click "Download Răspuns" din ANAFInvoiceActions
3. Backend descarcă răspunsul XML de la ANAF
4. Salvat în `ANAFSubmission.anafResponse`
5. Download către user

---

## 🔒 Securitate Implementată

### 1. **OAuth2 Flow**

- State parameter pentru CSRF protection
- Token refresh automat
- Session validation pe toate routes

### 2. **Certificate Encryption**

- AES-256-GCM encryption
- Unique IV per certificate
- Authentication tag verification
- Parola nu este salvată

### 3. **Rate Limiting**

- 1000 requests / 1 minute (conform ANAF)
- In-memory tracking cu cleanup automat
- 429 Too Many Requests când limita este depășită

### 4. **Audit Logging**

- Toate acțiunile loggate în `ANAFAuditLog`
- Timestamp, user, action, status, metadata
- Pentru compliance și debugging

### 5. **Input Validation**

- File type validation (.pfx, .p12)
- File size limits (10MB)
- Certificate expiration check
- Session validation

---

## 🧪 Testing Checklist

### Test OAuth2 Flow:

```bash
1. ✅ Click "Conectare cu ANAF" → redirect la logincert.anaf.ro
2. ✅ Login cu credențiale ANAF test
3. ✅ Redirect înapoi la app cu code
4. ✅ Token salvat în DB
5. ✅ Badge "ANAF Connected" apare
```

### Test Certificate Upload:

```bash
1. ✅ Selectează .pfx/.p12 file
2. ✅ Introduce parolă
3. ✅ Click "Încarcă Certificat"
4. ✅ Success message + info certificat afișat
5. ✅ Tab "Info Certificat" devine activ
```

### Test Invoice Submission:

```bash
1. ✅ OAuth + Certificate configurate
2. ✅ Selectează o factură
3. ✅ Click "Trimite la ANAF"
4. ✅ Loading indicator
5. ✅ Success message cu submission ID
6. ✅ Status badge = "Pending"
```

### Test Status Check:

```bash
1. ✅ Factură cu submission ID
2. ✅ Click "Verifică Status"
3. ✅ Status update: pending → processing → accepted
4. ✅ Badge color change
```

### Test Response Download:

```bash
1. ✅ Factură cu status "Accepted"
2. ✅ Click "Download Răspuns"
3. ✅ XML file downloaded
```

---

## 🐛 Troubleshooting

### Problema: "ANAF OAuth2 not configured"

**Soluție**: Verifică că `ANAF_CLIENT_ID` și `ANAF_REDIRECT_URI` sunt setate în `.env`

### Problema: "Certificate validation failed"

**Soluție**:

- Verifică că fișierul este .pfx sau .p12
- Verifică că parola este corectă
- Verifică că certificatul nu a expirat

### Problema: "Rate limit exceeded"

**Soluție**: Așteaptă 60 secunde sau folosește alt user/tenant ID

### Problema: "Missing encryption key"

**Soluție**:

```bash
# Generează și adaugă în .env:
ANAF_CERTIFICATE_ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### Problema: "OAuth token expired"

**Soluție**:

- Reconnectare OAuth din tab "ANAF Setup"
- Verifică că ANAF credentials sunt valide

---

## 📊 Monitorizare Production

### Metrics to Monitor:

1. **OAuth Success Rate**
   - Query: `SELECT COUNT(*) FROM "ANAFOAuthToken" WHERE "expiresAt" > NOW()`
2. **Certificate Validity**
   - Query: `SELECT COUNT(*) FROM "ANAFCertificate" WHERE "validTo" > NOW()`
3. **Submission Success Rate**
   - Query: `SELECT status, COUNT(*) FROM "ANAFSubmission" GROUP BY status`
4. **Rate Limit Hits**
   - Query: `SELECT COUNT(*) FROM "ANAFAuditLog" WHERE action = 'rate_limit_exceeded'`

### Log Alerts:

- OAuth failures (status = 'error')
- Certificate expiring în <30 zile
- Submission rejections (status = 'rejected')
- Rate limit exceedances

---

## 🔄 Maintenance Tasks

### Daily:

- ✅ Check expired OAuth tokens
- ✅ Check expiring certificates (< 30 days)

### Weekly:

- ✅ Review failed submissions
- ✅ Check rate limit patterns
- ✅ Audit log analysis

### Monthly:

- ✅ Certificate renewal reminders
- ✅ OAuth token refresh validation
- ✅ Performance metrics review

---

## 📚 Resources

### ANAF Documentation:

- [Portal ANAF](https://logincert.anaf.ro/)
- [API Documentation](https://static.anaf.ro/static/10/Anaf/Informatii_R/Structura_IT_10092020.htm)
- [e-Factura Guide](https://www.anaf.ro/anaf/internet/ANAF/despre_anaf/strategii_anaf/proiecte_digitalizare/e_factura)

### Standards:

- [EN16931 (European e-Invoicing)](https://ec.europa.eu/digital-single-market/en/news/european-standard-electronic-invoicing)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [PKCS#12 Standard](https://tools.ietf.org/html/rfc7292)

---

## ✨ Ready for Production!

Toate componentele sunt implementate, testate și gata pentru deployment în producție.

**Ultimul pas**:

1. Configurare `.env` cu credențiale ANAF reale
2. Schimbare `ANAF_ENVIRONMENT=production`
3. Update `ANAF_BASE_URL` pentru production
4. Deploy și test pe environment de staging mai întâi

🎉 **Sistemul este 100% funcțional și pregătit pentru producție!**
