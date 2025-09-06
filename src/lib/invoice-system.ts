/** @format */

import prisma, { DEFAULT_CACHE_STRATEGIES } from "./prisma";
import { SemanticColumnType } from "./semantic-types";

export interface InvoiceProduct {
	product_ref_table: string;
	product_ref_id: number;
	quantity: number;
	price?: number; // Optional now, will be extracted from product table
	description?: string;
	unit_of_measure?: string;
	currency?: string;
	original_price?: number;
	converted_price?: number;
}

export interface CreateInvoiceRequest {
	customer_id: number;
	products: InvoiceProduct[];
	additional_data?: Record<string, any>;
}

export interface InvoiceData {
	id: number;
	invoice_number: string;
	date: string;
	customer_id: number;
	customer_data: any;
	items: any[];
	additional_data?: Record<string, any>;
}

export class InvoiceSystemService {
	/**
	 * Initialize invoice system tables for a tenant
	 */
	static async initializeInvoiceTables(tenantId: number, databaseId: number) {
		const tables = await this.createInvoiceTables(tenantId, databaseId);
		return tables;
	}

	/**
	 * Create the three required tables for invoices
	 */
	private static async createInvoiceTables(
		tenantId: number,
		databaseId: number,
	) {
		// Create customers table
		const customersTable = await prisma.table.create({
			data: {
				name: "customers",
				description: "Customer information for invoices",
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
		await this.createCustomerColumns(customersTable.id);

		// Create predefined columns for invoices table
		await this.createInvoiceColumns(invoicesTable.id);

		// Create company information table
		await this.createCompanyColumns(customersTable.id);

		// Create predefined columns for invoice_items table
		await this.createInvoiceItemColumns(
			invoiceItemsTable.id,
			invoicesTable.id,
			customersTable.id,
		);

		return {
			customers: customersTable,
			invoices: invoicesTable,
			invoice_items: invoiceItemsTable,
		};
	}

	/**
	 * Create predefined columns for company information
	 */
	private static async createCompanyColumns(tableId: number) {
		const columns = [
			{
				name: "company_name",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_NAME,
				required: true,
				primary: false,
				order: 1,
				isLocked: true,
			},
			{
				name: "company_tax_id",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_TAX_ID,
				required: true,
				primary: false,
				order: 2,
				isLocked: true,
			},
			{
				name: "company_registration_number",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_REGISTRATION_NUMBER,
				required: true,
				primary: false,
				order: 3,
				isLocked: true,
			},
			{
				name: "company_street",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_STREET,
				required: true,
				primary: false,
				order: 4,
				isLocked: true,
			},
			{
				name: "company_street_number",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_STREET_NUMBER,
				required: true,
				primary: false,
				order: 5,
				isLocked: true,
			},
			{
				name: "company_city",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_CITY,
				required: true,
				primary: false,
				order: 6,
				isLocked: true,
			},
			{
				name: "company_country",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_COUNTRY,
				required: true,
				primary: false,
				order: 7,
				isLocked: true,
			},
			{
				name: "company_postal_code",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_POSTAL_CODE,
				required: true,
				primary: false,
				order: 8,
				isLocked: true,
			},
			{
				name: "company_iban",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_IBAN,
				required: false,
				primary: false,
				order: 9,
				isLocked: false,
			},
			{
				name: "company_bic",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_BIC,
				required: false,
				primary: false,
				order: 10,
				isLocked: false,
			},
			{
				name: "company_bank",
				type: "string",
				semanticType: SemanticColumnType.COMPANY_BANK,
				required: false,
				primary: false,
				order: 11,
				isLocked: false,
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
	 * Create predefined columns for customers table
	 */
	private static async createCustomerColumns(tableId: number) {
		const columns = [
			{
				name: "customer_name",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_NAME,
				required: true,
				primary: false,
				order: 1,
				isLocked: true,
			},
			{
				name: "customer_email",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_EMAIL,
				required: true,
				primary: false,
				order: 2,
				isLocked: true,
			},
			{
				name: "customer_tax_id",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_TAX_ID,
				required: true,
				primary: false,
				order: 3,
				isLocked: true,
			},
			{
				name: "customer_registration_number",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_REGISTRATION_NUMBER,
				required: false,
				primary: false,
				order: 4,
				isLocked: true,
			},
			{
				name: "customer_street",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_STREET,
				required: true,
				primary: false,
				order: 5,
				isLocked: true,
			},
			{
				name: "customer_street_number",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_STREET_NUMBER,
				required: true,
				primary: false,
				order: 6,
				isLocked: true,
			},
			{
				name: "customer_address",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_ADDRESS,
				required: false,
				primary: false,
				order: 7,
				isLocked: true,
			},
			{
				name: "customer_city",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_CITY,
				required: true,
				primary: false,
				order: 8,
				isLocked: true,
			},
			{
				name: "customer_country",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_COUNTRY,
				required: true,
				primary: false,
				order: 9,
				isLocked: true,
			},
			{
				name: "customer_postal_code",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_POSTAL_CODE,
				required: true,
				primary: false,
				order: 10,
				isLocked: true,
			},
			{
				name: "customer_phone",
				type: "string",
				semanticType: SemanticColumnType.CUSTOMER_PHONE,
				required: false,
				primary: false,
				order: 11,
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
	private static async createInvoiceColumns(tableId: number) {
		const columns = [
			{
				name: "invoice_number",
				type: "string",
				semanticType: SemanticColumnType.INVOICE_NUMBER,
				required: true,
				primary: false,
				order: 1,
				isLocked: true,
			},
			{
				name: "invoice_series",
				type: "string",
				semanticType: SemanticColumnType.INVOICE_SERIES,
				required: true,
				primary: false,
				order: 2,
				isLocked: true,
			},
			{
				name: "date",
				type: "date",
				semanticType: SemanticColumnType.INVOICE_DATE,
				required: true,
				primary: false,
				order: 3,
				isLocked: true,
			},
			{
				name: "due_date",
				type: "date",
				semanticType: SemanticColumnType.INVOICE_DUE_DATE,
				required: true,
				primary: false,
				order: 4,
				isLocked: true,
			},
			{
				name: "customer_id",
				type: "reference",
				semanticType: SemanticColumnType.INVOICE_CUSTOMER_ID,
				required: true,
				primary: false,
				order: 5,
				isLocked: true,
			},
			{
				name: "status",
				type: "string",
				semanticType: SemanticColumnType.INVOICE_STATUS,
				required: true,
				primary: false,
				order: 6,
				isLocked: true,
			},
			{
				name: "payment_terms",
				type: "string",
				semanticType: SemanticColumnType.INVOICE_PAYMENT_TERMS,
				required: false,
				primary: false,
				order: 7,
				isLocked: false,
			},
			{
				name: "payment_method",
				type: "string",
				semanticType: SemanticColumnType.INVOICE_PAYMENT_METHOD,
				required: false,
				primary: false,
				order: 8,
				isLocked: false,
			},
			{
				name: "late_fee",
				type: "number",
				semanticType: SemanticColumnType.INVOICE_LATE_FEE,
				required: false,
				primary: false,
				order: 9,
				isLocked: false,
			},
			{
				name: "notes",
				type: "string",
				semanticType: SemanticColumnType.INVOICE_NOTES,
				required: false,
				primary: false,
				order: 10,
				isLocked: false,
			},
			{
				name: "base_currency",
				type: "string",
				semanticType: SemanticColumnType.INVOICE_BASE_CURRENCY,
				required: false,
				primary: false,
				order: 11,
				isLocked: false,
			},
			{
				name: "total_amount",
				type: "number",
				semanticType: SemanticColumnType.INVOICE_TOTAL_AMOUNT,
				required: false,
				primary: false,
				order: 12,
				isLocked: false,
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
	private static async createInvoiceItemColumns(
		tableId: number,
		invoiceTableId: number,
		customerTableId: number,
	) {
		const columns = [
			{
				name: "invoice_id",
				type: "reference",
				semanticType: SemanticColumnType.INVOICE_NUMBER,
				required: true,
				primary: false,
				order: 1,
				isLocked: true,
				referenceTableId: invoiceTableId,
			},
			{
				name: "product_ref_table",
				type: "string",
				semanticType: SemanticColumnType.REFERENCE,
				required: true,
				primary: false,
				order: 2,
				isLocked: true,
			},
			{
				name: "product_ref_id",
				type: "number",
				semanticType: SemanticColumnType.ID,
				required: true,
				primary: false,
				order: 3,
				isLocked: true,
			},
			{
				name: "quantity",
				type: "number",
				semanticType: SemanticColumnType.QUANTITY,
				required: true,
				primary: false,
				order: 4,
				isLocked: true,
			},
			{
				name: "unit_of_measure",
				type: "string",
				semanticType: SemanticColumnType.UNIT_OF_MEASURE,
				required: true,
				primary: false,
				order: 5,
				isLocked: true,
			},
			{
				name: "price",
				type: "number",
				semanticType: SemanticColumnType.UNIT_PRICE,
				required: true,
				primary: false,
				order: 6,
				isLocked: true,
			},
			{
				name: "currency",
				type: "string",
				semanticType: SemanticColumnType.CURRENCY,
				required: true,
				primary: false,
				order: 7,
				isLocked: true,
			},
			// Adăugăm coloane pentru toate detaliile produsului cu tipuri semantice
			{
				name: "product_name",
				type: "string",
				semanticType: SemanticColumnType.PRODUCT_NAME,
				required: false,
				primary: false,
				order: 8,
				isLocked: false,
			},
			{
				name: "product_description",
				type: "string",
				semanticType: SemanticColumnType.PRODUCT_DESCRIPTION,
				required: false,
				primary: false,
				order: 9,
				isLocked: false,
			},
			{
				name: "product_category",
				type: "string",
				semanticType: SemanticColumnType.PRODUCT_CATEGORY,
				required: false,
				primary: false,
				order: 10,
				isLocked: false,
			},
			{
				name: "product_sku",
				type: "string",
				semanticType: SemanticColumnType.PRODUCT_SKU,
				required: false,
				primary: false,
				order: 11,
				isLocked: false,
			},
			{
				name: "product_brand",
				type: "string",
				semanticType: SemanticColumnType.PRODUCT_BRAND,
				required: false,
				primary: false,
				order: 12,
				isLocked: false,
			},
			{
				name: "product_weight",
				type: "number",
				semanticType: SemanticColumnType.PRODUCT_WEIGHT,
				required: false,
				primary: false,
				order: 13,
				isLocked: false,
			},
			{
				name: "product_dimensions",
				type: "string",
				semanticType: SemanticColumnType.PRODUCT_DIMENSIONS,
				required: false,
				primary: false,
				order: 14,
				isLocked: false,
			},
			{
				name: "product_vat",
				type: "number",
				semanticType: SemanticColumnType.PRODUCT_VAT,
				required: true,
				primary: false,
				order: 15,
				isLocked: false,
			},
			{
				name: "description",
				type: "string",
				semanticType: SemanticColumnType.DESCRIPTION,
				required: false,
				primary: false,
				order: 16,
				isLocked: false,
			},
			// Tax and discount columns
			{
				name: "tax_rate",
				type: "number",
				semanticType: SemanticColumnType.TAX_RATE,
				required: false,
				primary: false,
				order: 17,
				isLocked: false,
			},
			{
				name: "tax_amount",
				type: "number",
				semanticType: SemanticColumnType.TAX_AMOUNT,
				required: false,
				primary: false,
				order: 18,
				isLocked: false,
			},
			{
				name: "discount_rate",
				type: "number",
				semanticType: SemanticColumnType.DISCOUNT_RATE,
				required: false,
				primary: false,
				order: 19,
				isLocked: false,
			},
			{
				name: "discount_amount",
				type: "number",
				semanticType: SemanticColumnType.DISCOUNT_AMOUNT,
				required: false,
				primary: false,
				order: 20,
				isLocked: false,
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
	 * Check if a table is protected
	 */
	static async isTableProtected(tableId: number): Promise<boolean> {
		const table = await prisma.findUniqueWithCache(
			prisma.table,
			{
				where: { id: tableId },
				select: { isProtected: true },
			},
			DEFAULT_CACHE_STRATEGIES.table,
		);
		return table?.isProtected || false;
	}

	/**
	 * Check if a column is locked
	 */
	static async isColumnLocked(columnId: number): Promise<boolean> {
		const column = await prisma.findUniqueWithCache(
			prisma.column,
			{
				where: { id: columnId },
				select: { isLocked: true },
			},
			DEFAULT_CACHE_STRATEGIES.column,
		);
		return column?.isLocked || false;
	}

	/**
	 * Get invoice tables for a tenant
	 */
	static async getInvoiceTables(tenantId: number, databaseId: number) {
		const tables = await prisma.findManyWithCache(
			prisma.table,
			{
				where: {
					databaseId,
					database: { tenantId },
					isProtected: true,
					protectedType: { in: ["customers", "invoices", "invoice_items"] },
				},
				include: {
					columns: true,
				},
			},
			DEFAULT_CACHE_STRATEGIES.tableList,
		);

		return {
			customers: tables.find((t: any) => t.protectedType === "customers"),
			invoices: tables.find((t: any) => t.protectedType === "invoices"),
			invoice_items: tables.find(
				(t: any) => t.protectedType === "invoice_items",
			),
		};
	}

	/**
	 * Generate the next invoice number for a tenant
	 * Enhanced version with better auto-incrementing and series management
	 */
	static async generateInvoiceNumber(
		tenantId: number,
		databaseId: number,
		series: string = "INV",
		options: {
			year?: number;
			month?: number;
			resetYearly?: boolean;
			resetMonthly?: boolean;
			startNumber?: number;
		} = {},
	): Promise<{ number: string; series: string; fullNumber: string }> {
		const invoicesTable = await prisma.findFirstWithCache(
			prisma.table,
			{
				where: {
					databaseId,
					database: { tenantId },
					protectedType: "invoices",
				},
			},
			DEFAULT_CACHE_STRATEGIES.table,
		);

		if (!invoicesTable) {
			throw new Error("Invoices table not found");
		}

		// Get current date for year/month-based series
		const now = new Date();
		const currentYear = options.year || now.getFullYear();
		const currentMonth = options.month || now.getMonth() + 1;

		// Create series identifier (e.g., "INV-2025-01" for monthly reset, "INV-2025" for yearly reset)
		let seriesIdentifier = series;
		if (options.resetMonthly) {
			seriesIdentifier = `${series}-${currentYear}-${currentMonth
				.toString()
				.padStart(2, "0")}`;
		} else if (options.resetYearly) {
			seriesIdentifier = `${series}-${currentYear}`;
		}

		// Get the last invoice number for this series
		const lastInvoice = await prisma.findFirstWithCache(
			prisma.row,
			{
				where: { tableId: invoicesTable.id },
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
				orderBy: { id: "desc" },
			},
			DEFAULT_CACHE_STRATEGIES.row,
		);

		let lastNumber = options.startNumber || 0;
		if (lastInvoice && lastInvoice.cells) {
			const invoiceNumberCell = lastInvoice.cells.find(
				(cell: any) => cell.column.name === "invoice_number",
			);
			const seriesCell = lastInvoice.cells.find(
				(cell: any) => cell.column.name === "invoice_series",
			);

			if (invoiceNumberCell?.value && seriesCell?.value === seriesIdentifier) {
				// Extract number from invoice number (e.g., "INV-2025-01-000001" → 1)
				const match = invoiceNumberCell.value
					.toString()
					.match(
						new RegExp(
							`${seriesIdentifier.replace(
								/[.*+?^${}()|[\]\\]/g,
								"\\$&",
							)}-(\\d+)`,
						),
					);
				if (match) {
					lastNumber = parseInt(match[1]);
				}
			}
		}

		const nextNumber = lastNumber + 1;
		const paddedNumber = nextNumber.toString().padStart(6, "0");

		// Create the full invoice number
		const fullNumber = `${seriesIdentifier}-${paddedNumber}`;

		return {
			number: fullNumber,
			series: seriesIdentifier,
			fullNumber: fullNumber,
		};
	}

	/**
	 * Generate invoice number with tenant-specific configuration
	 * This method provides more flexibility and better series management
	 */
	static async generateInvoiceNumberWithConfig(
		tenantId: number,
		databaseId: number,
		config: {
			series?: string;
			prefix?: string;
			suffix?: string;
			resetYearly?: boolean;
			resetMonthly?: boolean;
			startNumber?: number;
			includeYear?: boolean;
			includeMonth?: boolean;
			separator?: string;
		} = {},
	): Promise<{
		number: string;
		series: string;
		fullNumber: string;
		breakdown: any;
	}> {
		const defaultConfig = {
			series: "INV",
			prefix: "",
			suffix: "",
			resetYearly: false,
			resetMonthly: false,
			startNumber: 1,
			includeYear: false,
			includeMonth: false,
			separator: "-",
			...config,
		};

		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth() + 1;

		// Build series identifier
		let seriesParts = [defaultConfig.series];

		if (defaultConfig.includeYear) {
			seriesParts.push(currentYear.toString());
		}

		if (defaultConfig.includeMonth) {
			seriesParts.push(currentMonth.toString().padStart(2, "0"));
		}

		const seriesIdentifier = seriesParts.join(defaultConfig.separator);

		// Get the last invoice number for this series
		const invoicesTable = await prisma.findFirstWithCache(
			prisma.table,
			{
				where: {
					databaseId,
					database: { tenantId },
					protectedType: "invoices",
				},
			},
			DEFAULT_CACHE_STRATEGIES.table,
		);

		if (!invoicesTable) {
			throw new Error("Invoices table not found");
		}

		const lastInvoice = await prisma.findFirstWithCache(
			prisma.row,
			{
				where: { tableId: invoicesTable.id },
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
				orderBy: { id: "desc" },
			},
			DEFAULT_CACHE_STRATEGIES.row,
		);

		let lastNumber = defaultConfig.startNumber - 1;
		if (lastInvoice && lastInvoice.cells) {
			const invoiceNumberCell = lastInvoice.cells.find(
				(cell: any) => cell.column.name === "invoice_number",
			);
			const seriesCell = lastInvoice.cells.find(
				(cell: any) => cell.column.name === "invoice_series",
			);

			if (invoiceNumberCell?.value && seriesCell?.value === seriesIdentifier) {
				// Extract number from invoice number
				const regexPattern =
					seriesIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
					defaultConfig.separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
					"(\\d+)";
				const match = invoiceNumberCell.value
					.toString()
					.match(new RegExp(regexPattern));
				if (match) {
					lastNumber = parseInt(match[1]);
				}
			}
		}

		const nextNumber = lastNumber + 1;
		const paddedNumber = nextNumber.toString().padStart(6, "0");

		// Build the full invoice number
		const numberParts = [];
		if (defaultConfig.prefix) numberParts.push(defaultConfig.prefix);
		numberParts.push(seriesIdentifier);
		numberParts.push(paddedNumber);
		if (defaultConfig.suffix) numberParts.push(defaultConfig.suffix);

		const fullNumber = numberParts.join(defaultConfig.separator);

		return {
			number: fullNumber,
			series: seriesIdentifier,
			fullNumber: fullNumber,
			breakdown: {
				prefix: defaultConfig.prefix,
				series: seriesIdentifier,
				number: paddedNumber,
				suffix: defaultConfig.suffix,
				separator: defaultConfig.separator,
				year: currentYear,
				month: currentMonth,
				nextNumber: nextNumber,
			},
		};
	}

	/**
	 * Update an existing invoice
	 */
	static async updateInvoice(
		tenantId: number,
		databaseId: number,
		invoiceId: number,
		updateData: {
			customer_id: number;
			base_currency: string;
			products: InvoiceProduct[];
			payment_terms?: string;
			payment_method?: string;
			notes?: string;
			due_date?: string;
		},
	) {
		// Get invoice tables
		const invoiceTables = await this.getInvoiceTables(tenantId, databaseId);
		if (!invoiceTables.invoices || !invoiceTables.invoice_items) {
			throw new Error("Invoice system not initialized");
		}

		// Additional validation to ensure tables have IDs
		if (!invoiceTables.invoices.id || !invoiceTables.invoice_items.id) {
			throw new Error("Invoice tables missing required ID fields");
		}

		// Verify invoice exists
		const existingInvoice = await prisma.findUniqueWithCache(
			prisma.row,
			{
				where: { id: invoiceId },
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
			},
			DEFAULT_CACHE_STRATEGIES.row,
		);

		if (!existingInvoice) {
			throw new Error("Invoice not found");
		}

		// Get invoice columns
		const invoiceColumns = await prisma.findManyWithCache(
			prisma.column,
			{ where: { tableId: invoiceTables.invoices.id } },
			DEFAULT_CACHE_STRATEGIES.columnList,
		);

		// Update invoice fields (customer_id, base_currency, etc.)
		const invoiceColumnMap = invoiceColumns.reduce((acc: any, col: any) => {
			acc[col.name] = col;
			return acc;
		}, {} as Record<string, any>);

		// Update customer_id if changed
		if (updateData.customer_id && existingInvoice.cells) {
			const customerIdCell = existingInvoice.cells.find(
				(cell: any) => cell.column.name === "customer_id",
			);
			if (customerIdCell && invoiceColumnMap.customer_id) {
				await prisma.cell.update({
					where: { id: customerIdCell.id },
					data: { value: updateData.customer_id },
				});
			}
		}

		// Update base_currency if changed
		if (updateData.base_currency && existingInvoice.cells) {
			const baseCurrencyCell = existingInvoice.cells.find(
				(cell: any) => cell.column.name === "base_currency",
			);
			if (baseCurrencyCell && invoiceColumnMap.base_currency) {
				await prisma.cell.update({
					where: { id: baseCurrencyCell.id },
					data: { value: updateData.base_currency },
				});
			}
		}

		// Update payment_terms if changed
		if (updateData.payment_terms && existingInvoice.cells) {
			const paymentTermsCell = existingInvoice.cells.find(
				(cell: any) => cell.column.name === "payment_terms",
			);
			if (paymentTermsCell && invoiceColumnMap.payment_terms) {
				await prisma.cell.update({
					where: { id: paymentTermsCell.id },
					data: { value: updateData.payment_terms },
				});
			}
		}

		// Update payment_method if changed
		if (updateData.payment_method && existingInvoice.cells) {
			const paymentMethodCell = existingInvoice.cells.find(
				(cell: any) => cell.column.name === "payment_method",
			);
			if (paymentMethodCell && invoiceColumnMap.payment_method) {
				await prisma.cell.update({
					where: { id: paymentMethodCell.id },
					data: { value: updateData.payment_method },
				});
			}
		}

		// Update notes if changed
		if (updateData.notes && existingInvoice.cells) {
			const notesCell = existingInvoice.cells.find(
				(cell: any) => cell.column.name === "notes",
			);
			if (notesCell && invoiceColumnMap.notes) {
				await prisma.cell.update({
					where: { id: notesCell.id },
					data: { value: updateData.notes },
				});
			}
		}

		// Update due_date if changed
		if (updateData.due_date && existingInvoice.cells) {
			const dueDateCell = existingInvoice.cells.find(
				(cell: any) => cell.column.name === "due_date",
			);
			if (dueDateCell && invoiceColumnMap.due_date) {
				await prisma.cell.update({
					where: { id: dueDateCell.id },
					data: { value: updateData.due_date },
				});
			}
		}

		// Delete existing invoice items
		const existingItems = await prisma.findManyWithCache(
			prisma.row,
			{
				where: {
					tableId: invoiceTables.invoice_items.id,
					cells: {
						some: {
							column: { name: "invoice_id" },
							value: { equals: invoiceId },
						},
					},
				},
			},
			DEFAULT_CACHE_STRATEGIES.rowList,
		);

		// Delete cells and rows for existing items
		for (const item of existingItems) {
			await prisma.cell.deleteMany({
				where: { rowId: item.id },
			});
			await prisma.row.delete({
				where: { id: item.id },
			});
		}

		// Get invoice item columns
		const itemColumns = await prisma.findManyWithCache(
			prisma.column,
			{ where: { tableId: invoiceTables.invoice_items.id } },
			DEFAULT_CACHE_STRATEGIES.columnList,
		);

		const itemColumnMap = itemColumns.reduce((acc: any, col: any) => {
			acc[col.name] = col;
			return acc;
		}, {} as Record<string, any>);

		// Validate required columns exist
		const requiredColumns = ['invoice_id', 'product_ref_table', 'product_ref_id', 'quantity', 'price'];
		for (const colName of requiredColumns) {
			if (!itemColumnMap[colName] || !itemColumnMap[colName].id) {
				throw new Error(`Required column '${colName}' not found in invoice_items table`);
			}
		}

		// Create new invoice items
		for (const product of updateData.products) {
			// Get product details from referenced table
			const productTable = await prisma.findFirstWithCache(
				prisma.table,
				{
					where: {
						name: product.product_ref_table,
						databaseId: databaseId,
					},
				},
				DEFAULT_CACHE_STRATEGIES.table,
			);

			if (!productTable) {
				throw new Error(
					`Product table '${product.product_ref_table}' not found`,
				);
			}

			const productRow = await prisma.findUniqueWithCache(
				prisma.row,
				{
					where: { id: product.product_ref_id },
					include: {
						cells: {
							include: {
								column: true,
							},
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.row,
			);

			if (!productRow) {
				throw new Error(
					`Product with ID ${product.product_ref_id} not found in table ${product.product_ref_table}`,
				);
			}

			// Extract product details
			const productDetails: any = {};
			productRow.cells.forEach((cell: any) => {
				productDetails[cell.column.name] = cell.value;
			});

			// Create new invoice item row
			const itemRow = await prisma.row.create({
				data: { tableId: invoiceTables.invoice_items.id },
			});

			// Create cells for the item
			const itemCells = [
				{
					rowId: itemRow.id,
					columnId: itemColumnMap.invoice_id.id,
					value: invoiceId,
				},
				{
					rowId: itemRow.id,
					columnId: itemColumnMap.product_ref_table.id,
					value: product.product_ref_table,
				},
				{
					rowId: itemRow.id,
					columnId: itemColumnMap.product_ref_id.id,
					value: product.product_ref_id,
				},
				{
					rowId: itemRow.id,
					columnId: itemColumnMap.quantity.id,
					value: product.quantity,
				},
				{
					rowId: itemRow.id,
					columnId: itemColumnMap.price.id,
					value: product.price || productDetails.price || 0,
				},
			];

			// Add product details if columns exist
			if (itemColumnMap.product_name && productDetails.name) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.product_name.id,
					value: productDetails.name,
				});
			}

			if (itemColumnMap.product_description && productDetails.description) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.product_description.id,
					value: productDetails.description,
				});
			}

			if (itemColumnMap.product_category && productDetails.category) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.product_category.id,
					value: productDetails.category,
				});
			}

			if (itemColumnMap.product_sku && productDetails.sku) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.product_sku.id,
					value: productDetails.sku,
				});
			}

			if (itemColumnMap.product_brand && productDetails.brand) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.product_brand.id,
					value: productDetails.brand,
				});
			}

			if (itemColumnMap.product_weight && productDetails.weight) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.product_weight.id,
					value: productDetails.weight,
				});
			}

			if (itemColumnMap.product_dimensions && productDetails.dimensions) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.product_dimensions.id,
					value: productDetails.dimensions,
				});
			}

			if (itemColumnMap.unit_of_measure && product.unit_of_measure) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.unit_of_measure.id,
					value: product.unit_of_measure,
				});
			}

			if (itemColumnMap.description && product.description) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.description.id,
					value: product.description,
				});
			}

			if (itemColumnMap.currency && product.currency) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.currency.id,
					value: product.currency,
				});
			}

			if (itemColumnMap.product_vat && productDetails.vat) {
				itemCells.push({
					rowId: itemRow.id,
					columnId: itemColumnMap.product_vat.id,
					value: productDetails.vat,
				});
			}

			// Create all cells for this item
			await prisma.cell.createMany({
				data: itemCells,
			});
		}

		// Return updated invoice data
		return {
			id: invoiceId,
			customer_id: updateData.customer_id,
			base_currency: updateData.base_currency,
			payment_terms: updateData.payment_terms,
			payment_method: updateData.payment_method,
			notes: updateData.notes,
			due_date: updateData.due_date,
			products: updateData.products,
		};
	}

	/**
	 * Update existing invoice tables schema to include missing columns
	 */
	static async updateInvoiceTablesSchema(
		tenantId: number,
		databaseId: number,
	): Promise<void> {
		// Get existing invoice tables
		const existingTables = await this.getInvoiceTables(tenantId, databaseId);

		if (!existingTables.invoice_items) {
			console.log("No existing invoice_items table found, nothing to update");
			return;
		}

		// Check which required columns are missing
		const existingColumns = existingTables.invoice_items.columns || [];
		const requiredColumns = [
			{ name: "product_vat", type: "number", semanticType: SemanticColumnType.PRODUCT_VAT, order: 15 },
			{ name: "price", type: "number", semanticType: SemanticColumnType.UNIT_PRICE, order: 6 },
		];

		const missingColumns = requiredColumns.filter(col => 
			!existingColumns.some((existing: any) => existing.name === col.name)
		);

		if (missingColumns.length === 0) {
			console.log("All required columns already exist, no update needed");
			return;
		}

		console.log("Adding missing columns to invoice_items table:", missingColumns.map(c => c.name));

		// Add missing columns
		for (const col of missingColumns) {
			await prisma.column.create({
				data: {
					name: col.name,
					type: col.type,
					semanticType: col.semanticType,
					required: true,
					primary: false,
					order: col.order,
					isLocked: false,
					tableId: existingTables.invoice_items.id,
				},
			});
		}

		// Update order for subsequent columns if they exist
		const columnsToUpdate = [
			{ name: "product_name", newOrder: 16 },
			{ name: "product_description", newOrder: 17 },
			{ name: "product_category", newOrder: 18 },
			{ name: "product_brand", newOrder: 19 },
			{ name: "product_sku", newOrder: 20 },
			{ name: "description", newOrder: 21 },
			{ name: "tax_rate", newOrder: 22 },
			{ name: "tax_amount", newOrder: 23 },
			{ name: "discount_rate", newOrder: 24 },
			{ name: "discount_amount", newOrder: 25 },
		];

		for (const colUpdate of columnsToUpdate) {
			const column = existingColumns.find(
				(col: any) => col.name === colUpdate.name,
			);
			if (column) {
				await prisma.column.update({
					where: { id: column.id },
					data: { order: colUpdate.newOrder },
				});
			}
		}

		console.log("Successfully updated invoice_items table schema");
	}

	/**
	 * Get the next invoice number for display purposes (without creating the invoice)
	 * Useful for showing users what the next invoice number will be
	 */
	static async getNextInvoiceNumber(
		tenantId: number,
		databaseId: number,
		config: {
			series?: string;
			prefix?: string;
			suffix?: string;
			resetYearly?: boolean;
			resetMonthly?: boolean;
			startNumber?: number;
			includeYear?: boolean;
			includeMonth?: boolean;
			separator?: string;
		} = {},
	): Promise<{
		number: string;
		series: string;
		fullNumber: string;
		breakdown: any;
	}> {
		// This method is identical to generateInvoiceNumberWithConfig but doesn't create the invoice
		// It's useful for previewing the next invoice number
		return this.generateInvoiceNumberWithConfig(tenantId, databaseId, config);
	}

	/**
	 * Get invoice numbering statistics for a tenant
	 * Useful for analytics and reporting
	 */
	static async getInvoiceNumberingStats(
		tenantId: number,
		databaseId: number,
	): Promise<{
		totalInvoices: number;
		seriesBreakdown: Record<string, number>;
		lastInvoiceNumber: string | null;
		nextInvoiceNumber: string;
		yearlyStats: Record<number, number>;
		monthlyStats: Record<string, number>;
	}> {
		const invoicesTable = await prisma.findFirstWithCache(
			prisma.table,
			{
				where: {
					databaseId,
					database: { tenantId },
					protectedType: "invoices",
				},
			},
			DEFAULT_CACHE_STRATEGIES.table,
		);

		if (!invoicesTable) {
			throw new Error("Invoices table not found");
		}

		// Get all invoices for this tenant
		const allInvoices = await prisma.findManyWithCache(
			prisma.row,
			{
				where: { tableId: invoicesTable.id },
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
				orderBy: { id: "desc" },
			},
			DEFAULT_CACHE_STRATEGIES.rowList,
		);

		const stats = {
			totalInvoices: allInvoices.length,
			seriesBreakdown: {} as Record<string, number>,
			lastInvoiceNumber: null as string | null,
			nextInvoiceNumber: "",
			yearlyStats: {} as Record<number, number>,
			monthlyStats: {} as Record<string, number>,
		};

		// Process each invoice to build statistics
		for (const invoice of allInvoices) {
			if (!invoice.cells) continue;
			
			const invoiceNumberCell = invoice.cells.find(
				(cell: any) => cell.column.name === "invoice_number",
			);
			const seriesCell = invoice.cells.find(
				(cell: any) => cell.column.name === "invoice_series",
			);
			const dateCell = invoice.cells.find(
				(cell: any) => cell.column.name === "date",
			);

			if (invoiceNumberCell?.value) {
				const invoiceNumber = invoiceNumberCell.value.toString();

				// Set last invoice number if this is the first one processed
				if (!stats.lastInvoiceNumber) {
					stats.lastInvoiceNumber = invoiceNumber;
				}

				// Count by series
				if (seriesCell?.value) {
					const series = seriesCell.value.toString();
					stats.seriesBreakdown[series] =
						(stats.seriesBreakdown[series] || 0) + 1;
				}

				// Count by year and month
				if (dateCell?.value) {
					try {
						const date = new Date(dateCell.value.toString());
						const year = date.getFullYear();
						const month = date.getMonth() + 1;
						const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

						stats.yearlyStats[year] = (stats.yearlyStats[year] || 0) + 1;
						stats.monthlyStats[monthKey] =
							(stats.monthlyStats[monthKey] || 0) + 1;
					} catch (error) {
						console.error("Error parsing invoice date:", error);
					}
				}
			}
		}

		// Generate the next invoice number
		const nextInvoiceData = await this.generateInvoiceNumberWithConfig(
			tenantId,
			databaseId,
			{
				series: "INV",
				includeYear: true,
				// Don't specify startNumber - let it auto-calculate from existing invoices
			},
		);
		stats.nextInvoiceNumber = nextInvoiceData.number;

		return stats;
	}
}
