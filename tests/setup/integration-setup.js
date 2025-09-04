/** @format */

// Integration test setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_invoice_db';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock external services
jest.mock('@/lib/email-service', () => ({
	EmailService: {
		queueEmail: jest.fn().mockResolvedValue('email-123'),
		getQueueStatus: jest.fn().mockResolvedValue({ pending: 0, processing: 0, completed: 10 }),
	},
}));

// Mock currency exchange
jest.mock('@/lib/currency-exchange-client', () => ({
	getExchangeRateProvider: jest.fn().mockReturnValue({
		getExchangeRate: jest.fn().mockResolvedValue({
			rate: 1.2,
			date: '2024-01-01',
			source: 'test',
		}),
	}),
}));

// Mock external APIs
jest.mock('@/lib/migrators/oblio-migrator', () => ({
	OblioMigrator: {
		importInvoices: jest.fn().mockResolvedValue({
			success: true,
			imported: 5,
			updated: 2,
			skipped: 0,
			errors: 0,
		}),
		exportInvoices: jest.fn().mockResolvedValue({
			success: true,
			data: 'Invoice Number,Date,Customer\nINV-001,2024-01-01,Test Customer',
			mimeType: 'text/csv',
			filename: 'invoices_export.csv',
		}),
	},
}));

jest.mock('@/lib/migrators/smartbill-migrator', () => ({
	SmartBillMigrator: {
		importInvoices: jest.fn().mockResolvedValue({
			success: true,
			imported: 3,
			updated: 1,
			skipped: 0,
			errors: 0,
		}),
		exportInvoices: jest.fn().mockResolvedValue({
			success: true,
			data: 'Invoice Number,Date,Customer\nINV-001,2024-01-01,Test Customer',
			mimeType: 'text/csv',
			filename: 'invoices_export.csv',
		}),
	},
}));

// Global test utilities
global.createMockInvoice = (overrides = {}) => ({
	id: 1,
	invoice_number: 'INV-2024-000001',
	date: '2024-01-01',
	due_date: '2024-01-31',
	customer_id: 1,
	base_currency: 'USD',
	total_amount: 120,
	payment_terms: 'Net 30',
	payment_method: 'Bank Transfer',
	notes: 'Test invoice',
	...overrides,
});

global.createMockCustomer = (overrides = {}) => ({
	id: 1,
	customer_name: 'Test Customer',
	customer_email: 'test@example.com',
	customer_address: '123 Test St',
	customer_city: 'Test City',
	customer_country: 'Test Country',
	customer_postal_code: '12345',
	customer_phone: '123-456-7890',
	...overrides,
});

global.createMockInvoiceItem = (overrides = {}) => ({
	id: 1,
	invoice_id: 1,
	product_ref_table: 'products',
	product_ref_id: 1,
	quantity: 1,
	price: 100,
	currency: 'USD',
	product_vat: 20,
	description: 'Test Product',
	product_name: 'Test Product',
	product_sku: 'SKU-001',
	product_category: 'Electronics',
	product_brand: 'Test Brand',
	...overrides,
});

global.createMockProduct = (overrides = {}) => ({
	id: 1,
	name: 'Test Product',
	price: 100,
	currency: 'USD',
	vat: 20,
	sku: 'SKU-001',
	description: 'Test Product Description',
	category: 'Electronics',
	brand: 'Test Brand',
	...overrides,
});

// Cleanup after each test
afterEach(() => {
	jest.clearAllMocks();
});
