/** @format */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
	validateCustomer,
	validateProducts,
	validateInvoiceDetails,
	validateBaseCurrency,
	validateInvoiceForm,
	ValidationResult,
	InvoiceFormData,
} from '@/lib/invoice-form-validator';

describe('Invoice Form Validator', () => {
	describe('validateCustomer', () => {
		it('should return no errors for valid customer ID', () => {
			const errors = validateCustomer(1);
			expect(errors).toEqual([]);
		});

		it('should return error for null customer ID', () => {
			const errors = validateCustomer(null);
			expect(errors).toEqual(['Customer is required']);
		});

		it('should return error for zero customer ID', () => {
			const errors = validateCustomer(0);
			expect(errors).toEqual(['Customer is required']);
		});

		it('should return error for negative customer ID', () => {
			const errors = validateCustomer(-1);
			expect(errors).toEqual(['Customer is required']);
		});
	});

	describe('validateProducts', () => {
		it('should return no errors for valid products', () => {
			const products = [
				{
					product_ref_table: 'products',
					product_ref_id: 1,
					quantity: 2,
					currency: 'USD',
					extractedPrice: 100,
				},
				{
					product_ref_table: 'products',
					product_ref_id: 2,
					quantity: 1,
					currency: 'EUR',
					original_price: 50,
				},
			];
			const errors = validateProducts(products);
			expect(errors).toEqual([]);
		});

		it('should return error for empty products array', () => {
			const errors = validateProducts([]);
			expect(errors).toEqual(['At least one product is required']);
		});

		it('should return error for null products', () => {
			const errors = validateProducts(null as any);
			expect(errors).toEqual(['At least one product is required']);
		});

		it('should return errors for invalid product data', () => {
			const products = [
				{
					product_ref_table: '',
					product_ref_id: 0,
					quantity: -1,
					currency: '',
					extractedPrice: -10,
				},
			];
			const errors = validateProducts(products);
			expect(errors).toEqual([
				'Product 1: Product table is required',
				'Product 1: Product ID is required',
				'Product 1: Quantity must be a valid positive number',
				'Product 1: Currency is required',
				'Product 1: Price must be a valid non-negative number',
			]);
		});

		it('should validate price from different fields', () => {
			const products = [
				{
					product_ref_table: 'products',
					product_ref_id: 1,
					quantity: 1,
					currency: 'USD',
					price: 100, // Using 'price' field
				},
			];
			const errors = validateProducts(products);
			expect(errors).toEqual([]);
		});

		it('should return error for invalid numeric values', () => {
			const products = [
				{
					product_ref_table: 'products',
					product_ref_id: 1,
					quantity: NaN,
					currency: 'USD',
					extractedPrice: Infinity,
				},
			];
			const errors = validateProducts(products);
			expect(errors).toEqual([
				'Product 1: Quantity must be a valid positive number',
				'Product 1: Price must be a valid non-negative number',
			]);
		});
	});

	describe('validateInvoiceDetails', () => {
		it('should return no errors for valid invoice details', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30);
			const invoiceForm = {
				due_date: futureDate.toISOString().split('T')[0],
				payment_method: 'Bank Transfer',
			};
			const errors = validateInvoiceDetails(invoiceForm);
			expect(errors).toEqual([]);
		});

		it('should return error for missing due date', () => {
			const invoiceForm = {
				due_date: '',
				payment_method: 'Bank Transfer',
			};
			const errors = validateInvoiceDetails(invoiceForm);
			expect(errors).toEqual(['Due date is required']);
		});

		it('should return error for missing payment method', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30);
			const invoiceForm = {
				due_date: futureDate.toISOString().split('T')[0],
				payment_method: '',
			};
			const errors = validateInvoiceDetails(invoiceForm);
			expect(errors).toEqual(['Payment method is required']);
		});

		it('should return error for past due date', () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const invoiceForm = {
				due_date: yesterday.toISOString().split('T')[0],
				payment_method: 'Bank Transfer',
			};
			const errors = validateInvoiceDetails(invoiceForm);
			expect(errors).toEqual(['Due date cannot be in the past']);
		});

		it('should allow today as due date', () => {
			const today = new Date();
			const invoiceForm = {
				due_date: today.toISOString().split('T')[0],
				payment_method: 'Bank Transfer',
			};
			const errors = validateInvoiceDetails(invoiceForm);
			expect(errors).toEqual([]);
		});
	});

	describe('validateBaseCurrency', () => {
		it('should return no errors for valid currency', () => {
			const errors = validateBaseCurrency('USD');
			expect(errors).toEqual([]);
		});

		it('should return error for empty currency', () => {
			const errors = validateBaseCurrency('');
			expect(errors).toEqual(['Base currency is required']);
		});

		it('should return error for invalid currency format', () => {
			const errors = validateBaseCurrency('usd');
			expect(errors).toEqual(['Base currency must be a valid 3-letter currency code']);
		});

		it('should return error for too short currency', () => {
			const errors = validateBaseCurrency('US');
			expect(errors).toEqual(['Base currency must be a valid 3-letter currency code']);
		});

		it('should return error for too long currency', () => {
			const errors = validateBaseCurrency('USDO');
			expect(errors).toEqual(['Base currency must be a valid 3-letter currency code']);
		});
	});

	describe('validateInvoiceForm', () => {
		it('should return valid result for complete valid data', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30);
			const futureDateStr = futureDate.toISOString().split('T')[0];
			
			const data = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: futureDateStr,
				payment_method: 'Bank Transfer',
				products: [
					{
						product_ref_table: 'products',
						product_ref_id: 1,
						quantity: 2,
						currency: 'USD',
						extractedPrice: 100,
					},
				],
				invoiceForm: {
					due_date: futureDateStr,
					payment_method: 'Bank Transfer',
				},
			};
			const result = validateInvoiceForm(data);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
			expect(result.warnings).toEqual([]);
			expect(result.missingFields).toEqual([]);
		});

		it('should return invalid result with errors for incomplete data', () => {
			const data = {
				customer_id: null,
				base_currency: '',
				due_date: '',
				payment_method: '',
				products: [],
				invoiceForm: {
					due_date: '',
					payment_method: '',
				},
			};
			const result = validateInvoiceForm(data);
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.missingFields.length).toBeGreaterThan(0);
		});

		it('should include all missing fields in missingFields array', () => {
			const data = {
				customer_id: null,
				base_currency: '',
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [],
				invoiceForm: {
					due_date: '2024-12-31',
					payment_method: 'Bank Transfer',
				},
			};
			const result = validateInvoiceForm(data);
			expect(result.missingFields).toContain('Customer');
			expect(result.missingFields).toContain('Base Currency');
			expect(result.missingFields).toContain('Products');
		});

		it('should handle mixed valid and invalid products', () => {
			const data = {
				customer_id: 1,
				base_currency: 'USD',
				due_date: '2024-12-31',
				payment_method: 'Bank Transfer',
				products: [
					{
						product_ref_table: 'products',
						product_ref_id: 1,
						quantity: 2,
						currency: 'USD',
						extractedPrice: 100,
					},
					{
						product_ref_table: '',
						product_ref_id: 0,
						quantity: -1,
						currency: '',
						extractedPrice: -10,
					},
				],
				invoiceForm: {
					due_date: '2024-12-31',
					payment_method: 'Bank Transfer',
				},
			};
			const result = validateInvoiceForm(data);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Product 2: Product table is required');
		});
	});
});
