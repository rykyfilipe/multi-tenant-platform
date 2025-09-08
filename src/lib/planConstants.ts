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
	canManagePermissions: boolean;
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
		users: 3, // Increased from 1 to 3 for team collaboration
		storage: 100, // Increased from 10 MB to 100 MB
		rows: 1000, // 1,000 rows
	},
	Starter: {
		databases: 3,
		tables: 15,
		users: 5,
		storage: 500, // 500 MB
		rows: 10000, // 10,000 rows
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
		canCreateUsers: true, // Now allowed up to 3 users
		canCreateRows: true,
		canImportData: true,
		canExportData: true,
		canUseAdvancedFeatures: false,
		canManagePermissions: true, // Enable permission management for Free plan
		canAccessAnalytics: true, // Now enabled for Free plan - basic analytics
		canUseCustomIntegrations: false,
		canAccessAdvancedSecurity: false,
		canUsePrioritySupport: false,
		canUseDedicatedSupport: false,
	},
	Starter: {
		canCreateDatabases: true, // Up to 3 databases
		canCreateTables: true,
		canCreateUsers: true, // Up to 5 users
		canCreateRows: true,
		canImportData: true,
		canExportData: true,
		canUseAdvancedFeatures: false, // Limited advanced features
		canManagePermissions: false,
		canAccessAnalytics: true,
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
		canManagePermissions: true,
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
		canManagePermissions: true,
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
		annualPrice?: string;
		annualDiscount?: string;
		popular?: boolean;
	}
> = {
	Free: {
		databases: 1,
		tables: 5,
		users: 3,
		storage: "100 MB",
		rows: "1,000 rows",
		price: "$0/month",
	},
	Starter: {
		databases: 3,
		tables: 15,
		users: 5,
		storage: "500 MB",
		rows: "10,000 rows",
		price: "$9/month",
		annualPrice: "$90/year",
		annualDiscount: "17% off",
		popular: true,
	},
	Pro: {
		databases: 5,
		tables: 50,
		users: 10,
		storage: "1 GB",
		rows: "100,000 rows",
		price: "$29/month",
		annualPrice: "$290/year",
		annualDiscount: "17% off",
	},
	Enterprise: {
		databases: "Unlimited",
		tables: "Unlimited",
		users: "Unlimited",
		storage: "10 GB",
		rows: "1,000,000 rows",
		price: "$99/month",
		annualPrice: "$990/year",
		annualDiscount: "17% off",
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

// Pricing utilities
export const getMonthlyPrice = (plan: string): number => {
	const prices: Record<string, number> = {
		Free: 0,
		Starter: 9,
		Pro: 29,
		Enterprise: 99,
	};
	return prices[plan] || 0;
};

export const getAnnualPrice = (plan: string): number => {
	const monthlyPrice = getMonthlyPrice(plan);
	return monthlyPrice * 12 * 0.83; // 17% discount for annual billing
};

export const getAnnualDiscount = (plan: string): number => {
	return 17; // 17% discount for all paid plans
};

export const getStripePriceId = (plan: string, billing: "monthly" | "annual"): string | null => {
	const priceIds: Record<string, Record<string, string>> = {
		Free: {
			monthly: process.env.NEXT_PUBLIC_STRIPE_FREE_PRICE_ID || "",
			annual: process.env.NEXT_PUBLIC_STRIPE_FREE_PRICE_ID || "",
		},
		Starter: {
			monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || "",
			annual: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID || "",
		},
		Pro: {
			monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "",
			annual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || "",
		},
		Enterprise: {
			monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "",
			annual: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || "",
		},
	};
	
	const planPriceIds = priceIds[plan];
	if (!planPriceIds) return null;
	
	return planPriceIds[billing] || null;
};

export const formatPrice = (price: number, currency: string = "USD"): string => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(price);
};

export const getPlanComparison = () => {
	const plans = ["Free", "Starter", "Pro", "Enterprise"];
	return plans.map(plan => ({
		name: plan,
		...PLAN_FEATURES[plan],
		monthlyPrice: getMonthlyPrice(plan),
		annualPrice: getAnnualPrice(plan),
		annualDiscount: getAnnualDiscount(plan),
		limits: PLAN_LIMITS[plan],
		restrictions: ROLE_RESTRICTIONS[plan],
	}));
};
