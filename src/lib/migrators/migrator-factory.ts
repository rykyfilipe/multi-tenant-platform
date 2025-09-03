/** @format */

import { Migrator, ImportOptions } from './types';
import { OblioMigrator } from './oblio-migrator';
import { SmartBillMigrator } from './smartbill-migrator';
import { FGOMigrator } from './fgo-migrator';
import { CSVMigrator } from './csv-migrator';

export type MigratorType = 'oblio' | 'smartbill' | 'fgo' | 'csv';

export class MigratorFactory {
	private static migrators: Map<MigratorType, () => Migrator> = new Map<MigratorType, () => Migrator>([
		['oblio', () => new OblioMigrator()],
		['smartbill', () => new SmartBillMigrator()],
		['fgo', () => new FGOMigrator()],
		['csv', () => new CSVMigrator()],
	]);

	/**
	 * Create a migrator instance for the specified provider
	 */
	static createMigrator(provider: MigratorType): Migrator {
		const migratorFactory = this.migrators.get(provider);
		if (!migratorFactory) {
			throw new Error(`Unsupported migrator provider: ${provider}`);
		}
		return migratorFactory();
	}

	/**
	 * Get list of available migrator providers
	 */
	static getAvailableProviders(): MigratorType[] {
		return Array.from(this.migrators.keys());
	}

	/**
	 * Check if a provider is supported
	 */
	static isProviderSupported(provider: string): provider is MigratorType {
		return this.migrators.has(provider as MigratorType);
	}

	/**
	 * Get provider information
	 */
	static getProviderInfo(provider: MigratorType): {
		name: string;
		displayName: string;
		description: string;
		requiresApiKey: boolean;
		supportsFileUpload: boolean;
		supportsDateRange: boolean;
	} {
		const providerInfo: Record<MigratorType, any> = {
			oblio: {
				name: 'oblio',
				displayName: 'Oblio',
				description: 'Import invoices from Oblio.eu accounting software',
				requiresApiKey: true,
				supportsFileUpload: false,
				supportsDateRange: true,
			},
			smartbill: {
				name: 'smartbill',
				displayName: 'SmartBill',
				description: 'Import invoices from SmartBill accounting software',
				requiresApiKey: true,
				supportsFileUpload: false,
				supportsDateRange: true,
			},
			fgo: {
				name: 'fgo',
				displayName: 'FGO',
				description: 'Import invoices from FGO accounting software',
				requiresApiKey: true,
				supportsFileUpload: false,
				supportsDateRange: true,
			},
			csv: {
				name: 'csv',
				displayName: 'CSV File',
				description: 'Import invoices from CSV file upload',
				requiresApiKey: false,
				supportsFileUpload: true,
				supportsDateRange: false,
			},
		};

		return providerInfo[provider];
	}

	/**
	 * Validate import options for a specific provider
	 */
	static validateImportOptions(provider: MigratorType, options: ImportOptions): string[] {
		const errors: string[] = [];
		const providerInfo = this.getProviderInfo(provider);

		// Check required fields based on provider
		if (providerInfo.requiresApiKey && !options.apiKey) {
			errors.push('API key is required for this provider');
		}

		if (providerInfo.supportsFileUpload && !options.fileContent && !options.filePath) {
			errors.push('File content or file path is required for this provider');
		}

		// Check tenant ID
		if (!options.tenantId) {
			errors.push('Tenant ID is required');
		}

		// Check date range if supported
		if (providerInfo.supportsDateRange) {
			if (options.dateFrom && options.dateTo) {
				const fromDate = new Date(options.dateFrom);
				const toDate = new Date(options.dateTo);
				if (fromDate > toDate) {
					errors.push('Start date cannot be after end date');
				}
			}
		}

		return errors;
	}

	/**
	 * Get default import options for a provider
	 */
	static getDefaultImportOptions(provider: MigratorType): Partial<ImportOptions> {
		const defaults: Record<MigratorType, Partial<ImportOptions>> = {
			oblio: {
				deduplicationStrategy: 'external_id',
				skipDuplicates: true,
				createMissingCustomers: true,
				createMissingProducts: true,
			},
			smartbill: {
				deduplicationStrategy: 'external_id',
				skipDuplicates: true,
				createMissingCustomers: true,
				createMissingProducts: true,
			},
			fgo: {
				deduplicationStrategy: 'external_id',
				skipDuplicates: true,
				createMissingCustomers: true,
				createMissingProducts: true,
			},
			csv: {
				deduplicationStrategy: 'invoice_number_date_customer',
				skipDuplicates: true,
				createMissingCustomers: true,
				createMissingProducts: true,
			},
		};

		return defaults[provider] || {};
	}
}
