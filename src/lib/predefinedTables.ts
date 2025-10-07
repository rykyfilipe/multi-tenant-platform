/** @format */

import prisma from "@/lib/prisma";
import { SemanticColumnType } from "./semantic-types";

/**
 * Creates predefined tables for a new database
 * This includes the basic invoice system tables: customers, invoices, and invoice_items
 */
export default async function createPredefinedTables(databaseId: number) {
	try {
		// Create customers table
		const customersTable = await prisma.table.create({
			data: {
				name: "customers",
				description: "Customer information",
				databaseId,
				isProtected: true,
				protectedType: "customers",
			},
		});

		// Create invoices table
		const invoicesTable = await prisma.table.create({
			data: {
				name: "invoices",
				description: "Invoice headers",
				databaseId,
				isProtected: true,
				protectedType: "invoices",
			},
		});

		// Create invoice_items table
		const invoiceItemsTable = await prisma.table.create({
			data: {
				name: "invoice_items",
				description: "Invoice line items",
				databaseId,
				isProtected: true,
				protectedType: "invoice_items",
			},
		});

		// Create predefined columns for customers table
		await createCustomerColumns(customersTable.id);

		// Create predefined columns for invoices table
		await createInvoiceColumns(invoicesTable.id, customersTable.id);

		// Create predefined columns for invoice_items table
		await createInvoiceItemColumns(invoiceItemsTable.id, invoicesTable.id);
		return {
			customers: customersTable,
			invoices: invoicesTable,
			invoice_items: invoiceItemsTable,
		};
	} catch (error) {
		console.error("❌ Error creating predefined tables:", error);
		throw error;
	}
}

/**
 * Create predefined columns for customers table
 */
async function createCustomerColumns(tableId: number) {
	const columns = [
		{
			name: "created_at",
			type: "date",
			semanticType: "created_date",
			description: "Record creation timestamp (auto-generated)",
			required: false,
			defaultValue: new Date().toISOString(),
			order: 0,
			isLocked: true,
		},
		{
			name: "customer_name",
			type: "string",
			semanticType: SemanticColumnType.CUSTOMER_NAME,
			required: true,
			order: 1,
			isLocked: true,
		},
		{
			name: "customer_email",
			type: "string",
			semanticType: SemanticColumnType.CUSTOMER_EMAIL,
			required: true,
			order: 2,
			isLocked: true,
		},
		{
			name: "customer_address",
			type: "string",
			semanticType: SemanticColumnType.CUSTOMER_ADDRESS,
			required: false,
			order: 3,
			isLocked: true,
		},
	];

	for (const column of columns) {
		await prisma.column.create({
			data: {
				...column,
				tableId,
			},
		});
	}
}

/**
 * Create predefined columns for invoices table
 */
async function createInvoiceColumns(tableId: number, customersTableId: number) {
	const columns = [
		{
			name: "created_at",
			type: "date",
			semanticType: "created_date",
			description: "Record creation timestamp (auto-generated)",
			required: false,
			defaultValue: new Date().toISOString(),
			order: 0,
			isLocked: true,
		},
		{
			name: "invoice_number",
			type: "string",
			semanticType: SemanticColumnType.INVOICE_NUMBER,
			required: true,
			order: 1,
			isLocked: true,
		},
		{
			name: "date",
			type: "date",
			semanticType: SemanticColumnType.INVOICE_DATE,
			required: true,
			order: 2,
			isLocked: true,
		},
		{
			name: "due_date",
			type: "date",
			semanticType: SemanticColumnType.INVOICE_DUE_DATE,
			required: false,
			order: 3,
			isLocked: true,
		},
		{
			name: "customer_id",
			type: "reference",
			semanticType: SemanticColumnType.REFERENCE,
			required: true,
			order: 4,
			isLocked: true,
			referenceTableId: customersTableId,
		},
		{
			name: "total_amount",
			type: "number",
			semanticType: SemanticColumnType.INVOICE_TOTAL,
			required: true,
			order: 5,
			isLocked: true,
		},
		{
			name: "status",
			type: "string",
			semanticType: SemanticColumnType.INVOICE_STATUS,
			required: true,
			order: 6,
			isLocked: true,
		},
	];

	for (const column of columns) {
		await prisma.column.create({
			data: {
				...column,
				tableId,
			},
		});
	}
}

/**
 * Create predefined columns for invoice_items table
 */
async function createInvoiceItemColumns(
	tableId: number,
	invoicesTableId: number,
) {
	const columns = [
		{
			name: "created_at",
			type: "date",
			semanticType: "created_date",
			description: "Record creation timestamp (auto-generated)",
			required: false,
			defaultValue: new Date().toISOString(),
			order: 0,
			isLocked: true,
		},
		{
			name: "invoice_id",
			type: "reference",
			semanticType: SemanticColumnType.REFERENCE,
			required: true,
			order: 1,
			isLocked: true,
			referenceTableId: invoicesTableId,
		},
		{
			name: "description",
			type: "string",
			semanticType: SemanticColumnType.DESCRIPTION,
			required: true,
			order: 2,
			isLocked: true,
		},
		{
			name: "quantity",
			type: "number",
			semanticType: SemanticColumnType.QUANTITY,
			required: true,
			order: 3,
			isLocked: true,
		},
		{
			name: "unit_price",
			type: "number",
			semanticType: SemanticColumnType.UNIT_PRICE,
			required: true,
			order: 4,
			isLocked: true,
		},
		{
			name: "total_price",
			type: "number",
			semanticType: SemanticColumnType.TOTAL_PRICE,
			required: true,
			order: 5,
			isLocked: true,
		},
	];

	for (const column of columns) {
		await prisma.column.create({
			data: {
				...column,
				tableId,
			},
		});
	}
}
