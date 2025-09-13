/**
 * End-to-end test for greater_than operator via API
 */

// Using built-in fetch (Node.js 18+)

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 1;
const DATABASE_ID = 1;
const PRODUCTS_TABLE_ID = 14; // From our previous test
const PRICE_COLUMN_ID = 136; // From our previous test

async function testGreaterThanAPI() {
  try {
    console.log('🚀 Testing greater_than operator via API...\n');
    
    // Step 1: Test without authentication first
    console.log('Step 1: Testing without authentication...');
    try {
      const response = await fetch(`${BASE_URL}/api/tenants/${TENANT_ID}/databases/${DATABASE_ID}/tables/${PRODUCTS_TABLE_ID}/rows`);
      console.log('Response status:', response.status);
      if (response.status === 401) {
        console.log('✅ Authentication required (expected)');
      } else {
        console.log('⚠️  Unexpected response:', await response.text());
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
    
    // Step 2: Test with a simple filter
    console.log('\nStep 2: Testing with greater_than filter...');
    
    const filter = [{
      id: 'test-greater-than',
      columnId: PRICE_COLUMN_ID,
      columnName: 'price',
      columnType: 'number',
      operator: 'greater_than',
      value: 50
    }];
    
    const url = new URL(`${BASE_URL}/api/tenants/${TENANT_ID}/databases/${DATABASE_ID}/tables/${PRODUCTS_TABLE_ID}/rows`);
    url.searchParams.set('filters', JSON.stringify(filter));
    
    console.log('🔍 Request URL:', url.toString());
    console.log('📋 Filter being sent:', JSON.stringify(filter, null, 2));
    
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Cookie': 'your-session-cookie-here', // You'll need to replace this with actual session cookie
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:', JSON.stringify(data, null, 2));
        
        if (data.data?.rows) {
          console.log(`📊 Found ${data.data.rows.length} rows`);
          
          data.data.rows.forEach((row, index) => {
            console.log(`  Row ${index + 1}: ID ${row.id}`);
            if (row.cells) {
              const priceCell = row.cells.find(cell => cell.columnId === PRICE_COLUMN_ID);
              if (priceCell) {
                console.log(`    Price: ${priceCell.value}`);
              }
            }
          });
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', errorText);
      }
    } catch (error) {
      console.log('❌ Request error:', error.message);
    }
    
    // Step 3: Test different filter values
    console.log('\nStep 3: Testing with different filter values...');
    
    const testValues = [0, 10, 25, 50, 100];
    
    for (const testValue of testValues) {
      console.log(`\n🔍 Testing price > ${testValue}...`);
      
      const testFilter = [{
        id: `test-greater-than-${testValue}`,
        columnId: PRICE_COLUMN_ID,
        columnName: 'price',
        columnType: 'number',
        operator: 'greater_than',
        value: testValue
      }];
      
      const testUrl = new URL(`${BASE_URL}/api/tenants/${TENANT_ID}/databases/${DATABASE_ID}/tables/${PRODUCTS_TABLE_ID}/rows`);
      testUrl.searchParams.set('filters', JSON.stringify(testFilter));
      
      try {
        const response = await fetch(testUrl.toString(), {
          headers: {
            'Cookie': 'your-session-cookie-here',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const rowCount = data.data?.rows?.length || 0;
          console.log(`  Results: ${rowCount} rows`);
          
          if (rowCount > 0) {
            data.data.rows.forEach((row, index) => {
              if (row.cells) {
                const priceCell = row.cells.find(cell => cell.columnId === PRICE_COLUMN_ID);
                if (priceCell) {
                  console.log(`    Row ${index + 1}: Price ${priceCell.value}`);
                }
              }
            });
          }
        } else {
          console.log(`  Error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`  Request error: ${error.message}`);
      }
    }
    
    console.log('\n✅ API test completed!');
    console.log('\n📝 To run this test with real authentication:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Login to your application in a browser');
    console.log('3. Copy the session cookie from browser dev tools');
    console.log('4. Replace "your-session-cookie-here" in this script');
    console.log('5. Run: node test-greater-than-api.js');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testGreaterThanAPI();
