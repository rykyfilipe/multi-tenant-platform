/** @format */
// Storage tracking service for tenant data usage

import prisma from "./prisma";
import { getMemoryLimitForPlan } from "./planConstants";
import { convertBytesToMB, convertMBToBytes } from "./storage-utils";

export interface MemoryUsage {
	usedMB: number;
	limitMB: number;
	percentage: number;
	lastUpdate: Date;
}

export interface MemoryCalculation {
	totalRows: number;
	totalColumns: number;
	totalTables: number;
	estimatedSizeMB: number;
}

/**
 * Calculate storage usage based on actual data size using PostgreSQL pg_column_size
 * Formula: Sum of actual column sizes from database using pg_column_size
 */
export const calculateMemoryUsage = async (
	tenantId: number,
): Promise<MemoryCalculation> => {
	try {
		// Get all databases for the tenant
		const databases = await prisma.database.findMany({
			where: { tenantId },
			include: {
				tables: {
					include: {
						columns: true,
						rows: {
							include: {
								cells: true,
							},
						},
					},
				},
			},
		});

		let totalRows = 0;
		let totalColumns = 0;
		let totalTables = 0;
		let totalBytes = 0;

		// Calculate totals
		for (const database of databases) {
			for (const table of database.tables) {
				totalTables++;
				totalColumns += table.columns.length;
				totalRows += table.rows.length;
			}
		}

		// Get exact cell sizes using PostgreSQL pg_column_size
		try {
			// Query to get the exact size of all cell values using pg_column_size
			const cellSizeQuery = `
				SELECT 
					SUM(pg_column_size(c."value")) as total_cell_bytes,
					COUNT(c."value") as total_cells
				FROM "Cell" c
				INNER JOIN "Row" r ON c."rowId" = r.id
				INNER JOIN "Table" t ON r."tableId" = t.id
				INNER JOIN "Database" d ON t."databaseId" = d.id
				WHERE d."tenantId" = $1
			`;

			const result = await prisma.$queryRawUnsafe(cellSizeQuery, tenantId);

			if (result && Array.isArray(result) && result.length > 0) {
				const sizeData = result[0] as any;
				totalBytes = Number(sizeData.total_cell_bytes) || 0; // Convert BigInt to Number
				const totalCells = Number(sizeData.total_cells) || 0; // Convert BigInt to Number
			}
		} catch (sqlError) {
			// Fallback to JSON calculation if SQL fails
			for (const database of databases) {
				for (const table of database.tables) {
					for (const row of table.rows) {
						for (const cell of row.cells) {
							const jsonString = JSON.stringify(cell.value);
							const cellBytes = Buffer.byteLength(jsonString, "utf8");
							totalBytes += cellBytes;
						}
					}
				}
			}
		}

		// Convert to MB using the storage utility
		const estimatedSizeMB = convertBytesToMB(totalBytes);

		const result = {
			totalRows,
			totalColumns,
			totalTables,
			estimatedSizeMB: Math.round(estimatedSizeMB * 1000) / 1000, // Round to 3 decimal places
		};

		return result;
	} catch (error) {
		return {
			totalRows: 0,
			totalColumns: 0,
			totalTables: 0,
			estimatedSizeMB: 0,
		};
	}
};

/**
 * Calculate actual database size using PostgreSQL native functions
 */
export const calculateActualDatabaseSize = async (
	tenantId: number,
): Promise<MemoryCalculation> => {
	try {
		// Get all databases for the tenant
		const databases = await prisma.database.findMany({
			where: { tenantId },
			include: {
				tables: {
					include: {
						columns: true,
						rows: {
							include: {
								cells: true,
							},
						},
					},
				},
			},
		});

		let totalRows = 0;
		let totalColumns = 0;
		let totalTables = 0;
		let totalBytes = 0;

		// Calculate totals
		for (const database of databases) {
			for (const table of database.tables) {
				totalTables++;
				totalColumns += table.columns.length;
				totalRows += table.rows.length;
			}
		}

		// Try to get actual table sizes from PostgreSQL
		try {
			// Get the database name from the first database
			if (databases.length > 0) {
				const dbName = databases[0].name;

				// Query to get actual table sizes
				const sizeQuery = `
					SELECT 
						pg_size_pretty(pg_total_relation_size('"${dbName}"'::regclass)) as size_pretty,
						pg_total_relation_size('"${dbName}"'::regclass) as size_bytes
					FROM pg_tables 
					WHERE tablename = '${dbName}'
				`;

				// Execute raw query
				const result = await prisma.$queryRawUnsafe(sizeQuery);

				if (result && Array.isArray(result) && result.length > 0) {
					const sizeData = result[0] as any;
					totalBytes = sizeData.size_bytes || 0;
				}
			}
		} catch (sizeError) {
			// Fallback to cell calculation

			// Fallback to cell calculation
			for (const database of databases) {
				for (const table of database.tables) {
					for (const row of table.rows) {
						for (const cell of row.cells) {
							const jsonString = JSON.stringify(cell.value);
							const cellBytes = Buffer.byteLength(jsonString, "utf8");
							totalBytes += cellBytes;
						}
					}
				}
			}
		}

		const estimatedSizeMB = convertBytesToMB(totalBytes);

		const result = {
			totalRows,
			totalColumns,
			totalTables,
			estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
		};

		return result;
	} catch (error) {
		return {
			totalRows: 0,
			totalColumns: 0,
			totalTables: 0,
			estimatedSizeMB: 0,
		};
	}
};

/**
 * Get storage limits based on subscription plan
 * @deprecated Use getMemoryLimitForPlan from planConstants instead
 */
export const getMemoryLimitForPlanLegacy = (plan: string | null): number => {
	return getMemoryLimitForPlan(plan);
};

/**
 * Update tenant storage usage
 */
export const updateTenantMemoryUsage = async (
	tenantId: number,
): Promise<MemoryUsage> => {
	try {
		// Get tenant with subscription info
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenantId },
			include: {
				admin: {
					select: {
						subscriptionPlan: true,
					},
				},
			},
		});

		if (!tenant) {
			throw new Error("Tenant not found");
		}

		// Calculate current storage usage
		const calculation = await calculateMemoryUsage(tenantId);

		// Get storage limit based on plan (already in MB)
		const memoryLimitMB = getMemoryLimitForPlan(tenant.admin?.subscriptionPlan);

		// Update tenant storage usage (store in MB)
		const updatedTenant = await prisma.tenant.update({
			where: { id: tenantId },
			data: {
				memoryUsedGB: calculation.estimatedSizeMB, // Store MB value directly
				memoryLimitGB: memoryLimitMB, // Store MB value directly
				lastMemoryUpdate: new Date(),
			},
		});

		const percentage = (calculation.estimatedSizeMB / memoryLimitMB) * 100;

		const result = {
			usedMB: calculation.estimatedSizeMB,
			limitMB: memoryLimitMB,
			percentage: Math.min(percentage, 100), // Cap at 100%
			lastUpdate: updatedTenant.lastMemoryUpdate || new Date(),
		};

		return result;
	} catch (error) {
		throw error;
	}
};

/**
 * Get current storage usage for a tenant
 */
export const getTenantMemoryUsage = async (
	tenantId: number,
): Promise<MemoryUsage> => {
	try {
		const tenant = await prisma.tenant.findUnique({
			where: { id: tenantId }
		});

		if (!tenant) {
			throw new Error("Tenant not found");
		}

		// Read stored MB values directly (no conversion needed)
		const usedMB = tenant.memoryUsedGB; // Already in MB
		const limitMB = tenant.memoryLimitGB; // Already in MB
		const percentage = (usedMB / limitMB) * 100;

		const result = {
			usedMB,
			limitMB,
			percentage: Math.min(percentage, 100),
			lastUpdate: tenant.lastMemoryUpdate || new Date(),
		};

		return result;
	} catch (error) {
		throw error;
	}
};

/**
 * Check if tenant is approaching storage limit
 */
export const checkMemoryLimit = async (
	tenantId: number,
): Promise<{
	isNearLimit: boolean;
	isOverLimit: boolean;
	warningThreshold: number;
}> => {
	try {
		const memoryUsage = await getTenantMemoryUsage(tenantId);
		const warningThreshold = 80; // 80% warning threshold

		return {
			isNearLimit: memoryUsage.percentage >= warningThreshold,
			isOverLimit: memoryUsage.percentage >= 100,
			warningThreshold,
		};
	} catch (error) {
		return {
			isNearLimit: false,
			isOverLimit: false,
			warningThreshold: 80,
		};
	}
};
