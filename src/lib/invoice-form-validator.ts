/** @format */

import { z } from "zod";

// Schema for invoice form validation
export const InvoiceFormSchema = z.object({
	customer_id: z.number().min(1, "Customer is required"),
	base_currency: z.string().min(1, "Base currency is required"),
	due_date: z.string().min(1, "Due date is required"),
	payment_terms: z.string().optional(),
	payment_method: z.string().min(1, "Payment method is required"),
	notes: z.string().optional(),
	status: z.string().optional().default("draft"),
	invoice_series: z.string().optional(),
	products: z.array(
		z.object({
			product_ref_table: z.string().min(1, "Product table is required"),
			product_ref_id: z.number().min(1, "Product ID is required"),
			quantity: z.number().min(0.01, "Quantity must be greater than 0"),
			unit_of_measure: z.string().optional(),
			description: z.string().optional(),
			currency: z.string().min(1, "Currency is required"),
			original_price: z.number().min(0, "Price must be non-negative"),
			converted_price: z.number().min(0, "Converted price must be non-negative"),
			price: z.number().min(0, "Price must be non-negative"),
		}),
	).min(1, "At least one product is required"),
});

export type InvoiceFormData = z.infer<typeof InvoiceFormSchema>;

// Validation result interface
export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	missingFields: string[];
}

// Field validation functions
export function validateCustomer(customerId: number | null): string[] {
	const errors: string[] = [];
	if (!customerId || customerId <= 0) {
		errors.push("Customer is required");
	}
	return errors;
}

export function validateProducts(products: any[]): string[] {
	const errors: string[] = [];
	
	if (!products || products.length === 0) {
		errors.push("At least one product is required");
		return errors;
	}

	products.forEach((product, index) => {
		const productPrefix = `Product ${index + 1}`;
		
		if (!product.product_ref_table || product.product_ref_table.trim() === "") {
			errors.push(`${productPrefix}: Product table is required`);
		}
		
		if (!product.product_ref_id || product.product_ref_id <= 0) {
			errors.push(`${productPrefix}: Product ID is required`);
		}
		
		if (!product.quantity || product.quantity <= 0) {
			errors.push(`${productPrefix}: Quantity must be greater than 0`);
		}
		
		if (!product.currency || product.currency.trim() === "") {
			errors.push(`${productPrefix}: Currency is required`);
		}
		
		if (product.original_price === undefined || product.original_price === null || product.original_price < 0) {
			errors.push(`${productPrefix}: Price must be non-negative`);
		}
	});

	return errors;
}

export function validateInvoiceDetails(invoiceForm: any): string[] {
	const errors: string[] = [];
	
	if (!invoiceForm.due_date || invoiceForm.due_date.trim() === "") {
		errors.push("Due date is required");
	}
	
	if (!invoiceForm.payment_method || invoiceForm.payment_method.trim() === "") {
		errors.push("Payment method is required");
	}
	
	// Validate due date is not in the past
	if (invoiceForm.due_date) {
		const dueDate = new Date(invoiceForm.due_date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		if (dueDate < today) {
			errors.push("Due date cannot be in the past");
		}
	}
	
	return errors;
}

export function validateBaseCurrency(baseCurrency: string): string[] {
	const errors: string[] = [];
	
	if (!baseCurrency || baseCurrency.trim() === "") {
		errors.push("Base currency is required");
	}
	
	// Validate currency format (3 letters)
	if (baseCurrency && !/^[A-Z]{3}$/.test(baseCurrency)) {
		errors.push("Base currency must be a valid 3-letter currency code");
	}
	
	return errors;
}

// Main validation function
export function validateInvoiceForm(data: {
	customer_id: number | null;
	base_currency: string;
	due_date: string;
	payment_method: string;
	products: any[];
	invoiceForm: any;
}): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const missingFields: string[] = [];

	// Debug logging
	console.log("=== VALIDATION DEBUG ===");
	console.log("Input data:", data);
	console.log("Customer ID type:", typeof data.customer_id, "value:", data.customer_id);
	console.log("Base currency type:", typeof data.base_currency, "value:", data.base_currency);
	console.log("Due date type:", typeof data.due_date, "value:", data.due_date);
	console.log("Payment method type:", typeof data.payment_method, "value:", data.payment_method);
	console.log("Products array length:", data.products?.length || 0);

	// Validate customer
	const customerErrors = validateCustomer(data.customer_id);
	console.log("Customer errors:", customerErrors);
	errors.push(...customerErrors);
	if (customerErrors.length > 0) {
		missingFields.push("Customer");
	}

	// Validate base currency
	const currencyErrors = validateBaseCurrency(data.base_currency);
	console.log("Currency errors:", currencyErrors);
	errors.push(...currencyErrors);
	if (currencyErrors.length > 0) {
		missingFields.push("Base Currency");
	}

	// Validate invoice details
	const invoiceErrors = validateInvoiceDetails(data.invoiceForm);
	console.log("Invoice errors:", invoiceErrors);
	errors.push(...invoiceErrors);
	if (invoiceErrors.length > 0) {
		missingFields.push("Invoice Details");
	}

	// Validate products
	const productErrors = validateProducts(data.products);
	console.log("Product errors:", productErrors);
	errors.push(...productErrors);
	if (productErrors.length > 0) {
		missingFields.push("Products");
	}

	// Add warnings for potential issues
	if (data.products && data.products.length > 0) {
		const currencies = [...new Set(data.products.map(p => p.currency))];
		if (currencies.length > 1) {
			warnings.push("Multiple currencies detected. All amounts will be converted to base currency.");
		}
		
		// Check for products with zero price
		const zeroPriceProducts = data.products.filter(p => p.original_price === 0);
		if (zeroPriceProducts.length > 0) {
			warnings.push(`${zeroPriceProducts.length} product(s) have zero price.`);
		}
	}

	const result = {
		isValid: errors.length === 0,
		errors,
		warnings,
		missingFields,
	};

	console.log("Final validation result:", result);
	
	// Test with empty data to ensure validation works
	if (data.customer_id === null && data.products.length === 0 && !data.due_date) {
		console.log("TESTING: Empty form should have validation errors");
		console.log("Errors found:", errors.length);
		console.log("Is valid:", result.isValid);
	}
	
	return result;
}

// Helper function to get field-specific error messages
export function getFieldError(field: string, errors: string[]): string | null {
	const fieldErrors = errors.filter(error => 
		error.toLowerCase().includes(field.toLowerCase()) ||
		error.toLowerCase().includes("required") ||
		error.toLowerCase().includes("invalid")
	);
	return fieldErrors.length > 0 ? fieldErrors[0] : null;
}

// Helper function to check if form can be submitted
export function canSubmitForm(validationResult: ValidationResult): boolean {
	return validationResult.isValid && validationResult.errors.length === 0;
}

// Helper function to format validation errors for display
export function formatValidationErrors(validationResult: ValidationResult): string {
	if (validationResult.isValid) {
		return "";
	}

	const errorList = validationResult.errors.map((error, index) => `${index + 1}. ${error}`);
	return errorList.join("\n");
}

// Helper function to format missing fields for display
export function formatMissingFields(validationResult: ValidationResult): string {
	if (validationResult.missingFields.length === 0) {
		return "";
	}

	return `Missing required fields: ${validationResult.missingFields.join(", ")}`;
}
