/** @format */

import { Migrator, ImportOptions, ImportResult, ImportedInvoiceDTO } from './types';
import prisma from '@/lib/prisma';
import { InvoiceSystemService } from '@/lib/invoice-system';

export abstract class BaseMigrator implements Migrator {
	abstract getProviderName(): string;
	abstract importInvoices(opts: ImportOptions): Promise<ImportResult>;

	/**
	 * Check for duplicate invoices using different strategies
	 */
	protected async checkForDuplicates(
		tenantId: string,
		databaseId: number,
		invoice: ImportedInvoiceDTO,
		strategy: 'external_id' | 'invoice_number_date_customer' = 'external_id'
	): Promise<{ isDuplicate: boolean; existingInvoiceId?: number; reason?: string }> {
		try {
			// Get invoice tables
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(Number(tenantId), databaseId);
			
			if (!invoiceTables.invoices || !invoiceTables.customers) {
				return { isDuplicate: false };
			}

			// Strategy 1: Check by external ID in import log
			if (strategy === 'external_id') {
				const existingImport = await prisma.invoiceImport.findFirst({
					where: {
						tenantId: Number(tenantId),
						provider: this.getProviderName(),
						externalId: invoice.externalId,
					},
				});

				if (existingImport) {
					return {
						isDuplicate: true,
						existingInvoiceId: existingImport.id,
						reason: `Invoice already imported with external ID: ${invoice.externalId}`,
					};
				}
			}

			// Strategy 2: Check by invoice number + date + customer
			if (strategy === 'invoice_number_date_customer') {
				// Find customer by VAT ID or name
				const customer = await this.findCustomerByVatIdOrName(
					tenantId,
					databaseId,
					invoice.customer.vatId,
					invoice.customer.name
				);

				if (customer) {
					// Check if invoice with same number and date exists for this customer
					const existingInvoice = await prisma.row.findFirst({
						where: {
							tableId: invoiceTables.invoices.id,
							cells: {
								some: {
									column: { name: 'invoice_number' },
									value: invoice.invoiceNumber,
								},
							},
						},
						include: {
							cells: {
								include: {
									column: true,
								},
							},
						},
					});

					if (existingInvoice) {
						const dateCell = existingInvoice.cells.find(
							(cell: any) => cell.column.name === 'date'
						);
						const customerIdCell = existingInvoice.cells.find(
							(cell: any) => cell.column.name === 'customer_id'
						);

						if (dateCell && customerIdCell) {
							const existingDate = new Date(dateCell.value).toISOString().split('T')[0];
							const invoiceDate = new Date(invoice.invoiceDate).toISOString().split('T')[0];
							
							if (existingDate === invoiceDate && customerIdCell.value === customer.id) {
								return {
									isDuplicate: true,
									existingInvoiceId: existingInvoice.id,
									reason: `Invoice ${invoice.invoiceNumber} already exists for customer ${invoice.customer.name} on ${invoiceDate}`,
								};
							}
						}
					}
				}
			}

			return { isDuplicate: false };
		} catch (error) {
			console.error('Error checking for duplicates:', error);
			return { isDuplicate: false };
		}
	}

	/**
	 * Find customer by VAT ID or name
	 */
	protected async findCustomerByVatIdOrName(
		tenantId: string,
		databaseId: number,
		vatId?: string,
		name?: string
	): Promise<any> {
		try {
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(Number(tenantId), databaseId);
			
			if (!invoiceTables.customers) {
				return null;
			}

			// First try to find by VAT ID
			if (vatId) {
				const customerByVatId = await prisma.row.findFirst({
					where: {
						tableId: invoiceTables.customers.id,
						cells: {
							some: {
								column: { name: 'customer_tax_id' },
								value: vatId,
							},
						},
					},
					include: {
						cells: {
							include: {
								column: true,
							},
						},
					},
				});

				if (customerByVatId) {
					return customerByVatId;
				}
			}

			// Then try to find by name
			if (name) {
				const customerByName = await prisma.row.findFirst({
					where: {
						tableId: invoiceTables.customers.id,
						cells: {
							some: {
								column: { name: 'customer_name' },
								value: name,
							},
						},
					},
					include: {
						cells: {
							include: {
								column: true,
							},
						},
					},
				});

				if (customerByName) {
					return customerByName;
				}
			}

			return null;
		} catch (error) {
			console.error('Error finding customer:', error);
			return null;
		}
	}

	/**
	 * Create or update customer
	 */
	protected async createOrUpdateCustomer(
		tenantId: string,
		databaseId: number,
		customerData: ImportedInvoiceDTO['customer']
	): Promise<any> {
		try {
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(Number(tenantId)  , databaseId);
			
			if (!invoiceTables.customers) {
				throw new Error('Customers table not found');
			}

			// Check if customer already exists
			const existingCustomer = await this.findCustomerByVatIdOrName(
				tenantId,
				databaseId,
				customerData.vatId,
				customerData.name
			);

			if (existingCustomer) {
				// Update existing customer if needed
				return existingCustomer;
			}

			// Create new customer
			const customerRow = await prisma.row.create({
				data: {
					tableId: invoiceTables.customers.id,
				},
			});

			// Get customer columns
			const customerColumns = await prisma.column.findMany({
				where: { tableId: invoiceTables.customers.id },
			});

			const columnMap = customerColumns.reduce((acc: any, col: any) => {
				acc[col.name] = col;
				return acc;
			}, {});

			// Create customer cells
			const customerCells = [
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_name?.id,
					value: customerData.name,
				},
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_email?.id,
					value: customerData.email || '',
				},
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_tax_id?.id,
					value: customerData.vatId || '',
				},
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_registration_number?.id,
					value: customerData.registrationNumber || '',
				},
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_address?.id,
					value: customerData.address || '',
				},
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_city?.id,
					value: customerData.city || '',
				},
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_country?.id,
					value: customerData.country || '',
				},
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_postal_code?.id,
					value: customerData.postalCode || '',
				},
				{
					rowId: customerRow.id,
					columnId: columnMap.customer_phone?.id,
					value: customerData.phone || '',
				},
			].filter(cell => cell.columnId); // Only include cells where column exists

			await prisma.cell.createMany({
				data: customerCells,
			});

			return customerRow;
		} catch (error) {
			console.error('Error creating/updating customer:', error);
			throw error;
		}
	}

	/**
	 * Record import in the database
	 */
	protected async recordImport(
		tenantId: string,
		databaseId: number,
		invoice: ImportedInvoiceDTO,
		invoiceId: number,
		status: 'imported' | 'duplicate' | 'error' = 'imported',
		errorMessage?: string
	): Promise<void> {
		try {
			await prisma.invoiceImport.create({
				data: {
					tenantId: Number(tenantId),
					databaseId,
					provider: this.getProviderName(),
					externalId: invoice.externalId,
					invoiceNumber: invoice.invoiceNumber,
					invoiceDate: new Date(invoice.invoiceDate),
					customerVatId: invoice.customer.vatId,
					customerName: invoice.customer.name,
					rawSnapshot: invoice.rawData,
					status,
					errorMessage,
				},
			});
		} catch (error) {
			console.error('Error recording import:', error);
			// Don't throw here as it's not critical
		}
	}

	/**
	 * Log audit event
	 */
	protected async logAuditEvent(
		tenantId: string,
		databaseId: number,
		invoiceId: number,
		action: string,
		userId?: number,
		changes?: any,
		metadata?: any
	): Promise<void> {
		try {
			await prisma.invoiceAuditLog.create({
				data: {
					tenantId: Number(tenantId),
					databaseId,
					invoiceId,
					action,
					userId,
					changes,
					metadata,
				},
			});
		} catch (error) {
			console.error('Error logging audit event:', error);
			// Don't throw here as it's not critical
		}
	}
}
