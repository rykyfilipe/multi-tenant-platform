/** @format */

import {  InvoiceItem } from './invoice-calculations';

export interface ANAFValidationResult {
	success: boolean;
	valid: boolean;
	errors: string[];
	warnings: string[];
	anafId?: string;
	validationDate: string;
	details?: {
		cui: string;
		companyName: string;
		address: string;
		vatNumber: string;
	};
}

export interface ANAFInvoiceSubmission {
	invoiceId: string;
	invoiceNumber: string;
	series: string;
	date: string;
	dueDate: string;
	customerCUI: string;
	customerName: string;
	customerAddress: string;
	items: Array<{
		name: string;
		quantity: number;
		unitOfMeasure: string;
		price: number;
		vatRate: number;
		vatAmount: number;
		totalAmount: number;
	}>;
	subtotal: number;
	vatTotal: number;
	grandTotal: number;
	currency: string;
	paymentMethod: string;
	paymentTerms: string;
}

export class ANAFIntegrationService {
	private static instance: ANAFIntegrationService;
	private apiKey: string;
	private baseUrl: string;
	private timeout: number;

	constructor() {
		this.apiKey = process.env.ANAF_API_KEY || '';
		this.baseUrl = process.env.ANAF_BASE_URL || 'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva';
		this.timeout = 30000; // 30 seconds
	}

	static getInstance(): ANAFIntegrationService {
		if (!ANAFIntegrationService.instance) {
			ANAFIntegrationService.instance = new ANAFIntegrationService();
		}
		return ANAFIntegrationService.instance;
	}

	/**
	 * Validate CUI (Cod Unic de Identificare) with ANAF
	 */
	async validateCUI(cui: string): Promise<ANAFValidationResult> {
		try {
			const response = await fetch(`${this.baseUrl}?cui=${cui}&data=${new Date().toISOString().split('T')[0]}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'MultiTenantPlatform/1.0',
				},
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`ANAF API error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			
			if (data.found && data.found.length > 0) {
				const company = data.found[0];
				return {
					success: true,
					valid: true,
					errors: [],
					warnings: [],
					anafId: company.anafId,
					validationDate: new Date().toISOString(),
					details: {
						cui: company.cui,
						companyName: company.denumire,
						address: company.adresa,
						vatNumber: company.nrRegCom,
					},
				};
			} else {
				return {
					success: true,
					valid: false,
					errors: ['CUI not found in ANAF database'],
					warnings: [],
					validationDate: new Date().toISOString(),
				};
			}
		} catch (error) {
			console.error('ANAF CUI validation error:', error);
			return {
				success: false,
				valid: false,
				errors: [`ANAF validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
				warnings: [],
				validationDate: new Date().toISOString(),
			};
		}
	}

	/**
	 * Submit invoice to ANAF for fiscal validation
	 */
	async submitInvoice(invoice: ANAFInvoiceSubmission): Promise<ANAFValidationResult> {
		try {
			// Validate CUI first
			const cuiValidation = await this.validateCUI(invoice.customerCUI);
			if (!cuiValidation.valid) {
				return {
					success: false,
					valid: false,
					errors: ['Customer CUI is not valid', ...cuiValidation.errors],
					warnings: cuiValidation.warnings,
					validationDate: new Date().toISOString(),
				};
			}

			// Prepare invoice data for ANAF submission
			const anafInvoiceData = {
				invoiceId: invoice.invoiceId,
				invoiceNumber: invoice.invoiceNumber,
				series: invoice.series,
				date: invoice.date,
				dueDate: invoice.dueDate,
				customer: {
					cui: invoice.customerCUI,
					name: invoice.customerName,
					address: invoice.customerAddress,
				},
				items: invoice.items.map(item => ({
					description: item.name,
					quantity: item.quantity,
					unitOfMeasure: item.unitOfMeasure,
					unitPrice: item.price,
					vatRate: item.vatRate,
					vatAmount: item.vatAmount,
					totalAmount: item.totalAmount,
				})),
				totals: {
					subtotal: invoice.subtotal,
					vatTotal: invoice.vatTotal,
					grandTotal: invoice.grandTotal,
				},
				currency: invoice.currency,
				paymentMethod: invoice.paymentMethod,
				paymentTerms: invoice.paymentTerms,
			};

			const response = await fetch(`${this.baseUrl}/submit`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`,
					'User-Agent': 'MultiTenantPlatform/1.0',
				},
				body: JSON.stringify(anafInvoiceData),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`ANAF submission error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			
			return {
				success: true,
				valid: result.valid || false,
				errors: result.errors || [],
				warnings: result.warnings || [],
				anafId: result.anafId,
				validationDate: new Date().toISOString(),
			};
		} catch (error) {
			console.error('ANAF invoice submission error:', error);
			return {
				success: false,
				valid: false,
				errors: [`ANAF submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
				warnings: [],
				validationDate: new Date().toISOString(),
			};
		}
	}

	/**
	 * Check invoice status in ANAF
	 */
	async checkInvoiceStatus(anafId: string): Promise<{
		status: 'pending' | 'validated' | 'rejected' | 'error';
		message: string;
		lastChecked: string;
	}> {
		try {
			const response = await fetch(`${this.baseUrl}/status/${anafId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`,
					'User-Agent': 'MultiTenantPlatform/1.0',
				},
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`ANAF status check error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			
			return {
				status: data.status || 'error',
				message: data.message || 'Status check completed',
				lastChecked: new Date().toISOString(),
			};
		} catch (error) {
			console.error('ANAF status check error:', error);
			return {
				status: 'error',
				message: `Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				lastChecked: new Date().toISOString(),
			};
		}
	}

	/**
	 * Get ANAF configuration and requirements
	 */
	async getANAFRequirements(): Promise<{
		requiredFields: string[];
		vatRates: number[];
		currencyCodes: string[];
		unitOfMeasures: string[];
		paymentMethods: string[];
	}> {
		try {
			const response = await fetch(`${this.baseUrl}/requirements`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'MultiTenantPlatform/1.0',
				},
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`ANAF requirements error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			
			return {
				requiredFields: data.requiredFields || ['cui', 'companyName', 'address', 'vatNumber'],
				vatRates: data.vatRates || [0, 5, 9, 19, 20],
				currencyCodes: data.currencyCodes || ['RON', 'EUR', 'USD'],
				unitOfMeasures: data.unitOfMeasures || ['buc', 'kg', 'm', 'm2', 'm3', 'l', 'h'],
				paymentMethods: data.paymentMethods || ['Bank Transfer', 'Cash', 'Card', 'Check'],
			};
		} catch (error) {
			console.error('ANAF requirements error:', error);
			// Return default requirements if API fails
			return {
				requiredFields: ['cui', 'companyName', 'address', 'vatNumber'],
				vatRates: [0, 5, 9, 19, 20],
				currencyCodes: ['RON', 'EUR', 'USD'],
				unitOfMeasures: ['buc', 'kg', 'm', 'm2', 'm3', 'l', 'h'],
				paymentMethods: ['Bank Transfer', 'Cash', 'Card', 'Check'],
			};
		}
	}

	/**
	 * Validate invoice data against ANAF requirements
	 */
	async validateInvoiceData(invoice: ANAFInvoiceSubmission): Promise<{
		valid: boolean;
		errors: string[];
		warnings: string[];
	}> {
		const requirements = await this.getANAFRequirements();
		const errors: string[] = [];
		const warnings: string[] = [];

		// Validate required fields
		if (!invoice.customerCUI || invoice.customerCUI.length < 2) {
			errors.push('Customer CUI is required');
		}
		if (!invoice.customerName || invoice.customerName.trim().length === 0) {
			errors.push('Customer name is required');
		}
		if (!invoice.customerAddress || invoice.customerAddress.trim().length === 0) {
			errors.push('Customer address is required');
		}
		if (!invoice.invoiceNumber || invoice.invoiceNumber.trim().length === 0) {
			errors.push('Invoice number is required');
		}
		if (!invoice.series || invoice.series.trim().length === 0) {
			errors.push('Invoice series is required');
		}

		// Validate VAT rates
		for (const item of invoice.items) {
			if (!requirements.vatRates.includes(item.vatRate)) {
				errors.push(`Invalid VAT rate ${item.vatRate}% for item ${item.name}. Allowed rates: ${requirements.vatRates.join(', ')}%`);
			}
		}

		// Validate currency
		if (!requirements.currencyCodes.includes(invoice.currency)) {
			errors.push(`Invalid currency ${invoice.currency}. Allowed currencies: ${requirements.currencyCodes.join(', ')}`);
		}

		// Validate unit of measures
		for (const item of invoice.items) {
			if (!requirements.unitOfMeasures.includes(item.unitOfMeasure)) {
				warnings.push(`Unit of measure '${item.unitOfMeasure}' for item ${item.name} may not be recognized by ANAF`);
			}
		}

		// Validate payment method
		if (!requirements.paymentMethods.includes(invoice.paymentMethod)) {
			warnings.push(`Payment method '${invoice.paymentMethod}' may not be recognized by ANAF`);
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}
}

export default ANAFIntegrationService;
