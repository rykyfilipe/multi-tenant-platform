#!/bin/bash

# Test script for ANAF e-Factura integration
# This script helps test the ANAF integration locally with ngrok

echo "🧪 Testing ANAF e-Factura Integration..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from env.example"
    exit 1
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

if ! grep -q "ANAF_CLIENT_ID" .env || grep -q "your-anaf-client-id" .env; then
    echo "❌ ANAF_CLIENT_ID not configured in .env"
    echo "   Please set your ANAF client ID in .env file"
    exit 1
fi

if ! grep -q "ANAF_CLIENT_SECRET" .env || grep -q "your-anaf-client-secret" .env; then
    echo "❌ ANAF_CLIENT_SECRET not configured in .env"
    echo "   Please set your ANAF client secret in .env file"
    exit 1
fi

if ! grep -q "ANAF_REDIRECT_URI" .env || grep -q "your-ngrok-url" .env; then
    echo "❌ ANAF_REDIRECT_URI not configured in .env"
    echo "   Please run ./scripts/setup-ngrok-anaf.sh first"
    exit 1
fi

echo "✅ Environment variables configured"

# Check if ngrok is running
if ! pgrep -f "ngrok http 3000" > /dev/null; then
    echo "⚠️  ngrok is not running. Starting ngrok..."
    ./scripts/setup-ngrok-anaf.sh
    sleep 5
fi

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
    echo "❌ Could not get ngrok URL. Please check ngrok status."
    exit 1
fi

echo "🌐 ngrok URL: $NGROK_URL"

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Next.js development server is not running."
    echo "   Please start it with: npm run dev"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Next.js development server is running"

# Test ANAF OAuth URL generation
echo "🔗 Testing ANAF OAuth URL generation..."

# Create a simple test script
cat > test-anaf-oauth.js << 'EOF'
const { ANAFOAuthService } = require('./src/lib/anaf/oauth-service.ts');

async function testOAuthURL() {
    try {
        const authUrl = await ANAFOAuthService.getAuthUrl(1, 1);
        console.log('✅ OAuth URL generated successfully');
        console.log('   URL:', authUrl);
        return true;
    } catch (error) {
        console.error('❌ OAuth URL generation failed:', error.message);
        return false;
    }
}

testOAuthURL();
EOF

# Run the test
if node test-anaf-oauth.js; then
    echo "✅ ANAF OAuth URL generation test passed"
else
    echo "❌ ANAF OAuth URL generation test failed"
    rm test-anaf-oauth.js
    exit 1
fi

# Clean up test file
rm test-anaf-oauth.js

# Test API endpoints
echo "🌐 Testing API endpoints..."

# Test OAuth callback endpoint
echo "   Testing OAuth callback endpoint..."
if curl -s "$NGROK_URL/api/anaf/oauth/callback" > /dev/null; then
    echo "   ✅ OAuth callback endpoint accessible"
else
    echo "   ❌ OAuth callback endpoint not accessible"
fi

# Test send invoice endpoint (should return 401 without auth)
echo "   Testing send invoice endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$NGROK_URL/api/anaf/send-invoice" \
    -H "Content-Type: application/json" \
    -d '{"invoiceId": 1}')

if [ "$RESPONSE" = "401" ]; then
    echo "   ✅ Send invoice endpoint protected (401 Unauthorized)"
else
    echo "   ❌ Send invoice endpoint not properly protected (got $RESPONSE)"
fi

echo ""
echo "🎉 ANAF Integration Test Complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure your ANAF OAuth app with this redirect URI:"
echo "      $NGROK_URL/api/anaf/oauth/callback"
echo "   2. Test the integration in your browser:"
echo "      $NGROK_URL"
echo "   3. Check ngrok dashboard for requests:"
echo "      http://localhost:4040"
echo ""
echo "🔧 To stop ngrok: ./scripts/stop-ngrok.sh"
