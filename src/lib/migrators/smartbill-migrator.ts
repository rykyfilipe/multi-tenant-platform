/** @format */

import { BaseMigrator } from './base-migrator';
import { ImportOptions, ImportResult, ImportedInvoiceDTO } from './types';
import prisma from '@/lib/prisma';
import { InvoiceSystemService } from '@/lib/invoice-system';

export class SmartBillMigrator extends BaseMigrator {
	getProviderName(): string {
		return 'smartbill';
	}

	async validateConnection(opts: ImportOptions): Promise<boolean> {
		if (!opts.apiKey) {
			throw new Error('API key is required for SmartBill integration');
		}

		try {
			// SmartBill API endpoint for testing connection
			const response = await fetch('https://ws.smartbill.ro/SBORO/api/company', {
				method: 'GET',
				headers: {
					'Authorization': `Basic ${Buffer.from(opts.apiKey + ':').toString('base64')}`,
					'Content-Type': 'application/json',
				},
			});

			return response.ok;
		} catch (error) {
			console.error('SmartBill connection validation failed:', error);
			return false;
		}
	}

	async importInvoices(opts: ImportOptions): Promise<ImportResult> {
		if (!opts.apiKey) {
			throw new Error('API key is required for SmartBill integration');
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

			// Fetch invoices from SmartBill API
			const smartBillInvoices = await this.fetchSmartBillInvoices(opts.apiKey, opts.dateFrom, opts.dateTo);
			
			// Process each invoice
			for (const smartBillInvoice of smartBillInvoices) {
				try {
					const importedInvoice = await this.mapSmartBillInvoiceToDTO(smartBillInvoice);
					
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
						{ source: 'smartbill', externalId: importedInvoice.externalId }
					);

					if (duplicateCheck.isDuplicate) {
						result.updated++;
						result.summary.updated.push(importedInvoice);
					} else {
						result.imported++;
						result.summary.created.push(importedInvoice);
					}

				} catch (error) {
					console.error('Error processing SmartBill invoice:', error);
					result.errors++;
					result.summary.errors.push({
						invoice: { externalId: smartBillInvoice.number || 'unknown' },
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			}

		} catch (error) {
			console.error('Error importing from SmartBill:', error);
			result.success = false;
			result.summary.errors.push({
				invoice: {},
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}

		return result;
	}

	private async fetchSmartBillInvoices(
		apiKey: string,
		dateFrom?: string,
		dateTo?: string
	): Promise<any[]> {
		try {
			// SmartBill API endpoint for invoices
			const url = new URL('https://ws.smartbill.ro/SBORO/api/invoice');
			
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
					'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`SmartBill API error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			return data.list || [];
		} catch (error) {
			console.error('Error fetching SmartBill invoices:', error);
			throw error;
		}
	}

	private async mapSmartBillInvoiceToDTO(smartBillInvoice: any): Promise<ImportedInvoiceDTO> {
		// Map SmartBill invoice structure to our DTO
		const items = (smartBillInvoice.products || []).map((product: any) => ({
			description: product.name || product.description,
			quantity: parseFloat(product.quantity || '1') || 1,
			unitPrice: parseFloat(product.price || '0') || 0,
			currency: smartBillInvoice.currency || 'RON',
			vatRate: parseFloat(product.vatRate || '0') || 0,
			vatAmount: parseFloat(product.vatAmount || '0') || 0,
			total: parseFloat(product.total || '0') || 0,
			sku: product.code || product.sku,
			category: product.category,
			unitOfMeasure: product.unit || 'buc',
		}));

		// Calculate totals
		const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
		const vatTotal = items.reduce((sum: number, item: any) => sum + item.vatAmount, 0);
		const grandTotal = subtotal + vatTotal;

		return {
			invoiceNumber: smartBillInvoice.number,
			invoiceDate: smartBillInvoice.date,
			dueDate: smartBillInvoice.dueDate,
			currency: smartBillInvoice.currency || 'RON',
			status: this.mapSmartBillStatus(smartBillInvoice.status),
			customer: {
				name: smartBillInvoice.client?.name || smartBillInvoice.customer?.name,
				email: smartBillInvoice.client?.email || smartBillInvoice.customer?.email,
				vatId: smartBillInvoice.client?.vatCode || smartBillInvoice.customer?.vatCode,
				registrationNumber: smartBillInvoice.client?.regNumber || smartBillInvoice.customer?.regNumber,
				address: smartBillInvoice.client?.address || smartBillInvoice.customer?.address,
				city: smartBillInvoice.client?.city || smartBillInvoice.customer?.city,
				country: smartBillInvoice.client?.country || smartBillInvoice.customer?.country || 'Romania',
				postalCode: smartBillInvoice.client?.postalCode || smartBillInvoice.customer?.postalCode,
				phone: smartBillInvoice.client?.phone || smartBillInvoice.customer?.phone,
			},
			items: items,
			totals: {
				subtotal: subtotal,
				vatTotal: vatTotal,
				grandTotal: grandTotal,
				currency: smartBillInvoice.currency || 'RON',
			},
			paymentTerms: smartBillInvoice.paymentTerms || 'Net 30',
			paymentMethod: smartBillInvoice.paymentMethod || 'Bank Transfer',
			notes: smartBillInvoice.notes || smartBillInvoice.observations,
			externalId: smartBillInvoice.number,
			rawData: smartBillInvoice,
			importSource: 'smartbill',
		};
	}

	private mapSmartBillStatus(smartBillStatus: string): ImportedInvoiceDTO['status'] {
		if (!smartBillStatus) return 'issued';

		const statusMap: Record<string, ImportedInvoiceDTO['status']> = {
			'draft': 'draft',
			'issued': 'issued',
			'paid': 'paid',
			'overdue': 'overdue',
			'cancelled': 'cancelled',
			'credit_note': 'credit_note',
			'proforma': 'proforma',
		};

		return statusMap[smartBillStatus.toLowerCase()] || 'issued';
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
					value: 'SB', // SmartBill import series
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
					series: 'SB',
					includeYear: true,
					startNumber: 1,
				}
			);

			return invoiceData.number;
		} catch (error) {
			console.error('Error generating invoice number:', error);
			return `SB-${Date.now()}`;
		}
	}
}
