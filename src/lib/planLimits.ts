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

		if (!user || user.subscriptionStatus !== "active") {
			// Default to Free plan if no subscription
			const freeLimit = PLAN_LIMITS.Free[limitType];
			return {
				allowed: currentCount < freeLimit,
				limit: freeLimit,
				current: currentCount,
			};
		}

		const planLimits = PLAN_LIMITS[user.subscriptionPlan || "Free"];
		const limit = planLimits[limitType];

		return {
			allowed: currentCount < limit,
			limit,
			current: currentCount,
		};
	} catch (error) {
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

			return {
				databases,
				tables,
				users,
				rows,
			};
		} catch (error) {
			// Return default counts on error
			return {
				databases: 0,
				tables: 0,
				users: 0,
				rows: 0,
			};
		}
	} catch (error) {
		return {
			databases: 0,
			tables: 0,
			users: 0,
			rows: 0,
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
