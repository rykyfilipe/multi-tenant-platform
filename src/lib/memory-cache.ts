/** @format */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number; // Time to live in milliseconds
}

class MemoryCache {
	private cache = new Map<string, CacheEntry<any>>();
	private cleanupInterval: NodeJS.Timeout;

	constructor() {
		// Clean up expired entries every 5 minutes
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, 5 * 60 * 1000);
	}

	set<T>(key: string, data: T, ttlSeconds: number = 300): void {
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl: ttlSeconds * 1000,
		};
		this.cache.set(key, entry);
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
			}
		}
	}

	// Cache size management
	size(): number {
		return this.cache.size;
	}

	// Get cache statistics for monitoring
	getStats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys()),
		};
	}

	// Invalidate cache entries by pattern (useful for related data)
	invalidateByPattern(pattern: string): void {
		const regex = new RegExp(pattern);
		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	// Cleanup on application shutdown
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
		this.clear();
	}
}

// Create a singleton instance
export const memoryCache = new MemoryCache();

// Helper functions for common cache patterns
export const cacheHelpers = {
	// User cache with 10 minute TTL
	setUser: (userId: number, userData: any) => {
		memoryCache.set(`user:${userId}`, userData, 600);
	},
	getUser: (userId: number) => {
		return memoryCache.get(`user:${userId}`);
	},
	invalidateUser: (userId: number) => {
		memoryCache.delete(`user:${userId}`);
		// Also invalidate related cache entries
		memoryCache.invalidateByPattern(`user:${userId}:.*`);
	},

	// Tenant cache with 15 minute TTL
	setTenant: (tenantId: number, tenantData: any) => {
		memoryCache.set(`tenant:${tenantId}`, tenantData, 900);
	},
	getTenant: (tenantId: number) => {
		return memoryCache.get(`tenant:${tenantId}`);
	},
	invalidateTenant: (tenantId: number) => {
		memoryCache.delete(`tenant:${tenantId}`);
		memoryCache.invalidateByPattern(`tenant:${tenantId}:.*`);
	},

	// Counts cache with 5 minute TTL (more frequently updated)
	setCounts: (tenantId: number, userId: number, counts: any) => {
		memoryCache.set(`counts:${tenantId}:${userId}`, counts, 300);
	},
	getCounts: (tenantId: number, userId: number) => {
		return memoryCache.get(`counts:${tenantId}:${userId}`);
	},
	invalidateCounts: (tenantId: number, userId?: number) => {
		if (userId) {
			memoryCache.delete(`counts:${tenantId}:${userId}`);
		} else {
			memoryCache.invalidateByPattern(`counts:${tenantId}:.*`);
		}
	},

	// API Token cache with 30 minute TTL
	setApiTokens: (userId: number, tokens: any) => {
		memoryCache.set(`api-tokens:${userId}`, tokens, 1800);
	},
	getApiTokens: (userId: number) => {
		return memoryCache.get(`api-tokens:${userId}`);
	},
	invalidateApiTokens: (userId: number) => {
		memoryCache.delete(`api-tokens:${userId}`);
	},

	// Memory usage cache with 2 minute TTL (frequently checked)
	setMemoryUsage: (tenantId: number, memoryData: any) => {
		memoryCache.set(`memory:${tenantId}`, memoryData, 120);
	},
	getMemoryUsage: (tenantId: number) => {
		return memoryCache.get(`memory:${tenantId}`);
	},
	invalidateMemoryUsage: (tenantId: number) => {
		memoryCache.delete(`memory:${tenantId}`);
	},
};

// Graceful shutdown handler
process.on("SIGTERM", () => {
	memoryCache.destroy();
});

process.on("SIGINT", () => {
	memoryCache.destroy();
});
