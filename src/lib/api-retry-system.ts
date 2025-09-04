/** @format */

export interface RetryConfig {
	maxRetries: number;
	baseDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
	retryableStatusCodes: number[];
	retryableErrors: string[];
}

export interface RetryResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	attempts: number;
	totalTime: number;
}

export interface ApiCallOptions {
	url: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	headers?: Record<string, string>;
	body?: any;
	timeout?: number;
	retryConfig?: Partial<RetryConfig>;
}

export class ApiRetrySystem {
	private static instance: ApiRetrySystem;
	private defaultConfig: RetryConfig;

	constructor() {
		this.defaultConfig = {
			maxRetries: 3,
			baseDelay: 1000, // 1 second
			maxDelay: 30000, // 30 seconds
			backoffMultiplier: 2,
			retryableStatusCodes: [408, 429, 500, 502, 503, 504],
			retryableErrors: [
				'ECONNRESET',
				'ENOTFOUND',
				'ECONNREFUSED',
				'ETIMEDOUT',
				'NetworkError',
				'TimeoutError',
			],
		};
	}

	static getInstance(): ApiRetrySystem {
		if (!ApiRetrySystem.instance) {
			ApiRetrySystem.instance = new ApiRetrySystem();
		}
		return ApiRetrySystem.instance;
	}

	/**
	 * Make API call with retry logic
	 */
	async makeApiCall<T>(options: ApiCallOptions): Promise<RetryResult<T>> {
		const config = { ...this.defaultConfig, ...options.retryConfig };
		const startTime = Date.now();
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
			try {
				const response = await this.executeRequest(options);
				
				if (response.ok) {
					const data = await this.parseResponse<T>(response);
					return {
						success: true,
						data,
						attempts: attempt + 1,
						totalTime: Date.now() - startTime,
					};
				}

				// Check if status code is retryable
				if (config.retryableStatusCodes.includes(response.status)) {
					lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
					
					if (attempt < config.maxRetries) {
						await this.delay(this.calculateDelay(attempt, config));
						continue;
					}
				} else {
					// Non-retryable status code
					return {
						success: false,
						error: `HTTP ${response.status}: ${response.statusText}`,
						attempts: attempt + 1,
						totalTime: Date.now() - startTime,
					};
				}
			} catch (error) {
				lastError = error instanceof Error ? error : new Error('Unknown error');
				
				// Check if error is retryable
				if (this.isRetryableError(lastError, config)) {
					if (attempt < config.maxRetries) {
						await this.delay(this.calculateDelay(attempt, config));
						continue;
					}
				} else {
					// Non-retryable error
					return {
						success: false,
						error: lastError.message,
						attempts: attempt + 1,
						totalTime: Date.now() - startTime,
					};
				}
			}
		}

		// All retries exhausted
		return {
			success: false,
			error: lastError?.message || 'All retries exhausted',
			attempts: config.maxRetries + 1,
			totalTime: Date.now() - startTime,
		};
	}

	/**
	 * Execute HTTP request
	 */
	private async executeRequest(options: ApiCallOptions): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

		try {
			const response = await fetch(options.url, {
				method: options.method,
				headers: {
					'Content-Type': 'application/json',
					...options.headers,
				},
				body: options.body ? JSON.stringify(options.body) : undefined,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}

	/**
	 * Parse response based on content type
	 */
	private async parseResponse<T>(response: Response): Promise<T> {
		const contentType = response.headers.get('content-type') || '';
		
		if (contentType.includes('application/json')) {
			return await response.json();
		} else if (contentType.includes('text/')) {
			return await response.text() as T;
		} else {
			return await response.arrayBuffer() as T;
		}
	}

	/**
	 * Check if error is retryable
	 */
	private isRetryableError(error: Error, config: RetryConfig): boolean {
		const errorMessage = error.message.toLowerCase();
		
		return config.retryableErrors.some(retryableError => 
			errorMessage.includes(retryableError.toLowerCase())
		);
	}

	/**
	 * Calculate delay for next retry
	 */
	private calculateDelay(attempt: number, config: RetryConfig): number {
		const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
		return Math.min(delay, config.maxDelay);
	}

	/**
	 * Delay execution
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Make API call with exponential backoff
	 */
	async makeApiCallWithBackoff<T>(options: ApiCallOptions): Promise<RetryResult<T>> {
		const config = {
			...this.defaultConfig,
			...options.retryConfig,
			backoffMultiplier: 2,
		};

		return this.makeApiCall<T>({ ...options, retryConfig: config });
	}

	/**
	 * Make API call with linear backoff
	 */
	async makeApiCallWithLinearBackoff<T>(options: ApiCallOptions): Promise<RetryResult<T>> {
		const config = {
			...this.defaultConfig,
			...options.retryConfig,
			backoffMultiplier: 1,
		};

		return this.makeApiCall<T>({ ...options, retryConfig: config });
	}

	/**
	 * Make API call with custom retry logic
	 */
	async makeApiCallWithCustomLogic<T>(
		options: ApiCallOptions,
		shouldRetry: (error: Error, attempt: number) => boolean
	): Promise<RetryResult<T>> {
		const config = { ...this.defaultConfig, ...options.retryConfig };
		const startTime = Date.now();
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
			try {
				const response = await this.executeRequest(options);
				
				if (response.ok) {
					const data = await this.parseResponse<T>(response);
					return {
						success: true,
						data,
						attempts: attempt + 1,
						totalTime: Date.now() - startTime,
					};
				}

				lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
				
				if (attempt < config.maxRetries && shouldRetry(lastError, attempt)) {
					await this.delay(this.calculateDelay(attempt, config));
					continue;
				} else {
					return {
						success: false,
						error: lastError.message,
						attempts: attempt + 1,
						totalTime: Date.now() - startTime,
					};
				}
			} catch (error) {
				lastError = error instanceof Error ? error : new Error('Unknown error');
				
				if (attempt < config.maxRetries && shouldRetry(lastError, attempt)) {
					await this.delay(this.calculateDelay(attempt, config));
					continue;
				} else {
					return {
						success: false,
						error: lastError.message,
						attempts: attempt + 1,
						totalTime: Date.now() - startTime,
					};
				}
			}
		}

		return {
			success: false,
			error: lastError?.message || 'All retries exhausted',
			attempts: config.maxRetries + 1,
			totalTime: Date.now() - startTime,
		};
	}

	/**
	 * Get default retry config
	 */
	getDefaultConfig(): RetryConfig {
		return { ...this.defaultConfig };
	}

	/**
	 * Update default retry config
	 */
	updateDefaultConfig(config: Partial<RetryConfig>): void {
		this.defaultConfig = { ...this.defaultConfig, ...config };
	}

	/**
	 * Create retry config for specific API
	 */
	createRetryConfig(overrides: Partial<RetryConfig> = {}): RetryConfig {
		return { ...this.defaultConfig, ...overrides };
	}

	/**
	 * Test API endpoint with retry
	 */
	async testEndpoint(url: string, options: Partial<ApiCallOptions> = {}): Promise<{
		success: boolean;
		responseTime: number;
		statusCode?: number;
		error?: string;
	}> {
		const startTime = Date.now();
		
		try {
			const result = await this.makeApiCall({
				url,
				method: 'GET',
				...options,
			});

			return {
				success: result.success,
				responseTime: result.totalTime,
				statusCode: result.success ? 200 : undefined,
				error: result.error,
			};
		} catch (error) {
			return {
				success: false,
				responseTime: Date.now() - startTime,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}
}

export default ApiRetrySystem;
