/** @format */

import { BaseMigrator } from './base-migrator';
import { ImportOptions, ImportResult, ImportedInvoiceDTO } from './types';
import prisma from '@/lib/prisma';
import { InvoiceSystemService } from '@/lib/invoice-system';

export class FGOMigrator extends BaseMigrator {
	getProviderName(): string {
		return 'fgo';
	}

	async validateConnection(opts: ImportOptions): Promise<boolean> {
		if (!opts.apiKey) {
			throw new Error('API key is required for FGO integration');
		}

		try {
			// FGO API endpoint for testing connection
			const response = await fetch('https://api.fgo.ro/v1/company', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${opts.apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			return response.ok;
		} catch (error) {
			console.error('FGO connection validation failed:', error);
			return false;
		}
	}

	async importInvoices(opts: ImportOptions): Promise<ImportResult> {
		if (!opts.apiKey) {
			throw new Error('API key is required for FGO integration');
		}

		const result: ImportResult = {
			success: true,
			imported: 0,
			updated: 0,
			skipped: 0,
			errors: 0,
			summary: {
				created: [],
				updated: [],
				skipped: [],
				errors: [],
			},
		};

		try {
			// Get database for tenant
			const database = await prisma.database.findFirst({
				where: { tenantId: Number(opts.tenantId) },
			});

			if (!database) {
				throw new Error('Database not found for tenant');
			}

			// Fetch invoices from FGO API
			const fgoInvoices = await this.fetchFGOInvoices(opts.apiKey, opts.dateFrom, opts.dateTo);
			
			// Process each invoice
			for (const fgoInvoice of fgoInvoices) {
				try {
					const importedInvoice = await this.mapFGOInvoiceToDTO(fgoInvoice);
					
					// Check for duplicates
					const duplicateCheck = await this.checkForDuplicates(
						opts.tenantId,
						database.id,
						importedInvoice,
						opts.deduplicationStrategy
					);

					if (duplicateCheck.isDuplicate && opts.skipDuplicates) {
						result.skipped++;
						result.summary.skipped.push({
							invoice: importedInvoice,
							reason: duplicateCheck.reason || 'Duplicate invoice',
						});
						await this.recordImport(
							opts.tenantId,
							database.id,
							importedInvoice,
							duplicateCheck.existingInvoiceId || 0,
							'duplicate'
						);
						continue;
					}

					// Create or update customer
					const customer = await this.createOrUpdateCustomer(
						opts.tenantId,
						database.id,
						importedInvoice.customer
					);

					// Create invoice
					const invoiceId = await this.createInvoice(
						opts.tenantId,
						database.id,
						importedInvoice,
						customer.id
					);

					// Record import
					await this.recordImport(
						opts.tenantId,
						database.id,
						importedInvoice,
						invoiceId,
						'imported'
					);

					// Log audit event
					await this.logAuditEvent(
						opts.tenantId,
						database.id,
						invoiceId,
						'imported',
						undefined,
						{ source: 'fgo', externalId: importedInvoice.externalId }
					);

					if (duplicateCheck.isDuplicate) {
						result.updated++;
						result.summary.updated.push(importedInvoice);
					} else {
						result.imported++;
						result.summary.created.push(importedInvoice);
					}

				} catch (error) {
					console.error('Error processing FGO invoice:', error);
					result.errors++;
					result.summary.errors.push({
						invoice: { externalId: fgoInvoice.number || 'unknown' },
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			}

		} catch (error) {
			console.error('Error importing from FGO:', error);
			result.success = false;
			result.summary.errors.push({
				invoice: {},
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}

		return result;
	}

	private async fetchFGOInvoices(
		apiKey: string,
		dateFrom?: string,
		dateTo?: string
	): Promise<any[]> {
		try {
			// FGO API endpoint for invoices
			const url = new URL('https://api.fgo.ro/v1/invoices');
			
			// Add date filters if provided
			if (dateFrom) {
				url.searchParams.append('dateFrom', dateFrom);
			}
			if (dateTo) {
				url.searchParams.append('dateTo', dateTo);
			}

			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`FGO API error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			return data.invoices || [];
		} catch (error) {
			console.error('Error fetching FGO invoices:', error);
			throw error;
		}
	}

	private async mapFGOInvoiceToDTO(fgoInvoice: any): Promise<ImportedInvoiceDTO> {
		// Map FGO invoice structure to our DTO
		const items = (fgoInvoice.items || []).map((item: any) => ({
			description: item.name || item.description,
			quantity: parseFloat(item.quantity || '1') || 1,
			unitPrice: parseFloat(item.unitPrice || '0') || 0,
			currency: fgoInvoice.currency || 'RON',
			vatRate: parseFloat(item.vatRate || '0') || 0,
			vatAmount: parseFloat(item.vatAmount || '0') || 0,
			total: parseFloat(item.total || '0') || 0,
			sku: item.code || item.sku,
			category: item.category,
			unitOfMeasure: item.unit || 'buc',
		}));

		// Calculate totals
		const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
		const vatTotal = items.reduce((sum: number, item: any) => sum + item.vatAmount, 0);
		const grandTotal = subtotal + vatTotal;

		return {
			invoiceNumber: fgoInvoice.number,
			invoiceDate: fgoInvoice.date,
			dueDate: fgoInvoice.dueDate,
			currency: fgoInvoice.currency || 'RON',
			status: this.mapFGOStatus(fgoInvoice.status),
			customer: {
				name: fgoInvoice.customer?.name,
				email: fgoInvoice.customer?.email,
				vatId: fgoInvoice.customer?.vatId,
				registrationNumber: fgoInvoice.customer?.registrationNumber,
				address: fgoInvoice.customer?.address,
				city: fgoInvoice.customer?.city,
				country: fgoInvoice.customer?.country || 'Romania',
				postalCode: fgoInvoice.customer?.postalCode,
				phone: fgoInvoice.customer?.phone,
			},
			items: items,
			totals: {
				subtotal: subtotal,
				vatTotal: vatTotal,
				grandTotal: grandTotal,
				currency: fgoInvoice.currency || 'RON',
			},
			paymentTerms: fgoInvoice.paymentTerms || 'Net 30',
			paymentMethod: fgoInvoice.paymentMethod || 'Bank Transfer',
			notes: fgoInvoice.notes || fgoInvoice.observations,
			externalId: fgoInvoice.number,
			rawData: fgoInvoice,
			importSource: 'fgo',
		};
	}

	private mapFGOStatus(fgoStatus: string): ImportedInvoiceDTO['status'] {
		if (!fgoStatus) return 'issued';

		const statusMap: Record<string, ImportedInvoiceDTO['status']> = {
			'draft': 'draft',
			'issued': 'issued',
			'paid': 'paid',
			'overdue': 'overdue',
			'cancelled': 'cancelled',
			'credit_note': 'credit_note',
			'proforma': 'proforma',
		};

		return statusMap[fgoStatus.toLowerCase()] || 'issued';
	}

	private async createInvoice(
		tenantId: string,
		databaseId: number,
		invoiceData: ImportedInvoiceDTO,
		customerId: number
	): Promise<number> {
		try {
			// Get invoice tables
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(tenantId, databaseId);
			
			if (!invoiceTables.invoices || !invoiceTables.invoice_items) {
				throw new Error('Invoice system not initialized');
			}

			// Generate invoice number if not provided
			const invoiceNumber = invoiceData.invoiceNumber || await this.generateInvoiceNumber(
				tenantId,
				databaseId
			);

			// Create invoice row
			const invoiceRow = await prisma.row.create({
				data: {
					tableId: invoiceTables.invoices.id,
				},
			});

			// Get invoice columns
			const invoiceColumns = await prisma.column.findMany({
				where: { tableId: invoiceTables.invoices.id },
			});

			const columnMap = invoiceColumns.reduce((acc: any, col: any) => {
				acc[col.name] = col;
				return acc;
			}, {});

			// Create invoice cells
			const invoiceCells = [
				{
					rowId: invoiceRow.id,
					columnId: columnMap.invoice_number?.id,
					value: invoiceNumber,
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.invoice_series?.id,
					value: 'FGO', // FGO import series
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.date?.id,
					value: invoiceData.invoiceDate,
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.due_date?.id,
					value: invoiceData.dueDate || invoiceData.invoiceDate,
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.customer_id?.id,
					value: customerId,
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.status?.id,
					value: invoiceData.status,
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.base_currency?.id,
					value: invoiceData.currency,
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.total_amount?.id,
					value: invoiceData.totals.grandTotal,
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.payment_terms?.id,
					value: invoiceData.paymentTerms || 'Net 30',
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.payment_method?.id,
					value: invoiceData.paymentMethod || 'Bank Transfer',
				},
				{
					rowId: invoiceRow.id,
					columnId: columnMap.notes?.id,
					value: invoiceData.notes || '',
				},
			].filter(cell => cell.columnId);

			await prisma.cell.createMany({
				data: invoiceCells,
			});

			// Create invoice items
			await this.createInvoiceItems(
				tenantId,
				databaseId,
				invoiceRow.id,
				invoiceData.items
			);

			return invoiceRow.id;
		} catch (error) {
			console.error('Error creating invoice:', error);
			throw error;
		}
	}

	private async createInvoiceItems(
		tenantId: string,
		databaseId: number,
		invoiceId: number,
		items: ImportedInvoiceDTO['items']
	): Promise<void> {
		try {
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(tenantId, databaseId);
			
			if (!invoiceTables.invoice_items) {
				throw new Error('Invoice items table not found');
			}

			// Get invoice item columns
			const itemColumns = await prisma.column.findMany({
				where: { tableId: invoiceTables.invoice_items.id },
			});

			const columnMap = itemColumns.reduce((acc: any, col: any) => {
				acc[col.name] = col;
				return acc;
			}, {});

			// Create items
			for (const item of items) {
				const itemRow = await prisma.row.create({
					data: {
						tableId: invoiceTables.invoice_items.id,
					},
				});

				const itemCells = [
					{
						rowId: itemRow.id,
						columnId: columnMap.invoice_id?.id,
						value: invoiceId,
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.quantity?.id,
						value: item.quantity,
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.price?.id,
						value: item.unitPrice,
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.currency?.id,
						value: item.currency,
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.product_vat?.id,
						value: item.vatRate || 0,
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.description?.id,
						value: item.description,
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.unit_of_measure?.id,
						value: item.unitOfMeasure || 'buc',
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.product_name?.id,
						value: item.description,
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.product_sku?.id,
						value: item.sku || '',
					},
					{
						rowId: itemRow.id,
						columnId: columnMap.product_category?.id,
						value: item.category || '',
					},
				].filter(cell => cell.columnId);

				await prisma.cell.createMany({
					data: itemCells,
				});
			}
		} catch (error) {
			console.error('Error creating invoice items:', error);
			throw error;
		}
	}

	private async generateInvoiceNumber(tenantId: string, databaseId: number): Promise<string> {
		try {
			const invoiceData = await InvoiceSystemService.generateInvoiceNumberWithConfig(
				Number(tenantId),
				databaseId,
				{
					series: 'FGO',
					includeYear: true,
					startNumber: 1,
				}
			);

			return invoiceData.number;
		} catch (error) {
			console.error('Error generating invoice number:', error);
			return `FGO-${Date.now()}`;
		}
	}
}
