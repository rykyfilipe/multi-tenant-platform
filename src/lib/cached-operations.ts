/** @format */

import prisma from "./prisma";
import { cacheHelpers } from "./memory-cache";
import {
	withCache,
	createCacheKey,
	CACHE_DURATIONS,
} from "./api-cache-middleware";

// Simplified cached operations without complex cache logic
export const cachedOperations = {
	// User operations
	getUser: async (userId: number) => {
		try {
			const cached = cacheHelpers.getUser(userId);
			if (cached) return cached;

			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					email: true,
					name: true,
					role: true,
					tenantId: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (user) {
				cacheHelpers.setUser(userId, user);
			}
			return user;
		} catch (error) {
			return null;
		}
	},

	getUserTokens: async (userId: number) => {
		return []; // API tokens are not supported
	},

	// User operations
	getUsers: async (tenantId: number) => {
		try {
			return await prisma.user.findMany({ where: { tenantId } });
		} catch (error) {
			return [];
		}
	},

	// Cache invalidation helpers
	invalidateUserCache: (userId: number) => {
		cacheHelpers.invalidateUser(userId);
	},

	invalidateTenantCache: (tenantId: number) => {
		cacheHelpers.invalidateTenant(tenantId);
		// Also invalidate counts for all users in this tenant
		cacheHelpers.invalidateCounts(tenantId);
	},

	invalidateDatabaseCache: (databaseId: number, tenantId?: number) => {
		if (tenantId) {
			// Invalidate counts when database changes
			cacheHelpers.invalidateCounts(tenantId);
		}
	},

	invalidateTableCache: (tableId: number, tenantId?: number) => {
		if (tenantId) {
			// Invalidate counts when table changes
			cacheHelpers.invalidateCounts(tenantId);
		}
	},

	invalidateColumnCache: (columnId: number, tenantId?: number) => {
		if (tenantId) {
			// Columns don't affect counts, but might affect other cached data
			cacheHelpers.invalidateCounts(tenantId);
		}
	},

	invalidateRowCache: (tableId: number, tenantId?: number) => {
		if (tenantId) {
			// Rows don't affect counts, but might affect other cached data
			cacheHelpers.invalidateCounts(tenantId);
		}
	},

	// Clear all caches for a tenant
	clearTenantCache: (tenantId: number) => {
		cacheHelpers.clearTenantCache(tenantId);
	},

	// Clear all caches
	clearAllCaches: () => {
		cacheHelpers.clearAllCaches();
	},
};
