<!-- @format -->

# Production Authentication Fix Guide

## Issues Identified and Fixed

### 1. ✅ Fixed: Redirect Callback Logic

- Updated the redirect callback in `src/lib/auth.ts` to properly handle the
  production URL `https://ydv.digital`
- Added specific handling for the `callbackUrl` parameter in production URLs

### 2. ✅ Fixed: Enhanced Error Handling

- Added comprehensive logging to NextAuth configuration
- Created debug endpoint at `/api/auth/debug` for troubleshooting
- Enhanced auth-callback page with error handling and debug information

### 3. ✅ Fixed: Better Debugging

- Added logger configuration to NextAuth
- Enhanced auth-callback page to show detailed error information
- Added debug information display in development mode

## Required Environment Variables for Production

Make sure these environment variables are set correctly in your production
environment:

```bash
# Critical for production
NEXTAUTH_URL=https://ydv.digital
NEXTAUTH_SECRET=your-strong-secret-here

# Google OAuth (must be configured for ydv.digital domain)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secrets
JWT_SECRET=your-jwt-secret
PUBLIC_JWT_SECRET=your-public-jwt-secret

# Optional: Enable debug mode in production for troubleshooting
NEXTAUTH_DEBUG=true
```

## Google OAuth Configuration

### 1. Update Google OAuth Settings

Go to [Google Cloud Console](https://console.cloud.google.com/) and update your
OAuth application:

1. **Authorized JavaScript origins:**

   - `https://ydv.digital`

2. **Authorized redirect URIs:**
   - `https://ydv.digital/api/auth/callback/google`

### 2. Verify Domain Verification

Make sure your domain `ydv.digital` is verified in Google Cloud Console.

## Testing Steps

### 1. Test Authentication Debug Endpoint

Visit: `https://ydv.digital/api/auth/debug`

This will show you:

- Environment variable status
- Current session information
- Authentication working status
- Recommendations for fixes

### 2. Test Authentication Flow

1. Go to `https://ydv.digital`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Should redirect to `https://ydv.digital/auth-callback`
5. Should then redirect to `https://ydv.digital/home/analytics`

### 3. Check Browser Console

Open browser developer tools and check for any JavaScript errors during
authentication.

### 4. Check Network Tab

Look for failed requests to `/api/auth/*` endpoints.

## Common Issues and Solutions

### Issue: "Invalid redirect URI"

**Solution:** Update Google OAuth redirect URI to
`https://ydv.digital/api/auth/callback/google`

### Issue: "NEXTAUTH_URL mismatch"

**Solution:** Set `NEXTAUTH_URL=https://ydv.digital` in production environment

### Issue: "Session not persisting"

**Solution:** Check that cookies are being set with correct domain and secure
flags

### Issue: "CSRF token mismatch"

**Solution:** Ensure `NEXTAUTH_SECRET` is set and consistent

## Deployment Checklist

- [ ] Set `NEXTAUTH_URL=https://ydv.digital`
- [ ] Set `NEXTAUTH_SECRET` to a strong, random value
- [ ] Update Google OAuth redirect URI to
      `https://ydv.digital/api/auth/callback/google`
- [ ] Verify all environment variables are set
- [ ] Test authentication flow end-to-end
- [ ] Check browser console for errors
- [ ] Verify cookies are being set correctly

## Debug Commands

### Check Environment Variables

```bash
# In your production environment
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

### Test Authentication Endpoint

```bash
curl https://ydv.digital/api/auth/debug
```

## Next Steps

1. Deploy these changes to production
2. Update environment variables
3. Update Google OAuth configuration
4. Test the authentication flow
5. Monitor logs for any remaining issues

If authentication still doesn't work after these fixes, check the debug endpoint
and browser console for specific error messages.
