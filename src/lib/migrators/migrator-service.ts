/** @format */

import { MigratorFactory, MigratorType } from './migrator-factory';
import { ImportOptions, ImportResult, ExportOptions, ExportResult } from './types';
import prisma from '@/lib/prisma';
import { InvoiceSystemService } from '@/lib/invoice-system';
import { any } from 'zod';

export class MigratorService {
	/**
	 * Check if prisma client is available
	 */
	private static checkPrismaClient(): void {
		if (!prisma) {
			console.error('Prisma client is not available');
			throw new Error('Database connection not available');
		}
	}

	/**
	 * Import invoices from external provider
	 */
	static async importInvoices(
		provider: MigratorType,
		options: ImportOptions
	): Promise<ImportResult> {
		try {
			this.checkPrismaClient();

			// Validate options
			const validationErrors = MigratorFactory.validateImportOptions(provider, options);
			if (validationErrors.length > 0) {
				throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
			}

			// Create migrator instance
			const migrator = MigratorFactory.createMigrator(provider);

			// Merge with default options
			const defaultOptions = MigratorFactory.getDefaultImportOptions(provider);
			const mergedOptions = { ...defaultOptions, ...options };

			// Validate connection if required
			if (provider !== 'csv' && migrator.validateConnection) {
				const isValid = await migrator.validateConnection(mergedOptions);
				if (!isValid) {
					throw new Error(`Failed to validate connection to ${provider}`);
				}
			}

			// Perform import
			const result = await migrator.importInvoices(mergedOptions);

			// Log import summary
			await this.logImportSummary(provider, options.tenantId, result);

			return result;
		} catch (error) {
			console.error(`Error importing from ${provider}:`, error);
			throw error;
		}
	}

	/**
	 * Export invoices to specified format
	 */
	static async exportInvoices(options: ExportOptions): Promise<ExportResult> {
		try {
			this.checkPrismaClient();

			// Get database for tenant
			const database = await prisma.database.findFirst({
				where: { tenantId: Number(options.tenantId) },
			});

			if (!database) {
				throw new Error('Database not found for tenant');
			}

			// Get invoice tables
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(
				Number(options.tenantId),
				database.id
			);

			if (!invoiceTables.invoices) {
				throw new Error('Invoice system not initialized');
			}

			// Build query filters
			const whereClause = await this.buildExportWhereClause(
				options.tenantId,
				database.id,
				options.filters
			);

			// Get invoices
			const invoices = await this.getInvoicesForExport(
				options.tenantId,
				database.id,
				whereClause,
				options.limit
			);

			// Export based on format
			let exportData: string;
			let mimeType: string;
			let filename: string;

			switch (options.format) {
				case 'csv':
					exportData = await this.exportToCSV(invoices);
					mimeType = 'text/csv';
					filename = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
					break;
				case 'json':
					exportData = JSON.stringify(invoices, null, 2);
					mimeType = 'application/json';
					filename = `invoices_export_${new Date().toISOString().split('T')[0]}.json`;
					break;
				default:
					throw new Error(`Unsupported export format: ${options.format}`);
			}

			// Log export summary
			await this.logExportSummary(options.tenantId, options.format, invoices.length);

			return {
				success: true,
				data: exportData,
				mimeType,
				filename,
				count: invoices.length,
				format: options.format,
				recordCount: invoices.length,
			};
		} catch (error) {
			console.error('Error exporting invoices:', error);
			throw error;
		}
	}

	/**
	 * Get available migrator providers
	 */
	static getAvailableProviders(): MigratorType[] {
		return MigratorFactory.getAvailableProviders();
	}

	/**
	 * Get provider information
	 */
	static getProviderInfo(provider: MigratorType) {
		return MigratorFactory.getProviderInfo(provider);
	}

	/**
	 * Get import history for a tenant
	 */
	static async getImportHistory(tenantId: string, limit: number = 50): Promise<any[]> {
		try {
			this.checkPrismaClient();

			const database = await prisma.database.findFirst({
				where: { tenantId: Number(tenantId) },
			});

			if (!database) {
				throw new Error('Database not found for tenant');
			}

			// Get import history from audit logs
			const importHistory = await prisma.auditLog.findMany({
				where: {
					tenantId: Number(tenantId),
					databaseId: database.id,
					action: 'imported',
					metadata: {
						path: ['source'],
						not: null,
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
				take: limit,
			});

			return importHistory.map((log : any) => ({
				id: log.id,
				provider: log.metadata?.source,
				externalId: log.metadata?.externalId,
				importedAt: log.createdAt,
				userId: log.userId,
				success: log.status === 'success',
			}));
		} catch (error) {
			console.error('Error getting import history:', error);
			// Return empty array as fallback instead of throwing
			return [];
		}
	}

	/**
	 * Get export history for a tenant
	 */
	static async getExportHistory(tenantId: string, limit: number = 50): Promise<any[]> {
		try {
			this.checkPrismaClient();

			const database = await prisma.database.findFirst({
				where: { tenantId: Number(tenantId) },
			});

			if (!database) {
				throw new Error('Database not found for tenant');
			}

			// Get export history from audit logs
			const exportHistory = await prisma.auditLog.findMany({
				where: {
					tenantId: Number(tenantId),
					databaseId: database.id,
					action: 'exported',
					metadata: {
						path: ['format'],
						not: null,
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
				take: limit,
			});

			return exportHistory.map((log : any) => ({
				id: log.id,
				format: log.metadata?.format,
				exportedAt: log.createdAt,
				userId: log.userId,
				count: log.metadata?.count || 0,
				success: log.status === 'success',
			}));
		} catch (error) {
			console.error('Error getting export history:', error);
			// Return empty array as fallback instead of throwing
			return [];
		}
	}

	/**
	 * Build where clause for export filters
	 */
	private static async buildExportWhereClause(
		tenantId: string,
		databaseId: number,
		filters?: any
	): Promise<any> {
		const whereClause: any = {
			tenantId: Number(tenantId),
			databaseId: databaseId,
		};

		if (filters) {
			if (filters.dateFrom || filters.dateTo) {
				whereClause.createdAt = {};
				if (filters.dateFrom) {
					whereClause.createdAt.gte = new Date(filters.dateFrom);
				}
				if (filters.dateTo) {
					whereClause.createdAt.lte = new Date(filters.dateTo);
				}
			}

			if (filters.status) {
				whereClause.status = filters.status;
			}

			if (filters.customerId) {
				whereClause.customerId = filters.customerId;
			}
		}

		return whereClause;
	}

	/**
	 * Get invoices for export
	 */
	private static async getInvoicesForExport(
		tenantId: string,
		databaseId: number,
		whereClause: any,
		limit?: number
	): Promise<any[]> {
		try {
			this.checkPrismaClient();

			// Get invoice tables
			const invoiceTables = await InvoiceSystemService.getInvoiceTables(
				Number(tenantId),
				databaseId
			);

			if (!invoiceTables.invoices || !invoiceTables.invoice_items) {
				throw new Error('Invoice system not initialized');
			}

			// Get invoices with their items
			const invoices = await prisma.row.findMany({
				where: {
					tableId: invoiceTables.invoices.id,
				},
				include: {
					cells: {
						include: {
							column: true,
						},
					},
				},
				take: limit || 1000,
			});

			// Get invoice items for each invoice
			const invoicesWithItems = await Promise.all(
				invoices.map(async (invoice : any) => {
					const items = await prisma.row.findMany({
						where: {
							tableId: invoiceTables.invoice_items.id,
							cells: {
								some: {
									column: {
										name: 'invoice_id',
									},
									value: invoice.id.toString(),
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

					return {
						...invoice,
						items: items,
					};
				})
			);

			return invoicesWithItems;
		} catch (error) {
			console.error('Error getting invoices for export:', error);
			throw error;
		}
	}

	/**
	 * Export invoices to CSV format
	 */
	private static async exportToCSV(invoices: any[]): Promise<string> {
		const headers = [
			'Invoice Number',
			'Date',
			'Due Date',
			'Customer Name',
			'Customer Email',
			'Customer VAT ID',
			'Status',
			'Currency',
			'Subtotal',
			'VAT Total',
			'Grand Total',
			'Payment Terms',
			'Payment Method',
			'Notes',
		];

		const csvRows = [headers.join(',')];

		for (const invoice of invoices) {
			const invoiceData = this.extractInvoiceData(invoice);
			const row = [
				invoiceData.invoiceNumber || '',
				invoiceData.date || '',
				invoiceData.dueDate || '',
				invoiceData.customerName || '',
				invoiceData.customerEmail || '',
				invoiceData.customerVatId || '',
				invoiceData.status || '',
				invoiceData.currency || '',
				invoiceData.subtotal || '0',
				invoiceData.vatTotal || '0',
				invoiceData.grandTotal || '0',
				invoiceData.paymentTerms || '',
				invoiceData.paymentMethod || '',
				invoiceData.notes || '',
			];

			// Escape CSV values
			const escapedRow = row.map(value => {
				const stringValue = String(value || '');
				if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
					return `"${stringValue.replace(/"/g, '""')}"`;
				}
				return stringValue;
			});

			csvRows.push(escapedRow.join(','));
		}

		return csvRows.join('\n');
	}

	/**
	 * Extract invoice data from row structure
	 */
	private static extractInvoiceData(invoice: any): any {
		const data: any = {};

		for (const cell of invoice.cells) {
			const columnName = cell.column.name;
			data[columnName] = cell.value;
		}

		return data;
	}

	/**
	 * Log import summary
	 */
	private 	static async logImportSummary(
		provider: MigratorType,
		tenantId: string,
		result: ImportResult
	): Promise<void> {
		try {
			this.checkPrismaClient();

			const database = await prisma.database.findFirst({
				where: { tenantId: Number(tenantId) },
			});

			if (!database) {
				return;
			}

			await prisma.auditLog.create({
				data: {
					tenantId: Number(tenantId),
					databaseId: database.id,
					action: 'imported',
					status: result.success ? 'success' : 'error',
					metadata: {
						provider,
						imported: result.imported,
						updated: result.updated,
						skipped: result.skipped,
						errors: result.errors,
					},
				},
			});
		} catch (error) {
			console.error('Error logging import summary:', error);
		}
	}

	/**
	 * Log export summary
	 */
	private static async logExportSummary(
		tenantId: string,
		format: string,
		count: number
	): Promise<void> {
		try {
			this.checkPrismaClient();

			const database = await prisma.database.findFirst({
				where: { tenantId: Number(tenantId) },
			});

			if (!database) {
				return;
			}

			await prisma.auditLog.create({
				data: {
					tenantId: Number(tenantId),
					databaseId: database.id,
					action: 'exported',
					status: 'success',
					metadata: {
						format,
						count,
					},
				},
			});
		} catch (error) {
			console.error('Error logging export summary:', error);
		}
	}
}
