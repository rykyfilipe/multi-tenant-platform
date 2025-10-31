# 📘 ANAF e-Factura Integration - Complete Documentation

> **Professional implementation of ANAF e-Factura API integration with mutual TLS authentication and OAuth2 authorization**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Authentication Flow](#authentication-flow)
- [Invoice Submission Flow](#invoice-submission-flow)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This integration implements the complete ANAF e-Factura workflow as specified in the official documentation:

### Key Features

✅ **Mutual TLS (mTLS) Authentication** - OAuth2 requests use client certificates  
✅ **OAuth2 Authorization Code Flow** - Secure user authentication  
✅ **Automatic Token Refresh** - Tokens refreshed before expiration  
✅ **Invoice Upload** - UBL 2.1 XML with digital signature  
✅ **Status Tracking** - Real-time invoice validation status  
✅ **Response Download** - Download ANAF-validated invoices  
✅ **Comprehensive Logging** - Full audit trail  
✅ **Rate Limiting** - 1000 requests/minute compliance  
✅ **Error Handling** - User-friendly error messages

### Technology Stack

- **Node.js HTTPS** - Native mTLS support
- **node-forge** - PKCS#12 certificate parsing
- **Prisma ORM** - Database management
- **AES-256-GCM** - Certificate encryption at rest
- **Next.js API Routes** - Backend endpoints

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Upload Certificate (.pfx + password)                     │
│           ↓                                                   │
│  2. Click "Connect with ANAF"                                │
│           ↓                                                   │
│  3. Redirect to logincert.anaf.ro (mTLS)                     │
│           ↓                                                   │
│  4. Login with ANAF username/password                        │
│           ↓                                                   │
│  5. ANAF redirects back with code                            │
│           ↓                                                   │
│  6. App exchanges code for access_token (mTLS)               │
│           ↓                                                   │
│  7. Create & submit invoice                                  │
│           ↓                                                   │
│  8. Check status & download validated invoice                │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TECHNICAL FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React)                                            │
│       ↓                                                       │
│  API Routes (Next.js)                                        │
│       ↓                                                       │
│  Services (anafAuthService, anafInvoiceService)              │
│       ↓                                                       │
│  HTTPS Requests (mTLS for auth, Bearer for API)             │
│       ↓                                                       │
│  ANAF Endpoints (logincert.anaf.ro, api.anaf.ro)            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Service Layer

```typescript
src/lib/anaf/services/
├── anafAuthService.ts       # OAuth2 + mTLS authentication
├── anafInvoiceService.ts    # Invoice upload/status/download
└── ../certificate-service.ts # Certificate management
```

### Database Schema

```prisma
ANAFOAuthToken      # OAuth2 access & refresh tokens
ANAFCertificate     # Encrypted digital certificates
ANAFSubmission      # Invoice submission tracking
ANAFAuditLog        # Complete audit trail
ANAFRateLimit       # API rate limiting
```

---

## ✅ Prerequisites

### 1. ANAF Portal Setup

**Required:**

- ✅ ANAF account (username/password)
- ✅ Digital certificate (.pfx or .p12) with password
- ✅ Certificate registered in SPV (Spațiul Privat Virtual)
- ✅ Application registered in ANAF portal

**Register Application:**

1. Login to [https://logincert.anaf.ro/](https://logincert.anaf.ro/)
2. Navigate to "Aplicații OAuth2"
3. Click "Adaugă aplicație nouă"
4. Fill in:
   - **Client ID**: Your CUI (without "RO")
   - **Redirect URI**: `https://yourdomain.com/api/anaf/callback`
   - **Scope**: `openid`
5. Save and note your Client ID

### 2. Environment Variables

Create/update `.env` file:

```bash
# ANAF Configuration
ANAF_ENVIRONMENT="sandbox"  # or "production"
ANAF_CLIENT_ID="12345678"   # Your CUI without "RO"
ANAF_CLIENT_SECRET=""       # Usually not needed for public clients
ANAF_REDIRECT_URI="https://yourdomain.com/api/anaf/callback"

# OAuth2 Endpoints
ANAF_AUTH_URL="https://logincert.anaf.ro/anaf-oauth2/v1/authorize"
ANAF_TOKEN_URL="https://logincert.anaf.ro/anaf-oauth2/v1/token"

# API Endpoints (sandbox)
ANAF_BASE_URL="https://api.anaf.ro/test/FCTEL/rest"

# Security
ANAF_CERTIFICATE_ENCRYPTION_KEY="<generated-key>"  # Generate with: openssl rand -hex 32

# Application URLs
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

**Generate Encryption Key:**

```bash
openssl rand -hex 32
```

### 3. Digital Certificate

**Requirements:**

- ✅ Valid PKCS#12 format (.pfx or .p12)
- ✅ Issued by recognized CA
- ✅ Not expired
- ✅ Registered in ANAF SPV

**Verify Certificate:**

```bash
openssl pkcs12 -info -in certificate.pfx
```

---

## 🔐 Authentication Flow

### Step-by-Step

#### 1. Upload Certificate

**Endpoint:** `POST /api/anaf/certificate/upload`

**Request:**

```typescript
// FormData
{
  certificate: File,  // .pfx file
  password: string    // Certificate password
}
```

**Process:**

1. Parse PKCS#12 certificate using node-forge
2. Validate certificate (expiry, issuer, etc.)
3. Encrypt certificate + password with AES-256-GCM
4. Store encrypted data in database

**Response:**

```json
{
	"success": true,
	"certificateId": 123,
	"info": {
		"subject": {
			"commonName": "Company SRL",
			"organization": "Company",
			"country": "RO"
		},
		"validFrom": "2024-01-01T00:00:00Z",
		"validTo": "2025-12-31T23:59:59Z",
		"isValid": true,
		"daysUntilExpiry": 425
	}
}
```

#### 2. Initiate OAuth2 Flow

**Endpoint:** `GET /api/anaf/auth/login`

**Process:**

1. Generate CSRF state token
2. Build authorization URL
3. Return URL to frontend

**Response:**

```json
{
	"authUrl": "https://logincert.anaf.ro/anaf-oauth2/v1/authorize?response_type=code&client_id=12345678&redirect_uri=https%3A%2F%2Fyourdomain.com%2Fapi%2Fanaf%2Fcallback&scope=openid&state=eyJ1c2VySWQiOjEsInRlbmFudElkIjoxfQ"
}
```

**Frontend Action:**

```typescript
window.location.href = authUrl;
```

#### 3. User Authenticates on ANAF

**URL:** `https://logincert.anaf.ro/anaf-oauth2/v1/authorize`

**User Actions:**

1. ANAF loads login page
2. User enters ANAF username/password (NOT certificate password)
3. ANAF validates credentials
4. ANAF redirects back to redirect_uri with code

**Critical:** This request uses **mutual TLS (mTLS)** - browser sends client certificate automatically.

#### 4. OAuth Callback

**Endpoint:** `GET /api/anaf/callback?code=...&state=...`

**Process:**

1. Validate state parameter (CSRF protection)
2. Get user's certificate from database
3. Parse PKCS#12 to extract cert & key
4. Make mTLS request to token endpoint
5. Store access_token & refresh_token

**mTLS Request:**

```typescript
POST https://logincert.anaf.ro/anaf-oauth2/v1/token

Headers:
  Content-Type: application/x-www-form-urlencoded

Body:
  grant_type=authorization_code
  code=<authorization_code>
  redirect_uri=https://yourdomain.com/api/anaf/callback
  client_id=12345678

Client Certificate: <user-certificate.pem>
Private Key: <user-private-key.pem>
```

**ANAF Response:**

```json
{
	"access_token": "eyJhbGciOiJSUzI1NiIs...",
	"refresh_token": "def50200...",
	"token_type": "Bearer",
	"expires_in": 3600,
	"scope": "openid"
}
```

**Storage:**

```typescript
ANAFOAuthToken {
  userId: 1,
  tenantId: 1,
  accessToken: "eyJhbG...",
  refreshToken: "def502...",
  tokenType: "Bearer",
  expiresAt: "2024-12-30T13:00:00Z",
  scope: "openid",
  isActive: true
}
```

#### 5. Token Refresh (Automatic)

**Triggered:** When token expires in < 5 minutes

**Process:**

1. Get stored refresh_token
2. Get user's certificate
3. Make mTLS request to token endpoint
4. Update stored tokens

**mTLS Request:**

```typescript
POST https://logincert.anaf.ro/anaf-oauth2/v1/token

Headers:
  Content-Type: application/x-www-form-urlencoded

Body:
  grant_type=refresh_token
  refresh_token=<refresh_token>
  client_id=12345678

Client Certificate: <user-certificate.pem>
Private Key: <user-private-key.pem>
```

---

## 📤 Invoice Submission Flow

### Step-by-Step

#### 1. Create Invoice

User creates invoice in application (normal flow).

#### 2. Submit to ANAF

**Endpoint:** `POST /api/anaf/invoice/upload`

**Request:**

```json
{
	"invoiceId": 123,
	"submissionType": "manual"
}
```

**Process:**

1. Verify user is authenticated
2. Get valid access_token (refresh if needed)
3. Get invoice data from database
4. Generate UBL 2.1 XML
5. Sign XML with digital signature
6. Upload to ANAF

**Upload Request:**

```typescript
POST https://api.anaf.ro/test/v1/factura/upload

Headers:
  Authorization: Bearer <access_token>
  Content-Type: application/xml; charset=utf-8
  Accept: application/json

Body: <signed-xml-content>
```

**ANAF Response:**

```json
{
	"requestId": "550e8400-e29b-41d4-a716-446655440000",
	"status": "RECEIVED",
	"message": "Factura a fost primită și este în curs de procesare"
}
```

**Storage:**

```typescript
ANAFSubmission {
  tenantId: 1,
  invoiceId: 123,
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  status: "RECEIVED",
  message: "Factura a fost primită...",
  xmlContent: "<xml>...</xml>",
  submittedAt: "2024-12-30T12:00:00Z"
}
```

#### 3. Check Status

**Endpoint:** `GET /api/anaf/invoice/status/:requestId`

**Process:**

1. Get valid access_token
2. Query ANAF status endpoint
3. Update local status

**Status Request:**

```typescript
GET https://api.anaf.ro/test/v1/factura/status/550e8400-e29b-41d4-a716-446655440000

Headers:
  Authorization: Bearer <access_token>
  Accept: application/json
```

**ANAF Response (Success):**

```json
{
	"status": "VALIDAT",
	"message": "Factura a fost validată cu succes",
	"messages": [],
	"xml_download_link": "https://api.anaf.ro/test/v1/factura/download/550e8400-e29b-41d4-a716-446655440000"
}
```

**ANAF Response (Error):**

```json
{
	"status": "EROARE",
	"message": "Erori de validare",
	"messages": [
		"Câmpul BT-31 (Seller VAT identifier) este obligatoriu",
		"Data facturii nu poate fi în viitor"
	]
}
```

**Status Values:**

- `RECEIVED` - Primit de ANAF, în așteptare
- `PROCESSING` - În curs de procesare
- `VALIDAT` - Validat cu succes
- `EROARE` - Erori de validare
- `RESPINS` - Respins de ANAF

#### 4. Download Validated Invoice

**Endpoint:** `GET /api/anaf/invoice/download/:requestId`

**Process:**

1. Verify status is "VALIDAT"
2. Get valid access_token
3. Download from ANAF
4. Return XML content

**Download Request:**

```typescript
GET https://api.anaf.ro/test/v1/factura/download/550e8400-e29b-41d4-a716-446655440000

Headers:
  Authorization: Bearer <access_token>
  Accept: application/xml
```

**Response:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <!-- ANAF-validated invoice XML -->
</Invoice>
```

---

## 📚 API Reference

### Authentication Endpoints

#### `GET /api/anaf/auth/status`

Check if user is authenticated with ANAF.

**Response:**

```json
{
	"authenticated": true,
	"hasValidToken": true,
	"hasCertificate": true,
	"certificateValid": true,
	"certificateExpiresIn": 425
}
```

#### `GET /api/anaf/auth/login`

Initiate OAuth2 authorization flow.

**Response:**

```json
{
	"authUrl": "https://logincert.anaf.ro/anaf-oauth2/v1/authorize?..."
}
```

#### `GET /api/anaf/callback`

OAuth2 callback handler (internal).

#### `POST /api/anaf/auth/logout`

Disconnect from ANAF (revoke tokens).

**Response:**

```json
{
	"success": true,
	"message": "Successfully logged out from ANAF"
}
```

### Certificate Endpoints

#### `POST /api/anaf/certificate/upload`

Upload digital certificate.

**Request (multipart/form-data):**

```typescript
{
  certificate: File,  // .pfx or .p12
  password: string
}
```

**Response:**

```json
{
  "success": true,
  "certificateId": 123,
  "info": { ... }
}
```

#### `GET /api/anaf/certificate/info`

Get certificate information.

**Response:**

```json
{
	"subject": {
		"commonName": "Company SRL",
		"organization": "Company",
		"country": "RO"
	},
	"issuer": {
		"commonName": "ANAF CA",
		"organization": "ANAF"
	},
	"validFrom": "2024-01-01T00:00:00Z",
	"validTo": "2025-12-31T23:59:59Z",
	"serialNumber": "1234567890",
	"thumbprint": "A1B2C3D4...",
	"isValid": true,
	"daysUntilExpiry": 425
}
```

#### `POST /api/anaf/certificate/revoke`

Revoke (deactivate) certificate.

**Response:**

```json
{
	"success": true,
	"message": "Certificate revoked successfully"
}
```

### Invoice Endpoints

#### `POST /api/anaf/invoice/upload`

Submit invoice to ANAF.

**Request:**

```json
{
	"invoiceId": 123,
	"submissionType": "manual"
}
```

**Response:**

```json
{
	"success": true,
	"requestId": "550e8400-e29b-41d4-a716-446655440000",
	"status": "RECEIVED",
	"message": "Invoice submitted successfully",
	"timestamp": "2024-12-30T12:00:00Z"
}
```

#### `GET /api/anaf/invoice/status/:requestId`

Check invoice status.

**Response:**

```json
{
	"success": true,
	"requestId": "550e8400-e29b-41d4-a716-446655440000",
	"status": "VALIDAT",
	"message": "Factura a fost validată cu succes",
	"messages": [],
	"xmlDownloadLink": "...",
	"timestamp": "2024-12-30T12:05:00Z"
}
```

#### `GET /api/anaf/invoice/download/:requestId`

Download validated invoice.

**Response:**

```json
{
	"success": true,
	"content": "<xml>...</xml>",
	"filename": "anaf_550e8400-e29b-41d4-a716-446655440000.xml"
}
```

---

## ⚠️ Error Handling

### Common Errors

| HTTP | Error             | Cause                          | Solution                         |
| ---- | ----------------- | ------------------------------ | -------------------------------- |
| 401  | Unauthorized      | Token invalid/expired          | Refresh token or re-authenticate |
| 403  | Forbidden         | Request unauthorized           | Check ANAF portal configuration  |
| 429  | Too Many Requests | Rate limit exceeded (1000/min) | Wait and retry                   |
| 400  | Bad Request       | Invalid XML/data               | Validate invoice data            |
| 500  | Server Error      | ANAF server issue              | Retry later                      |

### Error Response Format

```json
{
	"success": false,
	"error": "User-friendly error message",
	"timestamp": "2024-12-30T12:00:00Z"
}
```

### Logging

All operations are logged to:

- `ANAFAuditLog` - Audit trail
- `ANAFSubmission` - Invoice submissions
- Console logs - Debugging

**Example Audit Log:**

```typescript
ANAFAuditLog {
  userId: 1,
  tenantId: 1,
  action: "certificate_upload",
  status: "success",
  metadata: { certificateId: 123 },
  createdAt: "2024-12-30T12:00:00Z"
}
```

---

## 🧪 Testing

### 1. Test Certificate Upload

```bash
curl -X POST http://localhost:3000/api/anaf/certificate/upload \
  -H "Cookie: next-auth.session-token=..." \
  -F "certificate=@certificate.pfx" \
  -F "password=your-password"
```

### 2. Test OAuth Flow

1. Login to application
2. Navigate to `/home/invoices`
3. Click "ANAF Setup" tab
4. Click "Conectare cu ANAF"
5. Verify redirect to logincert.anaf.ro
6. Login with ANAF credentials
7. Verify redirect back with success

### 3. Test Invoice Upload

```bash
curl -X POST http://localhost:3000/api/anaf/invoice/upload \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": 123, "submissionType": "manual"}'
```

### 4. Test Status Check

```bash
curl -X GET http://localhost:3000/api/anaf/invoice/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: next-auth.session-token=..."
```

### ANAF Sandbox

**Test Environment:**

- Base URL: `https://api.anaf.ro/test/v1/factura`
- No real invoices submitted
- Faster validation (minutes vs hours)

**Switch to Production:**

```bash
ANAF_ENVIRONMENT="production"
ANAF_BASE_URL="https://api.anaf.ro/prod/FCTEL/rest"
```

---

## ✅ Production Checklist

### Before Going Live

- [ ] Certificate from production ANAF CA
- [ ] Application registered in production portal
- [ ] Environment variables set to production
- [ ] SSL/TLS certificate for domain
- [ ] Database backups configured
- [ ] Monitoring & alerts setup
- [ ] Error logging configured
- [ ] Rate limiting tested
- [ ] Load testing completed
- [ ] Security audit passed

### Environment Variables

```bash
ANAF_ENVIRONMENT="production"
ANAF_CLIENT_ID="<production-cui>"
ANAF_BASE_URL="https://api.anaf.ro/prod/FCTEL/rest"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Security

- ✅ Use HTTPS only
- ✅ Rotate encryption keys regularly
- ✅ Monitor certificate expiration
- ✅ Implement IP whitelisting
- ✅ Enable 2FA for admins
- ✅ Regular security audits

---

## 🔧 Troubleshooting

### OAuth Authorization Failed

**Error:** "OAuth authorization failed"

**Causes:**

1. Incorrect redirect URI in ANAF portal
2. Certificate not registered in SPV
3. Invalid client_id (CUI)
4. mTLS handshake failed

**Solutions:**

1. Verify redirect URI matches exactly (no trailing slash)
2. Login to SPV and register certificate
3. Verify client_id = CUI without "RO"
4. Check certificate validity: `openssl pkcs12 -info -in cert.pfx`

### Certificate Upload Failed

**Error:** "Invalid certificate password"

**Solutions:**

1. Verify password is correct
2. Test certificate: `openssl pkcs12 -info -in cert.pfx`
3. Ensure certificate is PKCS#12 format (.pfx or .p12)

### Invoice Upload Failed

**Error:** "403 Forbidden"

**Causes:**

1. Token expired
2. Rate limit exceeded
3. Application not registered

**Solutions:**

1. Check token expiration: verify `ANAFOAuthToken.expiresAt`
2. Wait 1 minute and retry
3. Verify application in ANAF portal

### Rate Limit Exceeded

**Error:** "429 Too Many Requests"

**Solutions:**

1. Implement exponential backoff
2. Batch invoice uploads
3. Monitor `ANAFRateLimit` table
4. Spread requests over time

### XML Validation Errors

**Error:** "Câmpul BT-31 este obligatoriu"

**Solutions:**

1. Review ANAF UBL 2.1 specification
2. Validate XML before submission
3. Check required fields mapping
4. Test with ANAF sandbox first

---

## 📞 Support

### Official ANAF Resources

- **Portal:** https://logincert.anaf.ro/
- **API Docs:** https://api.anaf.ro/
- **SPV:** https://www.anaf.ro/spv

### Internal Support

- **Email:** dev@yourdomain.com
- **Docs:** `/docs/ANAF_*.md`
- **Logs:** `ANAFAuditLog`, `ANAFSubmission`

---

## 📄 License

© 2024 YourCompany. All rights reserved.

---

**Last Updated:** December 30, 2024  
**Version:** 2.0.0  
**Status:** ✅ Production Ready
