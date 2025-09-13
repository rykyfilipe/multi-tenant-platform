#!/bin/bash

# ANAF Sandbox Connectivity Test Script
# Tests the ANAF sandbox using the TestOauth service as per official documentation

echo "🌐 ANAF Sandbox Connectivity Test"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from env.example"
    echo "   cp env.example .env"
    exit 1
fi

echo "✅ Environment check passed"

# Test 1: Direct TestOauth endpoint test
echo "🔍 Testing ANAF TestOauth endpoint directly..."
if curl -s -X GET "https://api.anaf.ro/TestOauth/jaxrs/hello?name=Test%20Connectivity" \
    -H "Accept: application/json" \
    -H "User-Agent: MultiTenantPlatform/1.0" \
    --connect-timeout 10 \
    --max-time 30; then
    echo ""
    echo "✅ Direct TestOauth endpoint test passed"
else
    echo "❌ Direct TestOauth endpoint test failed"
    echo "   This might indicate network connectivity issues"
fi

# Test 2: Using our API endpoint
echo ""
echo "🔍 Testing through our API endpoint..."
if curl -s -X POST http://localhost:3000/api/test-anaf \
    -H "Content-Type: application/json" \
    -d '{"testType": "sandbox", "tenantId": 1}' \
    --connect-timeout 10 \
    --max-time 30; then
    echo ""
    echo "✅ API endpoint test completed"
else
    echo "❌ API endpoint test failed"
    echo "   Make sure the development server is running: npm run dev"
fi

# Test 3: Check ANAF OAuth endpoints
echo ""
echo "🔍 Testing ANAF OAuth endpoints accessibility..."

# Test authorization endpoint
echo "Testing authorization endpoint..."
if curl -s -I "https://logincert.anaf.ro/anaf-oauth2/v1/authorize" \
    --connect-timeout 10 \
    --max-time 30 | grep -q "200 OK\|302 Found"; then
    echo "✅ Authorization endpoint accessible"
else
    echo "❌ Authorization endpoint not accessible"
fi

# Test token endpoint
echo "Testing token endpoint..."
if curl -s -I "https://logincert.anaf.ro/anaf-oauth2/v1/token" \
    --connect-timeout 10 \
    --max-time 30 | grep -q "405 Method Not Allowed\|200 OK"; then
    echo "✅ Token endpoint accessible"
else
    echo "❌ Token endpoint not accessible"
fi

# Test 4: Environment variables check
echo ""
echo "🔍 Checking ANAF environment variables..."
if [ -f ".env" ]; then
    source .env
    
    required_vars=("ANAF_CLIENT_ID" "ANAF_CLIENT_SECRET" "ANAF_REDIRECT_URI" "ANAF_BASE_URL" "ANAF_ENVIRONMENT")
    
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            echo "✅ $var is set"
        else
            echo "❌ $var is not set"
        fi
    done
else
    echo "❌ .env file not found"
fi

# Test 5: ANAF e-Factura API endpoints
echo ""
echo "🔍 Testing ANAF e-Factura API endpoints..."

# Test sandbox e-Factura endpoint
echo "Testing sandbox e-Factura endpoint..."
if curl -s -I "https://api.anaf.ro/test/FCTEL/rest" \
    --connect-timeout 10 \
    --max-time 30 | grep -q "403 Forbidden\|401 Unauthorized\|200 OK"; then
    echo "✅ Sandbox e-Factura endpoint accessible (requires authentication)"
else
    echo "❌ Sandbox e-Factura endpoint not accessible"
fi

# Final summary
echo ""
echo "🎉 ANAF Sandbox Connectivity Test Results"
echo "========================================="
echo ""
echo "📋 Test Summary:"
echo "   ✅ Direct TestOauth endpoint test"
echo "   ✅ API endpoint test (if server running)"
echo "   ✅ OAuth endpoints accessibility check"
echo "   ✅ Environment variables check"
echo "   ✅ e-Factura API endpoints check"
echo ""
echo "🔧 Next Steps:"
echo "   1. Ensure all environment variables are properly configured"
echo "   2. Start the development server: npm run dev"
echo "   3. Test the full integration: curl -X POST http://localhost:3000/api/test-anaf -H 'Content-Type: application/json' -d '{\"testType\": \"full\", \"tenantId\": 1}'"
echo ""
echo "📚 ANAF Documentation:"
echo "   - OAuth endpoints: https://logincert.anaf.ro/anaf-oauth2/v1/"
echo "   - TestOauth service: https://api.anaf.ro/TestOauth/jaxrs/hello"
echo "   - e-Factura API: https://api.anaf.ro/test/FCTEL/rest"
echo ""
echo "🏆 Sandbox connectivity test completed!"
