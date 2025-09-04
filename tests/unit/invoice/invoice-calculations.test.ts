/** @format */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InvoiceCalculationService, InvoiceItem, InvoiceTotals } from '@/lib/invoice-calculations';

// Mock currency exchange
jest.mock('@/lib/currency-exchange-client', () => ({
	getExchangeRateProvider: jest.fn().mockReturnValue({
		getExchangeRate: jest.fn().mockResolvedValue({
			rate: 1.2,
			date: '2024-01-01',
			source: 'test',
		}),
	}),
}));

describe('InvoiceCalculationService', () => {
	describe('calculateInvoiceTotals', () => {
		it('should calculate totals correctly for single currency', async () => {
			const items: InvoiceItem[] = [
				{
					id: 1,
					product_ref_table: 'products',
					product_ref_id: 1,
					quantity: 2,
					price: 100,
					currency: 'USD',
					product_vat: 20,
					description: 'Test Product 1',
					unit_of_measure: 'buc',
				},
				{
					id: 2,
					product_ref_table: 'products',
					product_ref_id: 2,
					quantity: 1,
					price: 50,
					currency: 'USD',
					product_vat: 10,
					description: 'Test Product 2',
					unit_of_measure: 'buc',
				},
			];

			const config = {
				baseCurrency: 'USD',
				exchangeRates: {},
			};

			const result = await InvoiceCalculationService.calculateInvoiceTotals(items, config);

			expect(result.subtotal).toBe(250); // (2*100) + (1*50)
			expect(result.vatTotal).toBe(45); // (200*0.2) + (50*0.1)
			expect(result.grandTotal).toBe(295); // 250 + 45
			expect(result.baseCurrency).toBe('USD');
			expect(result.itemsCount).toBe(2);
			expect(result.totalsByCurrency).toEqual({ USD: 250 });
			expect(result.vatTotalsByCurrency).toEqual({ USD: 45 });
		});

		it('should calculate totals correctly for multiple currencies', async () => {
			const items: InvoiceItem[] = [
				{
					id: 1,
					product_ref_table: 'products',
					product_ref_id: 1,
					quantity: 1,
					price: 100,
					currency: 'EUR',
					product_vat: 20,
					description: 'Test Product 1',
					unit_of_measure: 'buc',
				},
				{
					id: 2,
					product_ref_table: 'products',
					product_ref_id: 2,
					quantity: 1,
					price: 50,
					currency: 'USD',
					product_vat: 10,
					description: 'Test Product 2',
					unit_of_measure: 'buc',
				},
			];

			const config = {
				baseCurrency: 'USD',
				exchangeRates: {
					EUR: {
						from: 'EUR',
						to: 'USD',
						rate: 1.2,
						date: '2024-01-01',
						source: 'test',
					},
				},
			};

			const result = await InvoiceCalculationService.calculateInvoiceTotals(items, config);

			expect(result.subtotal).toBe(170); // (100*1.2) + 50
			expect(result.vatTotal).toBe(29); // (120*0.2) + (50*0.1)
			expect(result.grandTotal).toBe(199); // 170 + 29
			expect(result.totalsByCurrency).toEqual({ EUR: 100, USD: 50 });
			expect(result.vatTotalsByCurrency).toEqual({ EUR: 20, USD: 5 });
		});

		it('should handle empty items array', async () => {
			const items: InvoiceItem[] = [];
			const config = {
				baseCurrency: 'USD',
				exchangeRates: {},
			};

			const result = await InvoiceCalculationService.calculateInvoiceTotals(items, config);

			expect(result.subtotal).toBe(0);
			expect(result.vatTotal).toBe(0);
			expect(result.grandTotal).toBe(0);
			expect(result.itemsCount).toBe(0);
		});

		it('should handle items with zero values', async () => {
			const items: InvoiceItem[] = [
				{
					id: 1,
					product_ref_table: 'products',
					product_ref_id: 1,
					quantity: 0,
					price: 100,
					currency: 'USD',
					product_vat: 20,
					description: 'Test Product 1',
					unit_of_measure: 'buc',
				},
				{
					id: 2,
					product_ref_table: 'products',
					product_ref_id: 2,
					quantity: 1,
					price: 0,
					currency: 'USD',
					product_vat: 10,
					description: 'Test Product 2',
					unit_of_measure: 'buc',
				},
			];

			const config = {
				baseCurrency: 'USD',
				exchangeRates: {},
			};

			const result = await InvoiceCalculationService.calculateInvoiceTotals(items, config);

			expect(result.subtotal).toBe(0);
			expect(result.vatTotal).toBe(0);
			expect(result.grandTotal).toBe(0);
		});

		it('should handle missing VAT rates', async () => {
			const items: InvoiceItem[] = [
				{
					id: 1,
					product_ref_table: 'products',
					product_ref_id: 1,
					quantity: 1,
					price: 100,
					currency: 'USD',
					product_vat: 0, // No VAT
					description: 'Test Product 1',
					unit_of_measure: 'buc',
				},
			];

			const config = {
				baseCurrency: 'USD',
				exchangeRates: {},
			};

			const result = await InvoiceCalculationService.calculateInvoiceTotals(items, config);

			expect(result.subtotal).toBe(100);
			expect(result.vatTotal).toBe(0);
			expect(result.grandTotal).toBe(100);
		});
	});

	describe('formatPrice', () => {
		it('should format price correctly for USD', () => {
			const result = InvoiceCalculationService.formatPrice(123.45, 'USD');
			expect(result).toBe('$123.45');
		});

		it('should format price correctly for EUR', () => {
			const result = InvoiceCalculationService.formatPrice(123.45, 'EUR');
			expect(result).toBe('€123.45');
		});

		it('should format price correctly for RON', () => {
			const result = InvoiceCalculationService.formatPrice(123.45, 'RON');
			expect(result).toBe('RON 123.45');
		});
	});

	describe('numberToWords', () => {
		it('should convert numbers to words correctly', () => {
			expect(InvoiceCalculationService.numberToWords(0)).toBe('zero');
			expect(InvoiceCalculationService.numberToWords(1)).toBe('one');
			expect(InvoiceCalculationService.numberToWords(15)).toBe('fifteen');
			expect(InvoiceCalculationService.numberToWords(25)).toBe('twenty-five');
			expect(InvoiceCalculationService.numberToWords(100)).toBe('one hundred');
			expect(InvoiceCalculationService.numberToWords(125)).toBe('one hundred and twenty-five');
			expect(InvoiceCalculationService.numberToWords(1000)).toBe('one thousand');
			expect(InvoiceCalculationService.numberToWords(1234)).toBe('one thousand two hundred and thirty-four');
		});
	});
});
