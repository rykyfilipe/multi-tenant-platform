/** @format */

// Integration test setup - minimal setup for API testing
// No window or DOM dependencies

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	// Uncomment to ignore specific console methods
	// log: jest.fn(),
	// debug: jest.fn(),
	// info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock Next.js specific globals
global.fetch = jest.fn();

// Cleanup after each test
global.afterEach = global.afterEach || (() => {});
afterEach(() => {
	jest.clearAllMocks();
});
