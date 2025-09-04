#!/usr/bin/env tsx

/** @format */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const command = args[0] || 'all';

const testCommands = {
	unit: 'jest tests/unit/invoice/ --coverage --verbose',
	integration: 'jest tests/integration/invoice/ --coverage --verbose',
	e2e: 'playwright test tests/e2e/invoice/',
	all: 'jest tests/unit/invoice/ tests/integration/invoice/ --coverage --verbose && playwright test tests/e2e/invoice/',
	coverage: 'jest tests/unit/invoice/ tests/integration/invoice/ --coverage --coverageReporters=text-lcov --coverageReporters=html',
	watch: 'jest tests/unit/invoice/ tests/integration/invoice/ --watch',
	ci: 'jest tests/unit/invoice/ tests/integration/invoice/ --ci --coverage --watchAll=false && playwright test tests/e2e/invoice/ --reporter=github'
};

function runCommand(cmd: string) {
	console.log(`Running: ${cmd}`);
	try {
		execSync(cmd, { stdio: 'inherit' });
		console.log(`✅ Command completed successfully: ${cmd}`);
	} catch (error) {
		console.error(`❌ Command failed: ${cmd}`);
		console.error(error);
		process.exit(1);
	}
}

function checkDependencies() {
	console.log('🔍 Checking dependencies...');
	
	const requiredFiles = [
		'package.json',
		'jest.config.js',
		'playwright.config.ts'
	];

	for (const file of requiredFiles) {
		if (!existsSync(file)) {
			console.error(`❌ Required file not found: ${file}`);
			process.exit(1);
		}
	}

	console.log('✅ All dependencies found');
}

function setupTestEnvironment() {
	console.log('🔧 Setting up test environment...');
	
	// Set test environment variables
	process.env.NODE_ENV = 'test';
	process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_invoice_db';
	process.env.NEXTAUTH_SECRET = 'test-secret';
	process.env.NEXTAUTH_URL = 'http://localhost:3000';
	
	console.log('✅ Test environment configured');
}

function generateCoverageReport() {
	console.log('📊 Generating coverage report...');
	
	const coverageCmd = testCommands.coverage;
	runCommand(coverageCmd);
	
	console.log('📈 Coverage report generated in coverage/ directory');
}

function main() {
	console.log('🚀 Starting Invoice System Test Suite');
	console.log('=====================================');
	
	checkDependencies();
	setupTestEnvironment();
	
	switch (command) {
		case 'setup':
			console.log('🔧 Setting up test environment...');
			// Add any setup commands here
			console.log('✅ Test environment setup complete');
			break;
			
		case 'unit':
			console.log('🧪 Running unit tests...');
			runCommand(testCommands.unit);
			break;
			
		case 'integration':
			console.log('🔗 Running integration tests...');
			runCommand(testCommands.integration);
			break;
			
		case 'e2e':
			console.log('🎭 Running E2E tests...');
			runCommand(testCommands.e2e);
			break;
			
		case 'coverage':
			console.log('📊 Running tests with coverage...');
			generateCoverageReport();
			break;
			
		case 'watch':
			console.log('👀 Running tests in watch mode...');
			runCommand(testCommands.watch);
			break;
			
		case 'ci':
			console.log('🤖 Running CI tests...');
			runCommand(testCommands.ci);
			break;
			
		case 'all':
		default:
			console.log('🧪 Running all tests...');
			runCommand(testCommands.all);
			break;
	}
	
	console.log('=====================================');
	console.log('✅ Test suite completed');
}

if (require.main === module) {
	main();
}

export { testCommands, runCommand, checkDependencies, setupTestEnvironment };
