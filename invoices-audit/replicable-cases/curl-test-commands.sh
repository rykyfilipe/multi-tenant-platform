#!/bin/bash

# Replicable Test Cases: API Endpoint Testing
# This script provides curl commands to test invoice API endpoints

set -e

# Configuration
BASE_URL="http://localhost:3000"
TENANT_ID="1"
DATABASE_ID="1"
USER_ID="1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Invoice API Test Commands${NC}"
echo "=========================="
echo ""

# Test 1: Create Invoice with Valid Data
echo -e "${GREEN}Test 1: Create Invoice with Valid Data${NC}"
echo "curl -X POST ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-user-id: ${USER_ID}' \\"
echo "  -d '{"
echo "    \"customer_id\": 1,"
echo "    \"products\": ["
echo "      {"
echo "        \"product_ref_id\": 1,"
echo "        \"quantity\": 2,"
echo "        \"price\": 100.50"
echo "      }"
echo "    ],"
echo "    \"additional_data\": {"
echo "      \"notes\": \"Test invoice\""
echo "    }"
echo "  }'"
echo ""

# Test 2: Create Invoice with Invalid Data (Missing Required Fields)
echo -e "${RED}Test 2: Create Invoice with Invalid Data${NC}"
echo "curl -X POST ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-user-id: ${USER_ID}' \\"
echo "  -d '{"
echo "    \"products\": ["
echo "      {"
echo "        \"quantity\": 2"
echo "        // Missing product_ref_id and price"
echo "      }"
echo "    ]"
echo "  }'"
echo ""

# Test 3: Create Invoice with Negative Values
echo -e "${RED}Test 3: Create Invoice with Negative Values${NC}"
echo "curl -X POST ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-user-id: ${USER_ID}' \\"
echo "  -d '{"
echo "    \"customer_id\": 1,"
echo "    \"products\": ["
echo "      {"
echo "        \"product_ref_id\": 1,"
echo "        \"quantity\": -1,"
echo "        \"price\": -100"
echo "      }"
echo "    ]"
echo "  }'"
echo ""

# Test 4: Create Invoice with Large Numbers (Precision Test)
echo -e "${YELLOW}Test 4: Create Invoice with Large Numbers${NC}"
echo "curl -X POST ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-user-id: ${USER_ID}' \\"
echo "  -d '{"
echo "    \"customer_id\": 1,"
echo "    \"products\": ["
echo "      {"
echo "        \"product_ref_id\": 1,"
echo "        \"quantity\": 1000000,"
echo "        \"price\": 0.01"
echo "      }"
echo "    ]"
echo "  }'"
echo ""

# Test 5: Create Invoice with Decimal Precision Issues
echo -e "${YELLOW}Test 5: Create Invoice with Decimal Precision Issues${NC}"
echo "curl -X POST ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-user-id: ${USER_ID}' \\"
echo "  -d '{"
echo "    \"customer_id\": 1,"
echo "    \"products\": ["
echo "      {"
echo "        \"product_ref_id\": 1,"
echo "        \"quantity\": 1,"
echo "        \"price\": 100.125"
echo "      }"
echo "    ]"
echo "  }'"
echo ""

# Test 6: Concurrent Invoice Creation (Race Condition Test)
echo -e "${RED}Test 6: Concurrent Invoice Creation (Race Condition)${NC}"
echo "# Run this in multiple terminals simultaneously:"
echo "for i in {1..5}; do"
echo "  curl -X POST ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'x-user-id: ${USER_ID}' \\"
echo "    -d '{"
echo "      \"customer_id\": 1,"
echo "      \"products\": ["
echo "        {"
echo "          \"product_ref_id\": 1,"
echo "          \"quantity\": 1,"
echo "          \"price\": 100"
echo "        }"
echo "      ]"
echo "    }' &"
echo "done"
echo "wait"
echo ""

# Test 7: Get Invoice by ID
echo -e "${GREEN}Test 7: Get Invoice by ID${NC}"
echo "curl -X GET ${BASE_URL}/api/tenants/${TENANT_ID}/invoices/INVOICE_ID \\"
echo "  -H 'x-user-id: ${USER_ID}'"
echo ""

# Test 8: List Invoices
echo -e "${GREEN}Test 8: List Invoices${NC}"
echo "curl -X GET ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "  -H 'x-user-id: ${USER_ID}'"
echo ""

# Test 9: Update Invoice
echo -e "${GREEN}Test 9: Update Invoice${NC}"
echo "curl -X PUT ${BASE_URL}/api/tenants/${TENANT_ID}/invoices/INVOICE_ID \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-user-id: ${USER_ID}' \\"
echo "  -d '{"
echo "    \"status\": \"PAID\","
echo "    \"additional_data\": {"
echo "      \"payment_date\": \"2025-01-01\""
echo "    }"
echo "  }'"
echo ""

# Test 10: Delete Invoice
echo -e "${RED}Test 10: Delete Invoice${NC}"
echo "curl -X DELETE ${BASE_URL}/api/tenants/${TENANT_ID}/invoices/INVOICE_ID \\"
echo "  -H 'x-user-id: ${USER_ID}'"
echo ""

# Test 11: Generate PDF
echo -e "${GREEN}Test 11: Generate PDF${NC}"
echo "curl -X POST ${BASE_URL}/api/tenants/${TENANT_ID}/invoices/INVOICE_ID/pdf \\"
echo "  -H 'x-user-id: ${USER_ID}' \\"
echo "  --output invoice.pdf"
echo ""

# Test 12: Preview Invoice
echo -e "${GREEN}Test 12: Preview Invoice${NC}"
echo "curl -X GET ${BASE_URL}/api/tenants/${TENANT_ID}/invoices/INVOICE_ID/preview \\"
echo "  -H 'x-user-id: ${USER_ID}'"
echo ""

# Test 13: Authorization Test (Wrong User)
echo -e "${RED}Test 13: Authorization Test (Wrong User)${NC}"
echo "curl -X GET ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "  -H 'x-user-id: 999'"
echo ""

# Test 14: Authorization Test (Wrong Tenant)
echo -e "${RED}Test 14: Authorization Test (Wrong Tenant)${NC}"
echo "curl -X GET ${BASE_URL}/api/tenants/999/invoices \\"
echo "  -H 'x-user-id: ${USER_ID}'"
echo ""

# Test 15: SQL Injection Test
echo -e "${RED}Test 15: SQL Injection Test${NC}"
echo "curl -X POST ${BASE_URL}/api/tenants/${TENANT_ID}/invoices \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-user-id: ${USER_ID}' \\"
echo "  -d '{"
echo "    \"customer_id\": 1,"
echo "    \"products\": [],"
echo "    \"additional_data\": {"
echo "      \"notes\": \"'; DROP TABLE invoices; --\""
echo "    }"
echo "  }'"
echo ""

echo -e "${YELLOW}Usage Instructions:${NC}"
echo "1. Start the development server: npm run dev"
echo "2. Ensure you have test data in your database"
echo "3. Replace INVOICE_ID with actual invoice IDs from your database"
echo "4. Run these commands to test different scenarios"
echo "5. Check the responses for proper error handling and data validation"
echo ""

echo -e "${YELLOW}Expected Results:${NC}"
echo "- Tests 1, 7, 8, 9, 11, 12: Should return 200 OK with valid data"
echo "- Tests 2, 3, 13, 14, 15: Should return 400/403/404 errors"
echo "- Tests 4, 5: Should handle precision correctly"
echo "- Test 6: May reveal race conditions in invoice numbering"
echo ""

echo -e "${YELLOW}Automated Testing:${NC}"
echo "# Save this as test-invoice-api.sh and run:"
echo "chmod +x test-invoice-api.sh"
echo "./test-invoice-api.sh"
echo ""

# Function to run all tests
cat << 'EOF'

# Automated test runner function
run_invoice_tests() {
    local base_url="$1"
    local tenant_id="$2"
    local user_id="$3"
    
    echo "Running invoice API tests..."
    
    # Test 1: Valid invoice creation
    echo "Test 1: Creating valid invoice..."
    local response=$(curl -s -w "%{http_code}" -X POST "${base_url}/api/tenants/${tenant_id}/invoices" \
        -H 'Content-Type: application/json' \
        -H "x-user-id: ${user_id}" \
        -d '{
            "customer_id": 1,
            "products": [
                {
                    "product_ref_id": 1,
                    "quantity": 2,
                    "price": 100.50
                }
            ]
        }')
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "201" ]; then
        echo "✅ Test 1 passed: Invoice created successfully"
        local invoice_id=$(echo "$body" | jq -r '.id')
        echo "Invoice ID: $invoice_id"
    else
        echo "❌ Test 1 failed: HTTP $http_code"
        echo "Response: $body"
    fi
    
    # Test 2: Invalid data
    echo "Test 2: Testing invalid data..."
    local response2=$(curl -s -w "%{http_code}" -X POST "${base_url}/api/tenants/${tenant_id}/invoices" \
        -H 'Content-Type: application/json' \
        -H "x-user-id: ${user_id}" \
        -d '{
            "products": [
                {
                    "quantity": 2
                }
            ]
        }')
    
    local http_code2="${response2: -3}"
    
    if [ "$http_code2" = "400" ]; then
        echo "✅ Test 2 passed: Invalid data rejected"
    else
        echo "❌ Test 2 failed: Expected 400, got $http_code2"
    fi
    
    # Test 3: Authorization
    echo "Test 3: Testing authorization..."
    local response3=$(curl -s -w "%{http_code}" -X GET "${base_url}/api/tenants/${tenant_id}/invoices" \
        -H "x-user-id: 999")
    
    local http_code3="${response3: -3}"
    
    if [ "$http_code3" = "403" ]; then
        echo "✅ Test 3 passed: Authorization working"
    else
        echo "❌ Test 3 failed: Expected 403, got $http_code3"
    fi
    
    echo "Tests completed!"
}

# Usage: run_invoice_tests "http://localhost:3000" "1" "1"
EOF
