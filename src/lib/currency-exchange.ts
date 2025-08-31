/** @format */

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

// Real exchange rate provider using ExchangeRate-API
export class RealExchangeRateProvider implements ExchangeRateProvider {
	private baseUrl = "https://v6.exchangerate-api.com/v6";
	private apiKey: string;

	constructor(apiKey?: string) {
		// Use environment variable or fallback to a demo key
		this.apiKey = apiKey || process.env.EXCHANGE_RATE_API_KEY || "demo";
	}

	async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
		try {
			const response = await fetch(
				`${this.baseUrl}/${
					this.apiKey
				}/pair/${from.toUpperCase()}/${to.toUpperCase()}`,
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.result === "success") {
				return {
					from: from.toUpperCase(),
					to: to.toUpperCase(),
					rate: data.conversion_rate,
					date: new Date().toISOString(),
					source: "ExchangeRate-API",
				};
			} else {
				throw new Error(`API error: ${data["error-type"] || "Unknown error"}`);
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
			const response = await fetch(
				`${this.baseUrl}/${this.apiKey}/latest/${baseCurrency.toUpperCase()}`,
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.result === "success") {
				return data.conversion_rates;
			} else {
				throw new Error(`API error: ${data["error-type"] || "Unknown error"}`);
			}
		} catch (error) {
			console.error("Error fetching exchange rates:", error);
			// Fallback to mock rates if API fails
			return this.getFallbackRates(baseCurrency);
		}
	}

	private getFallbackRate(from: string, to: string): ExchangeRate {
		// Fallback mock rates (RON as base currency)
		const MOCK_EXCHANGE_RATES: Record<string, number> = {
			EUR: 4.95,
			USD: 4.55,
			GBP: 5.85,
			RON: 1.0,
			CAD: 3.35,
			AUD: 2.95,
			JPY: 0.031,
			CHF: 5.15,
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
			EUR: 4.95,
			USD: 4.55,
			GBP: 5.85,
			RON: 1.0,
			CAD: 3.35,
			AUD: 2.95,
			JPY: 0.031,
			CHF: 5.15,
		};

		const baseRate = MOCK_EXCHANGE_RATES[baseCurrency.toUpperCase()] || 1;
		const rates: Record<string, number> = {};

		Object.entries(MOCK_EXCHANGE_RATES).forEach(([currency, rate]) => {
			rates[currency] = rate / baseRate;
		});

		return rates;
	}
}

// Legacy mock provider for testing purposes
export class MockExchangeRateProvider implements ExchangeRateProvider {
	async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
		const MOCK_EXCHANGE_RATES: Record<string, number> = {
			EUR: 1.17, // 1 EUR = 1.17 USD
			USD: 1.0, // 1 USD = 1.0 USD
			GBP: 1.25, // 1 GBP = 1.25 USD
			RON: 0.215, // 1 RON = 0.215 USD
			CAD: 0.73, // 1 CAD = 0.73 USD
			AUD: 0.66, // 1 AUD = 0.66 USD
			JPY: 0.0067, // 1 JPY = 0.0067 USD
			CHF: 1.12, // 1 CHF = 1.12 USD
		};

		const fromRate = MOCK_EXCHANGE_RATES[from.toUpperCase()] || 1;
		const toRate = MOCK_EXCHANGE_RATES[to.toUpperCase()] || 1;
		const rate = fromRate / toRate;

		return {
			from: from.toUpperCase(),
			to: to.toUpperCase(),
			rate,
			date: new Date().toISOString(),
			source: "Mock Provider",
		};
	}

	async getExchangeRates(
		baseCurrency: string,
	): Promise<Record<string, number>> {
		const MOCK_EXCHANGE_RATES: Record<string, number> = {
			EUR: 1.17, // 1 EUR = 1.17 USD
			USD: 1.0, // 1 USD = 1.0 USD
			GBP: 1.25, // 1 GBP = 1.25 USD
			RON: 0.215, // 1 RON = 0.215 USD
			CAD: 0.73, // 1 CAD = 0.73 USD
			AUD: 0.66, // 1 AUD = 0.66 USD
			JPY: 0.0067, // 1 JPY = 0.0067 USD
			CHF: 1.12, // 1 CHF = 1.12 USD
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
	// Check environment variable to determine which provider to use
	const providerType = process.env.EXCHANGE_RATE_PROVIDER || "real";

	switch (providerType) {
		case "mock":
			return new MockExchangeRateProvider();
		case "real":
		default:
			return new RealExchangeRateProvider();
	}
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
