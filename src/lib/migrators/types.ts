/** @format */

export interface ImportedInvoiceDTO {
	// Basic invoice information
	invoiceNumber: string;
	invoiceDate: string;
	dueDate?: string;
	currency: string;
	status: InvoiceStatus;
	
	// Customer information
	customer: {
		name: string;
		email?: string;
		vatId?: string;
		registrationNumber?: string;
		address?: string;
		city?: string;
		country?: string;
		postalCode?: string;
		phone?: string;
	};
	
	// Invoice items
	items: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
		currency: string;
		vatRate?: number;
		vatAmount?: number;
		total: number;
		sku?: string;
		category?: string;
		unitOfMeasure?: string;
	}>;
	
	// Totals
	totals: {
		subtotal: number;
		vatTotal: number;
		grandTotal: number;
		currency: string;
	};
	
	// Payment information
	paymentTerms?: string;
	paymentMethod?: string;
	notes?: string;
	
	// Import metadata
	externalId: string;
	rawData: any;
	importSource: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'credit_note' | 'proforma';

export interface ImportOptions {
	tenantId: string;
	apiKey?: string;
	filePath?: string;
	fileContent?: string;
	fileType?: 'csv' | 'json';
	deduplicationStrategy?: 'external_id' | 'invoice_number_date_customer';
	skipDuplicates?: boolean;
	dateFrom?: string;
	dateTo?: string;
	createMissingCustomers?: boolean;
	createMissingProducts?: boolean;
}

export interface ImportResult {
	success: boolean;
	imported: number;
	updated: number;
	skipped: number;
	errors: number;
	summary: {
		created: ImportedInvoiceDTO[];
		updated: ImportedInvoiceDTO[];
		skipped: Array<{ invoice: ImportedInvoiceDTO; reason: string }>;
		errors: Array<{ invoice: Partial<ImportedInvoiceDTO>; error: string }>;
	};
}

export interface Migrator {
	/**
	 * Import invoices from external source
	 */
	importInvoices(opts: ImportOptions): Promise<ImportResult>;
	
	/**
	 * Get provider name
	 */
	getProviderName(): string;
	
	/**
	 * Validate connection/credentials
	 */
	validateConnection?(opts: ImportOptions): Promise<boolean>;
	
	/**
	 * Get available invoice count (for progress tracking)
	 */
	getInvoiceCount?(opts: ImportOptions): Promise<number>;
}

export interface ExportOptions {
	tenantId: string;
	format: 'csv' | 'json';
	dateFrom?: string;
	dateTo?: string;
	status?: InvoiceStatus[];
	customerIds?: number[];
	includeItems?: boolean;
	filters?: {
		dateFrom?: string;
		dateTo?: string;
		status?: string;
		customerId?: number;
	};
	limit?: number;
}

export interface ExportResult {
	success: boolean;
	data: string;
	format: string;
	filename: string;
	recordCount: number;
	mimeType: string;
	count: number;
}
