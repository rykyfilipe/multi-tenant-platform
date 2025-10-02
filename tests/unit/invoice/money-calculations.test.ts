/**
 * Unit Tests: Money Calculations
 * 
 * These tests verify that monetary calculations are accurate and handle
 * edge cases properly, including precision issues and rounding.
 */

import { InvoiceCalculationService } from '@/lib/invoice-calculations';
import { InvoiceItem, InvoiceCalculationConfig } from '@/lib/invoice-calculations';

describe('InvoiceCalculationService', () => {
  const mockConfig: InvoiceCalculationConfig = {
    baseCurrency: 'USD',
    exchangeRates: {
      EUR: { from: 'EUR', to: 'USD', rate: 1.1, date: '2025-01-01', source: 'test' }
    }
  };

  describe('Basic Calculations', () => {
    it('should calculate simple line total correctly', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 2,
          price: 100,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(200);
      expect(result.vatTotal).toBe(38);
      expect(result.grandTotal).toBe(238);
    });

    it('should handle zero quantity', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 0,
          price: 100,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(0);
      expect(result.vatTotal).toBe(0);
      expect(result.grandTotal).toBe(0);
    });

    it('should handle zero price', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 2,
          price: 0,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(0);
      expect(result.vatTotal).toBe(0);
      expect(result.grandTotal).toBe(0);
    });
  });

  describe('Precision Issues', () => {
    it('should handle decimal precision correctly', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 1,
          price: 0.1,
          currency: 'USD',
          product_vat: 19
        },
        {
          id: 2,
          product_ref_table: 'products',
          product_ref_id: 2,
          quantity: 1,
          price: 0.2,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      // Should be 0.30, not 0.30000000000000004
      expect(result.subtotal).toBeCloseTo(0.3, 2);
      expect(result.vatTotal).toBeCloseTo(0.057, 3);
      expect(result.grandTotal).toBeCloseTo(0.357, 3);
    });

    it('should handle large numbers with small decimals', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 1000000,
          price: 0.01,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(10000);
      expect(result.vatTotal).toBe(1900);
      expect(result.grandTotal).toBe(11900);
    });

    it('should handle rounding edge cases', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 1,
          price: 100.125,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      // 19% of 100.125 = 19.02375, should round to 19.02
      expect(result.subtotal).toBeCloseTo(100.13, 2);
      expect(result.vatTotal).toBeCloseTo(19.02, 2);
      expect(result.grandTotal).toBeCloseTo(119.15, 2);
    });
  });

  describe('Negative Values', () => {
    it('should handle negative quantities (returns/credits)', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: -1,
          price: 100,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(-100);
      expect(result.vatTotal).toBe(-19);
      expect(result.grandTotal).toBe(-119);
    });

    it('should handle negative prices', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 1,
          price: -100,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(-100);
      expect(result.vatTotal).toBe(-19);
      expect(result.grandTotal).toBe(-119);
    });
  });

  describe('Currency Conversion', () => {
    it('should handle single currency correctly', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 1,
          price: 100,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(100);
      expect(result.vatTotal).toBe(19);
      expect(result.grandTotal).toBe(119);
      expect(result.baseCurrency).toBe('USD');
    });

    it('should handle multi-currency correctly', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 1,
          price: 100,
          currency: 'USD',
          product_vat: 19
        },
        {
          id: 2,
          product_ref_table: 'products',
          product_ref_id: 2,
          quantity: 1,
          price: 100,
          currency: 'EUR',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBeCloseTo(210, 1); // 100 USD + 110 USD (100 EUR * 1.1)
      expect(result.vatTotal).toBeCloseTo(39.9, 1); // 19 + 20.9
      expect(result.grandTotal).toBeCloseTo(249.9, 1);
      expect(result.totalsByCurrency.USD).toBe(100);
      expect(result.totalsByCurrency.EUR).toBe(100);
    });
  });

  describe('Invalid Input Handling', () => {
    it('should handle NaN values gracefully', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: NaN,
          price: 100,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(0);
      expect(result.vatTotal).toBe(0);
      expect(result.grandTotal).toBe(0);
    });

    it('should handle Infinity values gracefully', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: 1,
          price: Infinity,
          currency: 'USD',
          product_vat: 19
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(0);
      expect(result.vatTotal).toBe(0);
      expect(result.grandTotal).toBe(0);
    });

    it('should handle null/undefined values gracefully', async () => {
      const items: InvoiceItem[] = [
        {
          id: 1,
          product_ref_table: 'products',
          product_ref_id: 1,
          quantity: null as any,
          price: undefined as any,
          currency: 'USD',
          product_vat: null as any
        }
      ];

      const result = await InvoiceCalculationService.calculateInvoiceTotals(items, mockConfig);

      expect(result.subtotal).toBe(0);
      expect(result.vatTotal).toBe(0);
      expect(result.grandTotal).toBe(0);
    });
  });

  describe('Formatting Functions', () => {
    it('should format currency correctly', () => {
      const formatted = InvoiceCalculationService.formatPrice(123.45, 'USD');
      expect(formatted).toBe('$123.45');
    });

    it('should format currency with different locales', () => {
      const formatted = InvoiceCalculationService.formatPrice(123.45, 'EUR');
      expect(formatted).toBe('€123.45');
    });

    it('should handle zero amounts', () => {
      const formatted = InvoiceCalculationService.formatPrice(0, 'USD');
      expect(formatted).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      const formatted = InvoiceCalculationService.formatPrice(-123.45, 'USD');
      expect(formatted).toBe('-$123.45');
    });
  });

  describe('Number to Words', () => {
    it('should convert simple numbers to words', () => {
      expect(InvoiceCalculationService.numberToWords(0)).toBe('zero');
      expect(InvoiceCalculationService.numberToWords(1)).toBe('one');
      expect(InvoiceCalculationService.numberToWords(19)).toBe('nineteen');
    });

    it('should convert tens to words', () => {
      expect(InvoiceCalculationService.numberToWords(20)).toBe('twenty');
      expect(InvoiceCalculationService.numberToWords(25)).toBe('twenty-five');
      expect(InvoiceCalculationService.numberToWords(99)).toBe('ninety-nine');
    });

    it('should convert hundreds to words', () => {
      expect(InvoiceCalculationService.numberToWords(100)).toBe('one hundred');
      expect(InvoiceCalculationService.numberToWords(101)).toBe('one hundred and one');
      expect(InvoiceCalculationService.numberToWords(999)).toBe('nine hundred and ninety-nine');
    });

    it('should convert thousands to words', () => {
      expect(InvoiceCalculationService.numberToWords(1000)).toBe('one thousand');
      expect(InvoiceCalculationService.numberToWords(1001)).toBe('one thousand one');
      expect(InvoiceCalculationService.numberToWords(1234)).toBe('one thousand two hundred and thirty-four');
    });
  });
});
