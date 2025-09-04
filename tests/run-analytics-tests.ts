#!/usr/bin/env ts-node

/** @format */

import { execSync } from 'child_process';
import path from 'path';

const testFiles = [
  // Unit tests
  'tests/unit/analytics/KPICard.test.tsx',
  'tests/unit/analytics/AnalyticsDashboard.test.tsx',
  'tests/unit/analytics/useProcessedAnalyticsData.test.ts',
  'tests/unit/analytics/chart-components.test.tsx',
  'tests/unit/analytics/data-processing.test.ts',
  'tests/unit/analytics/useDashboardData.test.ts',
  'tests/unit/analytics/chart-colors.test.ts',
  'tests/unit/analytics/advanced-analytics.test.ts',
  
  // Integration tests
  'tests/integration/analytics/real-data-api.test.ts',
  'tests/integration/analytics/analytics-system.test.ts',
];

const runTests = () => {
  console.log('🚀 Running Analytics Tests...\n');
  
  let passed = 0;
  let failed = 0;
  const results: Array<{ file: string; status: 'PASS' | 'FAIL'; error?: string }> = [];

  for (const testFile of testFiles) {
    try {
      console.log(`📋 Running ${testFile}...`);
      
      const command = `npx jest ${testFile} --verbose --no-cache --passWithNoTests`;
      const output = execSync(command, { 
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      console.log(`✅ ${testFile} - PASSED`);
      results.push({ file: testFile, status: 'PASS' });
      passed++;
      
    } catch (error: any) {
      console.log(`❌ ${testFile} - FAILED`);
      console.log(`Error: ${error.message}`);
      results.push({ 
        file: testFile, 
        status: 'FAIL', 
        error: error.message 
      });
      failed++;
    }
    
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total: ${testFiles.length}`);
  console.log('');

  if (failed > 0) {
    console.log('❌ Failed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  - ${r.file}`);
        if (r.error) {
          console.log(`    Error: ${r.error}`);
        }
      });
    console.log('');
  }

  console.log('✅ Passed Tests:');
  results
    .filter(r => r.status === 'PASS')
    .forEach(r => {
      console.log(`  - ${r.file}`);
    });

  if (failed === 0) {
    console.log('\n🎉 All analytics tests passed!');
    process.exit(0);
  } else {
    console.log(`\n💥 ${failed} test(s) failed. Please check the errors above.`);
    process.exit(1);
  }
};

const runSpecificTest = (testFile: string) => {
  console.log(`🚀 Running specific test: ${testFile}\n`);
  
  try {
    const command = `npx jest ${testFile} --verbose --no-cache --passWithNoTests`;
    execSync(command, { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    console.log(`\n✅ ${testFile} completed successfully!`);
    
  } catch (error: any) {
    console.log(`\n❌ ${testFile} failed!`);
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

const runTestsWithCoverage = () => {
  console.log('🚀 Running Analytics Tests with Coverage...\n');
  
  try {
    const command = `npx jest ${testFiles.join(' ')} --coverage --verbose --no-cache --passWithNoTests`;
    execSync(command, { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    console.log('\n✅ Analytics tests with coverage completed successfully!');
    
  } catch (error: any) {
    console.log('\n❌ Analytics tests with coverage failed!');
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

const showHelp = () => {
  console.log('Analytics Test Runner');
  console.log('====================');
  console.log('');
  console.log('Usage:');
  console.log('  npm run test:analytics                    # Run all analytics tests');
  console.log('  npm run test:analytics:coverage           # Run all analytics tests with coverage');
  console.log('  npm run test:analytics:unit               # Run only unit tests');
  console.log('  npm run test:analytics:integration        # Run only integration tests');
  console.log('  npm run test:analytics:file <filename>    # Run specific test file');
  console.log('');
  console.log('Available test files:');
  testFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  npm run test:analytics:file KPICard.test.tsx');
  console.log('  npm run test:analytics:file real-data-api.test.ts');
};

// Main execution
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  case 'coverage':
    runTestsWithCoverage();
    break;
    
  case 'unit':
    const unitTests = testFiles.filter(f => f.includes('/unit/'));
    console.log('🚀 Running Unit Tests...\n');
    unitTests.forEach(testFile => {
      try {
        console.log(`📋 Running ${testFile}...`);
        const command = `npx jest ${testFile} --verbose --no-cache --passWithNoTests`;
        execSync(command, { 
          cwd: process.cwd(),
          stdio: 'inherit'
        });
        console.log(`✅ ${testFile} - PASSED\n`);
      } catch (error: any) {
        console.log(`❌ ${testFile} - FAILED\n`);
        process.exit(1);
      }
    });
    console.log('🎉 All unit tests passed!');
    break;
    
  case 'integration':
    const integrationTests = testFiles.filter(f => f.includes('/integration/'));
    console.log('🚀 Running Integration Tests...\n');
    integrationTests.forEach(testFile => {
      try {
        console.log(`📋 Running ${testFile}...`);
        const command = `npx jest ${testFile} --verbose --no-cache --passWithNoTests`;
        execSync(command, { 
          cwd: process.cwd(),
          stdio: 'inherit'
        });
        console.log(`✅ ${testFile} - PASSED\n`);
      } catch (error: any) {
        console.log(`❌ ${testFile} - FAILED\n`);
        process.exit(1);
      }
    });
    console.log('🎉 All integration tests passed!');
    break;
    
  case 'file':
    const testFile = args[1];
    if (!testFile) {
      console.log('❌ Please specify a test file name.');
      console.log('Usage: npm run test:analytics:file <filename>');
      process.exit(1);
    }
    
    const fullPath = testFiles.find(f => f.includes(testFile));
    if (!fullPath) {
      console.log(`❌ Test file not found: ${testFile}`);
      console.log('Available test files:');
      testFiles.forEach(file => {
        console.log(`  - ${file}`);
      });
      process.exit(1);
    }
    
    runSpecificTest(fullPath);
    break;
    
  default:
    runTests();
    break;
}

export { runTests, runSpecificTest, runTestsWithCoverage, showHelp };
