/**
 * Test Comprehensiv pentru Sistemul de Filtre Products
 * 
 * Acest script testează toate tipurile de coloane și operatori
 * pe tabela reală Products din baza de date.
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

// Culori pentru console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log('\n' + '='.repeat(80), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(80), 'cyan');
}

function logSection(title) {
  log('\n' + '-'.repeat(60), 'blue');
  log(`  ${title}`, 'blue');
  log('-'.repeat(60), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// ==================== TEST UTILITIES ====================

/**
 * Simulează construirea WHERE clause ca în backend
 */
class TestFilterBuilder {
  constructor(tableId, tableColumns) {
    this.tableId = tableId;
    this.tableColumns = tableColumns;
  }

  buildWhereClause(filters, globalSearch = '') {
    const whereConditions = [];
    whereConditions.push({ tableId: this.tableId });

    if (globalSearch && globalSearch.trim()) {
      whereConditions.push(this.buildGlobalSearchCondition(globalSearch.trim()));
    }

    if (filters && filters.length > 0) {
      for (const filter of filters) {
        const condition = this.buildColumnFilterCondition(filter);
        if (condition) {
          whereConditions.push(condition);
        }
      }
    }

    return {
      whereClause: whereConditions.length > 1 ? { AND: whereConditions } : whereConditions[0],
      hasFilters: whereConditions.length > 1
    };
  }

  buildGlobalSearchCondition(searchTerm) {
    const conditions = [];
    conditions.push({ stringValue: { contains: searchTerm, mode: 'insensitive' } });
    if (!isNaN(Number(searchTerm))) {
      conditions.push({ numberValue: { equals: Number(searchTerm) } });
    }
    return {
      cells: {
        some: {
          OR: conditions
        }
      }
    };
  }

  buildColumnFilterCondition(filter) {
    const { columnId, operator, value, secondValue, columnType } = filter;
    const cellCondition = this.buildCellCondition(columnId, operator, value, secondValue, columnType);
    if (!cellCondition) return null;

    return {
      cells: {
        some: {
          columnId: columnId,
          ...cellCondition
        }
      }
    };
  }

  buildCellCondition(columnId, operator, value, secondValue, columnType) {
    // Text operators
    if (['text', 'string', 'email', 'url'].includes(columnType)) {
      return this.buildTextCondition(operator, value);
    }
    // Number operators
    if (['number', 'integer', 'decimal'].includes(columnType)) {
      return this.buildNumericCondition(operator, value, secondValue);
    }
    // Boolean operators
    if (columnType === 'boolean') {
      return this.buildBooleanCondition(operator, value);
    }
    // Date operators
    if (['date', 'datetime', 'time'].includes(columnType)) {
      return this.buildDateCondition(operator, value, secondValue);
    }
    return null;
  }

  buildTextCondition(operator, value) {
    switch (operator) {
      case 'contains':
        return { stringValue: { contains: value, mode: 'insensitive' } };
      case 'not_contains':
        return { stringValue: { not: { contains: value, mode: 'insensitive' } } };
      case 'equals':
        return { stringValue: { equals: value } };  // ⚠️ Case sensitive
      case 'not_equals':
        return { stringValue: { not: { equals: value } } };  // ⚠️ Case sensitive
      case 'starts_with':
        return { stringValue: { startsWith: value, mode: 'insensitive' } };
      case 'ends_with':
        return { stringValue: { endsWith: value, mode: 'insensitive' } };
      case 'is_empty':
        return { OR: [{ stringValue: null }, { stringValue: '' }] };
      case 'is_not_empty':
        return { AND: [{ stringValue: { not: null } }, { stringValue: { not: '' } }] };
      default:
        return null;
    }
  }

  buildNumericCondition(operator, value, secondValue) {
    const numericValue = Number(value);
    switch (operator) {
      case 'equals':
        return { numberValue: { equals: numericValue } };
      case 'not_equals':
        return { numberValue: { not: { equals: numericValue } } };
      case 'greater_than':
        return { numberValue: { gt: numericValue } };
      case 'greater_than_or_equal':
        return { numberValue: { gte: numericValue } };
      case 'less_than':
        return { numberValue: { lt: numericValue } };
      case 'less_than_or_equal':
        return { numberValue: { lte: numericValue } };
      case 'between':
        return { numberValue: { gte: numericValue, lte: Number(secondValue) } };
      case 'not_between':
        return { OR: [{ numberValue: { lt: numericValue } }, { numberValue: { gt: Number(secondValue) } }] };
      case 'is_empty':
        return { numberValue: null };
      case 'is_not_empty':
        return { numberValue: { not: null } };
      default:
        return null;
    }
  }

  buildBooleanCondition(operator, value) {
    const booleanValue = Boolean(value);
    switch (operator) {
      case 'equals':
        return { booleanValue: { equals: booleanValue } };
      case 'not_equals':
        return { booleanValue: { not: { equals: booleanValue } } };
      case 'is_empty':
        return { booleanValue: null };
      case 'is_not_empty':
        return { booleanValue: { not: null } };
      default:
        return null;
    }
  }

  buildDateCondition(operator, value, secondValue) {
    const dateValue = new Date(value);
    switch (operator) {
      case 'equals':
        const startOfDay = new Date(dateValue);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateValue);
        endOfDay.setHours(23, 59, 59, 999);
        return { dateValue: { gte: startOfDay, lte: endOfDay } };
      case 'not_equals':
        const startOfDay2 = new Date(dateValue);
        startOfDay2.setHours(0, 0, 0, 0);
        const endOfDay2 = new Date(dateValue);
        endOfDay2.setHours(23, 59, 59, 999);
        return { OR: [{ dateValue: { lt: startOfDay2 } }, { dateValue: { gt: endOfDay2 } }] };
      case 'before':
        return { dateValue: { lt: dateValue } };
      case 'after':
        return { dateValue: { gt: dateValue } };
      case 'between':
        return { dateValue: { gte: new Date(value), lte: new Date(secondValue) } };
      case 'not_between':
        return { OR: [{ dateValue: { lt: new Date(value) } }, { dateValue: { gt: new Date(secondValue) } }] };
      case 'today':
        const today = new Date();
        const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        return { dateValue: { gte: startToday, lt: endToday } };
      case 'is_empty':
        return { dateValue: null };
      case 'is_not_empty':
        return { dateValue: { not: null } };
      default:
        return null;
    }
  }
}

// ==================== TEST DEFINITIONS ====================

const TEST_SUITES = {
  text: [
    { operator: 'contains', value: 'Laptop', expectedMin: 1, description: 'name contains "Laptop"' },
    { operator: 'not_contains', value: 'xyz999', expectedMin: 1, description: 'name not contains "xyz999"' },
    { operator: 'equals', value: 'Laptop Pro', expectedMin: 0, description: 'name equals "Laptop Pro"' },
    { operator: 'not_equals', value: 'Nonexistent', expectedMin: 1, description: 'name not equals "Nonexistent"' },
    { operator: 'starts_with', value: 'Lap', expectedMin: 0, description: 'name starts with "Lap"' },
    { operator: 'ends_with', value: 'Pro', expectedMin: 0, description: 'name ends with "Pro"' },
    { operator: 'is_empty', value: null, expectedMin: 0, description: 'name is empty' },
    { operator: 'is_not_empty', value: null, expectedMin: 1, description: 'name is not empty' },
  ],
  number: [
    { operator: 'equals', value: 100, expectedMin: 0, description: 'price equals 100' },
    { operator: 'not_equals', value: 9999999, expectedMin: 1, description: 'price not equals 9999999' },
    { operator: 'greater_than', value: 50, expectedMin: 0, description: 'price > 50' },
    { operator: 'greater_than_or_equal', value: 50, expectedMin: 0, description: 'price >= 50' },
    { operator: 'less_than', value: 1000, expectedMin: 0, description: 'price < 1000' },
    { operator: 'less_than_or_equal', value: 1000, expectedMin: 0, description: 'price <= 1000' },
    { operator: 'between', value: 50, secondValue: 500, expectedMin: 0, description: 'price between 50 and 500' },
    { operator: 'not_between', value: 1000, secondValue: 2000, expectedMin: 0, description: 'price not between 1000 and 2000' },
    { operator: 'is_empty', value: null, expectedMin: 0, description: 'price is empty' },
    { operator: 'is_not_empty', value: null, expectedMin: 1, description: 'price is not empty' },
  ],
  boolean: [
    { operator: 'equals', value: true, expectedMin: 0, description: 'active equals true' },
    { operator: 'equals', value: false, expectedMin: 0, description: 'active equals false' },
    { operator: 'not_equals', value: true, expectedMin: 0, description: 'active not equals true' },
    { operator: 'is_empty', value: null, expectedMin: 0, description: 'active is empty' },
    { operator: 'is_not_empty', value: null, expectedMin: 0, description: 'active is not empty' },
  ],
  date: [
    { operator: 'before', value: '2025-12-31', expectedMin: 0, description: 'created_at before 2025-12-31' },
    { operator: 'after', value: '2020-01-01', expectedMin: 0, description: 'created_at after 2020-01-01' },
    { operator: 'between', value: '2020-01-01', secondValue: '2025-12-31', expectedMin: 0, description: 'created_at between 2020-2025' },
    { operator: 'today', value: null, expectedMin: 0, description: 'created_at today' },
    { operator: 'is_empty', value: null, expectedMin: 0, description: 'created_at is empty' },
    { operator: 'is_not_empty', value: null, expectedMin: 0, description: 'created_at is not empty' },
  ],
};

// ==================== TEST EXECUTION ====================

async function findProductsTable(tenantId) {
  const tables = await prisma.table.findMany({
    where: {
      databaseId: {
        in: await prisma.database.findMany({
          where: { tenantId: tenantId },
          select: { id: true }
        }).then(dbs => dbs.map(db => db.id))
      },
      name: { contains: 'Product', mode: 'insensitive' }
    },
    include: {
      columns: { orderBy: { order: 'asc' } }
    }
  });

  if (tables.length === 0) {
    throw new Error('Nu s-a găsit o tabelă Products în tenant-ul specificat');
  }

  return tables[0];
}

async function getColumnByType(table, type) {
  return table.columns.find(col => {
    if (type === 'text') {
      return ['text', 'string', 'email', 'url'].includes(col.type);
    }
    if (type === 'number') {
      return ['number', 'integer', 'decimal'].includes(col.type);
    }
    if (type === 'date') {
      return ['date', 'datetime', 'time'].includes(col.type);
    }
    return col.type === type;
  });
}

async function testFilter(table, column, testCase) {
  const filter = {
    id: `test_${Date.now()}`,
    columnId: column.id,
    columnName: column.name,
    columnType: column.type,
    operator: testCase.operator,
    value: testCase.value,
    secondValue: testCase.secondValue,
  };

  const builder = new TestFilterBuilder(table.id, table.columns);
  const { whereClause } = builder.buildWhereClause([filter]);

  try {
    // Execute query
    const startTime = Date.now();
    const results = await prisma.row.findMany({
      where: whereClause,
      include: {
        cells: {
          where: { columnId: column.id },
          include: { column: true }
        }
      },
      take: 5, // Limităm la 5 rezultate pentru display
    });
    const executionTime = Date.now() - startTime;

    // Verificăm rezultatele
    const success = results.length >= testCase.expectedMin;

    return {
      success,
      filter,
      whereClause: JSON.stringify(whereClause, null, 2),
      resultsCount: results.length,
      expectedMin: testCase.expectedMin,
      executionTime,
      sampleResults: results.map(row => ({
        id: row.id,
        value: row.cells[0]?.stringValue || row.cells[0]?.numberValue || row.cells[0]?.booleanValue || row.cells[0]?.dateValue || row.cells[0]?.value
      })),
      error: null
    };
  } catch (error) {
    return {
      success: false,
      filter,
      whereClause: JSON.stringify(whereClause, null, 2),
      resultsCount: 0,
      expectedMin: testCase.expectedMin,
      executionTime: 0,
      sampleResults: [],
      error: error.message
    };
  }
}

async function runTestSuite(table, columnType, testCases) {
  logSection(`Testing ${columnType.toUpperCase()} filters`);

  const column = await getColumnByType(table, columnType);
  if (!column) {
    logWarning(`No ${columnType} column found in table ${table.name}`);
    return { passed: 0, failed: 0, skipped: testCases.length };
  }

  logInfo(`Column: ${column.name} (ID: ${column.id}, Type: ${column.type})`);

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await testFilter(table, column, testCase);

    if (result.success) {
      logSuccess(`${testCase.description} → ${result.resultsCount} results in ${result.executionTime}ms`);
      passed++;
    } else {
      logError(`${testCase.description} → FAILED`);
      logError(`   Expected >= ${result.expectedMin} results, got ${result.resultsCount}`);
      if (result.error) {
        logError(`   Error: ${result.error}`);
      }
      failed++;
    }

    // Log some sample results
    if (result.sampleResults.length > 0 && result.success) {
      logInfo(`   Sample values: ${result.sampleResults.map(r => r.value).join(', ')}`);
    }
  }

  return { passed, failed, skipped: 0 };
}

// ==================== MAIN ====================

async function main() {
  logHeader('🔍 COMPREHENSIVE FILTER SYSTEM TEST');

  try {
    // 1. Find tenant
    const tenants = await prisma.tenant.findMany({ take: 1 });
    if (tenants.length === 0) {
      throw new Error('No tenants found in database');
    }
    const tenant = tenants[0];
    logInfo(`Using tenant: ${tenant.name} (ID: ${tenant.id})`);

    // 2. Find Products table
    const table = await findProductsTable(tenant.id);
    logInfo(`Using table: ${table.name} (ID: ${table.id})`);
    logInfo(`Columns: ${table.columns.map(c => `${c.name}:${c.type}`).join(', ')}`);

    // 3. Run all test suites
    const totalResults = { passed: 0, failed: 0, skipped: 0 };

    for (const [columnType, testCases] of Object.entries(TEST_SUITES)) {
      const result = await runTestSuite(table, columnType, testCases);
      totalResults.passed += result.passed;
      totalResults.failed += result.failed;
      totalResults.skipped += result.skipped;
    }

    // 4. Summary
    logHeader('📊 TEST SUMMARY');
    logSuccess(`Passed:  ${totalResults.passed}`);
    if (totalResults.failed > 0) {
      logError(`Failed:  ${totalResults.failed}`);
    } else {
      logInfo(`Failed:  ${totalResults.failed}`);
    }
    if (totalResults.skipped > 0) {
      logWarning(`Skipped: ${totalResults.skipped}`);
    }

    const total = totalResults.passed + totalResults.failed + totalResults.skipped;
    const percentage = total > 0 ? ((totalResults.passed / total) * 100).toFixed(1) : 0;
    logInfo(`\nSuccess rate: ${percentage}%`);

  } catch (error) {
    logError(`FATAL ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main();

