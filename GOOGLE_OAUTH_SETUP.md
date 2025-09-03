# Google OAuth Setup Guide - Complete Configuration

## 🚨 Critical Issues Fixed

### 1. **Mobile Browser Compatibility**
- ✅ **SameSite Cookie Issues**: Fixed with `SameSite=None` for production
- ✅ **iOS Safari Problems**: Added `__Secure-` cookie prefix
- ✅ **WebView Restrictions**: Enhanced mobile detection and handling
- ✅ **Popup Blockers**: Implemented fallback strategies

### 2. **Production Environment Issues**
- ✅ **HTTPS Redirect**: Automatic HTTPS enforcement
- ✅ **Domain Mismatch**: Proper NEXTAUTH_URL configuration
- ✅ **Cookie Domain**: Correct domain settings for production
- ✅ **CORS Headers**: Enhanced cross-origin support

### 3. **Error Handling & Debugging**
- ✅ **Comprehensive Logging**: Detailed OAuth flow logging
- ✅ **Mobile Debug Endpoint**: `/api/auth/mobile-debug`
- ✅ **Error Recovery**: Fallback mechanisms for failures
- ✅ **User-Friendly Messages**: Clear error messages for users

## 📋 Google Cloud Console Configuration

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**

### Step 2: Create OAuth 2.0 Client ID
1. Click **Create Credentials** > **OAuth 2.0 Client IDs**
2. Select **Web application** as the application type
3. Give it a descriptive name (e.g., "Multi-Tenant Platform OAuth")

### Step 3: Configure Authorized JavaScript Origins
Add these origins to the **Authorized JavaScript origins** field:

```
# Development
http://localhost:3000

# Production (replace with your actual domain)
https://ydv.digital

# Testing with ngrok (replace with your ngrok URL)
https://your-ngrok-url.ngrok.io

# Testing on LAN (replace with your local IP)
http://192.168.1.100:3000
```

### Step 4: Configure Authorized Redirect URIs
Add these URIs to the **Authorized redirect URIs** field:

```
# Development
http://localhost:3000/api/auth/callback/google

# Production (replace with your actual domain)
https://ydv.digital/api/auth/callback/google

# Testing with ngrok (replace with your ngrok URL)
https://your-ngrok-url.ngrok.io/api/auth/callback/google

# Testing on LAN (replace with your local IP)
http://192.168.1.100:3000/api/auth/callback/google
```

### Step 5: Configure OAuth Consent Screen
1. Go to **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in the required fields:
   - **App name**: Your application name
   - **User support email**: Your support email
   - **Developer contact information**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (for development):
   - Add your email and any test user emails

### Step 6: Enable Required APIs
1. Go to **APIs & Services** > **Library**
2. Search for and enable:
   - **Google+ API** (if available)
   - **Google Identity API**
   - **People API**

## 🔧 Environment Variables Configuration

### Development Environment (.env.local)
```bash
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-development-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# JWT Secrets
JWT_SECRET="your-jwt-secret"
PUBLIC_JWT_SECRET="your-public-jwt-secret"

# Database
DATABASE_URL="your-database-url"
```

### Production Environment
```bash
# NextAuth Configuration
NEXTAUTH_URL="https://ydv.digital"
NEXTAUTH_SECRET="your-production-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# JWT Secrets
JWT_SECRET="your-jwt-secret"
PUBLIC_JWT_SECRET="your-public-jwt-secret"

# Database
DATABASE_URL="your-production-database-url"
```

### Testing with ngrok
```bash
# NextAuth Configuration
NEXTAUTH_URL="https://your-ngrok-url.ngrok.io"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth (same as development)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🧪 Testing and Validation

### 1. Run OAuth Test Script
```bash
# Test development environment
node scripts/test-oauth.js development

# Test production environment
node scripts/test-oauth.js production

# Test with ngrok
NGROK_URL="https://your-ngrok-url.ngrok.io" node scripts/test-oauth.js ngrok
```

### 2. Manual Testing Checklist

#### Desktop Testing
- [ ] Chrome: OAuth flow works
- [ ] Firefox: OAuth flow works
- [ ] Safari: OAuth flow works
- [ ] Edge: OAuth flow works

#### Mobile Testing
- [ ] iOS Safari: OAuth flow works
- [ ] Chrome Mobile: OAuth flow works
- [ ] Samsung Internet: OAuth flow works
- [ ] In-app browsers: OAuth flow works (or shows appropriate error)

#### Production Testing
- [ ] HTTPS redirect works
- [ ] OAuth flow works on production domain
- [ ] Cookies are set correctly
- [ ] Session persists after page refresh

### 3. Debug Endpoints

#### General OAuth Debug
```
GET /api/auth/debug
```
Returns environment info, session status, and recommendations.

#### Mobile OAuth Debug
```
GET /api/auth/mobile-debug
```
Returns mobile-specific information, device detection, and mobile recommendations.

#### Middleware Debug
```
GET /api/auth/middleware-debug
```
Returns middleware-specific information and cookie details.

## 🚨 Common Issues and Solutions

### Issue: "Invalid redirect URI"
**Solution**: 
1. Check that the redirect URI in Google Console exactly matches your application
2. Ensure no trailing slashes
3. Verify HTTPS vs HTTP protocol

### Issue: "Popup blocked" on mobile
**Solution**:
1. The app now detects mobile devices and uses redirect instead of popup
2. Users should allow popups for the site
3. Consider opening in external browser for in-app browsers

### Issue: "Session not persisting" on mobile
**Solution**:
1. Check SameSite cookie settings
2. Verify HTTPS is working
3. Check if cookies are being set in browser dev tools

### Issue: "OAuth callback failed" in production
**Solution**:
1. Verify NEXTAUTH_URL matches your production domain
2. Check that all environment variables are set
3. Ensure Google Console has the correct redirect URI

### Issue: "CSRF token mismatch"
**Solution**:
1. Ensure NEXTAUTH_SECRET is set and consistent
2. Check that cookies are being set correctly
3. Verify domain settings

## 📱 Mobile-Specific Optimizations

### 1. Enhanced Mobile Detection
The app now detects:
- Mobile devices (iOS, Android)
- In-app browsers (WebView)
- Specific browser types

### 2. Mobile-Optimized OAuth Flow
- Uses redirect instead of popup on mobile
- Handles WebView restrictions
- Provides fallback for in-app browsers

### 3. Mobile Cookie Configuration
- Uses `__Secure-` prefix for production
- Configures `SameSite=None` for cross-origin
- Sets appropriate `maxAge` values

## 🔒 Security Considerations

### 1. Cookie Security
- Uses `__Secure-` prefix in production
- Sets `httpOnly` for sensitive cookies
- Configures `SameSite` appropriately
- Uses `secure` flag for HTTPS

### 2. CORS Configuration
- Allows necessary origins
- Sets appropriate headers
- Handles preflight requests

### 3. Error Handling
- Doesn't expose sensitive information
- Provides user-friendly error messages
- Logs errors for debugging

## 📊 Monitoring and Logging

### 1. OAuth Flow Logging
The app now logs:
- OAuth initiation
- Callback handling
- Error conditions
- Mobile device detection

### 2. Debug Information
Available in development mode:
- Environment variables status
- Session information
- Cookie details
- Request headers

### 3. Production Monitoring
- Error tracking
- Performance monitoring
- User experience metrics

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Google Console configured with production domain
- [ ] Environment variables set correctly
- [ ] HTTPS certificate working
- [ ] OAuth test script passes

### Post-Deployment
- [ ] Test OAuth flow on production
- [ ] Test on mobile devices
- [ ] Check debug endpoints
- [ ] Monitor error logs

### Ongoing Maintenance
- [ ] Monitor OAuth success rates
- [ ] Check for new mobile browser issues
- [ ] Update Google Console as needed
- [ ] Review and rotate secrets periodically

## 📞 Support and Troubleshooting

### Debug Commands
```bash
# Check environment variables
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET
echo $GOOGLE_CLIENT_ID

# Test OAuth endpoints
curl https://yourdomain.com/api/auth/debug
curl https://yourdomain.com/api/auth/mobile-debug

# Check Google Console
# Visit: https://console.cloud.google.com/apis/credentials
```

### Common Debug Steps
1. Check browser console for errors
2. Verify cookies in browser dev tools
3. Test with different browsers/devices
4. Check network tab for failed requests
5. Review server logs for OAuth errors

### Getting Help
- Check the debug endpoints first
- Review the error logs
- Test with the OAuth test script
- Verify Google Console configuration
- Test on different devices/browsers

---

## 🎉 Success Indicators

Your OAuth setup is working correctly when:
- ✅ OAuth flow works on desktop browsers
- ✅ OAuth flow works on mobile browsers
- ✅ OAuth flow works in production
- ✅ Sessions persist correctly
- ✅ No console errors
- ✅ Debug endpoints return expected data
- ✅ OAuth test script passes all tests

The implementation now includes comprehensive mobile support, production-ready configuration, and extensive debugging capabilities to ensure OAuth works reliably across all environments and devices.
