/** @format */

import { SemanticColumnType } from "./semantic-types";
import { getExchangeRateProvider } from "./currency-exchange-client";

export interface InvoiceItem {
	id: number;
	product_ref_table: string;
	product_ref_id: number;
	quantity: number;
	price: number;
	currency: string;
	product_vat: number;
	description?: string;
	unit_of_measure?: string;
}

export interface InvoiceTotals {
	subtotal: number;
	vatTotal: number;
	grandTotal: number;
	subtotalInBaseCurrency: number;
	vatTotalInBaseCurrency: number;
	grandTotalInBaseCurrency: number;
	baseCurrency: string;
	totalsByCurrency: Record<string, number>;
	vatTotalsByCurrency: Record<string, number>;
	itemsCount: number;
}

export interface ExchangeRate {
	from: string;
	to: string;
	rate: number;
	date: string;
	source: string;
}

export interface InvoiceCalculationConfig {
	baseCurrency: string;
	exchangeRates: Record<string, ExchangeRate>;
}

/**
 * Unified invoice calculation service that handles VAT and currency conversions
 * Used across InvoiceForm, InvoiceList, API routes, and PDF generation
 */
export class InvoiceCalculationService {
	/**
	 * Calculate invoice totals with VAT and currency support
	 * This matches the exact calculation logic from InvoiceForm
	 */
	static async calculateInvoiceTotals(
		items: InvoiceItem[],
		config: InvoiceCalculationConfig,
	): Promise<InvoiceTotals> {
		const totalsByCurrency: Record<string, number> = {};
		const vatTotalsByCurrency: Record<string, number> = {};
		let subtotalInBaseCurrency = 0;
		let vatTotalInBaseCurrency = 0;

		// Process items sequentially to handle async exchange rate calls
		for (const item of items) {
			// Ensure we have valid numeric values
			const safePrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
			const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;
			const safeVatRate = typeof item.product_vat === 'number' && !isNaN(item.product_vat) ? item.product_vat : 0;
			
			// Calculate total for this item (price * quantity) - same as calculatedTotal in InvoiceForm
			const calculatedTotal = safePrice * safeQuantity;
			const itemVat = (calculatedTotal * safeVatRate) / 100;
			const currency = item.currency || "USD";

			// Add to currency-specific totals (without VAT)
			totalsByCurrency[currency] =
				(totalsByCurrency[currency] || 0) + calculatedTotal;
			vatTotalsByCurrency[currency] =
				(vatTotalsByCurrency[currency] || 0) + itemVat;

			// Convert to base currency
			if (currency === config.baseCurrency) {
				subtotalInBaseCurrency += calculatedTotal;
				vatTotalInBaseCurrency += itemVat;
			} else {
				const conversionRate = await this.getExchangeRate(
					currency,
					config.baseCurrency,
					config.exchangeRates,
				);
				const safeConversionRate = typeof conversionRate === 'number' && !isNaN(conversionRate) ? conversionRate : 1;
				const convertedSubtotal = calculatedTotal * safeConversionRate;
				const convertedVat = itemVat * safeConversionRate;
				subtotalInBaseCurrency += convertedSubtotal;
				vatTotalInBaseCurrency += convertedVat;
			}
		}

		const grandTotalInBaseCurrency =
			subtotalInBaseCurrency + vatTotalInBaseCurrency;

		return {
			subtotal: subtotalInBaseCurrency,
			vatTotal: vatTotalInBaseCurrency,
			grandTotal: grandTotalInBaseCurrency,
			subtotalInBaseCurrency,
			vatTotalInBaseCurrency,
			grandTotalInBaseCurrency,
			baseCurrency: config.baseCurrency,
			totalsByCurrency,
			vatTotalsByCurrency,
			itemsCount: items.length,
		};
	}

	/**
	 * Get exchange rate between two currencies
	 */
	private static async getExchangeRate(
		fromCurrency: string,
		toCurrency: string,
		exchangeRates: Record<string, ExchangeRate>,
	): Promise<number> {
		if (fromCurrency === toCurrency) return 1;

		// Try to get rate from exchange rates
		if (exchangeRates[fromCurrency]) {
			return exchangeRates[fromCurrency].rate;
		}

		// Use external API through currency-exchange-client
		try {
			const provider = getExchangeRateProvider();
			const rate = await provider.getExchangeRate(fromCurrency, toCurrency);
			return rate.rate;
		} catch (error) {
			console.warn(
				`Failed to get exchange rate for ${fromCurrency} to ${toCurrency}:`,
				error,
			);
			return 1; // Default fallback
		}
	}

	/**
	 * Format price with currency
	 */
	static formatPrice(price: number, currency: string): string {
		const formatter = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
		return formatter.format(price);
	}

	/**
	 * Convert number to words (for PDF)
	 */
	static numberToWords(num: number): string {
		const ones = [
			"",
			"one",
			"two",
			"three",
			"four",
			"five",
			"six",
			"seven",
			"eight",
			"nine",
			"ten",
			"eleven",
			"twelve",
			"thirteen",
			"fourteen",
			"fifteen",
			"sixteen",
			"seventeen",
			"eighteen",
			"nineteen",
		];
		const tens = [
			"",
			"",
			"twenty",
			"thirty",
			"forty",
			"fifty",
			"sixty",
			"seventy",
			"eighty",
			"ninety",
		];

		if (num === 0) return "zero";
		if (num < 20) return ones[num];
		if (num < 100) {
			return (
				tens[Math.floor(num / 10)] + (num % 10 ? "-" + ones[num % 10] : "")
			);
		}
		if (num < 1000) {
			return (
				ones[Math.floor(num / 100)] +
				" hundred" +
				(num % 100 ? " and " + this.numberToWords(num % 100) : "")
			);
		}
		if (num < 1000000) {
			return (
				this.numberToWords(Math.floor(num / 1000)) +
				" thousand" +
				(num % 1000 ? " " + this.numberToWords(num % 1000) : "")
			);
		}
		return (
			this.numberToWords(Math.floor(num / 1000000)) +
			" million" +
			(num % 1000000 ? " " + this.numberToWords(num % 1000000) : "")
		);
	}
}
