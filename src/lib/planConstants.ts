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
	storage: number; // in GB
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
	Starter: {
		databases: 1,
		tables: 5,
		users: 2,
		apiTokens: 1,
		publicTables: 0,
		storage: 1,
	},
	Pro: {
		databases: 5,
		tables: 25,
		users: 10,
		apiTokens: 5,
		publicTables: 2,
		storage: 10,
	},
	Enterprise: {
		databases: 999,
		tables: 999,
		users: 999,
		apiTokens: 10,
		publicTables: 10,
		storage: 100,
	},
};

export const PLAN_FEATURES: Record<string, {
	databases: number | string;
	tables: number | string;
	users: number | string;
	storage: string;
	memory: string;
	price: string;
}> = {
	Starter: {
		databases: 1,
		tables: 5,
		users: 2,
		storage: "1GB",
		memory: "1GB",
		price: "$9/month",
	},
	Pro: {
		databases: 5,
		tables: 25,
		users: 10,
		storage: "10GB",
		memory: "10GB",
		price: "$29/month",
	},
	Enterprise: {
		databases: "Unlimited",
		tables: "Unlimited",
		users: "Unlimited",
		storage: "100GB",
		memory: "100GB",
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