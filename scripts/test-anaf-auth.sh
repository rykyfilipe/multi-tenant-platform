#!/bin/bash

echo "🔍 Testing ANAF Authentication Flow"
echo "=================================="

# Test 1: Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Server is running on port 3001"
else
    echo "❌ Server is not running. Please start it with: npm run dev"
    exit 1
fi

# Test 2: Check ANAF status endpoint (should return 401 without auth)
echo "2. Testing ANAF status endpoint..."
STATUS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3001/api/anaf/status)
HTTP_CODE="${STATUS_RESPONSE: -3}"

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ ANAF status endpoint returns 401 (expected without authentication)"
else
    echo "❌ ANAF status endpoint returned $HTTP_CODE (expected 401)"
fi

# Test 3: Check ANAF auth-url endpoint (should return 401 without auth)
echo "3. Testing ANAF auth-url endpoint..."
AUTH_URL_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3001/api/anaf/auth-url)
HTTP_CODE="${AUTH_URL_RESPONSE: -3}"

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ ANAF auth-url endpoint returns 401 (expected without authentication)"
else
    echo "❌ ANAF auth-url endpoint returned $HTTP_CODE (expected 401)"
fi

# Test 4: Check test page accessibility
echo "4. Testing ANAF test page accessibility..."
if curl -s http://localhost:3001/test/anaf | grep -q "ANAF e-Factura Test Suite"; then
    echo "✅ ANAF test page is accessible"
else
    echo "❌ ANAF test page is not accessible or doesn't contain expected content"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Open http://localhost:3001/test/anaf in your browser"
echo "2. Log in to your account"
echo "3. Test the ANAF authentication flow"
echo "4. Check if the invoice list shows ANAF actions buttons"

echo ""
echo "🔧 If you see 'anaf.actions.not_authenticated':"
echo "1. Make sure you're logged in"
echo "2. Check if the useANAF hook is working correctly"
echo "3. Verify that the ANAF status endpoint returns success when authenticated"
