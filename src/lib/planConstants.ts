/** @format */

/**
 * Centralized plan limits and features
 * This file ensures consistency across all components and APIs
 */

export interface PlanLimits {
	databases: number;
	tables: number;
	users: number;
	apiTokens: number;
	publicTables: number;
	storage: number; // in MB
	rows: number; // total rows across all tables
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
	Starter: {
		databases: 1,
		tables: 5,
		users: 2,
		apiTokens: 1,
		publicTables: 0,
		storage: 100, // 100 MB
		rows: 10000, // 10.000 rows
	},
	Pro: {
		databases: 5,
		tables: 25,
		users: 10,
		apiTokens: 5,
		publicTables: 2,
		storage: 1024, // 1 GB
		rows: 100000, // 100.000 rows
	},
	Business: {
		databases: 999,
		tables: 999,
		users: 999,
		apiTokens: 10,
		publicTables: 10,
		storage: 5120, // 5 GB
		rows: 1000000, // 1.000.000 rows
	},
};

export const PLAN_FEATURES: Record<
	string,
	{
		databases: number | string;
		tables: number | string;
		users: number | string;
		storage: string;
		rows: string;
		price: string;
	}
> = {
	Starter: {
		databases: 1,
		tables: 5,
		users: 2,
		storage: "100 MB",
		rows: "10.000 rows",
		price: "$0/month",
	},
	Pro: {
		databases: 5,
		tables: 25,
		users: 10,
		storage: "1 GB",
		rows: "100.000 rows",
		price: "$29/month",
	},
	Business: {
		databases: "Unlimited",
		tables: "Unlimited",
		users: "Unlimited",
		storage: "5 GB",
		rows: "1.000.000 rows",
		price: "$99/month",
	},
};

export const getPlanLimits = (plan: string | null): PlanLimits => {
	return PLAN_LIMITS[plan || "Starter"] || PLAN_LIMITS.Starter;
};

export const getPlanFeatures = (plan: string | null) => {
	return PLAN_FEATURES[plan || "Starter"] || PLAN_FEATURES.Starter;
};

export const getMemoryLimitForPlan = (plan: string | null): number => {
	return getPlanLimits(plan).storage;
};

export const getRowsLimitForPlan = (plan: string | null): number => {
	return getPlanLimits(plan).rows;
};
