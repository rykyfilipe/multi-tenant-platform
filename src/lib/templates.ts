/** @format */

import {
	Table,
	Users,
	Package,
	CreditCard,
	FileText,
	Calendar,
	Settings,
	ShoppingCart,
	BarChart3,
} from "lucide-react";

export interface TemplateTable {
	id: string;
	name: string;
	description: string;
	icon: any;
	category: string;
	dependencies: string[];
	columns: Array<{
		name: string;
		type: string;
		required?: boolean;
		primary?: boolean;
		semanticType?: string;
		customOptions?: string[];
		referenceTableName?: string;
	}>;
}

// Currency options array from tenant settings
const CURRENCY_OPTIONS = [
	"USD", "EUR", "RON", "GBP", "JPY", "CAD", "AUD", "CHF"
];

// Template-uri predefinite pentru tabele
export const TABLE_TEMPLATES: TemplateTable[] = [
	{
		id: "users",
		name: "Users",
		description: "User management and authentication",
		icon: Users,
		category: "User Management",
		dependencies: [],
		columns: [
			{
				name: "email",
				type: "text",
				required: true,
				semanticType: "user_email",
			},
			{
				name: "name",
				type: "text",
				required: true,
				semanticType: "user_name",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "user_created_at",
			},
		],
	},
	{
		id: "products",
		name: "Products",
		description: "Product catalog and inventory management",
		icon: Package,
		category: "E-commerce",
		dependencies: [],
		columns: [
			{
				name: "name",
				type: "text",
				required: true,
				semanticType: "product_name",
			},
			{
				name: "description",
				type: "text",
				required: false,
				semanticType: "product_description",
			},
			{
				name: "price",
				type: "decimal",
				required: true,
				semanticType: "product_price",
			},
			{
				name: "sku",
				type: "text",
				required: true,
				semanticType: "product_sku",
			},
			{
				name: "category",
				type: "text",
				required: false,
				semanticType: "product_category",
			},
			{
				name: "brand",
				type: "text",
				required: false,
				semanticType: "product_brand",
			},
			{
				name: "vat",
				type: "decimal",
				required: false,
				semanticType: "product_vat",
			},
			{
				name: "unit_of_measure",
				type: "text",
				required: false,
				semanticType: "unit_of_measure",
			},
			{
				name: "currency",
				type: "custom_array",
				required: false,
				semanticType: "currency",
				customOptions: CURRENCY_OPTIONS,
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "product_created_at",
			},
		],
	},
	{
		id: "orders",
		name: "Orders",
		description: "Order management and tracking",
		icon: ShoppingCart,
		category: "E-commerce",
		dependencies: ["users", "products"],
		columns: [
			{
				name: "user_id",
				type: "reference",
				required: true,
				referenceTableName: "users",
				semanticType: "user_id",
			},
			{
				name: "total_amount",
				type: "decimal",
				required: true,
				semanticType: "order_total",
			},
			{
				name: "status",
				type: "text",
				required: true,
				semanticType: "order_status",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "order_created_at",
			},
		],
	},
	{
		id: "customers",
		name: "Customers",
		description: "Customer information and contact details",
		icon: Users,
		category: "CRM",
		dependencies: [],
		columns: [
			{
				name: "first_name",
				type: "text",
				required: true,
				semanticType: "customer_first_name",
			},
			{
				name: "last_name",
				type: "text",
				required: true,
				semanticType: "customer_last_name",
			},
			{
				name: "email",
				type: "text",
				required: true,
				semanticType: "customer_email",
			},
			{
				name: "phone",
				type: "text",
				required: false,
				semanticType: "customer_phone",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "customer_created_at",
			},
		],
	},
	{
		id: "invoices",
		name: "Invoices",
		description: "Invoice management and billing",
		icon: FileText,
		category: "Billing",
		dependencies: ["customers"],
		columns: [
			{
				name: "customer_id",
				type: "reference",
				required: true,
				referenceTableName: "customers",
				semanticType: "customer_id",
			},
			{
				name: "invoice_number",
				type: "text",
				required: true,
				semanticType: "invoice_number",
			},
			{
				name: "total_amount",
				type: "decimal",
				required: true,
				semanticType: "invoice_total",
			},
			{
				name: "due_date",
				type: "date",
				required: true,
				semanticType: "invoice_due_date",
			},
			{
				name: "status",
				type: "text",
				required: true,
				semanticType: "invoice_status",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "invoice_created_at",
			},
		],
	},
	{
		id: "payments",
		name: "Payments",
		description: "Payment processing and transaction records",
		icon: CreditCard,
		category: "Billing",
		dependencies: ["invoices"],
		columns: [
			{
				name: "invoice_id",
				type: "reference",
				required: true,
				referenceTableName: "invoices",
				semanticType: "invoice_id",
			},
			{
				name: "amount",
				type: "decimal",
				required: true,
				semanticType: "payment_amount",
			},
			{
				name: "payment_method",
				type: "text",
				required: true,
				semanticType: "payment_method",
			},
			{
				name: "status",
				type: "text",
				required: true,
				semanticType: "payment_status",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "payment_created_at",
			},
		],
	},
	{
		id: "analytics",
		name: "Analytics",
		description: "Data analytics and reporting tables",
		icon: BarChart3,
		category: "Analytics",
		dependencies: [],
		columns: [
			{
				name: "event_name",
				type: "text",
				required: true,
				semanticType: "event_name",
			},
			{
				name: "event_data",
				type: "text",
				required: false,
				semanticType: "event_data",
			},
			{
				name: "user_id",
				type: "reference",
				required: false,
				referenceTableName: "users",
				semanticType: "user_id",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "event_created_at",
			},
		],
	},
	{
		id: "settings",
		name: "Settings",
		description: "Application settings and configuration",
		icon: Settings,
		category: "System",
		dependencies: [],
		columns: [
			{
				name: "key",
				type: "text",
				required: true,
				semanticType: "setting_key",
			},
			{
				name: "value",
				type: "text",
				required: true,
				semanticType: "setting_value",
			},
			{
				name: "description",
				type: "text",
				required: false,
				semanticType: "setting_description",
			},
			{
				name: "updated_at",
				type: "timestamp",
				required: true,
				semanticType: "setting_updated_at",
			},
		],
	},
];
