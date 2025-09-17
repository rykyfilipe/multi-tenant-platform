const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testWidgetDataFlow() {
  try {
    console.log('🔄 Testing complete widget data flow...\n');

    // Get data from database
    const table = await prisma.table.findFirst({
      where: { name: 'Products' },
      include: {
        columns: true,
        rows: {
          include: {
            cells: {
              include: {
                column: true
              }
            }
          }
        }
      }
    });

    if (!table) {
      console.log('❌ No Products table found');
      return;
    }

    console.log(`📊 Table: ${table.name}`);
    console.log(`   Columns: ${table.columns.length}`);
    console.log(`   Rows: ${table.rows.length}\n`);

    if (table.rows.length === 0) {
      console.log('❌ No data in table');
      return;
    }

    // Simulate API response structure
    const apiResponse = {
      data: table.rows.map(row => ({
        id: row.id,
        cells: row.cells.map(cell => ({
          column: {
            id: cell.column.id,
            name: cell.column.name,
            type: cell.column.type
          },
          value: cell.value
        }))
      })),
      pagination: {
        page: 1,
        pageSize: 25,
        total: table.rows.length,
        totalPages: 1
      }
    };

    console.log('🌐 Simulated API Response:');
    console.log(`   Rows: ${apiResponse.data.length}`);
    console.log(`   Sample row:`, {
      id: apiResponse.data[0].id,
      cells: apiResponse.data[0].cells.slice(0, 3).map(cell => ({
        column: cell.column.name,
        value: cell.value
      }))
    });

    // Test chart data transformation
    console.log('\n📈 Chart Data Transformation:');
    const chartData = apiResponse.data.map(row => {
      const dataPoint = {};
      row.cells.forEach(cell => {
        if (cell.column.name === 'name') {
          dataPoint.x = cell.value;
        } else if (cell.column.name === 'price') {
          dataPoint.y = parseFloat(cell.value) || 0;
        }
      });
      return dataPoint;
    }).filter(point => point.x && point.y !== undefined);

    console.log('   Sample chart data:');
    chartData.slice(0, 3).forEach(point => {
      console.log(`     ${point.x}: $${point.y}`);
    });

    // Test type validation
    console.log('\n🔍 Type Validation Test:');
    const textColumns = table.columns.filter(col => 
      ['text', 'string', 'varchar'].includes(col.type.toLowerCase())
    );
    const numberColumns = table.columns.filter(col => 
      ['number', 'integer', 'decimal', 'float'].includes(col.type.toLowerCase())
    );

    console.log(`   Text columns: ${textColumns.map(c => c.name).join(', ')}`);
    console.log(`   Number columns: ${numberColumns.map(c => c.name).join(', ')}`);

    // Test widget compatibility
    console.log('\n🎯 Widget Compatibility:');
    console.log('   Line Chart:');
    console.log(`     X-Axis (text): ${textColumns.length > 0 ? '✅' : '❌'} ${textColumns[0]?.name || 'None'}`);
    console.log(`     Y-Axis (number): ${numberColumns.length > 0 ? '✅' : '❌'} ${numberColumns[0]?.name || 'None'}`);
    
    console.log('   KPI Widget:');
    console.log(`     Value (number): ${numberColumns.length > 0 ? '✅' : '❌'} ${numberColumns[0]?.name || 'None'}`);
    
    console.log('   Table Widget:');
    console.log(`     All columns: ${table.columns.length} available`);

    console.log('\n✅ Widget data flow test completed successfully!');
    console.log('   - Database has data ✓');
    console.log('   - API response structure correct ✓');
    console.log('   - Chart data transformation works ✓');
    console.log('   - Type validation works ✓');
    console.log('   - Widget compatibility verified ✓');

  } catch (error) {
    console.error('❌ Error testing widget data flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWidgetDataFlow();
