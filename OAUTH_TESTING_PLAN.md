# OAuth Testing Plan - Comprehensive Validation Guide

## 🎯 Testing Objectives

This testing plan ensures that Google OAuth authentication works correctly across:
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)
- ✅ Production environment (HTTPS)
- ✅ Development environment (HTTP)
- ✅ Cross-origin scenarios (ngrok, LAN)

## 🧪 Test Scenarios

### 1. Environment Setup Tests

#### 1.1 Development Environment
```bash
# Test development setup
node scripts/test-oauth.js development
```

**Expected Results:**
- ✅ All environment variables are set
- ✅ OAuth debug endpoint returns success
- ✅ Mobile debug endpoint detects devices correctly
- ✅ Cookie configuration is correct
- ✅ CORS headers are present

#### 1.2 Production Environment
```bash
# Test production setup
node scripts/test-oauth.js production
```

**Expected Results:**
- ✅ HTTPS redirect works
- ✅ Secure cookies are used
- ✅ All OAuth endpoints respond correctly
- ✅ Mobile detection works

#### 1.3 ngrok Testing
```bash
# Test with ngrok
NGROK_URL="https://your-ngrok-url.ngrok.io" node scripts/test-oauth.js ngrok
```

**Expected Results:**
- ✅ Cross-origin requests work
- ✅ OAuth flow completes successfully
- ✅ Mobile devices work correctly

### 2. Desktop Browser Tests

#### 2.1 Chrome (Windows/Mac/Linux)
**Test Steps:**
1. Open Chrome browser
2. Navigate to application URL
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Verify redirect to dashboard

**Expected Results:**
- ✅ OAuth popup opens
- ✅ Google login page loads
- ✅ After login, redirects to `/auth-callback`
- ✅ Then redirects to `/home/analytics`
- ✅ Session persists after page refresh
- ✅ User data is correctly stored

#### 2.2 Firefox (Windows/Mac/Linux)
**Test Steps:** Same as Chrome
**Expected Results:** Same as Chrome

#### 2.3 Safari (Mac)
**Test Steps:** Same as Chrome
**Expected Results:** Same as Chrome

#### 2.4 Edge (Windows)
**Test Steps:** Same as Chrome
**Expected Results:** Same as Chrome

### 3. Mobile Browser Tests

#### 3.1 iOS Safari
**Test Steps:**
1. Open Safari on iPhone/iPad
2. Navigate to application URL
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Verify redirect to dashboard

**Expected Results:**
- ✅ OAuth redirect works (no popup)
- ✅ Google login page loads in same tab
- ✅ After login, redirects to `/auth-callback`
- ✅ Then redirects to `/home/analytics`
- ✅ Session persists after page refresh
- ✅ Cookies are set correctly

#### 3.2 Chrome Mobile (Android)
**Test Steps:** Same as iOS Safari
**Expected Results:** Same as iOS Safari

#### 3.3 Samsung Internet (Android)
**Test Steps:** Same as iOS Safari
**Expected Results:** Same as iOS Safari

#### 3.4 In-App Browsers
**Test Steps:**
1. Open application in Facebook, Instagram, or other in-app browser
2. Try OAuth flow
3. Check for appropriate error messages

**Expected Results:**
- ✅ App detects in-app browser
- ✅ Shows appropriate warning/error message
- ✅ Suggests opening in external browser

### 4. Production Environment Tests

#### 4.1 HTTPS Configuration
**Test Steps:**
1. Access application via HTTP
2. Verify automatic redirect to HTTPS
3. Test OAuth flow on HTTPS

**Expected Results:**
- ✅ HTTP requests redirect to HTTPS
- ✅ OAuth works correctly on HTTPS
- ✅ Secure cookies are used
- ✅ No mixed content warnings

#### 4.2 Domain Configuration
**Test Steps:**
1. Test OAuth with production domain
2. Verify Google Console configuration
3. Check cookie domain settings

**Expected Results:**
- ✅ OAuth works with production domain
- ✅ Google Console has correct redirect URIs
- ✅ Cookies are set for correct domain
- ✅ No domain mismatch errors

### 5. Error Handling Tests

#### 5.1 Network Errors
**Test Steps:**
1. Disconnect internet during OAuth flow
2. Reconnect and retry
3. Check error messages

**Expected Results:**
- ✅ Appropriate error message shown
- ✅ User can retry OAuth flow
- ✅ No application crashes

#### 5.2 OAuth Cancellation
**Test Steps:**
1. Start OAuth flow
2. Cancel at Google login page
3. Check application behavior

**Expected Results:**
- ✅ User returns to application
- ✅ Appropriate error message shown
- ✅ User can retry OAuth flow

#### 5.3 Invalid Credentials
**Test Steps:**
1. Use invalid Google OAuth credentials
2. Check error handling

**Expected Results:**
- ✅ Configuration error message shown
- ✅ Error logged for debugging
- ✅ User can contact support

### 6. Performance Tests

#### 6.1 OAuth Flow Speed
**Test Steps:**
1. Measure time from OAuth initiation to completion
2. Test on different network speeds
3. Test on different devices

**Expected Results:**
- ✅ OAuth flow completes within 10 seconds
- ✅ No significant performance differences between devices
- ✅ Graceful handling of slow networks

#### 6.2 Session Persistence
**Test Steps:**
1. Complete OAuth flow
2. Close browser
3. Reopen browser and navigate to application
4. Check if session persists

**Expected Results:**
- ✅ Session persists after browser restart
- ✅ User remains logged in
- ✅ No need to re-authenticate

## 🔍 Debug Endpoints Testing

### 1. General OAuth Debug
```bash
curl https://yourdomain.com/api/auth/debug
```

**Expected Response:**
```json
{
  "message": "Authentication Debug Information",
  "environment": {
    "NODE_ENV": "production",
    "NEXTAUTH_URL": "https://yourdomain.com",
    "NEXTAUTH_SECRET": "Set",
    "GOOGLE_CLIENT_ID": "Set",
    "GOOGLE_CLIENT_SECRET": "Set"
  },
  "session": null,
  "token": null,
  "authWorking": true,
  "recommendations": [...]
}
```

### 2. Mobile OAuth Debug
```bash
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15" https://yourdomain.com/api/auth/mobile-debug
```

**Expected Response:**
```json
{
  "message": "Mobile OAuth Debug Information",
  "device": {
    "isMobile": true,
    "isIOS": true,
    "isInApp": false,
    "platform": "iOS"
  },
  "environment": {...},
  "issues": [],
  "recommendations": [...]
}
```

### 3. Middleware Debug
```bash
curl https://yourdomain.com/api/auth/middleware-debug
```

**Expected Response:**
```json
{
  "message": "Middleware Debug Information",
  "session": null,
  "token": null,
  "cookies": {
    "total": 0,
    "nextAuthCookies": []
  },
  "recommendations": [...]
}
```

## 📊 Test Results Documentation

### Test Results Template
```
Test Date: [DATE]
Environment: [DEVELOPMENT/PRODUCTION/NGROK]
Browser: [BROWSER_NAME]
Device: [DESKTOP/MOBILE/DEVICE_TYPE]
OS: [OPERATING_SYSTEM]

Test Steps:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

Expected Results:
- [EXPECTATION 1]
- [EXPECTATION 2]
- [EXPECTATION 3]

Actual Results:
- [ACTUAL RESULT 1]
- [ACTUAL RESULT 2]
- [ACTUAL RESULT 3]

Status: [PASS/FAIL]
Issues Found: [LIST OF ISSUES]
Screenshots: [SCREENSHOT LINKS]
```

### Test Matrix
| Environment | Browser | Device | Status | Notes |
|-------------|---------|--------|--------|-------|
| Development | Chrome | Desktop | ✅ | |
| Development | Safari | Desktop | ✅ | |
| Development | Chrome | Mobile | ✅ | |
| Development | Safari | Mobile | ✅ | |
| Production | Chrome | Desktop | ✅ | |
| Production | Safari | Desktop | ✅ | |
| Production | Chrome | Mobile | ✅ | |
| Production | Safari | Mobile | ✅ | |
| ngrok | Chrome | Desktop | ✅ | |
| ngrok | Safari | Mobile | ✅ | |

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### Issue: OAuth popup blocked
**Symptoms:** Popup doesn't open, error message about popup blocked
**Solution:** 
1. Allow popups for the site
2. Use mobile-optimized flow (redirect instead of popup)
3. Check browser popup blocker settings

#### Issue: Invalid redirect URI
**Symptoms:** Google error page, "Invalid redirect URI" message
**Solution:**
1. Check Google Console configuration
2. Verify exact URL match
3. Ensure no trailing slashes
4. Check HTTP vs HTTPS protocol

#### Issue: Session not persisting
**Symptoms:** User logged out after page refresh
**Solution:**
1. Check cookie settings
2. Verify SameSite configuration
3. Check domain settings
4. Verify HTTPS is working

#### Issue: Mobile OAuth not working
**Symptoms:** OAuth fails on mobile devices
**Solution:**
1. Check mobile debug endpoint
2. Verify mobile detection
3. Check cookie configuration for mobile
4. Test with different mobile browsers

#### Issue: Production OAuth not working
**Symptoms:** OAuth works in development but not production
**Solution:**
1. Check environment variables
2. Verify Google Console configuration
3. Check HTTPS configuration
4. Verify domain settings

## 📈 Success Metrics

### OAuth Success Rate
- **Target:** >95% success rate across all devices
- **Measurement:** Track successful OAuth completions vs attempts

### Performance Metrics
- **OAuth Flow Time:** <10 seconds average
- **Page Load Time:** <3 seconds after OAuth
- **Session Persistence:** >99% success rate

### User Experience Metrics
- **Error Rate:** <5% of OAuth attempts
- **User Satisfaction:** No critical user complaints
- **Support Tickets:** <1% of users need OAuth support

## 🔄 Continuous Testing

### Automated Testing
```bash
# Run daily OAuth tests
0 9 * * * node scripts/test-oauth.js production

# Run mobile-specific tests
0 10 * * * node scripts/test-oauth.js production --mobile-only

# Run cross-browser tests
0 11 * * * node scripts/test-oauth.js production --all-browsers
```

### Manual Testing Schedule
- **Daily:** Check OAuth debug endpoints
- **Weekly:** Test on different devices
- **Monthly:** Full cross-browser testing
- **Before Releases:** Complete test suite

### Monitoring
- **Real-time:** OAuth success rate monitoring
- **Alerts:** OAuth failure rate >5%
- **Logs:** OAuth error tracking
- **Analytics:** User authentication flow tracking

## 📋 Pre-Release Checklist

### Development Testing
- [ ] OAuth works in development environment
- [ ] All debug endpoints respond correctly
- [ ] Mobile detection works
- [ ] Error handling works
- [ ] Performance is acceptable

### Production Testing
- [ ] OAuth works in production environment
- [ ] HTTPS redirect works
- [ ] Google Console is configured correctly
- [ ] Environment variables are set
- [ ] Monitoring is in place

### Cross-Device Testing
- [ ] Desktop browsers work
- [ ] Mobile browsers work
- [ ] In-app browsers handled correctly
- [ ] Different operating systems work
- [ ] Different screen sizes work

### Security Testing
- [ ] Secure cookies are used
- [ ] HTTPS is enforced
- [ ] CORS is configured correctly
- [ ] No sensitive data exposed
- [ ] Error messages are user-friendly

---

## 🎉 Success Criteria

OAuth implementation is considered successful when:
- ✅ All test scenarios pass
- ✅ Success rate >95% across all devices
- ✅ No critical security issues
- ✅ Performance meets requirements
- ✅ User experience is smooth
- ✅ Monitoring and alerting work
- ✅ Documentation is complete
- ✅ Support team is trained

This comprehensive testing plan ensures that OAuth authentication works reliably across all environments and devices, providing a smooth user experience while maintaining security and performance standards.
