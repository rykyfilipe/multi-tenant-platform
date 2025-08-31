/** @format */

export interface Tenant {
	id: number;
	name: string;
	adminId: number;
	createdAt: string; // ISO date string
	updatedAt: string; // ISO date string

	// Contact Information
	companyEmail?: string;
	phone?: string;
	website?: string;
	address?: string;

	// Settings
	logoUrl?: string;
	theme?: string;
	timezone?: string;
	language?: string;
	defaultCurrency?: string;

	// Legacy settings (for backward compatibility)
	settings?: TenantSettings;
	branding?: TenantBranding;
}

export interface TenantSettings {
	language?: string; // ex: "en", "ro"
	timezone?: string; // ex: "Europe/Bucharest"
	enableNotifications?: boolean;
	customDomain?: string; // ex: "mycompany.com"
	features?: Record<string, boolean>; // ex: { reports: true, chat: false }
}

export interface TenantBranding {
	logoUrl?: string;
	primaryColor?: string;
	secondaryColor?: string;
}

export interface TenantUpdateRequest {
	name?: string;
	companyEmail?: string;
	phone?: string;
	website?: string;
	address?: string;
	logoUrl?: string;
	theme?: string;
	timezone?: string;
	language?: string;
	defaultCurrency?: string;
}
