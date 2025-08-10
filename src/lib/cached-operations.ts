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
			// Check cache first
			const cached = cacheHelpers.getUser(userId);
			if (cached) return cached;

			const user = await prisma.user.findUnique({ where: { id: userId } });
			if (user) {
				cacheHelpers.setUser(userId, user);
			}
			return user;
		} catch (error) {
			return null;
		}
	},

	getUserByEmail: async (email: string) => {
		try {
			return await prisma.user.findUnique({ where: { email } });
		} catch (error) {
			return null;
		}
	},

	// Tenant operations
	getTenant: async (tenantId: number) => {
		try {
			// Check cache first
			const cached = cacheHelpers.getTenant(tenantId);
			if (cached) return cached;

			const tenant = await prisma.tenant.findUnique({
				where: { id: tenantId },
			});
			if (tenant) {
				cacheHelpers.setTenant(tenantId, tenant);
			}
			return tenant;
		} catch (error) {
			return null;
		}
	},

	getTenantByAdmin: async (adminId: number) => {
		try {
			return await prisma.tenant.findUnique({ where: { adminId } });
		} catch (error) {
			return null;
		}
	},

	// Database operations
	getDatabases: async (tenantId: number) => {
		try {
			return await prisma.database.findMany({ where: { tenantId } });
		} catch (error) {
			return [];
		}
	},

	getDatabase: async (databaseId: number, tenantId: number) => {
		try {
			return await prisma.database.findFirst({
				where: { id: databaseId, tenantId },
			});
		} catch (error) {
			return null;
		}
	},

	// Table operations
	getTables: async (databaseId: number) => {
		try {
			return await prisma.table.findMany({ where: { databaseId } });
		} catch (error) {
			return [];
		}
	},

	getTable: async (tableId: number, databaseId: number) => {
		try {
			return await prisma.table.findFirst({
				where: { id: tableId, databaseId },
			});
		} catch (error) {
			return null;
		}
	},

	getPublicTables: async (tenantId: number) => {
		try {
			return await prisma.table.findMany({
				where: {
					database: { tenantId },
					isPublic: true,
				},
				select: {
					id: true,
					name: true,
					description: true,
					isPublic: true,
					createdAt: true,
					databaseId: true,
					_count: {
						select: {
							columns: true,
							rows: true,
						},
					},
				},
				orderBy: {
					createdAt: "asc",
				},
			});
		} catch (error) {
			return [];
		}
	},

	// Column operations
	getColumns: async (tableId: number) => {
		try {
			return await prisma.column.findMany({ where: { tableId } });
		} catch (error) {
			return [];
		}
	},

	getColumn: async (columnId: number, tableId: number) => {
		try {
			return await prisma.column.findFirst({
				where: { id: columnId, tableId },
			});
		} catch (error) {
			return null;
		}
	},

	// Row operations with pagination support
	getRows: async (
		tableId: number,
		includeCells: boolean = true,
		page: number = 1,
		pageSize: number = 25,
	) => {
		try {
			const skip = (page - 1) * pageSize;

			// Get total count and paginated rows in parallel
			const [totalRows, rows] = await Promise.all([
				prisma.row.count({ where: { tableId } }),
				prisma.row.findMany({
					where: { tableId },
					include: includeCells ? { cells: true } : undefined,
					skip,
					take: pageSize,
					orderBy: { id: "asc" }, // Consistent ordering for pagination
				}),
			]);

			return {
				data: rows,
				pagination: {
					page,
					pageSize,
					totalRows,
					totalPages: Math.ceil(totalRows / pageSize),
					hasNext: page * pageSize < totalRows,
					hasPrev: page > 1,
				},
			};
		} catch (error) {
			return {
				data: [],
				pagination: {
					page: 1,
					pageSize,
					totalRows: 0,
					totalPages: 0,
					hasNext: false,
					hasPrev: false,
				},
			};
		}
	},

	// Legacy method for backwards compatibility
	getRowsLegacy: async (tableId: number, includeCells: boolean = true) => {
		try {
			return await prisma.row.findMany({
				where: { tableId },
				include: includeCells ? { cells: true } : undefined,
			});
		} catch (error) {
			return [];
		}
	},

	getRow: async (rowId: number, tableId: number) => {
		try {
			return await prisma.row.findFirst({
				where: { id: rowId, tableId },
				include: { cells: true },
			});
		} catch (error) {
			return null;
		}
	},

	// Permission operations
	getTablePermissions: async (userId: number, tenantId: number) => {
		try {
			return await prisma.tablePermission.findMany({
				where: { userId, tenantId },
			});
		} catch (error) {
			return [];
		}
	},

	getColumnPermissions: async (userId: number, tenantId: number) => {
		try {
			return await prisma.columnPermission.findMany({
				where: { userId, tenantId },
			});
		} catch (error) {
			return [];
		}
	},

	// Count operations - optimized with proper aggregation and caching
	getCounts: async (tenantId: number, userId: number) => {
		try {
			// Check cache first
			const cached = cacheHelpers.getCounts(tenantId, userId);
			if (cached) return cached;

			// Use a single optimized query to get all counts
			const result = (await prisma.$queryRaw`
				SELECT 
					(SELECT COUNT(*) FROM "Database" WHERE "tenantId" = ${tenantId}) as databases,
					(SELECT COUNT(*) FROM "Table" t 
						JOIN "Database" d ON t."databaseId" = d.id 
						WHERE d."tenantId" = ${tenantId}) as tables,
					(SELECT COUNT(*) FROM "User" WHERE "tenantId" = ${tenantId}) as users,
					(SELECT COUNT(*) FROM "ApiToken" WHERE "userId" = ${userId}) as "apiTokens",
					(SELECT COUNT(*) FROM "Table" t 
						JOIN "Database" d ON t."databaseId" = d.id 
						WHERE d."tenantId" = ${tenantId} AND t."isPublic" = true) as "publicTables",
					(SELECT COUNT(*) FROM "Row" r 
						JOIN "Table" t ON r."tableId" = t.id 
						JOIN "Database" d ON t."databaseId" = d.id 
						WHERE d."tenantId" = ${tenantId}) as rows
			`) as any[];

			const counts = result[0];
			const countArray = [
				Number(counts.databases),
				Number(counts.tables),
				Number(counts.users),
				Number(counts.apiTokens),
				Number(counts.publicTables),
				Number(counts.rows),
			];

			// Cache the result for 5 minutes
			cacheHelpers.setCounts(tenantId, userId, countArray);

			return countArray;
		} catch (error) {
			console.error("Error in getCounts:", error);
			// Fallback to individual queries if raw query fails
			try {
				const counts = await prisma.$transaction([
					prisma.database.count({ where: { tenantId } }),
					prisma.table.count({ where: { database: { tenantId } } }),
					prisma.user.count({ where: { tenantId } }),
					prisma.apiToken.count({ where: { userId } }),
					prisma.table.count({
						where: {
							database: { tenantId },
							isPublic: true,
						},
					}),
					prisma.row.aggregate({
						where: { table: { database: { tenantId } } },
						_count: { id: true },
					}),
				]);

				return [
					counts[0],
					counts[1],
					counts[2],
					counts[3],
					counts[4],
					counts[5]._count.id,
				];
			} catch (fallbackError) {
				console.error("Fallback count query also failed:", fallbackError);
				return [0, 0, 0, 0, 0, 0];
			}
		}
	},

	// API Token operations
	getApiTokens: async (userId: number) => {
		try {
			// Check cache first
			const cached = cacheHelpers.getApiTokens(userId);
			if (cached) return cached;

			const tokens = await prisma.apiToken.findMany({ where: { userId } });
			if (tokens) {
				cacheHelpers.setApiTokens(userId, tokens);
			}
			return tokens;
		} catch (error) {
			return [];
		}
	},

	getApiToken: async (tokenHash: string) => {
		try {
			return await prisma.apiToken.findUnique({ where: { tokenHash } });
		} catch (error) {
			return null;
		}
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
			// Invalidate counts when rows change
			cacheHelpers.invalidateCounts(tenantId);
			// Also invalidate memory usage
			cacheHelpers.invalidateMemoryUsage(tenantId);
		}
	},

	invalidatePermissionCache: (userId: number, tenantId: number) => {
		// Permissions don't affect counts directly, but invalidate user cache
		cacheHelpers.invalidateUser(userId);
	},

	invalidateApiTokenCache: (userId: number) => {
		cacheHelpers.invalidateApiTokens(userId);
		// Also need to invalidate counts as API tokens affect limits
		const user = cacheHelpers.getUser(userId);
		if (user?.tenantId) {
			cacheHelpers.invalidateCounts(user.tenantId, userId);
		}
	},

	// Clear all cache
	clearAllCache: () => {
		cacheHelpers.invalidateUser(-1); // This will clear all user caches
		cacheHelpers.invalidateTenant(-1); // This will clear all tenant caches
		// Add more specific clearing as needed
	},

	// Generic cache invalidation method
	invalidate: (pattern: string) => {
		// Use the memory cache pattern invalidation
		const { memoryCache } = require("./memory-cache");
		memoryCache.invalidateByPattern(pattern);
	},
};
