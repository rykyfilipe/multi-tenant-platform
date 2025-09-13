/**
 * Test script for greater_than operator with real data from Products table
 */

const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 1; // Adjust based on your test data
const DATABASE_ID = 1; // Adjust based on your test data

// You'll need to get these from your database
const PRODUCTS_TABLE_ID = null; // We'll find this dynamically
const PRICE_COLUMN_ID = null; // We'll find this dynamically

async function getAuthToken() {
  // This is a placeholder - you'll need to implement proper authentication
  // For now, we'll assume you have a valid session cookie or JWT token
  return 'your-auth-token-here';
}

async function findProductsTable() {
  try {
    const response = await fetch(`${BASE_URL}/api/tenants/${TENANT_ID}/databases/${DATABASE_ID}/tables`, {
      headers: {
        'Cookie': 'your-session-cookie-here', // Replace with actual session cookie
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📋 Available tables:', data.data?.map(t => ({ id: t.id, name: t.name })));
    
    const productsTable = data.data?.find(t => t.name.toLowerCase().includes('product'));
    if (!productsTable) {
      throw new Error('Products table not found');
    }
    
    console.log('✅ Found Products table:', productsTable);
    return productsTable;
  } catch (error) {
    console.error('❌ Error finding Products table:', error);
    throw error;
  }
}

async function getTableColumns(tableId) {
  try {
    const response = await fetch(`${BASE_URL}/api/tenants/${TENANT_ID}/databases/${DATABASE_ID}/tables/${tableId}`, {
      headers: {
        'Cookie': 'your-session-cookie-here', // Replace with actual session cookie
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch table: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Table columns:', data.data?.columns?.map(c => ({ 
      id: c.id, 
      name: c.name, 
      type: c.type 
    })));
    
    return data.data?.columns || [];
  } catch (error) {
    console.error('❌ Error fetching table columns:', error);
    throw error;
  }
}

async function getTableRows(tableId, filters = null) {
  try {
    const url = new URL(`${BASE_URL}/api/tenants/${TENANT_ID}/databases/${DATABASE_ID}/tables/${tableId}/rows`);
    
    if (filters) {
      url.searchParams.set('filters', JSON.stringify(filters));
    }
    
    console.log('🔍 Fetching rows with URL:', url.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'Cookie': 'your-session-cookie-here', // Replace with actual session cookie
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch rows: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    console.log('📦 Raw API response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching table rows:', error);
    throw error;
  }
}

async function testGreaterThanOperator() {
  try {
    console.log('🚀 Starting greater_than operator test...\n');
    
    // Step 1: Find Products table
    console.log('Step 1: Finding Products table...');
    const productsTable = await findProductsTable();
    const tableId = productsTable.id;
    
    // Step 2: Get table columns
    console.log('\nStep 2: Getting table columns...');
    const columns = await getTableColumns(tableId);
    
    // Find price column
    const priceColumn = columns.find(c => 
      c.name.toLowerCase().includes('price') || 
      c.type.toLowerCase().includes('decimal') ||
      c.type.toLowerCase().includes('number')
    );
    
    if (!priceColumn) {
      throw new Error('No price column found. Available columns: ' + columns.map(c => c.name).join(', '));
    }
    
    console.log('💰 Found price column:', priceColumn);
    
    // Step 3: Get all rows first to see what data we have
    console.log('\nStep 3: Getting all rows to see available data...');
    const allRows = await getTableRows(tableId);
    console.log(`📊 Found ${allRows.data?.rows?.length || 0} rows`);
    
    if (allRows.data?.rows?.length > 0) {
      console.log('📋 Sample row data:');
      const sampleRow = allRows.data.rows[0];
      if (sampleRow.cells) {
        sampleRow.cells.forEach(cell => {
          const column = columns.find(c => c.id === cell.columnId);
          console.log(`  ${column?.name || 'Unknown'}: ${cell.value} (type: ${column?.type})`);
        });
      }
    }
    
    // Step 4: Test greater_than filter
    console.log('\nStep 4: Testing greater_than filter...');
    
    // Create a filter for price > 50
    const greaterThanFilter = [{
      id: 'test-greater-than',
      columnId: priceColumn.id,
      columnName: priceColumn.name,
      columnType: 'number', // Map to our filter system type
      operator: 'greater_than',
      value: 50
    }];
    
    console.log('🔍 Filter being sent:', JSON.stringify(greaterThanFilter, null, 2));
    
    const filteredRows = await getTableRows(tableId, greaterThanFilter);
    console.log(`📊 Filtered results: ${filteredRows.data?.rows?.length || 0} rows`);
    
    if (filteredRows.data?.rows?.length > 0) {
      console.log('✅ Greater than filter results:');
      filteredRows.data.rows.forEach((row, index) => {
        console.log(`  Row ${index + 1}:`);
        if (row.cells) {
          row.cells.forEach(cell => {
            const column = columns.find(c => c.id === cell.columnId);
            if (column?.name.toLowerCase().includes('price')) {
              console.log(`    ${column.name}: ${cell.value}`);
            }
          });
        }
      });
    } else {
      console.log('⚠️  No rows found with price > 50');
    }
    
    // Step 5: Test with different values
    console.log('\nStep 5: Testing with different values...');
    
    const testValues = [10, 25, 100, 1000];
    
    for (const testValue of testValues) {
      console.log(`\n🔍 Testing price > ${testValue}...`);
      
      const testFilter = [{
        id: `test-greater-than-${testValue}`,
        columnId: priceColumn.id,
        columnName: priceColumn.name,
        columnType: 'number',
        operator: 'greater_than',
        value: testValue
      }];
      
      const testResults = await getTableRows(tableId, testFilter);
      console.log(`  Results: ${testResults.data?.rows?.length || 0} rows`);
      
      if (testResults.data?.rows?.length > 0) {
        testResults.data.rows.forEach((row, index) => {
          if (row.cells) {
            const priceCell = row.cells.find(cell => {
              const column = columns.find(c => c.id === cell.columnId);
              return column?.name.toLowerCase().includes('price');
            });
            if (priceCell) {
              console.log(`    Row ${index + 1} price: ${priceCell.value}`);
            }
          }
        });
      }
    }
    
    console.log('\n✅ Greater than operator test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testGreaterThanOperator();
