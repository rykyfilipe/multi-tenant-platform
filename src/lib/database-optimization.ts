/** @format */

import { databaseConfig } from "./database-config";

// Database connection optimization utilities
export class DatabaseOptimizer {
	private static instance: DatabaseOptimizer;
	private connectionCount = 0;
	private maxConnections = databaseConfig.pool.max;
	private connectionQueue: Array<() => void> = [];
	private isProcessingQueue = false;

	static getInstance(): DatabaseOptimizer {
		if (!DatabaseOptimizer.instance) {
			DatabaseOptimizer.instance = new DatabaseOptimizer();
		}
		return DatabaseOptimizer.instance;
	}

	// Acquire connection with queue management
	async acquireConnection(): Promise<boolean> {
		if (this.connectionCount < this.maxConnections) {
			this.connectionCount++;
			return true;
		}

		// Wait for available connection
		return new Promise((resolve) => {
			this.connectionQueue.push(() => resolve(true));
			this.processQueue();
		});
	}

	// Release connection and process queue
	releaseConnection(): void {
		if (this.connectionCount > 0) {
			this.connectionCount--;
			this.processQueue();
		}
	}

	// Process connection queue
	private async processQueue(): Promise<void> {
		if (this.isProcessingQueue || this.connectionQueue.length === 0) {
			return;
		}

		this.isProcessingQueue = true;

		while (
			this.connectionQueue.length > 0 &&
			this.connectionCount < this.maxConnections
		) {
			const resolve = this.connectionQueue.shift();
			if (resolve) {
				this.connectionCount++;
				resolve();
			}
		}

		this.isProcessingQueue = false;
	}

	// Get current connection status
	getConnectionStatus() {
		return {
			current: this.connectionCount,
			max: this.maxConnections,
			available: this.maxConnections - this.connectionCount,
			queued: this.connectionQueue.length,
		};
	}

	// Reset connection count (use with caution)
	reset(): void {
		this.connectionCount = 0;
		this.connectionQueue = [];
		this.isProcessingQueue = false;
	}
}

// Query execution wrapper with connection management
export const executeWithConnection = async <T>(
	operation: () => Promise<T>,
	retries: number = databaseConfig.query.maxRetries,
): Promise<T> => {
	const optimizer = DatabaseOptimizer.getInstance();

	try {
		await optimizer.acquireConnection();

		try {
			const result = await operation();
			return result;
		} finally {
			optimizer.releaseConnection();
		}
	} catch (error: any) {
		// Handle connection pool exhaustion
		if (error.message?.includes("too many connections") && retries > 0) {
			console.warn(
				`Connection pool exhausted, retrying... (${retries} attempts left)`,
			);

			// Wait before retry
			await new Promise((resolve) =>
				setTimeout(resolve, databaseConfig.query.retryDelay),
			);

			// Retry with one less attempt
			return executeWithConnection(operation, retries - 1);
		}

		throw error;
	}
};

// Batch operations with connection optimization
export const executeBatchWithConnection = async <T>(
	operations: Array<() => Promise<T>>,
	batchSize: number = 5,
): Promise<T[]> => {
	const results: T[] = [];

	// Process operations in batches to avoid overwhelming the connection pool
	for (let i = 0; i < operations.length; i += batchSize) {
		const batch = operations.slice(i, i + batchSize);

		const batchResults = await Promise.all(
			batch.map((operation) => executeWithConnection(operation)),
		);

		results.push(...batchResults);

		// Small delay between batches to allow connection pool recovery
		if (i + batchSize < operations.length) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	return results;
};

// Connection pool health monitor
export const monitorConnectionPool = () => {
	const optimizer = DatabaseOptimizer.getInstance();

	setInterval(() => {
		const status = optimizer.getConnectionStatus();

		if (status.current >= status.max * 0.8) {
			console.warn("Connection pool reaching capacity:", status);
		}

		if (status.queued > 0) {
			console.warn("Connection requests queued:", status.queued);
		}
	}, 10000); // Check every 10 seconds
};

// Export singleton instance
export const databaseOptimizer = DatabaseOptimizer.getInstance();

// Auto-start monitoring in development
if (process.env.NODE_ENV === "development") {
	monitorConnectionPool();
}
