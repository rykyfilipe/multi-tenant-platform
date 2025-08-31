/** @format */

/**
 * Centralized plan limits and features
 * This file ensures consistency across all components and APIs
 */

export interface PlanLimits {
	databases: number;
	tables: number;
	users: number;
	storage: number; // in MB
	rows: number; // total rows across all tables
}

export interface RoleRestrictions {
	canCreateDatabases: boolean;
	canCreateTables: boolean;
	canCreateUsers: boolean;
	canCreateRows: boolean;
	canImportData: boolean;
	canExportData: boolean;
	canUseAdvancedFeatures: boolean;
	canAccessAnalytics: boolean;
	canUseCustomIntegrations: boolean;
	canAccessAdvancedSecurity: boolean;
	canUsePrioritySupport: boolean;
	canUseDedicatedSupport: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
	Free: {
		databases: 1,
		tables: 5,
		users: 1,
		storage: 10, // 10 MB
		rows: 1000, // 1,000 rows
	},
	Pro: {
		databases: 5,
		tables: 50,
		users: 10,
		storage: 1024, // 1 GB
		rows: 100000, // 100,000 rows
	},
	Enterprise: {
		databases: 999,
		tables: 999,
		users: 999,
		storage: 10240, // 10 GB
		rows: 1000000, // 1,000,000 rows
	},
};

export const ROLE_RESTRICTIONS: Record<string, RoleRestrictions> = {
	Free: {
		canCreateDatabases: false, // Only 1 database allowed
		canCreateTables: true,
		canCreateUsers: false, // Only 1 user allowed
		canCreateRows: true,
		canImportData: true,
		canExportData: true,
		canUseAdvancedFeatures: false,
		canAccessAnalytics: false,
		canUseCustomIntegrations: false,
		canAccessAdvancedSecurity: false,
		canUsePrioritySupport: false,
		canUseDedicatedSupport: false,
	},
	Pro: {
		canCreateDatabases: true,
		canCreateTables: true,
		canCreateUsers: true,
		canCreateRows: true,
		canImportData: true,
		canExportData: true,
		canUseAdvancedFeatures: true,
		canAccessAnalytics: true,
		canUseCustomIntegrations: true,
		canAccessAdvancedSecurity: true,
		canUsePrioritySupport: true,
		canUseDedicatedSupport: true,
	},
	Enterprise: {
		canCreateDatabases: true,
		canCreateTables: true,
		canCreateUsers: true,
		canCreateRows: true,
		canImportData: true,
		canExportData: true,
		canUseAdvancedFeatures: true,
		canAccessAnalytics: true,
		canUseCustomIntegrations: true,
		canAccessAdvancedSecurity: true,
		canUsePrioritySupport: true,
		canUseDedicatedSupport: true,
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
	Free: {
		databases: 1,
		tables: 5,
		users: 1,
		storage: "10 MB",
		rows: "1,000 rows",
		price: "$0/month",
	},
	Pro: {
		databases: 5,
		tables: 50,
		users: 10,
		storage: "1 GB",
		rows: "100,000 rows",
		price: "$29/month",
	},
	Enterprise: {
		databases: "Unlimited",
		tables: "Unlimited",
		users: "Unlimited",
		storage: "10 GB",
		rows: "1,000,000 rows",
		price: "$99/month",
	},
};

export const getPlanLimits = (plan: string | null): PlanLimits => {
	return PLAN_LIMITS[plan || "Free"] || PLAN_LIMITS.Free;
};

export const getPlanFeatures = (plan: string | null) => {
	return PLAN_FEATURES[plan || "Free"] || PLAN_FEATURES.Free;
};

export const getRoleRestrictions = (plan: string | null): RoleRestrictions => {
	return ROLE_RESTRICTIONS[plan || "Free"] || ROLE_RESTRICTIONS.Free;
};

export const getMemoryLimitForPlan = (plan: string | null): number => {
	return getPlanLimits(plan).storage;
};

export const getRowsLimitForPlan = (plan: string | null): number => {
	return getPlanLimits(plan).rows;
};

// Function for checking permissions based on plan and role
export const checkPlanPermission = (
	plan: string | null,
	permission: keyof RoleRestrictions,
): boolean => {
	const restrictions = getRoleRestrictions(plan);
	return restrictions[permission];
};

// Function for checking permissions based on plan, role and limitations
export const checkPlanAndLimitPermission = (
	plan: string | null,
	permission: keyof RoleRestrictions,
	currentCount: number,
	limitType: keyof PlanLimits,
): { allowed: boolean; reason?: string } => {
	const restrictions = getRoleRestrictions(plan);
	const limits = getPlanLimits(plan);

	// Check if permission is active for plan
	if (!restrictions[permission]) {
		return {
			allowed: false,
			reason: `This feature is not available in your current plan. Upgrade to Pro or Enterprise to access this feature.`,
		};
	}

	// Check if limit has been reached
	if (currentCount >= limits[limitType]) {
		return {
			allowed: false,
			reason: `Plan limit exceeded. You can only have ${limits[limitType]} ${limitType}. Upgrade your plan to add more.`,
		};
	}

	return { allowed: true };
};
