/** @format */

import { MockExchangeRateProvider } from "./currency-exchange";

export interface ExchangeRate {
	from: string;
	to: string;
	rate: number;
	date: string;
	source: string;
}

export interface CurrencyConversion {
	originalAmount: number;
	originalCurrency: string;
	convertedAmount: number;
	baseCurrency: string;
	exchangeRate: number;
	conversionDate: string;
}

export interface ExchangeRateProvider {
	getExchangeRate(from: string, to: string): Promise<ExchangeRate>;
	getExchangeRates(baseCurrency: string): Promise<Record<string, number>>;
}

// Client-side exchange rate provider that calls our internal API
export class ClientExchangeRateProvider implements ExchangeRateProvider {
	private baseUrl: string;

	constructor() {
		// Use absolute URL for server-side, relative for client-side
		if (typeof window === "undefined") {
			// Server-side: use environment variable or construct absolute URL
			this.baseUrl = process.env.NEXTAUTH_URL
				? `${process.env.NEXTAUTH_URL}/api/currency/convert`
				: "http://localhost:3000/api/currency/convert";
		} else {
			// Client-side: use relative path
			this.baseUrl = "/api/currency/convert";
		}
	}

	async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
		try {
			const response = await fetch(
				`${this.baseUrl}?from=${encodeURIComponent(
					from,
				)}&to=${encodeURIComponent(to)}`,
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.success) {
				return result.data;
			} else {
				throw new Error(`API error: ${result.error || "Unknown error"}`);
			}
		} catch (error) {
			console.error("Error fetching exchange rate:", error);
			// Fallback to mock rates if API fails
			return this.getFallbackRate(from, to);
		}
	}

	async getExchangeRates(
		baseCurrency: string,
	): Promise<Record<string, number>> {
		try {
			// For now, we'll get individual rates for common currencies
			// This could be optimized with a batch endpoint later
			const commonCurrencies = [
				"USD",
				"EUR",
				"GBP",
				"RON",
				"CAD",
				"AUD",
				"JPY",
				"CHF",
			];
			const rates: Record<string, number> = { [baseCurrency]: 1.0 };

			for (const currency of commonCurrencies) {
				if (currency !== baseCurrency) {
					try {
						const rate = await this.getExchangeRate(currency, baseCurrency);
						rates[currency] = rate.rate;
					} catch (error) {
						console.warn(`Failed to get rate for ${currency}:`, error);
						// Use fallback rate
						const fallbackRate = this.getFallbackRate(currency, baseCurrency);
						rates[currency] = fallbackRate.rate;
					}
				}
			}

			return rates;
		} catch (error) {
			console.error("Error fetching exchange rates:", error);
			// Fallback to mock rates if API fails
			return this.getFallbackRates(baseCurrency);
		}
	}

	private getFallbackRate(from: string, to: string): ExchangeRate {
		// Fallback mock rates (using same rates as InvoiceCalculationService for consistency)
		const MOCK_EXCHANGE_RATES: Record<string, number> = {
			EUR: 1.17, // 1 EUR = 1.17 USD
			USD: 1.0, // 1 USD = 1.0 USD
			GBP: 1.25, // 1 GBP = 1.25 USD (approximate)
			RON: 0.215, // 1 RON = 0.215 USD
			CAD: 0.73, // 1 CAD = 0.73 USD (approximate)
			AUD: 0.66, // 1 AUD = 0.66 USD (approximate)
			JPY: 0.0067, // 1 JPY = 0.0067 USD (approximate)
			CHF: 1.12, // 1 CHF = 1.12 USD (approximate)
		};

		const fromRate = MOCK_EXCHANGE_RATES[from.toUpperCase()] || 1;
		const toRate = MOCK_EXCHANGE_RATES[to.toUpperCase()] || 1;
		const rate = fromRate / toRate;

		return {
			from: from.toUpperCase(),
			to: to.toUpperCase(),
			rate,
			date: new Date().toISOString(),
			source: "Fallback Mock Provider",
		};
	}

	private getFallbackRates(baseCurrency: string): Record<string, number> {
		const MOCK_EXCHANGE_RATES: Record<string, number> = {
			EUR: 1.09, // 1 EUR = 1.09 USD
			USD: 1.0, // 1 USD = 1.0 USD
			GBP: 1.25, // 1 GBP = 1.25 USD (approximate)
			RON: 0.215, // 1 RON = 0.215 USD
			CAD: 0.73, // 1 CAD = 0.73 USD (approximate)
			AUD: 0.66, // 1 AUD = 0.66 USD (approximate)
			JPY: 0.0067, // 1 JPY = 0.0067 USD (approximate)
			CHF: 1.12, // 1 CHF = 1.12 USD (approximate)
		};

		const baseRate = MOCK_EXCHANGE_RATES[baseCurrency.toUpperCase()] || 1;
		const rates: Record<string, number> = {};

		Object.entries(MOCK_EXCHANGE_RATES).forEach(([currency, rate]) => {
			rates[currency] = rate / baseRate;
		});

		return rates;
	}
}

// Factory function to get the appropriate exchange rate provider
export function getExchangeRateProvider(): ExchangeRateProvider {
	// TEMPORAR: Use mock provider everywhere to avoid API issues
	return new MockExchangeRateProvider();
}

// Main currency conversion function
export async function convertCurrency(
	amount: number,
	fromCurrency: string,
	toCurrency: string,
	provider: ExchangeRateProvider = getExchangeRateProvider(),
): Promise<CurrencyConversion> {
	if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
		return {
			originalAmount: amount,
			originalCurrency: fromCurrency.toUpperCase(),
			convertedAmount: amount,
			baseCurrency: toCurrency.toUpperCase(),
			exchangeRate: 1,
			conversionDate: new Date().toISOString(),
		};
	}

	const exchangeRate = await provider.getExchangeRate(fromCurrency, toCurrency);
	const convertedAmount = amount * exchangeRate.rate;

	return {
		originalAmount: amount,
		originalCurrency: fromCurrency.toUpperCase(),
		convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
		baseCurrency: toCurrency.toUpperCase(),
		exchangeRate: exchangeRate.rate,
		conversionDate: exchangeRate.date,
	};
}

// Batch conversion for multiple amounts
export async function convertMultipleCurrencies(
	conversions: Array<{ amount: number; currency: string }>,
	baseCurrency: string,
	provider: ExchangeRateProvider = getExchangeRateProvider(),
): Promise<CurrencyConversion[]> {
	const results: CurrencyConversion[] = [];

	for (const conversion of conversions) {
		const result = await convertCurrency(
			conversion.amount,
			conversion.currency,
			baseCurrency,
			provider,
		);
		results.push(result);
	}

	return results;
}

// Get all available currencies
export function getAvailableCurrencies(): string[] {
	// Return a comprehensive list of supported currencies
	return [
		"USD",
		"EUR",
		"GBP",
		"RON",
		"CAD",
		"AUD",
		"JPY",
		"CHF",
		"CNY",
		"INR",
		"BRL",
		"MXN",
		"KRW",
		"SGD",
		"HKD",
		"NZD",
		"SEK",
		"NOK",
		"DKK",
		"PLN",
		"CZK",
		"HUF",
		"RUB",
		"TRY",
		"ZAR",
		"BGN",
		"HRK",
		"RSD",
		"UAH",
		"MDL",
	];
}

// Validate if a currency is supported
export function isCurrencySupported(currency: string): boolean {
	const supportedCurrencies = getAvailableCurrencies();
	return supportedCurrencies.includes(currency.toUpperCase());
}
