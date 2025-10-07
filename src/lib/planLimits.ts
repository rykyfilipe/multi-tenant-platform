/** @format */

import prisma from "./prisma";
import { PLAN_LIMITS, getRowsLimitForPlan, type PlanLimits } from "./planConstants";

// Re-export for backward compatibility
export { PLAN_LIMITS };
export type { PlanLimits };

export async function checkPlanLimit(
	userId: number,
	limitType: keyof PlanLimits,
	currentCount: number = 0,
): Promise<{ allowed: boolean; limit: number; current: number }> {
	try {
		const user = await prisma.user.findUnique({
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
		});

		console.log(`🔍 [checkPlanLimit] User info:`, {
			userId,
			plan: user?.subscriptionPlan || 'Free',
			status: user?.subscriptionStatus || 'inactive',
			limitType,
			currentCount,
		});

		if (!user || user.subscriptionStatus !== "active") {
			// Default to Free plan if no subscription
			const freeLimit = PLAN_LIMITS.Free[limitType];
			console.log(`📋 [checkPlanLimit] Using Free plan (no active subscription):`, {
				limit: freeLimit,
				current: currentCount,
				allowed: currentCount < freeLimit,
			});
			return {
				allowed: currentCount < freeLimit,
				limit: freeLimit,
				current: currentCount,
			};
		}

		const planLimits = PLAN_LIMITS[user.subscriptionPlan || "Free"];
		const limit = planLimits[limitType];

		console.log(`📋 [checkPlanLimit] Using ${user.subscriptionPlan} plan:`, {
			limit,
			current: currentCount,
			allowed: currentCount < limit,
		});

		return {
			allowed: currentCount < limit,
			limit,
			current: currentCount,
		};
	} catch (error) {
		console.error(`❌ [checkPlanLimit] Error:`, error);
		// Default to Free plan on error
		const freeLimit = PLAN_LIMITS.Free[limitType];
		return {
			allowed: currentCount < freeLimit,
			limit: freeLimit,
			current: currentCount,
		};
	}
}

export async function getCurrentCounts(
	userId: number,
): Promise<Record<keyof PlanLimits, number>> {
	try {
		const user = await prisma.user.findUnique({
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
		});

		if (!user?.tenantId) {
			return {	
				databases: 0,
				tables: 0,
				users: 0,
				rows: 0,
				storage: 0,
			};
		}

		try {
			// Get counts directly from Prisma
			const [databases, tables, users, rows] = await Promise.all([
				prisma.database.count({ where: { tenantId: user.tenantId } }),
				prisma.table.count({ 
					where: { 
						database: { tenantId: user.tenantId },
						isModuleTable: false,
						isProtected: false,
					} 
				}),
				prisma.user.count({ where: { tenantId: user.tenantId } }),
				prisma.row.count({ 
					where: { 
						table: { 
							database: { tenantId: user.tenantId }
						} 
					} 
				}),
			]);

			// Calculate storage usage in MB by getting actual table sizes
			let storageMB = 0;
			try {
				const tenantTables = await prisma.table.findMany({
					where: {
						database: { tenantId: user.tenantId }
					},
					select: { name: true }
				});

				for (const table of tenantTables) {
					try {
						const tableSizeResult = await prisma.$queryRaw`
							SELECT pg_total_relation_size(${table.name}::regclass) as table_size_bytes
						` as any[];
						
						const tableSizeBytes = Number(tableSizeResult[0]?.table_size_bytes || 0);
						storageMB += tableSizeBytes / (1024 * 1024); // Convert bytes to MB
					} catch (error) {
						// Fallback: estimate based on row count
						const tableRowCount = await prisma.row.count({
							where: { table: { name: table.name } }
						});
						storageMB += (tableRowCount * 100) / (1024 * 1024); // Estimate 100 bytes per row
					}
				}
			} catch (error) {
				console.warn('Could not calculate storage size:', error);
				// Fallback: estimate based on total rows
				storageMB = (rows * 100) / (1024 * 1024); // Estimate 100 bytes per row
			}

			return {
				databases,
				tables,
				users,
				rows,
				storage: Math.round(storageMB),
			};
		} catch (error) {
			// Return default counts on error
			return {
				databases: 0,
				tables: 0,
				users: 0,
				rows: 0,
				storage: 0,
			};
		}
	} catch (error) {
		return {
			databases: 0,
			tables: 0,
			users: 0,
			rows: 0,
			storage: 0,
		};
	}
}

/**
 * Get the count of tables that should be excluded from plan limits
 * This includes module tables and predefined/protected tables
 */
// This function is no longer needed since we exclude module/protected tables directly in getCounts
// async function getModuleTablesCount(tenantId: number): Promise<number> {
// 	// Implementation removed - no longer needed
// }

export function getPlanFeatures(plan: string): string[] {
	const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.Free;

	const features = [
		`${limits.databases} database${limits.databases > 1 ? "s" : ""}`,
		`${limits.tables} table${limits.tables > 1 ? "s" : ""}`,
		`${limits.users} user${limits.users > 1 ? "s" : ""}`,
		`${limits.storage} MB storage`,
		`${limits.rows.toLocaleString()} rows`,
		`${limits.storage} MB storage`,
	];

	if (plan === "Pro") {
		features.push("Advanced user permissions");
		features.push("Full API access");
		features.push("Priority support");
		features.push("Advanced data management");
		features.push("Custom integrations");
	} else if (plan === "Enterprise") {
		features.push("Everything in Pro");
		features.push("Advanced security features");
		features.push("24/7 priority support");
		features.push("Custom branding");
		features.push("Advanced analytics");
		features.push("White-label options");
		features.push("SLA guarantee");
	} else {
		features.push("Basic user management");
		features.push("API access (limited)");
		features.push("Community support");
		features.push("Data import/export");
	}

	return features;
}
