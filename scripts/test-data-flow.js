const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testDataFlow() {
  try {
    console.log('🔄 Testing data flow from database to widgets...\n');

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

    // Transform data for chart widgets
    console.log('📈 Chart Data Transformation:');
    const chartData = table.rows.map(row => {
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

    // Transform data for table widgets
    console.log('\n📋 Table Data Transformation:');
    const tableData = table.rows.map(row => {
      const rowData = {};
      row.cells.forEach(cell => {
        rowData[cell.column.name] = cell.value;
      });
      return rowData;
    });

    console.log('   Sample table data:');
    tableData.slice(0, 2).forEach((row, i) => {
      console.log(`     Row ${i + 1}:`, row);
    });

    // Transform data for KPI widgets
    console.log('\n📊 KPI Data Transformation:');
    const prices = table.rows.map(row => {
      const priceCell = row.cells.find(cell => cell.column.name === 'price');
      return priceCell ? parseFloat(priceCell.value) || 0 : 0;
    });

    const totalValue = prices.reduce((sum, price) => sum + price, 0);
    const averagePrice = totalValue / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    console.log(`   Total Value: $${totalValue.toFixed(2)}`);
    console.log(`   Average Price: $${averagePrice.toFixed(2)}`);
    console.log(`   Max Price: $${maxPrice.toFixed(2)}`);
    console.log(`   Min Price: $${minPrice.toFixed(2)}`);

    // Test API simulation
    console.log('\n🌐 API Simulation:');
    console.log('   GET /api/tenants/1/databases/1/tables/1/rows');
    console.log('   Response structure:');
    console.log('   {');
    console.log('     "success": true,');
    console.log('     "data": {');
    console.log('       "rows": [');
    console.log('         {');
    console.log('           "id": 1,');
    console.log('           "cells": [');
    console.log('             { "column": { "name": "name" }, "value": "Laptop" },');
    console.log('             { "column": { "name": "price" }, "value": "999.99" }');
    console.log('           ]');
    console.log('         }');
    console.log('       ]');
    console.log('     }');
    console.log('   }');

    console.log('\n✅ Data flow test completed successfully!');
    console.log('   - Database has data ✓');
    console.log('   - Data can be transformed for charts ✓');
    console.log('   - Data can be transformed for tables ✓');
    console.log('   - Data can be transformed for KPIs ✓');

  } catch (error) {
    console.error('❌ Error testing data flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDataFlow();
