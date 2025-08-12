/** @format */

import prisma from "./prisma";
import { cachedOperations } from "./cached-operations";
import { PLAN_LIMITS, getRowsLimitForPlan } from "./planConstants";
import type { PlanLimits } from "./planConstants";

// Re-export for backward compatibility
export { PLAN_LIMITS };
export type { PlanLimits };

export async function checkPlanLimit(
	userId: number,
	limitType: keyof PlanLimits,
	currentCount: number = 0,
): Promise<{ allowed: boolean; limit: number; current: number }> {
	try {
		const user = await cachedOperations.getUser(userId);

		if (!user || user.subscriptionStatus !== "active") {
			// Default to Starter plan if no subscription
			const starterLimit = PLAN_LIMITS.Starter[limitType];
			return {
				allowed: currentCount < starterLimit,
				limit: starterLimit,
				current: currentCount,
			};
		}

		const planLimits = PLAN_LIMITS[user.subscriptionPlan || "Starter"];
		const limit = planLimits[limitType];

		return {
			allowed: currentCount < limit,
			limit,
			current: currentCount,
		};
	} catch (error) {
		// Default to Starter plan on error
		const starterLimit = PLAN_LIMITS.Starter[limitType];
		return {
			allowed: currentCount < starterLimit,
			limit: starterLimit,
			current: currentCount,
		};
	}
}

export async function getCurrentCounts(
	userId: number,
): Promise<Record<keyof PlanLimits, number>> {
	try {
		const user = await cachedOperations.getUser(userId);

		if (!user?.tenantId) {
			return {
				databases: 0,
				tables: 0,
				users: 0,
				apiTokens: 0,
				publicTables: 0,
				storage: 0,
				rows: 0,
			};
		}

		try {
			const counts = await cachedOperations.getCounts(user.tenantId, userId);

			// getCounts returns an array: [databases, tables, users, apiTokens, publicTables, rows]
			if (Array.isArray(counts) && counts.length === 6) {
				const [databases, tables, users, apiTokens, publicTables, rows] =
					counts;

				return {
					databases,
					tables,
					users,
					apiTokens,
					publicTables,
					storage: 0, // Storage is calculated separately in memory tracking
					rows,
				};
			}

			// Fallback if counts is not in expected format
			return {
				databases: 0,
				tables: 0,
				users: 0,
				apiTokens: 0,
				publicTables: 0,
				storage: 0,
				rows: 0,
			};
		} catch (error) {
			// Return default counts on error
			return {
				databases: 0,
				tables: 0,
				users: 0,
				apiTokens: 0,
				publicTables: 0,
				storage: 0,
				rows: 0,
			};
		}
	} catch (error) {
		return {
			databases: 0,
			tables: 0,
			users: 0,
			apiTokens: 0,
			publicTables: 0,
			storage: 0,
			rows: 0,
		};
	}
}

export function getPlanFeatures(plan: string): string[] {
	const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.Starter;

	const features = [
		`${limits.databases} database${limits.databases > 1 ? "s" : ""}`,
		`${limits.tables} table${limits.tables > 1 ? "s" : ""}`,
		`${limits.users} user${limits.users > 1 ? "s" : ""}`,
		`${limits.apiTokens} API token${limits.apiTokens > 1 ? "s" : ""}`,
		`${limits.storage} MB storage`,
		`${limits.rows.toLocaleString()} rows`,
	];

	if (limits.publicTables > 0) {
		features.push(
			`${limits.publicTables} public table${
				limits.publicTables > 1 ? "s" : ""
			}`,
		);
	}

	if (plan === "Pro") {
		features.push("Advanced user permissions");
		features.push("Full API access");
		features.push("Priority support");
		features.push("Advanced data management");
		features.push("Public data sharing");
		features.push("Custom integrations");
	} else if (plan === "Business") {
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
