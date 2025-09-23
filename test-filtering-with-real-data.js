const { PrismaClient } = require('./src/generated/prisma');

async function testFilteringSystem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing filtering system with real data...\n');
    
    // 1. Check what data we have
    const tables = await prisma.table.findMany({
      include: {
        columns: true,
        rows: {
          take: 5,
          include: {
            cells: {
              include: { column: true }
            }
          }
        }
      }
    });
    
    console.log(`📊 Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${table.name} (${table.rows.length} rows, ${table.columns.length} columns)`);
      
      // Show sample data
      if (table.rows.length > 0) {
        console.log(`    Sample data from first row:`);
        table.rows[0].cells.forEach(cell => {
          const value = cell.stringValue || cell.numberValue || cell.dateValue || cell.booleanValue;
          if (value !== null) {
            console.log(`      ${cell.column.name} (${cell.column.type}): ${value}`);
          }
        });
      }
    });
    
    if (tables.length === 0) {
      console.log('❌ No tables found!');
      return;
    }
    
    const testTable = tables[0];
    console.log(`\n🎯 Testing with table: ${testTable.name}`);
    
    // 2. Test API endpoint with different filters
    const testFilters = [
      // String filter
      {
        columnId: testTable.columns.find(c => c.type === 'text')?.id,
        columnName: testTable.columns.find(c => c.type === 'text')?.name,
        columnType: 'text',
        operator: 'contains',
        value: 'test'
      },
      // Number filter  
      {
        columnId: testTable.columns.find(c => c.type === 'number')?.id,
        columnName: testTable.columns.find(c => c.type === 'number')?.name,
        columnType: 'number',
        operator: 'greater_than',
        value: 10
      }
    ].filter(f => f.columnId); // Only include filters for columns that exist
    
    console.log('\n🧪 Testing API endpoint with filters:');
    
    for (const filter of testFilters) {
      console.log(`\n  Testing filter: ${filter.columnName} ${filter.operator} ${filter.value}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/tenants/1/databases/1/tables/${testTable.id}/rows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token' // You might need to adjust this
          },
          body: JSON.stringify({
            filters: [filter],
            page: 1,
            limit: 10
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`    ✅ Success: Found ${data.data?.length || 0} results`);
          if (data.data && data.data.length > 0) {
            console.log(`    Sample result:`, Object.keys(data.data[0]).slice(0, 3));
          }
        } else {
          console.log(`    ❌ Error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`    ❌ Network error: ${error.message}`);
      }
    }
    
    // 3. Test without filters (get all data)
    console.log('\n🧪 Testing API endpoint without filters:');
    try {
      const response = await fetch(`http://localhost:3000/api/tenants/1/databases/1/tables/${testTable.id}/rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          page: 1,
          limit: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Success: Found ${data.data?.length || 0} results`);
        console.log(`  Pagination: ${JSON.stringify(data.pagination)}`);
      } else {
        console.log(`  ❌ Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`  ❌ Network error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFilteringSystem();
