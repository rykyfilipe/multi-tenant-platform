#!/bin/bash

echo "🔐 Testing ANAF OAuth 2.0 Flow"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check server status
echo -e "${BLUE}1. Checking server status...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Server is running on port 3000${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start it with: npm run dev${NC}"
    exit 1
fi

# Test 2: Check ANAF test page
echo -e "${BLUE}2. Testing ANAF test page accessibility...${NC}"
if curl -s http://localhost:3000/test/anaf | grep -q "ANAF e-Factura Test Suite"; then
    echo -e "${GREEN}✅ ANAF test page is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  ANAF test page might not be fully loaded (this is normal for client-side rendering)${NC}"
fi

# Test 3: Check ANAF auth URL generation
echo -e "${BLUE}3. Testing ANAF auth URL generation...${NC}"
AUTH_URL_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/anaf/auth-url)
HTTP_CODE="${AUTH_URL_RESPONSE: -3}"

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ ANAF auth-url endpoint returns 401 (expected without authentication)${NC}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ ANAF auth-url endpoint returns 200 (user is authenticated)${NC}"
    # Extract auth URL from response
    AUTH_URL=$(echo "${AUTH_URL_RESPONSE%???}" | grep -o '"authUrl":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$AUTH_URL" ]; then
        echo -e "${BLUE}   Generated auth URL: ${AUTH_URL}${NC}"
        echo -e "${YELLOW}   This URL should redirect to ANAF login page${NC}"
    fi
else
    echo -e "${RED}❌ ANAF auth-url endpoint returned $HTTP_CODE${NC}"
fi

# Test 4: Check ANAF status endpoint
echo -e "${BLUE}4. Testing ANAF status endpoint...${NC}"
STATUS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/anaf/status)
HTTP_CODE="${STATUS_RESPONSE: -3}"

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ ANAF status endpoint returns 401 (expected without authentication)${NC}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ ANAF status endpoint returns 200 (user is authenticated)${NC}"
    # Extract authentication status
    IS_AUTHENTICATED=$(echo "${STATUS_RESPONSE%???}" | grep -o '"isAuthenticated":[^,}]*' | cut -d':' -f2)
    if [ "$IS_AUTHENTICATED" = "true" ]; then
        echo -e "${GREEN}   User is authenticated with ANAF${NC}"
    else
        echo -e "${YELLOW}   User is not authenticated with ANAF${NC}"
    fi
else
    echo -e "${RED}❌ ANAF status endpoint returned $HTTP_CODE${NC}"
fi

# Test 5: Check environment variables
echo -e "${BLUE}5. Checking ANAF environment variables...${NC}"
if [ -f ".env" ]; then
    if grep -q "ANAF_CLIENT_ID" .env; then
        echo -e "${GREEN}✅ ANAF_CLIENT_ID is configured${NC}"
    else
        echo -e "${YELLOW}⚠️  ANAF_CLIENT_ID not found in .env${NC}"
    fi
    
    if grep -q "ANAF_CLIENT_SECRET" .env; then
        echo -e "${GREEN}✅ ANAF_CLIENT_SECRET is configured${NC}"
    else
        echo -e "${YELLOW}⚠️  ANAF_CLIENT_SECRET not found in .env${NC}"
    fi
    
    if grep -q "ANAF_REDIRECT_URI" .env; then
        echo -e "${GREEN}✅ ANAF_REDIRECT_URI is configured${NC}"
    else
        echo -e "${YELLOW}⚠️  ANAF_REDIRECT_URI not found in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found. Please copy from env.example${NC}"
fi

echo ""
echo -e "${BLUE}🎯 OAuth 2.0 Flow Summary:${NC}"
echo "1. User clicks 'Generate Authorization URL'"
echo "2. App generates URL with client_id and redirect_uri"
echo "3. User is redirected to: https://logincert.anaf.ro/anaf-oauth2/v1/authorize"
echo "4. User logs in on ANAF portal"
echo "5. ANAF redirects back with authorization_code"
echo "6. App exchanges code for access_token using client_secret"
echo "7. App stores tokens and user is authenticated"

echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "1. Open http://localhost:3000/test/anaf in your browser"
echo "2. Log in to your account"
echo "3. Click 'Generate Authorization URL'"
echo "4. Follow the OAuth flow"
echo "5. Check if invoice list shows ANAF action buttons"

echo ""
echo -e "${YELLOW}💡 If you see 'anaf.actions.not_authenticated':${NC}"
echo "1. Make sure you completed the OAuth flow"
echo "2. Check if tokens are stored in database"
echo "3. Verify ANAF status endpoint returns success"
