/**
 * Test script for greater_than operator using Prisma directly
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testGreaterThanWithRealData() {
  try {
    console.log('🚀 Testing greater_than operator with real data...\n');
    
    // Step 1: Find Products table
    console.log('Step 1: Finding Products table...');
    const productsTable = await prisma.table.findFirst({
      where: {
        name: {
          contains: 'Product',
          mode: 'insensitive'
        }
      },
      include: {
        columns: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!productsTable) {
      throw new Error('Products table not found');
    }
    
    console.log('✅ Found Products table:', {
      id: productsTable.id,
      name: productsTable.name,
      columns: productsTable.columns.map(c => ({ id: c.id, name: c.name, type: c.type }))
    });
    
    // Step 2: Find price column
    const priceColumn = productsTable.columns.find(c => 
      c.name.toLowerCase().includes('price') || 
      c.type.toLowerCase().includes('decimal') ||
      c.type.toLowerCase().includes('number')
    );
    
    if (!priceColumn) {
      console.log('⚠️  No price column found. Available columns:', productsTable.columns.map(c => c.name));
      
      // Try to find any numeric column
      const numericColumn = productsTable.columns.find(c => 
        c.type.toLowerCase().includes('decimal') ||
        c.type.toLowerCase().includes('number') ||
        c.type.toLowerCase().includes('int')
      );
      
      if (numericColumn) {
        console.log('📊 Using numeric column instead:', numericColumn.name);
        priceColumn = numericColumn;
      } else {
        throw new Error('No numeric column found for testing');
      }
    } else {
      console.log('💰 Found price column:', priceColumn);
    }
    
    // Step 3: Get all rows to see what data we have
    console.log('\nStep 2: Getting all rows to see available data...');
    const allRows = await prisma.row.findMany({
      where: { tableId: productsTable.id },
      include: {
        cells: {
          where: { columnId: priceColumn.id }
        }
      },
      take: 10
    });
    
    console.log(`📊 Found ${allRows.length} rows (showing first 10)`);
    
    if (allRows.length > 0) {
      console.log('📋 Sample price data:');
      allRows.forEach((row, index) => {
        if (row.cells.length > 0) {
          console.log(`  Row ${index + 1}: ${priceColumn.name} = ${row.cells[0].value}`);
        }
      });
    }
    
    // Step 4: Test the filtering logic manually
    console.log('\nStep 3: Testing filtering logic...');
    
    // Get all cells for the price column
    const allPriceCells = await prisma.cell.findMany({
      where: {
        columnId: priceColumn.id,
        row: { tableId: productsTable.id }
      },
      include: {
        row: true
      }
    });
    
    console.log(`📊 Found ${allPriceCells.length} price cells`);
    
    // Test different greater_than values
    const testValues = [0, 10, 50, 100, 1000];
    
    for (const testValue of testValues) {
      console.log(`\n🔍 Testing ${priceColumn.name} > ${testValue}...`);
      
      // Filter cells where value > testValue
      const filteredCells = allPriceCells.filter(cell => {
        const numericValue = parseFloat(cell.value);
        return !isNaN(numericValue) && numericValue > testValue;
      });
      
      console.log(`  Results: ${filteredCells.length} rows`);
      
      if (filteredCells.length > 0) {
        console.log('  Sample values:');
        filteredCells.slice(0, 5).forEach((cell, index) => {
          console.log(`    Row ${index + 1}: ${cell.value}`);
        });
      }
    }
    
    // Step 5: Test the actual API filtering logic
    console.log('\nStep 4: Testing API filtering logic...');
    
    // Test the filter that would be sent from frontend
    const testFilter = [{
      id: 'test-greater-than',
      columnId: priceColumn.id,
      columnName: priceColumn.name,
      columnType: 'number',
      operator: 'greater_than',
      value: 50
    }];
    
    console.log('🔍 Filter that would be sent from frontend:', JSON.stringify(testFilter, null, 2));
    
    // Simulate the SQL query that should be generated
    const expectedSql = `SELECT * FROM "Row" WHERE "tableId" = $1 AND EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $2
      AND (c."value"::text)::numeric > $3
    )`;
    
    console.log('📝 Expected SQL query:', expectedSql);
    console.log('📊 Expected parameters:', [productsTable.id, priceColumn.id, 50]);
    
    // Execute the query directly - values are stored as JSON strings
    const result = await prisma.$queryRaw`SELECT * FROM "Row" WHERE "tableId" = ${productsTable.id} AND EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = ${priceColumn.id}
      AND (c."value"#>>'{}')::numeric > ${50}
    )`;
    
    console.log(`📊 SQL Query results: ${result.length} rows`);
    
    if (result.length > 0) {
      console.log('✅ SQL Query sample results:');
      result.slice(0, 5).forEach((row, index) => {
        console.log(`  Row ${index + 1}: ID ${row.id}`);
      });
    }
    
    console.log('\n✅ Greater than operator test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testGreaterThanWithRealData().catch(console.error);
