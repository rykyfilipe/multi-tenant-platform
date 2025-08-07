/** @format */

import prisma from "./prisma";

// Simplified cached operations without complex cache logic
export const cachedOperations = {
	// User operations
	getUser: async (userId: number) => {
		try {
			return await prisma.user.findUnique({ where: { id: userId } });
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
			return await prisma.tenant.findUnique({ where: { id: tenantId } });
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

	// Row operations
	getRows: async (tableId: number, includeCells: boolean = true) => {
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

	// Count operations
	getCounts: async (tenantId: number, userId: number) => {
		try {
			const [databases, tables, users, rows] = await Promise.all([
				prisma.database.count({ where: { tenantId } }),
				prisma.table.count({ where: { database: { tenantId } } }),
				prisma.user.count({ where: { tenantId } }),
				prisma.row.count({ where: { table: { database: { tenantId } } } }),
			]);

			const [apiTokens, publicTables] = await Promise.all([
				prisma.apiToken.count({ where: { userId } }),
				prisma.table.count({
					where: {
						database: { tenantId },
						isPublic: true,
					},
				}),
			]);

			return [databases, tables, users, apiTokens, publicTables, rows];
		} catch (error) {
			return [0, 0, 0, 0, 0, 0];
		}
	},

	// API Token operations
	getApiTokens: async (userId: number) => {
		try {
			return await prisma.apiToken.findMany({ where: { userId } });
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

	// Cache invalidation helpers (no-op for now)
	invalidateUserCache: (userId: number) => {
		// No-op for now
	},

	invalidateTenantCache: (tenantId: number) => {
		// No-op for now
	},

	invalidateDatabaseCache: (databaseId: number) => {
		// No-op for now
	},

	invalidateTableCache: (tableId: number) => {
		// No-op for now
	},

	invalidateColumnCache: (columnId: number) => {
		// No-op for now
	},

	invalidateRowCache: (tableId: number) => {
		// No-op for now
	},

	invalidatePermissionCache: (userId: number, tenantId: number) => {
		// No-op for now
	},

	// Clear all cache (no-op for now)
	clearAllCache: () => {
		// No-op for now
	},

	// Generic cache invalidation method
	invalidate: (pattern: string) => {
		// No-op for now - placeholder for future cache implementation
	},
};
