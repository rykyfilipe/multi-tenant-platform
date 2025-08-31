/** @format */
// Storage usage middleware for automatic updates after data changes

import { updateTenantMemoryUsage } from "./memory-tracking";

/**
 * Middleware to update storage usage after data operations
 * Optimized: Uses a longer delay and batches updates to avoid performance issues
 */
export const updateMemoryAfterDataChange = async (tenantId: number) => {
	try {
		// Update storage usage asynchronously with longer delay to batch updates
		setTimeout(async () => {
			try {
				await updateTenantMemoryUsage(tenantId);
			} catch (error) {
				console.error("Error updating storage usage:", error);
			}
		}, 30000); // Delay by 30 seconds to batch multiple operations
	} catch (error) {
		console.error("Error scheduling storage update:", error);
	}
};

/**
 * Middleware to update storage usage after row operations
 */
export const updateMemoryAfterRowChange = async (tenantId: number) => {
	await updateMemoryAfterDataChange(tenantId);
};

/**
 * Optimized middleware for single cell updates - minimal impact
 * Uses a much longer delay and lower priority since one cell has negligible storage impact
 */
export const updateMemoryAfterCellChange = async (tenantId: number) => {
	try {
		// Single cell changes have minimal impact, so we can afford much longer delays
		setTimeout(async () => {
			try {
				await updateTenantMemoryUsage(tenantId);
			} catch (error) {
				console.error("Error updating storage usage after cell change:", error);
			}
		}, 300000); // Delay by 5 minutes for single cell updates
	} catch (error) {
		console.error("Error scheduling cell storage update:", error);
	}
};

/**
 * Middleware to update storage usage after table operations
 */
export const updateMemoryAfterTableChange = async (tenantId: number) => {
	await updateMemoryAfterDataChange(tenantId);
};

/**
 * Middleware to update storage usage after database operations
 */
export const updateMemoryAfterDatabaseChange = async (tenantId: number) => {
	await updateMemoryAfterDataChange(tenantId);
};
