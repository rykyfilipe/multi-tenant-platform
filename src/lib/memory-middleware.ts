/** @format */
// Storage usage middleware for automatic updates after data changes

import { updateTenantMemoryUsage } from "./memory-tracking";

/**
 * Middleware to update storage usage after data operations
 */
export const updateMemoryAfterDataChange = async (tenantId: number) => {
	try {
		// Update storage usage asynchronously to not block the main operation
		setTimeout(async () => {
			try {
				await updateTenantMemoryUsage(tenantId);
			} catch (error) {
				// Error updating storage usage
			}
		}, 1000); // Delay by 1 second to ensure data is committed
	} catch (error) {
		// Error scheduling storage update
	}
};

/**
 * Middleware to update storage usage after row operations
 */
export const updateMemoryAfterRowChange = async (tenantId: number) => {
	await updateMemoryAfterDataChange(tenantId);
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
