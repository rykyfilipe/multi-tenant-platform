/** @format */

import { PrismaClient } from "@/generated/prisma/index";
import { createPrismaWithPerformanceTracking } from "./performance-monitor";
// import { connectionMonitor } from "./connection-monitor";

// Prisma Accelerate Cache Configuration
interface CacheStrategy {
	ttl: number; // Time to live in seconds
	swr: number; // Stale while revalidate in seconds
	tags?: string[]; // Cache invalidation tags
}

// Default cache strategies for different operation types
const DEFAULT_CACHE_STRATEGIES: Record<string, CacheStrategy> = {
	// User operations - frequently accessed, longer cache
	user: { ttl: 300, swr: 600, tags: ["user"] },
	userList: { ttl: 180, swr: 300, tags: ["user", "list"] },

	// Tenant operations - stable data, longer cache
	tenant: { ttl: 600, swr: 1200, tags: ["tenant"] },

	// Database operations - moderate cache
	database: { ttl: 240, swr: 480, tags: ["database"] },
	databaseList: { ttl: 180, swr: 360, tags: ["database", "list"] },

	// Table operations - moderate cache
	table: { ttl: 240, swr: 480, tags: ["table"] },
	tableList: { ttl: 180, swr: 360, tags: ["table", "list"] },
	tableSchema: { ttl: 300, swr: 600, tags: ["table", "schema"] },

	// Column operations - stable data, longer cache
	column: { ttl: 300, swr: 600, tags: ["column"] },
	columnList: { ttl: 240, swr: 480, tags: ["column", "list"] },

	// Row operations - dynamic data, shorter cache
	row: { ttl: 120, swr: 240, tags: ["row"] },
	rowList: { ttl: 90, swr: 180, tags: ["row", "list"] },

	// Cell operations - very dynamic, short cache
	cell: { ttl: 60, swr: 120, tags: ["cell"] },

	// Permission operations - moderate cache
	permission: { ttl: 180, swr: 360, tags: ["permission"] },

	// Count operations - moderate cache
	count: { ttl: 120, swr: 240, tags: ["count"] },

	// Dashboard operations - moderate cache
	dashboard: { ttl: 240, swr: 480, tags: ["dashboard"] },
	dashboardList: { ttl: 180, swr: 360, tags: ["dashboard", "list"] },

	// Widget operations - moderate cache
	widget: { ttl: 180, swr: 360, tags: ["widget"] },

	// Invoice operations - dynamic data, shorter cache
	invoice: { ttl: 90, swr: 180, tags: ["invoice"] },
	invoiceList: { ttl: 60, swr: 120, tags: ["invoice", "list"] },
};

// Enhanced Prisma Client with Accelerate Cache and Connection Pool Management
class PrismaAccelerateClient extends PrismaClient {
	private cache = new Map<
		string,
		{ data: any; expires: number; staleAt: number }
	>();
	private readonly maxCacheSize = 10000;
	private readonly cleanupInterval: NodeJS.Timeout;
	private connectionCount = 0;
	private readonly maxConnections = 10; // Match database config

	constructor() {
		super({
			datasources: {
				db: {
					url: process.env.YDV_DATABASE_URL,
				},
			},
			log:
				process.env.NODE_ENV === "development"
					? ["query", "error", "warn"]
					: ["error"],
		});

		// Configure connection pool settings
		// Note: beforeExit hook is not applicable to library engine in Prisma 5.0.0+
		// Use process event listeners instead

		// Cleanup expired cache entries every 5 minutes
		this.cleanupInterval = setInterval(() => {
			this.cleanupCache();
		}, 5 * 60 * 1000);

		// Graceful shutdown
		process.on("beforeExit", () => this.disconnect());
		process.on("SIGINT", () => this.disconnect());
		process.on("SIGTERM", () => this.disconnect());

		// Wrap all model methods with retry logic
		this.wrapModelMethods();
	}

	// Connection management methods
	private async acquireConnection(): Promise<boolean> {
		if (this.connectionCount < this.maxConnections) {
			this.connectionCount++;
			return true;
		}

		// Wait for connection to be available
		return new Promise((resolve) => {
			const checkConnection = () => {
				if (this.connectionCount < this.maxConnections) {
					this.connectionCount++;
					resolve(true);
				} else {
					setTimeout(checkConnection, 100);
				}
			};
			checkConnection();
		});
	}

	// Retry logic for database operations
	private async executeWithRetry<T>(
		operation: () => Promise<T>,
		maxRetries: number = 5,
		baseDelay: number = 500
	): Promise<T> {
		let lastError: Error | null = null;
		
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error: any) {
				lastError = error;
				
				// Check if it's a connection error that we should retry
				const isConnectionError = 
					error.code === 'P2021' || // Table does not exist
					error.code === 'P2024' || // Timed out fetching a new connection from the connection pool
					error.code === '08006' || // Connection closed by upstream database
					error.code === 'P1001' || // Can't reach database server
					error.code === 'P1002' || // The database server was reached but timed out
					error.code === 'P1003' || // Database does not exist
					error.code === 'P1008' || // Operations timed out
					error.code === 'P1017' || // Server has closed the connection
					error.message?.includes('connection closed') ||
					error.message?.includes('connection terminated') ||
					error.message?.includes('connection pool') ||
					error.message?.includes('ECONNRESET') ||
					error.message?.includes('ETIMEDOUT') ||
					error.message?.includes('ENOTFOUND') ||
					error.message?.includes('ECONNREFUSED') ||
					error.message?.includes('upstream database');

				if (!isConnectionError || attempt === maxRetries) {
					throw error;
				}

				// Exponential backoff with jitter
				const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000, 10000);
				console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms:`, error.message);
				
				await new Promise(resolve => setTimeout(resolve, delay));
				
				// Try to reconnect if it's a connection issue
				if (isConnectionError) {
					try {
						await this.$disconnect();
						await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before reconnecting
						await this.$connect();
					} catch (reconnectError) {
						console.warn('Failed to reconnect to database:', reconnectError);
					}
				}
			}
		}
		
		throw lastError || new Error('Max retries exceeded');
	}

	private releaseConnection(): void {
		if (this.connectionCount > 0) {
			this.connectionCount--;
		}
	}

	// Get connection status for monitoring
	getConnectionStatus() {
		return {
			current: this.connectionCount,
			max: this.maxConnections,
			available: this.maxConnections - this.connectionCount,
		};
	}

	// Enhanced findMany with automatic caching and connection management
	async findManyWithCache<T>(
		model: any,
		options: any,
		strategy: CacheStrategy = DEFAULT_CACHE_STRATEGIES.rowList,
	): Promise<T[]> {
		const cacheKey = this.generateCacheKey("findMany", model, options);
		const cached = this.getFromCache<T[]>(cacheKey);

		if (cached) {
			return cached;
		}

		return await this.executeWithRetry(async () => {
			await this.acquireConnection();
			try {
				const result = await model.findMany(options);
				this.setCache(cacheKey, result, strategy);
				return result;
			} finally {
				this.releaseConnection();
			}
		});
	}

	// Enhanced findUnique with automatic caching and connection management
	async findUniqueWithCache<T>(
		model: any,
		options: any,
		strategy: CacheStrategy = DEFAULT_CACHE_STRATEGIES.user,
	): Promise<T | null> {
		const cacheKey = this.generateCacheKey("findUnique", model, options);
		const cached = this.getFromCache<T>(cacheKey);

		if (cached) {
			return cached;
		}

		return await this.executeWithRetry(async () => {
			await this.acquireConnection();
			try {
				const result = await model.findUnique(options);
				if (result) {
					this.setCache(cacheKey, result, strategy);
				}
				return result;
			} finally {
				this.releaseConnection();
			}
		});
	}

	// Enhanced findFirst with automatic caching and connection management
	async findFirstWithCache<T>(
		model: any,
		options: any,
		strategy: CacheStrategy = DEFAULT_CACHE_STRATEGIES.user,
	): Promise<T | null> {
		const cacheKey = this.generateCacheKey("findFirst", model, options);
		const cached = this.getFromCache<T>(cacheKey);

		if (cached) {
			return cached;
		}

		return await this.executeWithRetry(async () => {
			await this.acquireConnection();
			try {
				const result = await model.findFirst(options);
				if (result) {
					this.setCache(cacheKey, result, strategy);
				}
				return result;
			} finally {
				this.releaseConnection();
			}
		});
	}

	// Enhanced count with automatic caching and connection management
	async countWithCache(
		model: any,
		options: any,
		strategy: CacheStrategy = DEFAULT_CACHE_STRATEGIES.count,
	): Promise<number> {
		const cacheKey = this.generateCacheKey("count", model, options);
		const cached = this.getFromCache<number>(cacheKey);

		if (cached !== null) {
			return cached;
		}

		await this.acquireConnection();
		try {
			const result = await model.count(options);
			this.setCache(cacheKey, result, strategy);
			return result;
		} finally {
			this.releaseConnection();
		}
	}

	// Enhanced aggregate with automatic caching and connection management
	async aggregateWithCache(
		model: any,
		options: any,
		strategy: CacheStrategy = DEFAULT_CACHE_STRATEGIES.count,
	): Promise<any> {
		const cacheKey = this.generateCacheKey("aggregate", model, options);
		const cached = this.getFromCache<any>(cacheKey);

		if (cached) {
			return cached;
		}

		await this.acquireConnection();
		try {
			const result = await model.aggregate(options);
			this.setCache(cacheKey, result, strategy);
			return result;
		} finally {
			this.releaseConnection();
		}
	}

	// Batch operations with intelligent caching and connection management
	async batchQuery<T>(
		operations: Array<{
			operation: () => Promise<T>;
			cacheKey: string;
			strategy: CacheStrategy;
		}>,
	): Promise<T[]> {
		const results: T[] = [];
		const uncachedOperations: Array<{
			index: number;
			operation: () => Promise<T>;
			cacheKey: string;
			strategy: CacheStrategy;
		}> = [];

		// Check cache for all operations
		for (let i = 0; i < operations.length; i++) {
			const { operation, cacheKey, strategy } = operations[i];
			const cached = this.getFromCache<T>(cacheKey);

			if (cached !== null) {
				results[i] = cached;
			} else {
				uncachedOperations.push({ index: i, operation, cacheKey, strategy });
			}
		}

		// Execute uncached operations with connection management
		if (uncachedOperations.length > 0) {
			await this.acquireConnection();
			try {
				const uncachedResults = await Promise.all(
					uncachedOperations.map(async ({ operation, cacheKey, strategy }) => {
						const result = await operation();
						this.setCache(cacheKey, result, strategy);
						return result;
					}),
				);

				// Place results in correct positions
				uncachedOperations.forEach(({ index }, i) => {
					results[index] = uncachedResults[i];
				});
			} finally {
				this.releaseConnection();
			}
		}

		return results;
	}

	// Cache management methods
	private generateCacheKey(
		operation: string,
		model: any,
		options: any,
	): string {
		const modelName = model?.constructor?.name || "unknown";
		const optionsHash = JSON.stringify(options);
		return `${operation}:${modelName}:${Buffer.from(optionsHash)
			.toString("base64")
			.slice(0, 16)}`;
	}

	private getFromCache<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		const now = Date.now();

		// Check if expired
		if (now > entry.expires) {
			this.cache.delete(key);
			return null;
		}

		// Check if stale (return stale data but mark for refresh)
		if (now > entry.staleAt) {
			// Return stale data but don't delete from cache
			// It will be refreshed on next access
			return entry.data;
		}

		return entry.data;
	}

	private setCache(key: string, data: any, strategy: CacheStrategy): void {
		// Evict least recently used if cache is full
		if (this.cache.size >= this.maxCacheSize) {
			this.evictLRU();
		}

		const now = Date.now();
		this.cache.set(key, {
			data,
			expires: now + strategy.ttl * 1000,
			staleAt: now + strategy.swr * 1000,
		});
	}

	private evictLRU(): void {
		const entries = Array.from(this.cache.entries());
		// Remove 10% of least recently used entries
		const toRemove = Math.ceil(this.maxCacheSize * 0.1);
		for (let i = 0; i < toRemove && i < entries.length; i++) {
			this.cache.delete(entries[i][0]);
		}
	}

	private cleanupCache(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expires) {
				this.cache.delete(key);
			}
		}
	}

	// Cache invalidation by tags
	invalidateCacheByTags(tags: string[]): void {
		// This would integrate with Prisma Accelerate's tag-based invalidation
		// For now, we'll clear the entire cache when tags are invalidated
		this.cache.clear();
	}

	// Cache statistics
	getCacheStats(): {
		size: number;
		maxSize: number;
		hitRate: number;
	} {
		// Implementation for cache statistics
		return {
			size: this.cache.size,
			maxSize: this.maxCacheSize,
			hitRate: 0.85, // Placeholder - would calculate actual hit rate
		};
	}

	// Wrapper for regular Prisma operations with retry logic
	async executeWithRetryWrapper<T>(operation: () => Promise<T>): Promise<T> {
		return await this.executeWithRetry(operation);
	}

	// Force reconnection method
	async forceReconnect(): Promise<void> {
		try {
			await this.$disconnect();
			await new Promise(resolve => setTimeout(resolve, 2000));
			await this.$connect();
			console.log('Database reconnected successfully');
		} catch (error) {
			console.error('Failed to force reconnect:', error);
		}
	}

	// Note: $transaction method is not overridden to avoid TypeScript conflicts
	// Use executeWithRetryWrapper for transaction-like operations if needed

	// Override all model methods to include retry logic
	private wrapModelMethods() {
		const models = ['user', 'tenant', 'database', 'table', 'column', 'row', 'cell', 'permission', 'dashboard', 'widget', 'invoiceAuditLog', 'invoiceSeries', 'emailQueue'];
		
		models.forEach(modelName => {
			const model = (this as any)[modelName];
			if (model) {
				// Wrap common methods
				const methods = ['findMany', 'findUnique', 'findFirst', 'create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany', 'count', 'aggregate'];
				
				methods.forEach(method => {
					if (typeof model[method] === 'function') {
						const originalMethod = model[method].bind(model);
						model[method] = async (...args: any[]) => {
							return await this.executeWithRetry(() => originalMethod(...args));
						};
					}
				});
			}
		});
	}

	// Disconnect and cleanup
	async disconnect(): Promise<void> {
		try {
			clearInterval(this.cleanupInterval);
			this.cache.clear();
			this.connectionCount = 0; // Reset connection count
			await super.$disconnect();
			console.log("Prisma Accelerate client disconnected successfully");
		} catch (error: any) {
			console.error("Error disconnecting Prisma Accelerate client:", error);
		}
	}
}

// Create and export the enhanced Prisma client with global reuse to prevent multiple pools
declare global {
	// eslint-disable-next-line no-var, @typescript-eslint/naming-convention
	var __PRISMA__: PrismaAccelerateClient | undefined;
}

const prisma = globalThis.__PRISMA__ ?? new PrismaAccelerateClient();

// Development mode global assignment (avoid creating multiple clients during HMR)
if (process.env.NODE_ENV !== "production") {
	globalThis.__PRISMA__ = prisma;
}

// Add performance tracking in development mode
const trackedPrisma =
	process.env.NODE_ENV === "development"
		? createPrismaWithPerformanceTracking(prisma)
		: prisma;

// Export cache strategies for external use
export { DEFAULT_CACHE_STRATEGIES };
export type { CacheStrategy };

// Utility function to wrap any Prisma operation with retry logic
export async function withRetry<T>(
	operation: () => Promise<T>,
	maxRetries: number = 3
): Promise<T> {
	return await trackedPrisma.executeWithRetryWrapper(operation);
}

// Utility function to force database reconnection
export async function forceReconnect(): Promise<void> {
	return await trackedPrisma.forceReconnect();
}

// Export the enhanced client
export default trackedPrisma;
