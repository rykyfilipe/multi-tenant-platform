// Using native fetch (Node.js 18+)

async function testFilteringAPI() {
  try {
    console.log('Testing filtering API...\n');
    
    // Test 1: Get all rows without filters
    console.log('1. Testing basic API call (no filters):');
    const response1 = await fetch('http://localhost:3000/api/tenants/1/databases/1/tables/1/rows?page=1&limit=5');
    const data1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    console.log(`Rows returned: ${data1.data?.length || 0}`);
    console.log(`Total rows: ${data1.pagination?.totalRows || 0}`);
    if (data1.data && data1.data.length > 0) {
      console.log(`First row: ${JSON.stringify(data1.data[0], null, 2)}`);
    }
    console.log('');
    
    // Test 2: Filter by category = 'Electronics'
    console.log('2. Testing filter by category = "Electronics":');
    const filters2 = [{
      id: 'test-1',
      columnId: 5, // category column
      columnName: 'category',
      columnType: 'text',
      operator: 'equals',
      value: 'Electronics'
    }];
    
    const params2 = new URLSearchParams();
    params2.set('page', '1');
    params2.set('limit', '10');
    params2.set('filters', JSON.stringify(filters2));
    
    const response2 = await fetch(`http://localhost:3000/api/tenants/1/databases/1/tables/1/rows?${params2.toString()}`);
    const data2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log(`Rows returned: ${data2.data?.length || 0}`);
    console.log(`Total rows: ${data2.pagination?.totalRows || 0}`);
    if (data2.data && data2.data.length > 0) {
      console.log(`First filtered row: ${JSON.stringify(data2.data[0], null, 2)}`);
    }
    console.log('');
    
    // Test 3: Filter by price > 1000
    console.log('3. Testing filter by price > 1000:');
    const filters3 = [{
      id: 'test-2',
      columnId: 3, // price column
      columnName: 'price',
      columnType: 'number',
      operator: 'greater_than',
      value: 1000
    }];
    
    const params3 = new URLSearchParams();
    params3.set('page', '1');
    params3.set('limit', '10');
    params3.set('filters', JSON.stringify(filters3));
    
    const response3 = await fetch(`http://localhost:3000/api/tenants/1/databases/1/tables/1/rows?${params3.toString()}`);
    const data3 = await response3.json();
    console.log(`Status: ${response3.status}`);
    console.log(`Rows returned: ${data3.data?.length || 0}`);
    console.log(`Total rows: ${data3.pagination?.totalRows || 0}`);
    if (data3.data && data3.data.length > 0) {
      console.log(`First filtered row: ${JSON.stringify(data3.data[0], null, 2)}`);
    }
    console.log('');
    
    // Test 4: Filter by brand contains 'Apple'
    console.log('4. Testing filter by brand contains "Apple":');
    const filters4 = [{
      id: 'test-3',
      columnId: 6, // brand column
      columnName: 'brand',
      columnType: 'text',
      operator: 'contains',
      value: 'Apple'
    }];
    
    const params4 = new URLSearchParams();
    params4.set('page', '1');
    params4.set('limit', '10');
    params4.set('filters', JSON.stringify(filters4));
    
    const response4 = await fetch(`http://localhost:3000/api/tenants/1/databases/1/tables/1/rows?${params4.toString()}`);
    const data4 = await response4.json();
    console.log(`Status: ${response4.status}`);
    console.log(`Rows returned: ${data4.data?.length || 0}`);
    console.log(`Total rows: ${data4.pagination?.totalRows || 0}`);
    if (data4.data && data4.data.length > 0) {
      console.log(`First filtered row: ${JSON.stringify(data4.data[0], null, 2)}`);
    }
    console.log('');
    
    // Test 5: Multiple filters (category = 'Electronics' AND price > 1000)
    console.log('5. Testing multiple filters (category = "Electronics" AND price > 1000):');
    const filters5 = [
      {
        id: 'test-4a',
        columnId: 5, // category column
        columnName: 'category',
        columnType: 'text',
        operator: 'equals',
        value: 'Electronics'
      },
      {
        id: 'test-4b',
        columnId: 3, // price column
        columnName: 'price',
        columnType: 'number',
        operator: 'greater_than',
        value: 1000
      }
    ];
    
    const params5 = new URLSearchParams();
    params5.set('page', '1');
    params5.set('limit', '10');
    params5.set('filters', JSON.stringify(filters5));
    
    const response5 = await fetch(`http://localhost:3000/api/tenants/1/databases/1/tables/1/rows?${params5.toString()}`);
    const data5 = await response5.json();
    console.log(`Status: ${response5.status}`);
    console.log(`Rows returned: ${data5.data?.length || 0}`);
    console.log(`Total rows: ${data5.pagination?.totalRows || 0}`);
    if (data5.data && data5.data.length > 0) {
      console.log(`First filtered row: ${JSON.stringify(data5.data[0], null, 2)}`);
    }
    console.log('');
    
    // Test 6: Global search
    console.log('6. Testing global search for "laptop":');
    const params6 = new URLSearchParams();
    params6.set('page', '1');
    params6.set('limit', '10');
    params6.set('search', 'laptop');
    
    const response6 = await fetch(`http://localhost:3000/api/tenants/1/databases/1/tables/1/rows?${params6.toString()}`);
    const data6 = await response6.json();
    console.log(`Status: ${response6.status}`);
    console.log(`Rows returned: ${data6.data?.length || 0}`);
    console.log(`Total rows: ${data6.pagination?.totalRows || 0}`);
    if (data6.data && data6.data.length > 0) {
      console.log(`First search result: ${JSON.stringify(data6.data[0], null, 2)}`);
    }
    console.log('');
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testFilteringAPI();
