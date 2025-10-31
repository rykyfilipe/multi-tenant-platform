# 🔧 ANAF OAuth Troubleshooting Guide

## ❌ Error: "OAuth authorization failed"

### **Root Causes & Solutions**

---

## 🔴 **1. Wrong Redirect URL Configuration**

### **Symptom:**

User is redirected back to app with error: `OAuth authorization failed`

### **Cause:**

```bash
# ❌ WRONG - localhost in production
NEXTAUTH_URL="https://localhost:3000"
NEXT_PUBLIC_APP_URL="https://localhost:3000"
```

### **Solution:**

```bash
# ✅ CORRECT - actual domain
NEXTAUTH_URL="https://ydv.digital"
NEXT_PUBLIC_APP_URL="https://ydv.digital"
```

### **Verify:**

1. Check callback URL in browser: should be `https://ydv.digital/api/anaf/callback`
2. Check ANAF portal: redirect URI must match exactly

---

## 🔴 **2. Missing ANAF Environment Variables**

### **Symptom:**

Server error or "ANAF OAuth2 not configured"

### **Cause:**

Missing or incorrect ANAF variables in `.env`

### **Required Variables:**

```bash
# ANAF OAuth2 Credentials
ANAF_CLIENT_ID="your-client-id-from-anaf"
ANAF_CLIENT_SECRET="your-client-secret-from-anaf"
ANAF_REDIRECT_URI="https://ydv.digital/api/anaf/callback"

# ANAF API Configuration
ANAF_ENVIRONMENT="sandbox"  # or "production"
ANAF_BASE_URL="https://api.anaf.ro/test/FCTEL/rest"  # for sandbox
# ANAF_BASE_URL="https://api.anaf.ro/prod/FCTEL/rest"  # for production

# ANAF OAuth URLs
ANAF_AUTH_URL="https://logincert.anaf.ro/anaf-oauth2/v1/authorize"
ANAF_TOKEN_URL="https://logincert.anaf.ro/anaf-oauth2/v1/token"

# Security Keys
ANAF_JWT_SECRET="your-jwt-secret-key"
ANAF_CERTIFICATE_ENCRYPTION_KEY="your-64-char-hex-key"
```

### **Solution:**

Add ALL required variables to `.env` file

---

## 🔴 **3. ANAF Portal Configuration Mismatch**

### **Symptom:**

ANAF rejects redirect with error

### **Cause:**

Redirect URI in ANAF portal doesn't match your `.env` configuration

### **Verification:**

1. Login to ANAF Portal: https://logincert.anaf.ro/
2. Go to your application settings
3. Check "Redirect URI" field
4. Must match EXACTLY: `https://ydv.digital/api/anaf/callback`

### **Common Mistakes:**

```bash
❌ http://ydv.digital/api/anaf/callback  (http instead of https)
❌ https://ydv.digital/anaf/callback     (missing /api)
❌ https://www.ydv.digital/api/anaf/callback  (extra www)
❌ https://ydv.digital/api/anaf/callback/    (trailing slash)
```

---

## 🔴 **4. Invalid State Parameter**

### **Symptom:**

Error: "Invalid state parameter"

### **Cause:**

State parameter validation failed (CSRF protection)

### **Possible Reasons:**

1. User took too long to authenticate (state expired)
2. State parameter was modified
3. Session expired during OAuth flow

### **Solution:**

1. Try again - start fresh OAuth flow
2. Check that cookies are enabled
3. Verify session is active before starting OAuth

---

## 🔴 **5. ANAF Service Unavailable**

### **Symptom:**

Timeout or connection error

### **Cause:**

ANAF services are down or unreachable

### **Check:**

```bash
# Test ANAF connectivity
curl -I https://logincert.anaf.ro/
```

### **Solution:**

- Wait and retry later
- Check ANAF status page
- Verify network connectivity

---

## 🔴 **6. Invalid Client Credentials**

### **Symptom:**

Error after redirect: "Invalid client" or "Unauthorized"

### **Cause:**

Wrong `ANAF_CLIENT_ID` or `ANAF_CLIENT_SECRET`

### **Solution:**

1. Login to ANAF Portal
2. Verify your application credentials
3. Copy-paste carefully (no extra spaces!)
4. Update `.env` file
5. Restart application

---

## 🔴 **7. Session Not Found**

### **Symptom:**

Error: "Unauthorized - Please login"

### **Cause:**

User not logged into your application

### **Solution:**

1. Ensure user is logged in with NextAuth
2. Check session is valid: `getServerSession(authOptions)`
3. Verify `session.user.id` and `session.user.tenantId` exist

---

## 🔴 **8. Network/Firewall Issues**

### **Symptom:**

Connection timeout or network error

### **Possible Causes:**

- Firewall blocking outbound HTTPS to ANAF
- DNS resolution issues
- Proxy configuration problems

### **Verify:**

```bash
# Test DNS
nslookup logincert.anaf.ro

# Test HTTPS connection
curl -v https://logincert.anaf.ro/

# Check from server
curl -v https://api.anaf.ro/test/FCTEL/rest/
```

---

## 🔴 **9. Browser Cookie/Storage Issues**

### **Symptom:**

OAuth starts but loses session during redirect

### **Cause:**

- Cookies blocked by browser
- Third-party cookies disabled
- Browser storage full

### **Solution:**

1. Enable cookies in browser
2. Allow third-party cookies for ydv.digital
3. Clear browser cache and cookies
4. Try incognito/private mode

---

## 📋 **Complete Environment Checklist**

Before attempting OAuth, verify ALL these variables:

```bash
# Application URLs (MUST match your domain)
✅ NEXTAUTH_URL="https://ydv.digital"
✅ NEXT_PUBLIC_APP_URL="https://ydv.digital"

# ANAF OAuth (from ANAF portal)
✅ ANAF_CLIENT_ID="..."
✅ ANAF_CLIENT_SECRET="..."
✅ ANAF_REDIRECT_URI="https://ydv.digital/api/anaf/callback"

# ANAF Environment
✅ ANAF_ENVIRONMENT="sandbox" or "production"
✅ ANAF_BASE_URL="https://api.anaf.ro/test/FCTEL/rest"
✅ ANAF_AUTH_URL="https://logincert.anaf.ro/anaf-oauth2/v1/authorize"
✅ ANAF_TOKEN_URL="https://logincert.anaf.ro/anaf-oauth2/v1/token"

# Security
✅ ANAF_JWT_SECRET="..." (generate with: openssl rand -base64 32)
✅ ANAF_CERTIFICATE_ENCRYPTION_KEY="..." (generate with: openssl rand -hex 32)
```

---

## 🧪 **Testing OAuth Flow**

### **Manual Test:**

```bash
# 1. Get auth URL
curl https://ydv.digital/api/anaf/auth/login \
  -H "Cookie: your-session-cookie"

# Should return:
{
  "authUrl": "https://logincert.anaf.ro/anaf-oauth2/v1/authorize?client_id=...&redirect_uri=...&response_type=code&scope=efactura&state=..."
}

# 2. Open authUrl in browser
# 3. Login with ANAF credentials
# 4. Should redirect to: https://ydv.digital/api/anaf/callback?code=XXX&state=YYY
# 5. Should redirect to: https://ydv.digital/home/invoices?anaf_success=true
```

---

## 🔍 **Debug Mode**

Enable debug logging in `/api/anaf/callback/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // DEBUG: Log all parameters
    console.log('🔍 OAuth Callback:', {
      code: searchParams.get('code') ? 'present' : 'missing',
      state: searchParams.get('state') ? 'present' : 'missing',
      error: searchParams.get('error'),
      error_description: searchParams.get('error_description'),
      url: request.url
    });

    // ... rest of code
  }
}
```

---

## ✅ **After Fixing**

1. **Restart Application:**

   ```bash
   # If using PM2
   pm2 restart all

   # If using npm
   npm run build
   npm run start
   ```

2. **Clear Browser Cache:**

   - Clear cookies for ydv.digital
   - Clear local storage
   - Restart browser

3. **Test OAuth Flow:**

   - Login to your application
   - Go to Invoices → ANAF Setup
   - Click "Conectare cu ANAF"
   - Complete ANAF authentication
   - Should see "ANAF Connected" badge

4. **Verify in Database:**
   ```sql
   SELECT * FROM "ANAFOAuthToken"
   WHERE "userId" = YOUR_USER_ID
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```

---

## 📞 **Still Having Issues?**

### **Check Logs:**

1. Application logs (console output)
2. Network tab in browser DevTools
3. ANAF callback URL parameters
4. Database entries in `ANAFOAuthToken`

### **Common Final Checks:**

- [ ] Domain matches in ALL places
- [ ] ANAF portal configuration matches `.env`
- [ ] User is logged in before starting OAuth
- [ ] All environment variables are set
- [ ] Application restarted after `.env` changes
- [ ] Firewall allows HTTPS to ANAF domains

---

**Last Updated:** October 31, 2025  
**Status:** Complete Troubleshooting Guide
