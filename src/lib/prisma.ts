/** @format */

import { PrismaClient } from "@/generated/prisma/index";
import { createPrismaWithPerformanceTracking } from "./performance-monitor";

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

// Enhanced Prisma Client with Accelerate Cache
class PrismaAccelerateClient extends PrismaClient {
	private cache = new Map<
		string,
		{ data: any; expires: number; staleAt: number }
	>();
	private readonly maxCacheSize = 10000;
	private readonly cleanupInterval: NodeJS.Timeout;

	constructor() {
		super({
			datasources: {
				db: {
					url: process.env.DATABASE_URL,
				},
			},
			log:
				process.env.NODE_ENV === "development"
					? ["query", "error", "warn"]
					: ["error"],
		});

		// Cleanup expired cache entries every 5 minutes
		this.cleanupInterval = setInterval(() => {
			this.cleanupCache();
		}, 5 * 60 * 1000);

		// Graceful shutdown
		process.on("beforeExit", () => this.disconnect());
		process.on("SIGINT", () => this.disconnect());
		process.on("SIGTERM", () => this.disconnect());
	}

	// Enhanced findMany with automatic caching
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

		const result = await model.findMany(options);
		this.setCache(cacheKey, result, strategy);
		return result;
	}

	// Enhanced findUnique with automatic caching
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

		const result = await model.findUnique(options);
		if (result) {
			this.setCache(cacheKey, result, strategy);
		}
		return result;
	}

	// Enhanced findFirst with automatic caching
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

		const result = await model.findFirst(options);
		if (result) {
			this.setCache(cacheKey, result, strategy);
		}
		return result;
	}

	// Enhanced count with automatic caching
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

		const result = await model.count(options);
		this.setCache(cacheKey, result, strategy);
		return result;
	}

	// Enhanced aggregate with automatic caching
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

		const result = await model.aggregate(options);
		this.setCache(cacheKey, result, strategy);
		return result;
	}

	// Batch operations with intelligent caching
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

		// Execute uncached operations in parallel
		if (uncachedOperations.length > 0) {
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

	// Disconnect and cleanup
	async disconnect(): Promise<void> {
		try {
			clearInterval(this.cleanupInterval);
			this.cache.clear();
			await super.$disconnect();
			console.log("Prisma Accelerate client disconnected successfully");
		} catch (error: any) {
			console.error("Error disconnecting Prisma Accelerate client:", error);
		}
	}
}

// Create and export the enhanced Prisma client
const prisma = new PrismaAccelerateClient();

// Development mode global assignment
if (process.env.NODE_ENV !== "production") {
	(globalThis as any).prisma = prisma;
}

// Add performance tracking in development mode
const trackedPrisma =
	process.env.NODE_ENV === "development"
		? createPrismaWithPerformanceTracking(prisma)
		: prisma;

// Export cache strategies for external use
export { DEFAULT_CACHE_STRATEGIES };
export type { CacheStrategy };

// Export the enhanced client
export default trackedPrisma;
