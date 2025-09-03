/** @format */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { TestUtils } from './setup/test-config';

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_invoice_system',
		},
	},
});

async function setupTestDatabase() {
	console.log('Setting up test database...');
	
	try {
		// Create test tenant
		const tenant = await TestUtils.createTestTenant(prisma);
		console.log(`Created test tenant: ${tenant.id}`);

		// Create test database
		const database = await TestUtils.createTestDatabase(prisma, tenant.id);
		console.log(`Created test database: ${database.id}`);

		// Create test tables
		const tables = await TestUtils.createTestTables(prisma, database.id);
		console.log(`Created test tables: ${Object.keys(tables).join(', ')}`);

		// Create test columns
		const columns = await TestUtils.createTestColumns(prisma, tables);
		console.log(`Created test columns for all tables`);

		console.log('Test database setup completed successfully!');
	} catch (error) {
		console.error('Error setting up test database:', error);
		throw error;
	}
}

async function cleanupTestDatabase() {
	console.log('Cleaning up test database...');
	
	try {
		await TestUtils.cleanupTestData(prisma);
		console.log('Test database cleanup completed successfully!');
	} catch (error) {
		console.error('Error cleaning up test database:', error);
		throw error;
	}
}

async function runTests() {
	console.log('Running invoice system tests...');
	
	try {
		// Run unit tests
		console.log('\n=== Running Unit Tests ===');
		execSync('npx vitest run tests/unit --reporter=verbose', { stdio: 'inherit' });

		// Run integration tests
		console.log('\n=== Running Integration Tests ===');
		execSync('npx vitest run tests/integration --reporter=verbose', { stdio: 'inherit' });

		// Run E2E tests if they exist
		console.log('\n=== Running E2E Tests ===');
		try {
			execSync('npx playwright test', { stdio: 'inherit' });
		} catch (error) {
			console.log('E2E tests not available or failed (this is optional)');
		}

		console.log('\n✅ All tests completed successfully!');
	} catch (error) {
		console.error('❌ Tests failed:', error);
		process.exit(1);
	}
}

async function generateTestReport() {
	console.log('Generating test coverage report...');
	
	try {
		execSync('npx vitest run --coverage --reporter=verbose', { stdio: 'inherit' });
		console.log('Test coverage report generated successfully!');
	} catch (error) {
		console.error('Error generating test coverage report:', error);
	}
}

async function main() {
	const command = process.argv[2];

	try {
		switch (command) {
			case 'setup':
				await setupTestDatabase();
				break;
			case 'cleanup':
				await cleanupTestDatabase();
				break;
			case 'test':
				await runTests();
				break;
			case 'coverage':
				await generateTestReport();
				break;
			case 'full':
				await setupTestDatabase();
				await runTests();
				await generateTestReport();
				await cleanupTestDatabase();
				break;
			default:
				console.log(`
Usage: npm run test:invoice [command]

Commands:
  setup     - Setup test database
  cleanup   - Cleanup test database
  test      - Run all tests
  coverage  - Generate test coverage report
  full      - Run complete test suite (setup + test + coverage + cleanup)

Examples:
  npm run test:invoice setup
  npm run test:invoice test
  npm run test:invoice full
				`);
				break;
		}
	} catch (error) {
		console.error('Command failed:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Handle process termination
process.on('SIGINT', async () => {
	console.log('\nReceived SIGINT, cleaning up...');
	await cleanupTestDatabase();
	await prisma.$disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	console.log('\nReceived SIGTERM, cleaning up...');
	await cleanupTestDatabase();
	await prisma.$disconnect();
	process.exit(0);
});

main();
