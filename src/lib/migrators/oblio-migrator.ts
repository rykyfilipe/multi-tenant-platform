/** @format */

import { BaseMigrator } from './base-migrator';
import { ImportOptions, ImportResult, ImportedInvoiceDTO } from './types';
import prisma from '@/lib/prisma';
import { InvoiceSystemService } from '@/lib/invoice-system';

export class OblioMigrator extends BaseMigrator {
	getProviderName(): string {
		return 'oblio';
	}

	async validateConnection(opts: ImportOptions): Promise<boolean> {
		if (!opts.apiKey) {
			throw new Error('API key is required for Oblio integration');
		}

		try {
			const response = await fetch('https://www.oblio.eu/api/docs', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${opts.apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			return response.ok;
		} catch (error) {
			console.error('Oblio connection validation failed:', error);
			return false;
		}
	}

	async getInvoiceCount(opts: ImportOptions): Promise<number> {
		if (!opts.apiKey) {
			throw new Error('API key is required for Oblio integration');
		}

		try {
			const response = await fetch('https://www.oblio.eu/api/docs', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${opts.apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Oblio API error: ${response.status}`);
			}

			const data = await response.json();
			return data.total || 0;
		} catch (error) {
			console.error('Error getting invoice count from Oblio:', error);
			return 0;
		}
	}

	async importInvoices(opts: ImportOptions): Promise<ImportResult> {
		if (!opts.apiKey) {
			throw new Error('API key is required for Oblio integration');
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

			// Fetch invoices from Oblio API
			const invoices = await this.fetchInvoicesFromOblio(opts.apiKey);
			
			// Process each invoice
			for (const oblioInvoice of invoices) {
				try {
					const importedInvoice = await this.mapOblioInvoiceToDTO(oblioInvoice);
					
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
						{ source: 'oblio', externalId: importedInvoice.externalId }
					);

					if (duplicateCheck.isDuplicate) {
						result.updated++;
						result.summary.updated.push(importedInvoice);
					} else {
						result.imported++;
						result.summary.created.push(importedInvoice);
					}

				} catch (error) {
					console.error('Error processing Oblio invoice:', error);
					result.errors++;
					result.summary.errors.push({
						invoice: { externalId: oblioInvoice.id?.toString() || 'unknown' },
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			}

		} catch (error) {
			console.error('Error importing from Oblio:', error);
			result.success = false;
			result.summary.errors.push({
				invoice: {},
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}

		return result;
	}

	private async fetchInvoicesFromOblio(apiKey: string): Promise<any[]> {
		try {
			// This is a simplified example - you'll need to implement the actual Oblio API calls
			// based on their documentation
			const response = await fetch('https://www.oblio.eu/api/docs', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Oblio API error: ${response.status}`);
			}

			const data = await response.json();
			return data.data || [];
		} catch (error) {
			console.error('Error fetching invoices from Oblio:', error);
			throw error;
		}
	}

	private async mapOblioInvoiceToDTO(oblioInvoice: any): Promise<ImportedInvoiceDTO> {
		// Map Oblio invoice format to our DTO format
		// This is a simplified mapping - you'll need to adjust based on actual Oblio API response
		return {
			invoiceNumber: oblioInvoice.number || oblioInvoice.invoiceNumber,
			invoiceDate: oblioInvoice.date || oblioInvoice.invoiceDate,
			dueDate: oblioInvoice.dueDate,
			currency: oblioInvoice.currency || 'RON',
			status: this.mapOblioStatus(oblioInvoice.status),
			customer: {
				name: oblioInvoice.client?.name || oblioInvoice.customer?.name,
				email: oblioInvoice.client?.email || oblioInvoice.customer?.email,
				vatId: oblioInvoice.client?.cif || oblioInvoice.customer?.vatId,
				registrationNumber: oblioInvoice.client?.regNumber || oblioInvoice.customer?.registrationNumber,
				address: oblioInvoice.client?.address || oblioInvoice.customer?.address,
				city: oblioInvoice.client?.city || oblioInvoice.customer?.city,
				country: oblioInvoice.client?.country || oblioInvoice.customer?.country || 'Romania',
				postalCode: oblioInvoice.client?.postalCode || oblioInvoice.customer?.postalCode,
				phone: oblioInvoice.client?.phone || oblioInvoice.customer?.phone,
			},
			items: (oblioInvoice.products || oblioInvoice.items || []).map((item: any) => ({
				description: item.name || item.description,
				quantity: item.quantity || 1,
				unitPrice: item.price || item.unitPrice || 0,
				currency: item.currency || oblioInvoice.currency || 'RON',
				vatRate: item.vatRate || item.vat || 0,
				vatAmount: item.vatAmount || 0,
				total: item.total || (item.quantity * item.price) || 0,
				sku: item.sku || item.code,
				category: item.category,
				unitOfMeasure: item.unitOfMeasure || item.unit || 'buc',
			})),
			totals: {
				subtotal: oblioInvoice.subtotal || 0,
				vatTotal: oblioInvoice.vatTotal || 0,
				grandTotal: oblioInvoice.total || oblioInvoice.grandTotal || 0,
				currency: oblioInvoice.currency || 'RON',
			},
			paymentTerms: oblioInvoice.paymentTerms,
			paymentMethod: oblioInvoice.paymentMethod,
			notes: oblioInvoice.notes || oblioInvoice.observations,
			externalId: oblioInvoice.id?.toString() || oblioInvoice.externalId,
			rawData: oblioInvoice,
			importSource: 'oblio',
		};
	}

	private mapOblioStatus(oblioStatus: string): ImportedInvoiceDTO['status'] {
		const statusMap: Record<string, ImportedInvoiceDTO['status']> = {
			'draft': 'draft',
			'issued': 'issued',
			'paid': 'paid',
			'overdue': 'overdue',
			'cancelled': 'cancelled',
			'credit_note': 'credit_note',
			'proforma': 'proforma',
		};

		return statusMap[oblioStatus?.toLowerCase()] || 'issued';
	}

	private async createInvoice(
		tenantId: string,
		databaseId: number,
		invoiceData: ImportedInvoiceDTO,
		customerId: number
	): Promise<number> {
		try {
			// Get invoice tables
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(Number(tenantId), databaseId);
			
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
					value: 'IMP', // Import series
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
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(Number(tenantId), databaseId);
			
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
					series: 'IMP',
					includeYear: true,
					startNumber: 1,
				}
			);

			return invoiceData.number;
		} catch (error) {
			console.error('Error generating invoice number:', error);
			return `IMP-${Date.now()}`;
		}
	}
}
