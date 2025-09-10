/** @format */

import prisma, { DEFAULT_CACHE_STRATEGIES } from "./prisma";

// Prisma Accelerate Cache Operations
// This file provides cached operations using Prisma Accelerate instead of external cache systems

export const cachedOperations = {
	// User operations with Prisma Accelerate cache
	getUser: async (userId: number) => {
		try {
			return await prisma.findUniqueWithCache(
				prisma.user,
				{
					where: { id: userId },
					select: {
						id: true,
						email: true,
						firstName: true,
						lastName: true,
						role: true,
						tenantId: true,
						subscriptionPlan: true,
						subscriptionStatus: true,
						createdAt: true,
						updatedAt: true,
					},
				},
				DEFAULT_CACHE_STRATEGIES.user,
			);
		} catch (error) {
			console.error("Error fetching user:", error);
			return null;
		}
	},

	getUserTokens: async (userId: number) => {
		// API tokens are not supported in this version
		return [];
	},

	// User list operations with Prisma Accelerate cache
	getUsers: async (tenantId: number) => {
		try {
			return await prisma.findManyWithCache(
				prisma.user,
				{ where: { tenantId } },
				DEFAULT_CACHE_STRATEGIES.userList,
			);
		} catch (error) {
			console.error("Error fetching users:", error);
			return [];
		}
	},

	// Tenant operations with Prisma Accelerate cache
	getTenant: async (tenantId: number) => {
		try {
			return await prisma.findUniqueWithCache(
				prisma.tenant,
				{
					where: { id: tenantId },
					include: {
						admin: {
							select: {
								id: true,
								email: true,
								firstName: true,
								lastName: true,
							},
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.tenant,
			);
		} catch (error) {
			console.error("Error fetching tenant:", error);
			return null;
		}
	},

	// Database operations with Prisma Accelerate cache
	getDatabase: async (databaseId: number) => {
		try {
			return await prisma.findUniqueWithCache(
				prisma.database,
				{
					where: { id: databaseId },
					include: {
						tenant: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.database,
			);
		} catch (error) {
			console.error("Error fetching database:", error);
			return null;
		}
	},

	getDatabases: async (tenantId: number) => {
		try {
			return await prisma.findManyWithCache(
				prisma.database,
				{
					where: { tenantId },
					include: {
						tables: {
							include: {
								columns: {
									orderBy: { order: "asc" },
								},
							},
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.databaseList,
			);
		} catch (error) {
			console.error("Error fetching databases:", error);
			return [];
		}
	},

	// Table operations with Prisma Accelerate cache
	getTable: async (tableId: number) => {
		try {
			return await prisma.findUniqueWithCache(
				prisma.table,
				{
					where: { id: tableId },
					include: {
						columns: {
							orderBy: { order: "asc" },
						},
						database: {
							select: {
								id: true,
								name: true,
								tenantId: true,
							},
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.table,
			);
		} catch (error) {
			console.error("Error fetching table:", error);
			return null;
		}
	},

	getTables: async (databaseId: number) => {
		try {
			return await prisma.findManyWithCache(
				prisma.table,
				{
					where: { databaseId },
					include: {
						columns: {
							orderBy: { order: "asc" },
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.tableList,
			);
		} catch (error) {
			console.error("Error fetching tables:", error);
			return [];
		}
	},

	// Row operations with Prisma Accelerate cache
	getTableRows: async (
		tableId: number,
		page: number = 1,
		pageSize: number = 25,
		filters?: any,
	) => {
		try {
			const skip = (page - 1) * pageSize;

			// Get total count and rows in parallel with Prisma Accelerate cache
			const [totalRows, rows] = await Promise.all([
				prisma.countWithCache(
					prisma.row,
					{ where: { tableId } },
					DEFAULT_CACHE_STRATEGIES.count,
				),
				prisma.findManyWithCache(
					prisma.row,
					{
						where: { tableId },
						include: {
							cells: {
								include: {
									column: {
										select: {
											id: true,
											name: true,
											type: true,
											order: true,
											semanticType: true,
										},
									},
								},
							},
						},
						orderBy: { createdAt: "asc" },
						skip,
						take: pageSize,
					},
					DEFAULT_CACHE_STRATEGIES.rowList,
				),
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
			console.error("Error fetching table rows:", error);
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

	// Column operations with Prisma Accelerate cache
	getColumns: async (tableId: number) => {
		try {
			return await prisma.findManyWithCache(
				prisma.column,
				{
					where: { tableId },
					orderBy: { order: "asc" },
				},
				DEFAULT_CACHE_STRATEGIES.columnList,
			);
		} catch (error) {
			console.error("Error fetching columns:", error);
			return [];
		}
	},

	// Permission operations with Prisma Accelerate cache
	getUserPermissions: async (userId: number, tableId: number) => {
		try {
			return await prisma.findUniqueWithCache(
				prisma.tablePermission,
				{
					where: {
						userId_tableId: {
							userId,
							tableId,
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.permission,
			);
		} catch (error) {
			console.error("Error fetching user permissions:", error);
			return null;
		}
	},

	// Dashboard operations with Prisma Accelerate cache
	getDashboard: async (dashboardId: number) => {
		try {
			return await prisma.findUniqueWithCache(
				prisma.dashboard,
				{
					where: { id: dashboardId },
					include: {
						widgets: {
							orderBy: { order: "asc" },
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.dashboard,
			);
		} catch (error) {
			console.error("Error fetching dashboard:", error);
			return null;
		}
	},

	getDashboards: async (userId: number) => {
		try {
			return await prisma.findManyWithCache(
				prisma.dashboard,
				{
					where: { userId },
					include: {
						widgets: {
							orderBy: { order: "asc" },
						},
					},
				},
				DEFAULT_CACHE_STRATEGIES.dashboardList,
			);
		} catch (error) {
			console.error("Error fetching data:", error);
			return [];
		}
	},

	// Count operations with Prisma Accelerate cache
	getTableRowCount: async (tableId: number) => {
		try {
			return await prisma.countWithCache(
				prisma.row,
				{ where: { tableId } },
				DEFAULT_CACHE_STRATEGIES.count,
			);
		} catch (error) {
			console.error("Error fetching table row count:", error);
			return 0;
		}
	},

	getDatabaseTableCount: async (databaseId: number) => {
		try {
			return await prisma.countWithCache(
				prisma.table,
				{ where: { databaseId } },
				DEFAULT_CACHE_STRATEGIES.count,
			);
		} catch (error) {
			console.error("Error fetching database table count:", error);
			return 0;
		}
	},

	// Cache invalidation helpers using Prisma Accelerate tags
	invalidateUserCache: (userId: number) => {
		// Prisma Accelerate will handle cache invalidation based on tags
		console.log(`Cache invalidation requested for user ${userId}`);
	},

	invalidateTenantCache: (tenantId: number) => {
		// Prisma Accelerate will handle cache invalidation based on tags
		console.log(`Cache invalidation requested for tenant ${tenantId}`);
	},

	invalidateDatabaseCache: (databaseId: number, tenantId?: number) => {
		// Prisma Accelerate will handle cache invalidation based on tags
		console.log(`Cache invalidation requested for database ${databaseId}`);
	},

	invalidateTableCache: (tableId: number, tenantId?: number) => {
		// Prisma Accelerate will handle cache invalidation based on tags
		console.log(`Cache invalidation requested for table ${tableId}`);
	},

	invalidateColumnCache: (columnId: number, tenantId?: number) => {
		// Prisma Accelerate will handle cache invalidation based on tags
		console.log(`Cache invalidation requested for column ${columnId}`);
	},

	invalidateRowCache: (tableId: number, tenantId?: number) => {
		// Prisma Accelerate will handle cache invalidation based on tags
		console.log(`Cache invalidation requested for rows in table ${tableId}`);
	},

	// Get cache statistics from Prisma Accelerate
	getCacheStats: () => {
		return prisma.getCacheStats();
	},

	// Clear all cache (for development/testing purposes)
	clearAllCache: () => {
		// This would integrate with Prisma Accelerate's cache management
		console.log("Cache clear requested - handled by Prisma Accelerate");
	},

	// Get counts for plan limits
	getCounts: async (tenantId: number, userId: number) => {
		try {
			const [databases, tables, users, rows] = await Promise.all([
				prisma.countWithCache(
					prisma.database,
					{ where: { tenantId } },
					DEFAULT_CACHE_STRATEGIES.count,
				),
				prisma.countWithCache(
					prisma.table,
					{ 
						where: { 
							database: { tenantId },
							isModuleTable: false,
							isProtected: false,
						} 
					},
					DEFAULT_CACHE_STRATEGIES.count,
				),
				prisma.countWithCache(
					prisma.user,
					{ where: { tenantId } },
					DEFAULT_CACHE_STRATEGIES.count,
				),
				prisma.countWithCache(
					prisma.row,
					{ 
						where: { 
							table: { 
								database: { tenantId }
							} 
						} 
					},
					DEFAULT_CACHE_STRATEGIES.count,
				),
			]);

			return [databases, tables, users, rows];
		} catch (error) {
			console.error("Error fetching counts:", error);
			return [0, 0, 0, 0];
		}
	},
};
