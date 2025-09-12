/**
 * Legal Compliance Validation for Invoices
 * Ensures invoices meet international legal requirements
 *
 * @format
 */

export interface ComplianceValidationResult {
	isCompliant: boolean;
	errors: string[];
	warnings: string[];
	missingFields: string[];
	recommendations: string[];
}

export interface InvoiceComplianceData {
	company: {
		name?: string;
		taxId?: string;
		registrationNumber?: string;
		address?: string;
		city?: string;
		country?: string;
		postalCode?: string;
		iban?: string;
		bic?: string;
	};
	customer: {
		name?: string;
		taxId?: string;
		registrationNumber?: string;
		address?: string;
		city?: string;
		country?: string;
		postalCode?: string;
	};
	invoice: {
		number?: string;
		series?: string;
		date?: string;
		dueDate?: string;
		status?: string;
		payment_terms?: string;
		currency?: string;
	};
	items: Array<{
		name?: string;
		price?: number;
		quantity?: number;
		taxRate?: number;
		taxAmount?: number;
		discountRate?: number;
		discountAmount?: number;
	}>;
}

/**
 * Validate invoice compliance for different countries
 */
export function validateInvoiceCompliance(
	data: InvoiceComplianceData,
	country: string = "EU",
): ComplianceValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const missingFields: string[] = [];
	const recommendations: string[] = [];

	// Common international requirements
	validateCommonRequirements(data, errors, missingFields, warnings);

	// Country-specific validations
	switch (country.toUpperCase()) {
		case "EU":
		case "ROMANIA":
			validateEURomaniaRequirements(data, errors, missingFields, warnings);
			break;
		case "US":
		case "USA":
			validateUSRequirements(data, errors, missingFields, warnings);
			break;
		case "UK":
			validateUKRequirements(data, errors, missingFields, warnings);
			break;
		case "CANADA":
			validateCanadaRequirements(data, errors, missingFields, warnings);
			break;
		default:
			validateGenericRequirements(data, errors, missingFields, warnings);
	}

	// Generate recommendations
	generateRecommendations(data, recommendations);

	return {
		isCompliant: errors.length === 0,
		errors,
		warnings,
		missingFields,
		recommendations,
	};
}

/**
 * Validate common international requirements
 */
function validateCommonRequirements(
	data: InvoiceComplianceData,
	errors: string[],
	missingFields: string[],
	warnings: string[],
): void {
	// Company information
	if (!data.company.name) {
		missingFields.push("Company Name");
		errors.push("Company name is required for legal compliance");
	}
	if (!data.company.taxId) {
		missingFields.push("Company Tax ID/VAT");
		errors.push("Company tax ID/VAT is required for legal compliance");
	}
	if (!data.company.address || !data.company.city || !data.company.country) {
		missingFields.push("Company Complete Address");
		errors.push("Company complete address is required for legal compliance");
	}

	// Customer information
	if (!data.customer.name) {
		missingFields.push("Customer Name");
		errors.push("Customer name is required for legal compliance");
	}
	if (!data.customer.taxId) {
		missingFields.push("Customer Tax ID/VAT");
		errors.push("Customer tax ID/VAT is required for legal compliance");
	}
	if (!data.customer.address || !data.customer.city || !data.customer.country) {
		missingFields.push("Customer Complete Address");
		errors.push("Customer complete address is required for legal compliance");
	}

	// Invoice information
	if (!data.invoice.number) {
		missingFields.push("Invoice Number");
		errors.push("Invoice number is required for legal compliance");
	}
	if (!data.invoice.date) {
		missingFields.push("Invoice Date");
		errors.push("Invoice date is required for legal compliance");
	}
	if (!data.invoice.currency) {
		missingFields.push("Currency");
		errors.push("Currency is required for legal compliance");
	}

	// Items validation
	if (!data.items || data.items.length === 0) {
		errors.push("At least one invoice item is required");
	} else {
		data.items.forEach((item, index) => {
			if (!item.name) {
				missingFields.push(`Item ${index + 1} Name`);
				errors.push(`Item ${index + 1} name is required`);
			}
			if (!item.price || item.price <= 0) {
				missingFields.push(`Item ${index + 1} Price`);
				errors.push(`Item ${index + 1} must have a valid price`);
			}
			if (!item.quantity || item.quantity <= 0) {
				missingFields.push(`Item ${index + 1} Quantity`);
				errors.push(`Item ${index + 1} must have a valid quantity`);
			}
		});
	}
}

/**
 * Validate EU/Romania specific requirements
 */
function validateEURomaniaRequirements(
	data: InvoiceComplianceData,
	errors: string[],
	missingFields: string[],
	warnings: string[],
): void {
	// VAT requirements
	if (!data.company.taxId || !data.company.taxId.match(/^[A-Z]{2}\d{9,12}$/)) {
		errors.push(
			"Company must have a valid EU VAT number format (e.g., RO12345678)",
		);
	}
	if (
		!data.customer.taxId ||
		!data.customer.taxId.match(/^[A-Z]{2}\d{9,12}$/)
	) {
		errors.push("Customer must have a valid EU VAT number format");
	}

	// Invoice series requirement
	if (!data.invoice.series) {
		missingFields.push("Invoice Series");
		warnings.push("Invoice series is recommended for EU compliance");
	}

	// Due date requirement
	if (!data.invoice.dueDate) {
		missingFields.push("Invoice Due Date");
		warnings.push("Due date is recommended for EU compliance");
	}

	// Tax calculations
	data.items?.forEach((item, index) => {
		if (item.taxRate !== undefined && item.taxAmount !== undefined) {
			const calculatedTax = (item.price || 0) * (item.taxRate / 100);
			if (Math.abs(calculatedTax - item.taxAmount) > 0.01) {
				errors.push(`Item ${index + 1} tax amount calculation is incorrect`);
			}
		}
	});
}

/**
 * Validate US specific requirements
 */
function validateUSRequirements(
	data: InvoiceComplianceData,
	errors: string[],
	missingFields: string[],
	warnings: string[],
): void {
	// EIN requirement
	if (!data.company.taxId || !data.company.taxId.match(/^\d{2}-\d{7}$/)) {
		missingFields.push("Company EIN");
		warnings.push("Company EIN is recommended for US compliance");
	}

	// State tax requirements
	if (!data.company.address || !data.company.city) {
		warnings.push(
			"Complete company address is recommended for state tax compliance",
		);
	}

	// Sales tax calculations
	data.items?.forEach((item, index) => {
		if (item.taxRate !== undefined && item.taxAmount !== undefined) {
			const calculatedTax = (item.price || 0) * (item.taxRate / 100);
			if (Math.abs(calculatedTax - item.taxAmount) > 0.01) {
				errors.push(`Item ${index + 1} tax amount calculation is incorrect`);
			}
		}
	});
}

/**
 * Validate UK specific requirements
 */
function validateUKRequirements(
	data: InvoiceComplianceData,
	errors: string[],
	missingFields: string[],
	warnings: string[],
): void {
	// VAT number format
	if (
		!data.company.taxId ||
		!data.company.taxId.match(/^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/)
	) {
		errors.push("Company must have a valid UK VAT number format");
	}

	// Postcode requirement
	if (
		!data.company.postalCode ||
		!data.company.postalCode.match(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i)
	) {
		missingFields.push("Company Valid UK Postcode");
		warnings.push("Valid UK postcode is required for compliance");
	}
}

/**
 * Validate Canada specific requirements
 */
function validateCanadaRequirements(
	data: InvoiceComplianceData,
	errors: string[],
	missingFields: string[],
	warnings: string[],
): void {
	// GST/HST number
	if (!data.company.taxId || !data.company.taxId.match(/^\d{9}RT\d{4}$/)) {
		missingFields.push("Company GST/HST Number");
		warnings.push(
			"Company GST/HST number is recommended for Canadian compliance",
		);
	}

	// Province requirements
	if (!data.company.address || !data.company.city) {
		warnings.push("Complete company address with province is recommended");
	}
}

/**
 * Validate generic requirements for other countries
 */
function validateGenericRequirements(
	data: InvoiceComplianceData,
	errors: string[],
	missingFields: string[],
	warnings: string[],
): void {
	// Basic business requirements
	if (!data.company.iban) {
		warnings.push("Company IBAN is recommended for international payments");
	}
	if (!data.company.bic) {
		warnings.push(
			"Company BIC/SWIFT is recommended for international payments",
		);
	}

	// Payment terms
	if (!data.invoice.dueDate) {
		warnings.push("Payment due date is recommended for business compliance");
	}
}

/**
 * Generate compliance recommendations
 */
function generateRecommendations(
	data: InvoiceComplianceData,
	recommendations: string[],
): void {
	if (!data.company.iban) {
		recommendations.push("Add company IBAN for easier international payments");
	}
	if (!data.company.bic) {
		recommendations.push(
			"Add company BIC/SWIFT for international wire transfers",
		);
	}
	if (!data.invoice.dueDate) {
		recommendations.push(
			"Set payment due date to improve cash flow management",
		);
	}
	if (!data.invoice.status) {
		recommendations.push("Set invoice status for better tracking");
	}
	if (!data.invoice.payment_terms) {
		recommendations.push("Define payment terms to avoid payment delays");
	}

	// Tax optimization
	data.items?.forEach((item, index) => {
		if (item.taxRate === undefined) {
			recommendations.push(`Consider adding tax rate for item ${index + 1}`);
		}
		if (item.discountRate === undefined) {
			recommendations.push(
				`Consider adding discount rate for item ${index + 1}`,
			);
		}
	});
}

/**
 * Get compliance requirements for specific country
 */
export function getCountryComplianceRequirements(country: string): string[] {
	const requirements: Record<string, string[]> = {
		EU: [
			"VAT number required for both company and customer",
			"Invoice series recommended",
			"Due date recommended",
			"Tax calculations must be accurate",
			"Complete addresses required",
		],
		ROMANIA: [
			"CUI (VAT number) required",
			"Invoice series mandatory",
			"Due date recommended",
			"Tax calculations must be accurate",
			"Complete addresses required",
		],
		US: [
			"EIN recommended for company",
			"State tax compliance",
			"Sales tax calculations",
			"Complete addresses recommended",
		],
		UK: [
			"VAT number required",
			"Valid UK postcode required",
			"Tax calculations must be accurate",
		],
		CANADA: [
			"GST/HST number recommended",
			"Province information recommended",
			"Tax calculations must be accurate",
		],
	};

	return requirements[country.toUpperCase()] || requirements.EU;
}
