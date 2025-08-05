/** @format */

import prisma from "./prisma";

export interface PlanLimits {
	databases: number;
	tables: number;
	users: number;
	apiTokens: number;
	publicTables: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
	Starter: {
		databases: 1,
		tables: 1,
		users: 2,
		apiTokens: 1,
		publicTables: 0,
	},
	Pro: {
		databases: 5,
		tables: 5,
		users: 5,
		apiTokens: 3,
		publicTables: 2,
	},
	Enterprise: {
		databases: 10,
		tables: 50,
		users: 20,
		apiTokens: 10,
		publicTables: 10,
	},
};

export async function checkPlanLimit(
	userId: number,
	limitType: keyof PlanLimits,
	currentCount: number = 0,
): Promise<{ allowed: boolean; limit: number; current: number }> {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				subscriptionPlan: true,
				subscriptionStatus: true,
			},
		});

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
		console.error("Error checking plan limit:", error);
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
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { tenantId: true },
		});

		if (!user?.tenantId) {
			return {
				databases: 0,
				tables: 0,
				users: 0,
				apiTokens: 0,
				publicTables: 0,
			};
		}

		const [databases, tables, users, apiTokens, publicTables] =
			await Promise.all([
				prisma.database.count({ where: { tenantId: user.tenantId } }),
				prisma.table.count({
					where: { database: { tenantId: user.tenantId } },
				}),
				prisma.user.count({ where: { tenantId: user.tenantId } }),
				prisma.apiToken.count({ where: { userId } }),
				prisma.table.count({
					where: {
						database: { tenantId: user.tenantId },
						isPublic: true,
					},
				}),
			]);

		// Raw counts calculated for tenant

		return {
			databases,
			tables,
			users,
			apiTokens,
			publicTables,
		};
	} catch (error) {
		console.error("Error getting current counts:", error);
		return {
			databases: 0,
			tables: 0,
			users: 0,
			apiTokens: 0,
			publicTables: 0,
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
