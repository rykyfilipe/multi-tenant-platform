<!-- @format -->

# Debugging 401 Error Guide

## Problem Description

You're receiving 401 (Unauthorized) errors even when logged in.

## Root Cause Analysis

The issue is likely caused by a mismatch between:

1. **NextAuth tokens** (used for session management)
2. **Custom JWT tokens** (used for API authentication)

## Debugging Steps

### 1. Check Environment Variables

Make sure these are set in your `.env.local`:

```bash
NEXTAUTH_SECRET="your-strong-secret-here"
JWT_SECRET="your-strong-jwt-secret-here"
PUBLIC_JWT_SECRET="your-strong-public-jwt-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Check Console Logs

Look for these debug messages in the browser console:

- `🔧 Configuration Check:` - Shows if environment variables are correct
- `🔍 Session Debug:` - Shows if session and customJWT are loaded
- `🔍 Middleware Debug:` - Shows what's happening in middleware

### 3. Verify Token Generation

Check if `session.customJWT` is being generated:

1. Open browser dev tools
2. Go to Application/Storage → Local Storage
3. Look for `next-auth.session-token`
4. Decode the JWT at jwt.io to see if `customJWT` field exists

### 4. Test API Endpoints

Try making a request to a protected API endpoint:

```javascript
// In browser console
const token = "your-custom-jwt-token";
fetch("/api/tenants", {
	headers: {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	},
})
	.then((r) => r.json())
	.then(console.log);
```

### 5. Check Middleware Logic

The middleware now supports both:

- NextAuth tokens (for browser requests)
- Custom JWT tokens (for API requests)

## Common Issues & Solutions

### Issue 1: Missing Environment Variables

**Symptoms:** Configuration check shows missing variables **Solution:** Set all
required environment variables

### Issue 2: Weak JWT Secrets

**Symptoms:** Warnings about short secrets **Solution:** Generate strong secrets
(32+ characters)

### Issue 3: Token Not Generated

**Symptoms:** `session.customJWT` is empty **Solution:** Check NextAuth
configuration in `src/lib/auth.ts`

### Issue 4: Token Expired

**Symptoms:** Token exists but verification fails **Solution:** Check token
expiration time (currently 7 days)

### Issue 5: Different JWT Secrets

**Symptoms:** Token verification fails **Solution:** Ensure same JWT_SECRET is
used for generation and verification

## Quick Fixes

### 1. Regenerate JWT Secrets

```bash
# Generate strong secrets
openssl rand -base64 32
openssl rand -base64 32
```

### 2. Clear Browser Data

- Clear localStorage
- Clear cookies
- Log out and log back in

### 3. Restart Development Server

```bash
npm run dev
```

## Testing Steps

1. **Login** to the application
2. **Check console** for debug messages
3. **Navigate** to a protected page (e.g., /home/database)
4. **Check Network tab** for API requests
5. **Verify** no 401 errors in response

## Expected Behavior

After fixes:

- ✅ Configuration check passes
- ✅ Session debug shows customJWT
- ✅ Middleware debug shows valid tokens
- ✅ API requests return 200 instead of 401
- ✅ No authentication errors in console

## Still Having Issues?

If the problem persists:

1. Check the exact error message
2. Look at the Network tab for failed requests
3. Verify the Authorization header is being sent
4. Check if the token format is correct (Bearer + space + token)
5. Ensure the token hasn't expired

## Contact Support

If you continue to experience issues, please provide:

- Browser console logs
- Network request details
- Environment configuration (without secrets)
- Steps to reproduce the issue
