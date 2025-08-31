/** @format */

import { NextResponse } from "next/server";
import { memoryCache } from "./memory-cache";
//qqqqqqqqqqqqqqqqqqqqqqqqS
// Cache durations in seconds
export const CACHE_DURATIONS = {
	USER: 600, // 10 minutes
	TENANT: 900, // 15 minutes
	DATABASE_LIST: 300, // 5 minutes
	TABLE_LIST: 300, // 5 minutes
	TABLE_METADATA: 600, // 10 minutes
	COUNTS: 300, // 5 minutes
	PERMISSIONS: 900, // 15 minutes
	API_TOKENS: 1800, // 30 minutes
	MEMORY_USAGE: 120, // 2 minutes
	SHORT: 60, // 1 minute
	MEDIUM: 300, // 5 minutes
	LONG: 1800, // 30 minutes
};

interface CacheOptions {
	key: string;
	duration?: number;
	tags?: string[];
}

export function createCacheKey(
	prefix: string,
	...parts: (string | number)[]
): string {
	return `${prefix}:${parts.join(":")}`;
}

export function withCache<T>(
	cacheOptions: CacheOptions,
	dataFetcher: () => Promise<T>,
): Promise<T> {
	return new Promise(async (resolve, reject) => {
		try {
			// Try to get from cache first
			const cached = memoryCache.get<T>(cacheOptions.key);
			if (cached !== null) {
				resolve(cached);
				return;
			}

			// Fetch fresh data
			const data = await dataFetcher();

			// Cache the result
			memoryCache.set(
				cacheOptions.key,
				data,
				cacheOptions.duration || CACHE_DURATIONS.MEDIUM,
			);

			resolve(data);
		} catch (error) {
			reject(error);
		}
	});
}

export function withApiCache<T>(
	request: Request,
	cacheOptions: CacheOptions,
	dataFetcher: () => Promise<T>,
): Promise<NextResponse> {
	return new Promise(async (resolve, reject) => {
		try {
			// Check if caching is disabled via header
			const noCacheHeader = request.headers.get("cache-control");
			const skipCache =
				noCacheHeader === "no-cache" || noCacheHeader === "no-store";

			if (!skipCache) {
				// Try to get from cache first
				const cached = memoryCache.get<T>(cacheOptions.key);
				if (cached !== null) {
					const response = NextResponse.json(cached);
					response.headers.set("X-Cache", "HIT");
					response.headers.set(
						"Cache-Control",
						`max-age=${cacheOptions.duration || CACHE_DURATIONS.MEDIUM}`,
					);
					resolve(response);
					return;
				}
			}

			// Fetch fresh data
			const data = await dataFetcher();

			// Cache the result (unless no-store is specified)
			if (noCacheHeader !== "no-store") {
				memoryCache.set(
					cacheOptions.key,
					data,
					cacheOptions.duration || CACHE_DURATIONS.MEDIUM,
				);
			}

			const response = NextResponse.json(data);
			response.headers.set("X-Cache", "MISS");
			response.headers.set(
				"Cache-Control",
				`max-age=${cacheOptions.duration || CACHE_DURATIONS.MEDIUM}`,
			);
			resolve(response);
		} catch (error) {
			reject(error);
		}
	});
}

// Cache invalidation helpers
export const cacheInvalidation = {
	// Invalidate user-related cache
	invalidateUser: (userId: number) => {
		memoryCache.invalidateByPattern(`user:${userId}:.*`);
		memoryCache.delete(`user:${userId}`);
	},

	// Invalidate tenant-related cache
	invalidateTenant: (tenantId: number) => {
		memoryCache.invalidateByPattern(`tenant:${tenantId}:.*`);
		memoryCache.delete(`tenant:${tenantId}`);
	},

	// Invalidate database-related cache
	invalidateDatabase: (tenantId: number, databaseId?: number) => {
		if (databaseId) {
			memoryCache.invalidateByPattern(`database:${tenantId}:${databaseId}:.*`);
		} else {
			memoryCache.invalidateByPattern(`database:${tenantId}:.*`);
		}
		// Also invalidate lists
		memoryCache.delete(`databases:${tenantId}`);
		memoryCache.invalidateByPattern(`counts:${tenantId}:.*`);
	},

	// Invalidate table-related cache
	invalidateTable: (tenantId: number, databaseId: number, tableId?: number) => {
		if (tableId) {
			memoryCache.invalidateByPattern(
				`table:${tenantId}:${databaseId}:${tableId}:.*`,
			);
		} else {
			memoryCache.invalidateByPattern(`table:${tenantId}:${databaseId}:.*`);
		}
		// Also invalidate lists
		memoryCache.delete(`tables:${tenantId}:${databaseId}`);
		memoryCache.delete(`databases:${tenantId}`);
		memoryCache.invalidateByPattern(`counts:${tenantId}:.*`);
	},

	// Invalidate rows cache (affects counts and memory)
	invalidateRows: (tenantId: number, databaseId: number, tableId: number) => {
		memoryCache.invalidateByPattern(
			`rows:${tenantId}:${databaseId}:${tableId}:.*`,
		);
		memoryCache.invalidateByPattern(`counts:${tenantId}:.*`);
		memoryCache.invalidateByPattern(`memory:${tenantId}:.*`);
	},

	// Invalidate permissions cache
	invalidatePermissions: (tenantId: number, userId?: number) => {
		if (userId) {
			memoryCache.invalidateByPattern(`permissions:${tenantId}:${userId}:.*`);
		} else {
			memoryCache.invalidateByPattern(`permissions:${tenantId}:.*`);
		}
	},



	// Invalidate memory usage cache
	invalidateMemory: (tenantId: number) => {
		memoryCache.invalidateByPattern(`memory:${tenantId}:.*`);
	},

	// Invalidate all cache for a tenant
	invalidateAllTenantCache: (tenantId: number) => {
		memoryCache.invalidateByPattern(`.*:${tenantId}:.*`);
		memoryCache.delete(`tenant:${tenantId}`);
	},
};

// Middleware function to add caching headers
export function addCacheHeaders(
	response: NextResponse,
	duration: number,
): NextResponse {
	response.headers.set(
		"Cache-Control",
		`max-age=${duration}, s-maxage=${duration}`,
	);
	response.headers.set("X-Cache-Duration", duration.toString());
	return response;
}

// Helper to create conditional cache keys based on user role
export function createRoleBasedCacheKey(
	prefix: string,
	tenantId: number,
	userId: number,
	role: string,
	...additionalParts: (string | number)[]
): string {
	if (role === "ADMIN") {
		return createCacheKey(prefix, tenantId, "admin", ...additionalParts);
	} else {
		return createCacheKey(prefix, tenantId, "user", userId, ...additionalParts);
	}
}
