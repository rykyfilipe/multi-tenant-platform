/**
 * Test script for the enhanced filtering system
 * Validates all components and functionality
 */

import { FilterValidator } from '../lib/filter-validator';
import { PrismaFilterBuilder } from '../lib/prisma-filter-builder';
import { filterCache } from '../lib/filter-cache';
import { FilterConfig } from '../types/filtering-enhanced';

// Mock data for testing
const mockColumns = [
  { id: 1, name: 'Name', type: 'text' },
  { id: 2, name: 'Age', type: 'number' },
  { id: 3, name: 'Email', type: 'email' },
  { id: 4, name: 'Created Date', type: 'date' },
  { id: 5, name: 'Is Active', type: 'boolean' },
  { id: 6, name: 'User ID', type: 'reference' }
];

const mockFilters: FilterConfig[] = [
  {
    id: 'filter-1',
    columnId: 1,
    columnName: 'Name',
    columnType: 'text',
    operator: 'contains',
    value: 'John'
  },
  {
    id: 'filter-2',
    columnId: 2,
    columnName: 'Age',
    columnType: 'number',
    operator: 'between',
    value: 18,
    secondValue: 65
  },
  {
    id: 'filter-3',
    columnId: 4,
    columnName: 'Created Date',
    columnType: 'date',
    operator: 'this_month',
    value: null
  }
];

async function testFilterValidator() {
  console.log('🧪 Testing FilterValidator...');
  
  try {
    // Test valid filters
    const validResult = FilterValidator.validateFilters(mockFilters, mockColumns);
    console.log('✅ Valid filters test:', validResult.isValid ? 'PASSED' : 'FAILED');
    
    if (!validResult.isValid) {
      console.log('❌ Validation errors:', validResult.errors);
    }
    
    // Test invalid filters
    const invalidFilters: FilterConfig[] = [
      {
        id: 'invalid-1',
        columnId: 1,
        columnName: 'Name',
        columnType: 'text',
        operator: 'greater_than', // Invalid for text
        value: 'John'
      }
    ];
    
    const invalidResult = FilterValidator.validateFilters(invalidFilters, mockColumns);
    console.log('✅ Invalid filters test:', !invalidResult.isValid ? 'PASSED' : 'FAILED');
    
    if (invalidResult.isValid) {
      console.log('❌ Expected validation to fail but it passed');
    }
    
    // Test operator compatibility
    const textOperators = FilterValidator.getAvailableOperators('text');
    console.log('✅ Text operators:', textOperators);
    
    const numberOperators = FilterValidator.getAvailableOperators('number');
    console.log('✅ Number operators:', numberOperators);
    
    console.log('✅ FilterValidator tests completed\n');
    
  } catch (error) {
    console.error('❌ FilterValidator test failed:', error);
  }
}

async function testPrismaFilterBuilder() {
  console.log('🧪 Testing PrismaFilterBuilder...');
  
  try {
    const builder = new PrismaFilterBuilder(1, mockColumns);
    
    // Test global search
    builder.addGlobalSearch('test search');
    console.log('✅ Global search added');
    
    // Test column filters
    builder.addColumnFilters(mockFilters);
    console.log('✅ Column filters added');
    
    // Get where clause
    const whereClause = builder.getWhereClause();
    console.log('✅ Where clause generated:', JSON.stringify(whereClause, null, 2));
    
    console.log('✅ PrismaFilterBuilder tests completed\n');
    
  } catch (error) {
    console.error('❌ PrismaFilterBuilder test failed:', error);
  }
}

async function testFilterCache() {
  console.log('🧪 Testing FilterCache...');
  
  try {
    // Test cache key generation
    const cacheKey = filterCache.generateCacheKey(
      1,
      mockFilters,
      'test search',
      'id',
      'asc',
      1,
      25
    );
    console.log('✅ Cache key generated:', cacheKey);
    
    // Test cache set/get
    const testData = { rows: [], pagination: { page: 1, pageSize: 25, totalRows: 0, totalPages: 0 } };
    filterCache.set(cacheKey, testData.rows, testData.pagination, 1, mockFilters);
    
    const cachedData = filterCache.get(cacheKey);
    console.log('✅ Cache set/get test:', cachedData ? 'PASSED' : 'FAILED');
    
    // Test cache statistics
    const stats = filterCache.getStats();
    console.log('✅ Cache stats:', stats);
    
    // Test cache health
    const isHealthy = filterCache.isHealthy();
    console.log('✅ Cache health:', isHealthy ? 'HEALTHY' : 'UNHEALTHY');
    
    console.log('✅ FilterCache tests completed\n');
    
  } catch (error) {
    console.error('❌ FilterCache test failed:', error);
  }
}

async function testValueConversion() {
  console.log('🧪 Testing value conversion...');
  
  try {
    // Test text conversion
    const textValue = FilterValidator.convertFilterValue('test', 'text');
    console.log('✅ Text conversion:', textValue);
    
    // Test number conversion
    const numberValue = FilterValidator.convertFilterValue('42', 'number');
    console.log('✅ Number conversion:', numberValue, typeof numberValue);
    
    // Test boolean conversion
    const booleanValue = FilterValidator.convertFilterValue('true', 'boolean');
    console.log('✅ Boolean conversion:', booleanValue, typeof booleanValue);
    
    // Test date conversion
    const dateValue = FilterValidator.convertFilterValue('2024-01-15', 'date');
    console.log('✅ Date conversion:', dateValue);
    
    console.log('✅ Value conversion tests completed\n');
    
  } catch (error) {
    console.error('❌ Value conversion test failed:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting filtering system tests...\n');
  
  await testFilterValidator();
  await testPrismaFilterBuilder();
  await testFilterCache();
  await testValueConversion();
  
  console.log('🎉 All tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { runAllTests };
