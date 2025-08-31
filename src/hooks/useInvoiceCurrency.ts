/** @format */

import { useState, useEffect, useCallback } from "react";
import {
	convertCurrency,
	convertMultipleCurrencies,
	getExchangeRateProvider,
	getAvailableCurrencies,
	CurrencyConversion,
	ExchangeRate,
} from "@/lib/currency-exchange-client";

export interface InvoiceCurrencyConfig {
	baseCurrency: string;
	availableCurrencies: string[];
}

export interface ProductWithConversion {
	id: string;
	product_ref_table: string;
	product_ref_id: number;
	quantity: number;
	description: string;
	currency: string;
	extractedPrice?: number;
	calculatedTotal?: number;
	vatRate?: number;
	// Conversion fields
	conversion?: CurrencyConversion;
	convertedTotal?: number;
}

export interface InvoiceTotals {
	totalInBaseCurrency: number;
	totalInOriginalCurrencies: Record<string, number>;
	vatTotalInBaseCurrency: number;
	vatTotalInOriginalCurrencies: Record<string, number>;
	grandTotalInBaseCurrency: number;
	exchangeRates: Record<string, ExchangeRate>;
	conversionDate: string;
}

export function useInvoiceCurrency(defaultBaseCurrency: string = "RON") {
	const [baseCurrency, setBaseCurrency] = useState<string>(defaultBaseCurrency);
	const [availableCurrencies] = useState<string[]>(getAvailableCurrencies());
	const [exchangeRates, setExchangeRates] = useState<
		Record<string, ExchangeRate>
	>({});
	const [conversionDate, setConversionDate] = useState<string>(
		new Date().toISOString(),
	);

	// Load exchange rates for the base currency
	useEffect(() => {
		const loadExchangeRates = async () => {
			try {
				const provider = getExchangeRateProvider();
				const rates = await provider.getExchangeRates(baseCurrency);

				// Create exchange rate objects for each currency
				const rateObjects: Record<string, ExchangeRate> = {};
				for (const [currency, rate] of Object.entries(rates)) {
					if (currency !== baseCurrency) {
						rateObjects[currency] = {
							from: currency,
							to: baseCurrency,
							rate,
							date: new Date().toISOString(),
							source: "Mock Provider",
						};
					}
				}

				setExchangeRates(rateObjects);
				setConversionDate(new Date().toISOString());
			} catch (error) {
				console.error("Failed to load exchange rates:", error);
			}
		};

		loadExchangeRates();
	}, [baseCurrency]);

	// Convert a single product
	const convertProduct = useCallback(
		async (product: ProductWithConversion): Promise<ProductWithConversion> => {
			if (!product.extractedPrice || product.currency === baseCurrency) {
				return {
					...product,
					conversion: undefined,
					convertedTotal: product.calculatedTotal || 0,
				};
			}

			try {
				const conversion = await convertCurrency(
					product.calculatedTotal || 0,
					product.currency,
					baseCurrency,
				);

				return {
					...product,
					conversion,
					convertedTotal: conversion.convertedAmount,
				};
			} catch (error) {
				console.error(`Failed to convert product ${product.id}:`, error);
				return product;
			}
		},
		[baseCurrency],
	);

	// Convert multiple products
	const convertProducts = useCallback(
		async (
			products: ProductWithConversion[],
		): Promise<ProductWithConversion[]> => {
			const convertedProducts: ProductWithConversion[] = [];

			for (const product of products) {
				const converted = await convertProduct(product);
				convertedProducts.push(converted);
			}

			return convertedProducts;
		},
		[convertProduct],
	);

	// Calculate invoice totals
	const calculateInvoiceTotals = useCallback(
		(products: ProductWithConversion[]): InvoiceTotals => {
			const totalInOriginalCurrencies: Record<string, number> = {};
			const vatTotalInOriginalCurrencies: Record<string, number> = {};
			let totalInBaseCurrency = 0;
			let vatTotalInBaseCurrency = 0;

			products.forEach((product) => {
				if (product.calculatedTotal) {
					// Calculate VAT for this product
					const vatAmount =
						(product.calculatedTotal * (product.vatRate || 0)) / 100;

					// Add to original currency totals
					const currency = product.currency;
					totalInOriginalCurrencies[currency] =
						(totalInOriginalCurrencies[currency] || 0) +
						product.calculatedTotal;
					vatTotalInOriginalCurrencies[currency] =
						(vatTotalInOriginalCurrencies[currency] || 0) + vatAmount;

					// Add to base currency total
					if (product.convertedTotal) {
						const convertedVatAmount =
							(product.convertedTotal * (product.vatRate || 0)) / 100;
						totalInBaseCurrency += product.convertedTotal;
						vatTotalInBaseCurrency += convertedVatAmount;
					} else if (product.currency === baseCurrency) {
						totalInBaseCurrency += product.calculatedTotal;
						vatTotalInBaseCurrency += vatAmount;
					}
				}
			});

			const grandTotalInBaseCurrency =
				totalInBaseCurrency + vatTotalInBaseCurrency;

			return {
				totalInBaseCurrency: Math.round(totalInBaseCurrency * 100) / 100,
				totalInOriginalCurrencies,
				vatTotalInBaseCurrency: Math.round(vatTotalInBaseCurrency * 100) / 100,
				vatTotalInOriginalCurrencies,
				grandTotalInBaseCurrency:
					Math.round(grandTotalInBaseCurrency * 100) / 100,
				exchangeRates,
				conversionDate,
			};
		},
		[baseCurrency, exchangeRates],
	);

	// Get exchange rate for a specific currency pair
	const getExchangeRate = useCallback(
		(fromCurrency: string, toCurrency: string): number | null => {
			if (fromCurrency === toCurrency) return 1;

			if (toCurrency === baseCurrency && exchangeRates[fromCurrency]) {
				return exchangeRates[fromCurrency].rate;
			}

			return null;
		},
		[baseCurrency, exchangeRates],
	);

	// Format currency amount with proper formatting
	const formatCurrency = useCallback(
		(amount: number, currency: string): string => {
			const formatter = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
			return formatter.format(amount);
		},
		[],
	);

	// Get currency configuration
	const getCurrencyConfig = useCallback((): InvoiceCurrencyConfig => {
		return {
			baseCurrency,
			availableCurrencies,
		};
	}, [baseCurrency, availableCurrencies]);

	return {
		// State
		baseCurrency,
		availableCurrencies,
		exchangeRates,
		conversionDate,

		// Actions
		setBaseCurrency,
		convertProduct,
		convertProducts,
		calculateInvoiceTotals,
		getExchangeRate,
		formatCurrency,
		getCurrencyConfig,
	};
}
