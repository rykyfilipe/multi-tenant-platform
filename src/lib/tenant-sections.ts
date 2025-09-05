/** @format */

import {
	Building2,
	Mail,
	CreditCard,
	Puzzle,
	Settings,
	Users,
	Database,
	Shield,
} from "lucide-react";

export interface TenantSection {
	id: string;
	title: string;
	subtitle: string;
	icon: any;
	description: string;
	order: number;
}

export const TENANT_SECTIONS: TenantSection[] = [
	{
		id: "enterprise-info",
		title: "Enterprise Information",
		subtitle: "Organization details and settings",
		icon: Building2,
		description: "Manage your organization's basic information, timezone, and language settings.",
		order: 1,
	},
	{
		id: "business-contact",
		title: "Business Contact",
		subtitle: "Communication and location details",
		icon: Mail,
		description: "Update your business contact information including email, phone, and address.",
		order: 2,
	},
	{
		id: "billing-fiscal",
		title: "Billing & Fiscal",
		subtitle: "Tax and financial information",
		icon: CreditCard,
		description: "Manage your fiscal information, tax codes, and billing preferences.",
		order: 3,
	},
	{
		id: "module-management",
		title: "Module Management",
		subtitle: "Enable and configure features",
		icon: Puzzle,
		description: "Control which modules and features are available to your organization.",
		order: 4,
	},
	{
		id: "enterprise-actions",
		title: "Enterprise Actions",
		subtitle: "Advanced management tools",
		icon: Settings,
		description: "Access advanced enterprise management tools and administrative functions.",
		order: 5,
	},
];

export interface QuickAction {
	id: string;
	title: string;
	description: string;
	icon: any;
	href: string;
	variant: "default" | "secondary" | "outline";
}

export const QUICK_ACTIONS: QuickAction[] = [
	{
		id: "manage-team",
		title: "Manage Team",
		description: "Invite users and manage permissions",
		icon: Users,
		href: "/home/users",
		variant: "default",
	},
	{
		id: "data-command",
		title: "Data Command Center",
		description: "Manage databases and data",
		icon: Database,
		href: "/home/database",
		variant: "secondary",
	},
	{
		id: "enterprise-settings",
		title: "Enterprise Settings",
		description: "Advanced configuration",
		icon: Shield,
		href: "/home/settings",
		variant: "outline",
	},
];

