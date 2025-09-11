/** @format */

import { useCallback } from "react";

interface RetryOptions {
	maxRetries?: number;
	baseDelay?: number;
	maxDelay?: number;
	backoffMultiplier?: number;
}

interface UseRetryLogicResult {
	retryWithBackoff: <T>(
		operation: () => Promise<T>,
		options?: RetryOptions
	) => Promise<T>;
}

export function useRetryLogic(): UseRetryLogicResult {
	const retryWithBackoff = useCallback(async <T>(
		operation: () => Promise<T>,
		options: RetryOptions = {}
	): Promise<T> => {
		const {
			maxRetries = 3,
			baseDelay = 1000,
			maxDelay = 10000,
			backoffMultiplier = 2
		} = options;

		let lastError: Error;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				console.log(`🔄 Retry attempt ${attempt}/${maxRetries}`);
				return await operation();
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				
				if (attempt === maxRetries) {
					console.error(`❌ All ${maxRetries} retry attempts failed`);
					throw lastError;
				}

				// Calculate delay with exponential backoff
				const delay = Math.min(
					baseDelay * Math.pow(backoffMultiplier, attempt - 1),
					maxDelay
				);

				console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt + 1}`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}

		// This should never be reached, but TypeScript requires it
		throw lastError!;
	}, []);

	return { retryWithBackoff };
}
