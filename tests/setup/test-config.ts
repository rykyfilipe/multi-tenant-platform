/** @format */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Test database configuration
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_invoice_system';

// Mock data for testing
export const mockTenant = {
	id: 1,
	name: 'Test Company',
	companyEmail: 'test@company.com',
	address: '123 Test Street',
	defaultCurrency: 'USD',
	phone: '123-456-7890',
	website: 'https://testcompany.com',
	vatNumber: 'VAT123456',
	registrationNumber: 'REG789012',
};

export const mockDatabase = {
	id: 1,
	tenantId: 1,
	name: 'test_database',
	description: 'Test database for invoice system',
};

export const mockInvoiceTables = {
	invoices: { id: 1, name: 'invoices' },
	invoice_items: { id: 2, name: 'invoice_items' },
	customers: { id: 3, name: 'customers' },
};

export const mockInvoice = {
	id: 1,
	cells: [
		{ column: { name: 'invoice_number' }, value: 'INV-001' },
		{ column: { name: 'date' }, value: '2024-01-01' },
		{ column: { name: 'due_date' }, value: '2024-01-31' },
		{ column: { name: 'customer_id' }, value: 1 },
		{ column: { name: 'status' }, value: 'issued' },
		{ column: { name: 'base_currency' }, value: 'USD' },
		{ column: { name: 'total_amount' }, value: 100 },
		{ column: { name: 'payment_terms' }, value: 'Net 30' },
		{ column: { name: 'payment_method' }, value: 'Bank Transfer' },
		{ column: { name: 'notes' }, value: 'Thank you for your business!' },
	],
};

export const mockCustomer = {
	id: 1,
	cells: [
		{ column: { name: 'customer_name' }, value: 'Test Customer' },
		{ column: { name: 'customer_email' }, value: 'customer@test.com' },
		{ column: { name: 'customer_address' }, value: '456 Customer Street' },
		{ column: { name: 'customer_city' }, value: 'Customer City' },
		{ column: { name: 'customer_country' }, value: 'Customer Country' },
		{ column: { name: 'customer_postal_code' }, value: '12345' },
		{ column: { name: 'customer_phone' }, value: '987-654-3210' },
		{ column: { name: 'customer_vat_id' }, value: 'CUST123456' },
	],
};

export const mockInvoiceItems = [
	{
		id: 1,
		cells: [
			{ column: { name: 'invoice_id' }, value: 1 },
			{ column: { name: 'quantity' }, value: 2 },
			{ column: { name: 'price' }, value: 50 },
			{ column: { name: 'currency' }, value: 'USD' },
			{ column: { name: 'product_vat' }, value: 20 },
			{ column: { name: 'description' }, value: 'Test Product 1' },
			{ column: { name: 'unit_of_measure' }, value: 'buc' },
			{ column: { name: 'product_name' }, value: 'Test Product 1' },
			{ column: { name: 'product_sku' }, value: 'SKU-001' },
			{ column: { name: 'product_category' }, value: 'Category A' },
		],
	},
	{
		id: 2,
		cells: [
			{ column: { name: 'invoice_id' }, value: 1 },
			{ column: { name: 'quantity' }, value: 1 },
			{ column: { name: 'price' }, value: 100 },
			{ column: { name: 'currency' }, value: 'USD' },
			{ column: { name: 'product_vat' }, value: 10 },
			{ column: { name: 'description' }, value: 'Test Product 2' },
			{ column: { name: 'unit_of_measure' }, value: 'buc' },
			{ column: { name: 'product_name' }, value: 'Test Product 2' },
			{ column: { name: 'product_sku' }, value: 'SKU-002' },
			{ column: { name: 'product_category' }, value: 'Category B' },
		],
	},
];

export const mockCSVContent = `invoice_number,date,customer_name,customer_email,description,quantity,price,currency,product_vat
INV-001,2024-01-01,Test Customer,customer@test.com,Test Product 1,2,50,USD,20
INV-001,2024-01-01,Test Customer,customer@test.com,Test Product 2,1,100,USD,10`;

export const mockImportResult = {
	success: true,
	imported: 1,
	updated: 0,
	skipped: 0,
	errors: 0,
	summary: {
		created: [
			{
				invoiceNumber: 'INV-001',
				customer: { name: 'Test Customer' },
				totals: { grandTotal: 220 },
			},
		],
		updated: [],
		skipped: [],
		errors: [],
	},
};

export const mockExportResult = {
	success: true,
	data: 'Invoice Number,Date,Customer,Total\nINV-001,2024-01-01,Test Customer,220',
	mimeType: 'text/csv',
	filename: 'invoices_export_2024-01-01.csv',
	count: 1,
	format: 'csv',
};

// Test utilities
export class TestUtils {
	static async createTestTenant(prisma: PrismaClient) {
		return await prisma.tenant.create({
			data: mockTenant,
		});
	}

	static async createTestDatabase(prisma: PrismaClient, tenantId: number) {
		return await prisma.database.create({
			data: {
				...mockDatabase,
				tenantId,
			},
		});
	}

	static async createTestTables(prisma: PrismaClient, databaseId: number) {
		const tables = await Promise.all([
			prisma.table.create({
				data: {
					name: 'invoices',
					databaseId,
					description: 'Invoice table',
				},
			}),
			prisma.table.create({
				data: {
					name: 'invoice_items',
					databaseId,
					description: 'Invoice items table',
				},
			}),
			prisma.table.create({
				data: {
					name: 'customers',
					databaseId,
					description: 'Customers table',
				},
			}),
		]);

		return {
			invoices: tables[0],
			invoice_items: tables[1],
			customers: tables[2],
		};
	}

	static async createTestColumns(prisma: PrismaClient, tables: any) {
		// Create columns for invoices table
		const invoiceColumns = await Promise.all([
			prisma.column.create({
				data: { name: 'invoice_number', tableId: tables.invoices.id, type: 'TEXT' },
			}),
			prisma.column.create({
				data: { name: 'date', tableId: tables.invoices.id, type: 'DATE' },
			}),
			prisma.column.create({
				data: { name: 'due_date', tableId: tables.invoices.id, type: 'DATE' },
			}),
			prisma.column.create({
				data: { name: 'customer_id', tableId: tables.invoices.id, type: 'INTEGER' },
			}),
			prisma.column.create({
				data: { name: 'status', tableId: tables.invoices.id, type: 'TEXT' },
			}),
			prisma.column.create({
				data: { name: 'base_currency', tableId: tables.invoices.id, type: 'TEXT' },
			}),
			prisma.column.create({
				data: { name: 'total_amount', tableId: tables.invoices.id, type: 'DECIMAL' },
			}),
		]);

		// Create columns for invoice_items table
		const itemColumns = await Promise.all([
			prisma.column.create({
				data: { name: 'invoice_id', tableId: tables.invoice_items.id, type: 'INTEGER' },
			}),
			prisma.column.create({
				data: { name: 'quantity', tableId: tables.invoice_items.id, type: 'DECIMAL' },
			}),
			prisma.column.create({
				data: { name: 'price', tableId: tables.invoice_items.id, type: 'DECIMAL' },
			}),
			prisma.column.create({
				data: { name: 'description', tableId: tables.invoice_items.id, type: 'TEXT' },
			}),
		]);

		// Create columns for customers table
		const customerColumns = await Promise.all([
			prisma.column.create({
				data: { name: 'customer_name', tableId: tables.customers.id, type: 'TEXT' },
			}),
			prisma.column.create({
				data: { name: 'customer_email', tableId: tables.customers.id, type: 'TEXT' },
			}),
			prisma.column.create({
				data: { name: 'customer_address', tableId: tables.customers.id, type: 'TEXT' },
			}),
		]);

		return {
			invoiceColumns,
			itemColumns,
			customerColumns,
		};
	}

	static async cleanupTestData(prisma: PrismaClient) {
		// Clean up in reverse order of dependencies
		await prisma.cell.deleteMany();
		await prisma.row.deleteMany();
		await prisma.column.deleteMany();
		await prisma.table.deleteMany();
		await prisma.database.deleteMany();
		await prisma.tenant.deleteMany();
		await prisma.auditLog.deleteMany();
		await prisma.emailQueue.deleteMany();
		await prisma.emailTemplate.deleteMany();
		await prisma.invoiceSeries.deleteMany();
	}
}

// Global test setup
beforeAll(async () => {
	// Setup test environment
	console.log('Setting up test environment...');
});

afterAll(async () => {
	// Cleanup test environment
	console.log('Cleaning up test environment...');
});

beforeEach(async () => {
	// Setup before each test
});

afterEach(async () => {
	// Cleanup after each test
});
