# 🧪 ANAF Integration - Manual Test Plan

> **Purpose:** Verify complete ANAF e-Factura integration flow  
> **Date:** December 30, 2024  
> **Status:** Ready for Testing

---

## ✅ Pre-Test Checklist

Before starting tests, verify:

- [ ] Database migrations applied (`npx prisma db push`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] No TypeScript errors (`npm run build` or check editor)
- [ ] Environment variables set in `.env`
- [ ] Application is running (`npm run dev` or `pm2 status`)
- [ ] User account created and can login

---

## 📋 Test Flow

### Test 1: Certificate Upload ✅

**Objective:** Upload and store digital certificate

**Steps:**

1. Login to application
2. Navigate to **Invoices → ANAF Setup** tab
3. Go to **"Upload Certificat"** sub-tab
4. Select `.pfx` or `.p12` file
5. Enter certificate password
6. Click **"Upload Certificate"**

**Expected Results:**

- ✅ Success message appears
- ✅ Certificate info displays (company name, validity dates)
- ✅ Expiration date shown
- ✅ Status shows "Valid" with green checkmark

**Database Check:**

```sql
SELECT * FROM "ANAFCertificate" WHERE "tenantId" = <your_tenant_id>;
```

Should see:

- Encrypted certificate data
- Encrypted password
- Valid dates
- isActive = true

**API Check:**

```bash
curl -X GET http://localhost:3000/api/anaf/certificate/info \
  -H "Cookie: next-auth.session-token=<your-session-token>"
```

Expected response:

```json
{
	"subject": { "commonName": "Your Company SRL", "country": "RO" },
	"issuer": { "commonName": "ANAF CA" },
	"validFrom": "2024-01-01T00:00:00.000Z",
	"validTo": "2025-12-31T23:59:59.999Z",
	"isValid": true,
	"daysUntilExpiry": 425
}
```

---

### Test 2: OAuth2 Connection (Manual Browser Test)

**Objective:** Connect to ANAF OAuth2

**Steps:**

1. After uploading certificate, go to **"OAuth2"** sub-tab
2. Click **"Conectare cu ANAF"** button
3. Browser redirects to `logincert.anaf.ro`
4. **CRITICAL:** Browser should use your certificate (mTLS)
5. Enter ANAF username and password (NOT certificate password!)
6. Click login on ANAF portal
7. Should redirect back to your app

**Expected Results:**

- ✅ Redirect to logincert.anaf.ro happens
- ✅ Browser requests certificate selection (mTLS)
- ✅ ANAF login page appears
- ✅ After login, redirect back to `/api/anaf/callback?code=...`
- ✅ Final redirect to `/home/invoices?anaf_success=true`
- ✅ Success notification appears
- ✅ OAuth status shows "Connected" with green checkmark

**Database Check:**

```sql
SELECT * FROM "ANAFOAuthToken" WHERE "tenantId" = <your_tenant_id>;
```

Should see:

- accessToken (long string)
- refreshToken (if provided by ANAF)
- expiresAt (1 hour from now)
- isActive = true

**API Check:**

```bash
curl -X GET http://localhost:3000/api/anaf/auth/status \
  -H "Cookie: next-auth.session-token=<your-session-token>"
```

Expected response:

```json
{
  "authenticated": true,
  "hasCertificate": true,
  "certificateValid": true,
  "certificateInfo": { ... }
}
```

**Troubleshooting:**

If redirect fails:

1. Check ANAF portal redirect URI: `https://yourdomain.com/api/anaf/callback`
2. Verify ANAF_CLIENT_ID = CUI without "RO"
3. Check browser console for errors
4. Verify certificate is registered in SPV

If "OAuth authorization failed":

1. Check `.env` has correct NEXTAUTH_URL and NEXT_PUBLIC_APP_URL
2. Verify redirect_uri matches ANAF portal exactly
3. Check certificate is valid: `openssl pkcs12 -info -in cert.pfx`

---

### Test 3: Create Test Invoice

**Objective:** Create invoice for submission

**Steps:**

1. Navigate to **Invoices** main view
2. Click **"Create Invoice"** or **"New"**
3. Fill in required fields:
   - Customer (select or create)
   - Invoice number
   - Date
   - Items (at least one)
   - Amounts
4. Save invoice

**Expected Results:**

- ✅ Invoice created successfully
- ✅ Invoice appears in list
- ✅ Status shows "Draft" or similar
- ✅ Can view invoice details

**Database Check:**

```sql
SELECT * FROM "Row"
WHERE "tableId" = (SELECT id FROM "Table" WHERE name = 'invoices')
ORDER BY "createdAt" DESC LIMIT 1;
```

---

### Test 4: Submit Invoice to ANAF (MOCK)

**Objective:** Submit invoice to ANAF API

**Note:** Since we don't have real ANAF sandbox access yet, this test uses mocked responses.

**Steps:**

1. Select your test invoice
2. Click **"Submit to ANAF"** button (or similar action)
3. Wait for response

**Expected Results (Mocked):**

- ✅ Request sent to `/api/anaf/invoice/upload`
- ✅ Success message appears
- ✅ Request ID returned (UUID format)
- ✅ Status shows "RECEIVED"

**Database Check:**

```sql
SELECT * FROM "ANAFSubmission"
WHERE "invoiceId" = <your_invoice_id>;
```

Should see:

- requestId (UUID)
- status = "RECEIVED" or "pending"
- xmlContent (full XML)
- submittedAt timestamp

**API Check:**

```bash
curl -X POST http://localhost:3000/api/anaf/invoice/upload \
  -H "Cookie: next-auth.session-token=<your-session-token>" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": 123}'
```

Expected response:

```json
{
	"success": true,
	"requestId": "550e8400-e29b-41d4-a716-446655440000",
	"status": "RECEIVED",
	"message": "Invoice submitted successfully",
	"timestamp": "2024-12-30T12:00:00.000Z"
}
```

---

### Test 5: Check Invoice Status (MOCK)

**Objective:** Check submission status

**Steps:**

1. Copy requestId from previous step
2. Click **"Check Status"** button
3. Wait for response

**Expected Results (Mocked):**

- ✅ Status updated
- ✅ Shows "VALIDAT" or "PROCESSING"
- ✅ Messages displayed (if any)
- ✅ Download link appears (if validated)

**API Check:**

```bash
curl -X GET http://localhost:3000/api/anaf/invoice/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: next-auth.session-token=<your-session-token>"
```

Expected response:

```json
{
	"success": true,
	"requestId": "550e8400-e29b-41d4-a716-446655440000",
	"status": "VALIDAT",
	"message": "Factura a fost validată cu succes",
	"messages": [],
	"timestamp": "2024-12-30T12:05:00.000Z"
}
```

---

### Test 6: Download Validated Invoice (MOCK)

**Objective:** Download ANAF-validated XML

**Steps:**

1. After status shows "VALIDAT"
2. Click **"Download"** button
3. Save file

**Expected Results (Mocked):**

- ✅ XML file downloads
- ✅ Filename: `anaf_<requestId>.xml`
- ✅ Contains validated invoice
- ✅ Has ANAF signature

**API Check:**

```bash
curl -X GET http://localhost:3000/api/anaf/invoice/download/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: next-auth.session-token=<your-session-token>"
```

Expected response:

```json
{
	"success": true,
	"content": "<?xml version=\"1.0\"?>...",
	"filename": "anaf_550e8400-e29b-41d4-a716-446655440000.xml"
}
```

---

### Test 7: Token Refresh (Automatic)

**Objective:** Verify automatic token refresh

**Steps:**

1. Wait 55 minutes (or modify expiresAt in DB to 4 minutes from now)
2. Make any ANAF API request (upload/status/download)
3. Check if token was refreshed

**Database Check:**

```sql
-- Check token before and after
SELECT "accessToken", "expiresAt"
FROM "ANAFOAuthToken"
WHERE "tenantId" = <your_tenant_id>;
```

**Expected Results:**

- ✅ New accessToken generated
- ✅ New expiresAt set (1 hour from refresh)
- ✅ No errors in API calls
- ✅ User not logged out

---

### Test 8: Certificate Expiration Warning

**Objective:** Test expiration warnings

**Steps:**

1. Modify certificate validTo in DB to 25 days from now
2. Go to ANAF Setup tab
3. Check for warning

**Expected Results:**

- ✅ Warning badge appears
- ✅ Message: "Certificate expires in 25 days"
- ✅ Status still shows "Valid"

**Database Update:**

```sql
UPDATE "ANAFCertificate"
SET "validTo" = NOW() + INTERVAL '25 days'
WHERE "tenantId" = <your_tenant_id>;
```

---

### Test 9: Logout from ANAF

**Objective:** Disconnect OAuth

**Steps:**

1. Go to ANAF Setup → OAuth2 tab
2. Click **"Disconnect"** button
3. Confirm action

**Expected Results:**

- ✅ Success message
- ✅ OAuth status shows "Not Connected"
- ✅ Connect button appears again
- ✅ Cannot submit invoices

**Database Check:**

```sql
SELECT "isActive"
FROM "ANAFOAuthToken"
WHERE "tenantId" = <your_tenant_id>;
```

Should show:

- isActive = false

---

### Test 10: Error Handling

**Objective:** Test error scenarios

**Test 10.1: Upload without certificate**

1. Logout and revoke certificate
2. Try to connect to ANAF
3. Should show error: "Please upload certificate first"

**Test 10.2: Submit without OAuth**

1. Disconnect from ANAF
2. Try to submit invoice
3. Should show error: "Please connect to ANAF first"

**Test 10.3: Invalid certificate password**

1. Upload certificate with wrong password
2. Should show error: "Invalid certificate password"

**Test 10.4: Expired certificate**

1. Update validTo to past date in DB
2. Try to submit invoice
3. Should show error: "Certificate expired"

---

## 🎯 Success Criteria

### All Tests Pass ✅

- [ ] Certificate uploaded and encrypted
- [ ] OAuth2 connection works (or mock succeeds)
- [ ] Invoice submission works (mock)
- [ ] Status checking works (mock)
- [ ] Download works (mock)
- [ ] Token refresh automatic
- [ ] Expiration warnings show
- [ ] Logout works
- [ ] Error handling correct

### Database Integrity ✅

- [ ] ANAFCertificate records created
- [ ] ANAFOAuthToken records created
- [ ] ANAFSubmission records created
- [ ] All encrypted data properly stored
- [ ] Timestamps correct

### UI/UX ✅

- [ ] Status badges show correct colors
- [ ] Success/error messages clear
- [ ] Loading states work
- [ ] Forms validate correctly
- [ ] Buttons disabled appropriately

---

## 🔧 Troubleshooting

### Certificate Upload Fails

**Check:**

1. File is .pfx or .p12 format
2. Password is correct
3. ANAF_CERTIFICATE_ENCRYPTION_KEY is set
4. Certificate is not expired

**Fix:**

```bash
# Test certificate
openssl pkcs12 -info -in certificate.pfx

# Generate new encryption key
openssl rand -hex 32
```

### OAuth Redirect Fails

**Check:**

1. NEXTAUTH_URL matches domain
2. NEXT_PUBLIC_APP_URL matches domain
3. ANAF portal redirect URI is correct
4. Certificate registered in SPV

**Fix:**
Update `.env`:

```bash
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
ANAF_REDIRECT_URI="https://yourdomain.com/api/anaf/callback"
```

Restart app:

```bash
pm2 restart all
```

### API Requests Fail

**Check:**

1. Token is valid (check expiresAt)
2. User is authenticated
3. Certificate is valid
4. Network connectivity

**Fix:**

```sql
-- Check token
SELECT * FROM "ANAFOAuthToken" WHERE "tenantId" = <id>;

-- Re-authenticate if needed
UPDATE "ANAFOAuthToken" SET "isActive" = false;
```

---

## 📊 Test Results Template

```markdown
## Test Results

**Tested by:** [Your Name]
**Date:** [Date]
**Environment:** [Dev/Staging/Production]

| Test               | Status | Notes |
| ------------------ | ------ | ----- |
| Certificate Upload | ✅/❌  |       |
| OAuth Connection   | ✅/❌  |       |
| Create Invoice     | ✅/❌  |       |
| Submit to ANAF     | ✅/❌  |       |
| Check Status       | ✅/❌  |       |
| Download Invoice   | ✅/❌  |       |
| Token Refresh      | ✅/❌  |       |
| Expiration Warning | ✅/❌  |       |
| Logout             | ✅/❌  |       |
| Error Handling     | ✅/❌  |       |

**Overall:** ✅ PASS / ❌ FAIL

**Issues Found:**

1. [Issue description]
2. [Issue description]

**Next Steps:**

1. [Action item]
2. [Action item]
```

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**

   - Document any issues
   - Prepare for production deployment
   - Update team documentation

2. **If tests fail:**

   - Document exact error messages
   - Check logs: `pm2 logs` or browser console
   - Review database state
   - Check ANAF portal configuration
   - Contact support if needed

3. **Production deployment:**
   - Switch to production endpoints
   - Use production certificate
   - Update ANAF portal to production app
   - Monitor first real submission
   - Have rollback plan ready

---

**Last Updated:** December 30, 2024  
**Version:** 1.0  
**Status:** Ready for Testing
