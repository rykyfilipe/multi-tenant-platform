/** @format */
// Storage tracking service for tenant data usage

import { prisma } from "./prisma";

export interface MemoryUsage {
	usedGB: number;
	limitGB: number;
	percentage: number;
	lastUpdate: Date;
}

export interface MemoryCalculation {
	totalRows: number;
	totalColumns: number;
	totalTables: number;
	estimatedSizeGB: number;
}

/**
 * Calculate storage usage based on data size
 * Formula: (rows * columns * avg_cell_size) / (1024^3) for GB
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
		let totalCells = 0;

		// Calculate totals
		for (const database of databases) {
			for (const table of database.tables) {
				totalTables++;
				totalColumns += table.columns.length;
				totalRows += table.rows.length;

				// Count cells
				for (const row of table.rows) {
					totalCells += row.cells.length;
				}
			}
		}

		// Estimate storage usage
		// Average cell size: ~100 bytes (including overhead)
		const avgCellSizeBytes = 100;
		const totalBytes = totalCells * avgCellSizeBytes;
		const estimatedSizeGB = totalBytes / (1024 * 1024 * 1024);

		return {
			totalRows,
			totalColumns,
			totalTables,
			estimatedSizeGB: Math.round(estimatedSizeGB * 1000) / 1000, // Round to 3 decimal places
		};
	} catch (error) {
		console.error("Error calculating storage usage:", error);
		return {
			totalRows: 0,
			totalColumns: 0,
			totalTables: 0,
			estimatedSizeGB: 0,
		};
	}
};

/**
 * Get storage limits based on subscription plan
 */
export const getMemoryLimitForPlan = (plan: string | null): number => {
	switch (plan) {
		case "Starter":
			return 1.0; // 1 GB
		case "Pro":
			return 10.0; // 10 GB
		case "Enterprise":
			return 100.0; // 100 GB
		default:
			return 0.1; // 100 MB for free tier
	}
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

		// Get storage limit based on plan
		const memoryLimitGB = getMemoryLimitForPlan(tenant.admin?.subscriptionPlan);

		// Update tenant storage usage
		const updatedTenant = await prisma.tenant.update({
			where: { id: tenantId },
			data: {
				memoryUsedGB: calculation.estimatedSizeGB,
				memoryLimitGB,
				lastMemoryUpdate: new Date(),
			},
		});

		const percentage = (calculation.estimatedSizeGB / memoryLimitGB) * 100;

		return {
			usedGB: calculation.estimatedSizeGB,
			limitGB: memoryLimitGB,
			percentage: Math.min(percentage, 100), // Cap at 100%
			lastUpdate: updatedTenant.lastMemoryUpdate,
		};
	} catch (error) {
		console.error("Error updating tenant storage usage:", error);
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
			where: { id: tenantId },
		});

		if (!tenant) {
			throw new Error("Tenant not found");
		}

		const percentage = (tenant.memoryUsedGB / tenant.memoryLimitGB) * 100;

		return {
			usedGB: tenant.memoryUsedGB,
			limitGB: tenant.memoryLimitGB,
			percentage: Math.min(percentage, 100),
			lastUpdate: tenant.lastMemoryUpdate,
		};
	} catch (error) {
		console.error("Error getting tenant storage usage:", error);
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
		console.error("Error checking storage limit:", error);
		return {
			isNearLimit: false,
			isOverLimit: false,
			warningThreshold: 80,
		};
	}
};
