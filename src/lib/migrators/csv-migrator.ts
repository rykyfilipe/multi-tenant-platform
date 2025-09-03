/** @format */

import { BaseMigrator } from './base-migrator';
import { ImportOptions, ImportResult, ImportedInvoiceDTO } from './types';
import prisma from '@/lib/prisma';
import { InvoiceSystemService } from '@/lib/invoice-system';

export class CSVMigrator extends BaseMigrator {
	getProviderName(): string {
		return 'csv';
	}

	async importInvoices(opts: ImportOptions): Promise<ImportResult> {
		if (!opts.fileContent && !opts.filePath) {
			throw new Error('File content or file path is required for CSV import');
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

			// Parse CSV content
			const csvContent = opts.fileContent || await this.readFileContent(opts.filePath!);
			const invoices = await this.parseCSV(csvContent);
			
			// Process each invoice
			for (const csvInvoice of invoices) {
				try {
					const importedInvoice = await this.mapCSVInvoiceToDTO(csvInvoice);
					
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
						{ source: 'csv', externalId: importedInvoice.externalId }
					);

					if (duplicateCheck.isDuplicate) {
						result.updated++;
						result.summary.updated.push(importedInvoice);
					} else {
						result.imported++;
						result.summary.created.push(importedInvoice);
					}

				} catch (error) {
					console.error('Error processing CSV invoice:', error);
					result.errors++;
					result.summary.errors.push({
						invoice: { externalId: csvInvoice.invoiceNumber || 'unknown' },
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			}

		} catch (error) {
			console.error('Error importing from CSV:', error);
			result.success = false;
			result.summary.errors.push({
				invoice: {},
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}

		return result;
	}

	private async readFileContent(filePath: string): Promise<string> {
		// In a real implementation, you would read the file from the filesystem
		// For now, we'll assume the content is passed directly
		throw new Error('File reading not implemented - use fileContent option');
	}

	private async parseCSV(csvContent: string): Promise<any[]> {
		const lines = csvContent.split('\n').filter(line => line.trim());
		if (lines.length < 2) {
			throw new Error('CSV file must have at least a header row and one data row');
		}

		const headers = this.parseCSVLine(lines[0]);
		const invoices: any[] = [];

		// Group rows by invoice (assuming each invoice can have multiple items)
		const invoiceMap = new Map<string, any>();

		for (let i = 1; i < lines.length; i++) {
			const values = this.parseCSVLine(lines[i]);
			if (values.length !== headers.length) {
				console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
				continue;
			}

			const row: any = {};
			headers.forEach((header, index) => {
				row[header.trim()] = values[index]?.trim() || '';
			});

			// Use invoice number as key to group items
			const invoiceKey = row.invoiceNumber || row.invoice_number || row.number;
			if (!invoiceKey) {
				console.warn(`Row ${i + 1} missing invoice number, skipping`);
				continue;
			}

			if (!invoiceMap.has(invoiceKey)) {
				invoiceMap.set(invoiceKey, {
					invoiceNumber: invoiceKey,
					items: [],
					...row,
				});
			}

			// Add item to invoice
			const invoice = invoiceMap.get(invoiceKey);
			if (row.description || row.item_description || row.product_name) {
				invoice.items.push({
					description: row.description || row.item_description || row.product_name,
					quantity: parseFloat(row.quantity || row.qty || '1') || 1,
					unitPrice: parseFloat(row.unitPrice || row.unit_price || row.price || '0') || 0,
					currency: row.currency || 'USD',
					vatRate: parseFloat(row.vatRate || row.vat_rate || row.vat || '0') || 0,
					sku: row.sku || row.product_code,
					category: row.category || row.product_category,
					unitOfMeasure: row.unitOfMeasure || row.unit_of_measure || row.unit || 'buc',
				});
			}
		}

		return Array.from(invoiceMap.values());
	}

	private parseCSVLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;
		let i = 0;

		while (i < line.length) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					// Escaped quote
					current += '"';
					i += 2;
				} else {
					// Toggle quote state
					inQuotes = !inQuotes;
					i++;
				}
			} else if (char === ',' && !inQuotes) {
				// End of field
				result.push(current);
				current = '';
				i++;
			} else {
				current += char;
				i++;
			}
		}

		// Add the last field
		result.push(current);
		return result;
	}

	private async mapCSVInvoiceToDTO(csvInvoice: any): Promise<ImportedInvoiceDTO> {
		// Calculate totals
		let subtotal = 0;
		let vatTotal = 0;

		const items = csvInvoice.items.map((item: any) => {
			const total = item.quantity * item.unitPrice;
			const vatAmount = (total * item.vatRate) / 100;
			
			subtotal += total;
			vatTotal += vatAmount;

			return {
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				currency: item.currency,
				vatRate: item.vatRate,
				vatAmount: vatAmount,
				total: total + vatAmount,
				sku: item.sku,
				category: item.category,
				unitOfMeasure: item.unitOfMeasure,
			};
		});

		const grandTotal = subtotal + vatTotal;
		const currency = csvInvoice.currency || 'USD';

		return {
			invoiceNumber: csvInvoice.invoiceNumber,
			invoiceDate: csvInvoice.invoiceDate || csvInvoice.date || new Date().toISOString().split('T')[0],
			dueDate: csvInvoice.dueDate || csvInvoice.due_date,
			currency: currency,
			status: this.mapCSVStatus(csvInvoice.status),
			customer: {
				name: csvInvoice.customerName || csvInvoice.customer_name || csvInvoice.client_name,
				email: csvInvoice.customerEmail || csvInvoice.customer_email || csvInvoice.client_email,
				vatId: csvInvoice.customerVatId || csvInvoice.customer_vat_id || csvInvoice.client_vat_id,
				registrationNumber: csvInvoice.customerRegistrationNumber || csvInvoice.customer_registration_number,
				address: csvInvoice.customerAddress || csvInvoice.customer_address || csvInvoice.client_address,
				city: csvInvoice.customerCity || csvInvoice.customer_city || csvInvoice.client_city,
				country: csvInvoice.customerCountry || csvInvoice.customer_country || csvInvoice.client_country,
				postalCode: csvInvoice.customerPostalCode || csvInvoice.customer_postal_code || csvInvoice.client_postal_code,
				phone: csvInvoice.customerPhone || csvInvoice.customer_phone || csvInvoice.client_phone,
			},
			items: items,
			totals: {
				subtotal: subtotal,
				vatTotal: vatTotal,
				grandTotal: grandTotal,
				currency: currency,
			},
			paymentTerms: csvInvoice.paymentTerms || csvInvoice.payment_terms,
			paymentMethod: csvInvoice.paymentMethod || csvInvoice.payment_method,
			notes: csvInvoice.notes || csvInvoice.observations,
			externalId: csvInvoice.invoiceNumber, // Use invoice number as external ID for CSV
			rawData: csvInvoice,
			importSource: 'csv',
		};
	}

	private mapCSVStatus(csvStatus: string): ImportedInvoiceDTO['status'] {
		if (!csvStatus) return 'issued';

		const statusMap: Record<string, ImportedInvoiceDTO['status']> = {
			'draft': 'draft',
			'issued': 'issued',
			'paid': 'paid',
			'overdue': 'overdue',
			'cancelled': 'cancelled',
			'credit_note': 'credit_note',
			'proforma': 'proforma',
		};

		return statusMap[csvStatus.toLowerCase()] || 'issued';
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
					value: 'CSV', // CSV import series
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
					series: 'CSV',
					includeYear: true,
					startNumber: 1,
				}
			);

			return invoiceData.number;
		} catch (error) {
			console.error('Error generating invoice number:', error);
			return `CSV-${Date.now()}`;
		}
	}
}
