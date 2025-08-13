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
	storage: number; // in MB
	rows: number; // total rows across all tables
}

export interface RoleRestrictions {
	canCreateDatabases: boolean;
	canCreateTables: boolean;
	canCreateUsers: boolean;
	canCreateApiTokens: boolean;
	canMakeTablesPublic: boolean;
	canManagePermissions: boolean;
	canDeleteData: boolean;
	canExportData: boolean;
	canImportData: boolean;
	canViewAnalytics: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
	Starter: {
		databases: 1,
		tables: 5,
		users: 2,
		apiTokens: 1,
		storage: 100, // 100 MB
		rows: 10000, // 10.000 rows
	},
	Pro: {
		databases: 5,
		tables: 25,
		users: 10,
		apiTokens: 5,
		storage: 1024, // 1 GB
		rows: 100000, // 100.000 rows
	},
	Business: {
		databases: 999,
		tables: 999,
		users: 999,
		apiTokens: 10,
		storage: 5120, // 5 GB
		rows: 1000000, // 1.000.000 rows
	},
};

export const ROLE_RESTRICTIONS: Record<string, RoleRestrictions> = {
	Starter: {
		canCreateDatabases: false, // Doar 1 database permis
		canCreateTables: true,
		canCreateUsers: false, // Doar 2 utilizatori permis
		canCreateApiTokens: false, // Doar 1 token permis
		canMakeTablesPublic: false, // 0 public tables permis
		canManagePermissions: false, // Doar pentru Pro+
		canDeleteData: true,
		canExportData: true,
		canImportData: true,
		canViewAnalytics: false, // Doar pentru Pro+
	},
	Pro: {
		canCreateDatabases: true,
		canCreateTables: true,
		canCreateUsers: true,
		canCreateApiTokens: true,
		canMakeTablesPublic: true,
		canManagePermissions: true,
		canDeleteData: true,
		canExportData: true,
		canImportData: true,
		canViewAnalytics: true,
	},
	Business: {
		canCreateDatabases: true,
		canCreateTables: true,
		canCreateUsers: true,
		canCreateApiTokens: true,
		canMakeTablesPublic: true,
		canManagePermissions: true,
		canDeleteData: true,
		canExportData: true,
		canImportData: true,
		canViewAnalytics: true,
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

export const getRoleRestrictions = (plan: string | null): RoleRestrictions => {
	return ROLE_RESTRICTIONS[plan || "Starter"] || ROLE_RESTRICTIONS.Starter;
};

export const getMemoryLimitForPlan = (plan: string | null): number => {
	return getPlanLimits(plan).storage;
};

export const getRowsLimitForPlan = (plan: string | null): number => {
	return getPlanLimits(plan).rows;
};

// Funcție pentru verificarea permisiunilor bazate pe plan și rol
export const checkPlanPermission = (
	plan: string | null,
	permission: keyof RoleRestrictions,
): boolean => {
	const restrictions = getRoleRestrictions(plan);
	return restrictions[permission];
};

// Funcție pentru verificarea permisiunilor bazate pe plan, rol și limitări
export const checkPlanAndLimitPermission = (
	plan: string | null,
	permission: keyof RoleRestrictions,
	currentCount: number,
	limitType: keyof PlanLimits,
): { allowed: boolean; reason?: string } => {
	const restrictions = getRoleRestrictions(plan);
	const limits = getPlanLimits(plan);

	// Verifică dacă permisiunea este activă pentru plan
	if (!restrictions[permission]) {
		return {
			allowed: false,
			reason: `This feature is not available in your current plan. Upgrade to Pro or Business to access this feature.`,
		};
	}

	// Verifică dacă limita a fost atinsă
	if (currentCount >= limits[limitType]) {
		return {
			allowed: false,
			reason: `Plan limit exceeded. You can only have ${limits[limitType]} ${limitType}. Upgrade your plan to add more.`,
		};
	}

	return { allowed: true };
};
