/** @format */

/**
 * Semantic Type Templates for Auto-Fill Column Creation
 * Maps semantic types to column configurations
 */

import { CreateColumnRequest } from "@/types/database";
import { SemanticColumnType } from "./semantic-types";

export interface SemanticTypeTemplate {
	semanticType: SemanticColumnType;
	label: string;
	icon: string;
	category: string;
	template: Partial<CreateColumnRequest>;
}

export const SEMANTIC_TYPE_TEMPLATES: SemanticTypeTemplate[] = [
	// 💰 Financial / Currency
	{
		semanticType: SemanticColumnType.CURRENCY,
		label: "Currency",
		icon: "💰",
		category: "Financial",
		template: {
			name: "currency",
			type: "customArray",
			semanticType: SemanticColumnType.CURRENCY,
			customOptions: ["USD", "EUR", "GBP", "JPY", "CNY", "RON", "CAD", "AUD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF"],
			defaultValue: "USD",
			required: true,
			description: "Transaction or product currency",
		},
	},
	{
		semanticType: SemanticColumnType.INVOICE_CURRENCY,
		label: "Invoice Currency",
		icon: "💵",
		category: "Financial",
		template: {
			name: "invoice_currency",
			type: "customArray",
			semanticType: SemanticColumnType.INVOICE_CURRENCY,
			customOptions: ["USD", "EUR", "GBP", "RON"],
			defaultValue: "RON",
			required: true,
			description: "Currency for invoice amount",
		},
	},
	{
		semanticType: SemanticColumnType.PRICE,
		label: "Price / Amount",
		icon: "💵",
		category: "Financial",
		template: {
			name: "price",
			type: "number",
			semanticType: SemanticColumnType.PRICE,
			defaultValue: "0",
			required: true,
			description: "Monetary amount",
		},
	},
	{
		semanticType: SemanticColumnType.PRODUCT_PRICE,
		label: "Product Price",
		icon: "💰",
		category: "Financial",
		template: {
			name: "product_price",
			type: "number",
			semanticType: SemanticColumnType.PRODUCT_PRICE,
			defaultValue: "0",
			required: true,
			description: "Unit price of product",
		},
	},
	{
		semanticType: SemanticColumnType.PRODUCT_VAT,
		label: "VAT / Tax Rate (%)",
		icon: "📊",
		category: "Financial",
		template: {
			name: "product_vat",
			type: "number",
			semanticType: SemanticColumnType.PRODUCT_VAT,
			defaultValue: "19",
			required: true,
			description: "VAT percentage (e.g., 19 for 19%)",
		},
	},
	{
		semanticType: SemanticColumnType.TAX_RATE,
		label: "Tax Rate",
		icon: "📈",
		category: "Financial",
		template: {
			name: "tax_rate",
			type: "number",
			semanticType: SemanticColumnType.TAX_RATE,
			defaultValue: "19",
			required: false,
			description: "Tax percentage",
		},
	},

	// 📦 Product Info
	{
		semanticType: SemanticColumnType.PRODUCT_NAME,
		label: "Product Name",
		icon: "📦",
		category: "Product",
		template: {
			name: "product_name",
			type: "text",
			semanticType: SemanticColumnType.PRODUCT_NAME,
			required: true,
			description: "Name or title of the product",
		},
	},
	{
		semanticType: SemanticColumnType.PRODUCT_DESCRIPTION,
		label: "Product Description",
		icon: "📝",
		category: "Product",
		template: {
			name: "product_description",
			type: "text",
			semanticType: SemanticColumnType.PRODUCT_DESCRIPTION,
			required: false,
			description: "Detailed product description",
		},
	},
	{
		semanticType: SemanticColumnType.PRODUCT_SKU,
		label: "Product SKU",
		icon: "🏷️",
		category: "Product",
		template: {
			name: "product_sku",
			type: "text",
			semanticType: SemanticColumnType.PRODUCT_SKU,
			required: true,
			unique: true,
			description: "Stock Keeping Unit - unique product code",
		},
	},
	{
		semanticType: SemanticColumnType.PRODUCT_CATEGORY,
		label: "Product Category",
		icon: "📂",
		category: "Product",
		template: {
			name: "product_category",
			type: "customArray",
			semanticType: SemanticColumnType.PRODUCT_CATEGORY,
			customOptions: ["Electronics", "Clothing", "Food", "Books", "Toys", "Home", "Sports", "Beauty", "Other"],
			defaultValue: "Other",
			required: false,
			description: "Product classification category",
		},
	},
	{
		semanticType: SemanticColumnType.PRODUCT_BRAND,
		label: "Product Brand",
		icon: "🏢",
		category: "Product",
		template: {
			name: "product_brand",
			type: "text",
			semanticType: SemanticColumnType.PRODUCT_BRAND,
			required: false,
			description: "Brand or manufacturer name",
		},
	},
	{
		semanticType: SemanticColumnType.UNIT_OF_MEASURE,
		label: "Unit of Measure",
		icon: "📏",
		category: "Product",
		template: {
			name: "unit_of_measure",
			type: "customArray",
			semanticType: SemanticColumnType.UNIT_OF_MEASURE,
			customOptions: ["pcs", "kg", "g", "l", "ml", "m", "cm", "box", "pack", "set"],
			defaultValue: "pcs",
			required: true,
			description: "Measurement unit for quantity",
		},
	},
	{
		semanticType: SemanticColumnType.QUANTITY,
		label: "Quantity",
		icon: "🔢",
		category: "Product",
		template: {
			name: "quantity",
			type: "number",
			semanticType: SemanticColumnType.QUANTITY,
			defaultValue: "1",
			required: true,
			description: "Amount or count",
		},
	},

	// 👤 Customer Info
	{
		semanticType: SemanticColumnType.CUSTOMER_NAME,
		label: "Customer Name",
		icon: "👤",
		category: "Customer",
		template: {
			name: "customer_name",
			type: "text",
			semanticType: SemanticColumnType.CUSTOMER_NAME,
			required: true,
			description: "Full name of customer or company",
		},
	},
	{
		semanticType: SemanticColumnType.CUSTOMER_EMAIL,
		label: "Customer Email",
		icon: "📧",
		category: "Customer",
		template: {
			name: "customer_email",
			type: "email",
			semanticType: SemanticColumnType.CUSTOMER_EMAIL,
			required: false,
			description: "Customer email address",
		},
	},
	{
		semanticType: SemanticColumnType.CUSTOMER_PHONE,
		label: "Customer Phone",
		icon: "📱",
		category: "Customer",
		template: {
			name: "customer_phone",
			type: "text",
			semanticType: SemanticColumnType.CUSTOMER_PHONE,
			required: false,
			description: "Customer contact phone number",
		},
	},
	{
		semanticType: SemanticColumnType.CUSTOMER_TAX_ID,
		label: "Customer Tax ID / CUI",
		icon: "🆔",
		category: "Customer",
		template: {
			name: "customer_tax_id",
			type: "text",
			semanticType: SemanticColumnType.CUSTOMER_TAX_ID,
			required: false,
			description: "Tax identification number (CUI in Romania)",
		},
	},
	{
		semanticType: SemanticColumnType.CUSTOMER_VAT_NUMBER,
		label: "Customer VAT Number",
		icon: "📋",
		category: "Customer",
		template: {
			name: "customer_vat_number",
			type: "text",
			semanticType: SemanticColumnType.CUSTOMER_VAT_NUMBER,
			required: false,
			description: "VAT registration number",
		},
	},
	{
		semanticType: SemanticColumnType.CUSTOMER_COUNTRY,
		label: "Customer Country",
		icon: "🌍",
		category: "Customer",
		template: {
			name: "customer_country",
			type: "customArray",
			semanticType: SemanticColumnType.CUSTOMER_COUNTRY,
			customOptions: ["USA", "Canada", "UK", "Germany", "France", "Romania", "Spain", "Italy", "Netherlands", "Belgium", "Poland"],
			defaultValue: "Romania",
			required: false,
			description: "Customer country",
		},
	},
	{
		semanticType: SemanticColumnType.CUSTOMER_CITY,
		label: "Customer City",
		icon: "🏙️",
		category: "Customer",
		template: {
			name: "customer_city",
			type: "text",
			semanticType: SemanticColumnType.CUSTOMER_CITY,
			required: false,
			description: "Customer city",
		},
	},
	{
		semanticType: SemanticColumnType.CUSTOMER_ADDRESS,
		label: "Customer Address",
		icon: "📍",
		category: "Customer",
		template: {
			name: "customer_address",
			type: "text",
			semanticType: SemanticColumnType.CUSTOMER_ADDRESS,
			required: false,
			description: "Full customer address",
		},
	},

	// 📄 Invoice Fields
	{
		semanticType: SemanticColumnType.INVOICE_NUMBER,
		label: "Invoice Number",
		icon: "🔢",
		category: "Invoice",
		template: {
			name: "invoice_number",
			type: "text",
			semanticType: SemanticColumnType.INVOICE_NUMBER,
			required: true,
			unique: true,
			description: "Unique invoice identifier",
		},
	},
	{
		semanticType: SemanticColumnType.INVOICE_DATE,
		label: "Invoice Date",
		icon: "📅",
		category: "Invoice",
		template: {
			name: "invoice_date",
			type: "date",
			semanticType: SemanticColumnType.INVOICE_DATE,
			required: true,
			description: "Date invoice was issued",
		},
	},
	{
		semanticType: SemanticColumnType.INVOICE_DUE_DATE,
		label: "Invoice Due Date",
		icon: "⏰",
		category: "Invoice",
		template: {
			name: "invoice_due_date",
			type: "date",
			semanticType: SemanticColumnType.INVOICE_DUE_DATE,
			required: false,
			description: "Payment deadline",
		},
	},
	{
		semanticType: SemanticColumnType.INVOICE_STATUS,
		label: "Invoice Status",
		icon: "🎯",
		category: "Invoice",
		template: {
			name: "invoice_status",
			type: "customArray",
			semanticType: SemanticColumnType.INVOICE_STATUS,
			customOptions: ["Draft", "Sent", "Paid", "Overdue", "Cancelled", "Refunded"],
			defaultValue: "Draft",
			required: true,
			description: "Current invoice status",
		},
	},
	{
		semanticType: SemanticColumnType.INVOICE_PAYMENT_METHOD,
		label: "Payment Method",
		icon: "💳",
		category: "Invoice",
		template: {
			name: "invoice_payment_method",
			type: "customArray",
			semanticType: SemanticColumnType.INVOICE_PAYMENT_METHOD,
			customOptions: ["Cash", "Card", "Bank Transfer", "PayPal", "Stripe", "Other"],
			defaultValue: "Bank Transfer",
			required: false,
			description: "Method of payment",
		},
	},

	// 🎯 Status & Workflow
	{
		semanticType: SemanticColumnType.STATUS,
		label: "Generic Status",
		icon: "🎯",
		category: "Workflow",
		template: {
			name: "status",
			type: "customArray",
			semanticType: SemanticColumnType.STATUS,
			customOptions: ["Active", "Inactive", "Pending", "Archived"],
			defaultValue: "Active",
			required: true,
			description: "Record status",
		},
	},
	{
		semanticType: SemanticColumnType.PRODUCT_STATUS,
		label: "Product Status",
		icon: "📦",
		category: "Workflow",
		template: {
			name: "product_status",
			type: "customArray",
			semanticType: SemanticColumnType.PRODUCT_STATUS,
			customOptions: ["In Stock", "Out of Stock", "Discontinued", "Coming Soon", "Pre-Order"],
			defaultValue: "In Stock",
			required: true,
			description: "Product availability status",
		},
	},

	// 🏢 Company Info
	{
		semanticType: SemanticColumnType.COMPANY_NAME,
		label: "Company Name",
		icon: "🏢",
		category: "Company",
		template: {
			name: "company_name",
			type: "text",
			semanticType: SemanticColumnType.COMPANY_NAME,
			required: true,
			description: "Legal company name",
		},
	},
	{
		semanticType: SemanticColumnType.COMPANY_TAX_ID,
		label: "Company Tax ID / CUI",
		icon: "🆔",
		category: "Company",
		template: {
			name: "company_tax_id",
			type: "text",
			semanticType: SemanticColumnType.COMPANY_TAX_ID,
			required: true,
			unique: true,
			description: "Company tax identification (CUI in Romania)",
		},
	},
	{
		semanticType: SemanticColumnType.COMPANY_REGISTRATION_NUMBER,
		label: "Company Registration Number",
		icon: "📋",
		category: "Company",
		template: {
			name: "company_registration_number",
			type: "text",
			semanticType: SemanticColumnType.COMPANY_REGISTRATION_NUMBER,
			required: false,
			description: "Trade register number (J... in Romania)",
		},
	},
	{
		semanticType: SemanticColumnType.COMPANY_IBAN,
		label: "Company IBAN",
		icon: "🏦",
		category: "Company",
		template: {
			name: "company_iban",
			type: "text",
			semanticType: SemanticColumnType.COMPANY_IBAN,
			required: false,
			description: "International Bank Account Number",
		},
	},
	{
		semanticType: SemanticColumnType.COMPANY_COUNTRY,
		label: "Company Country",
		icon: "🌍",
		category: "Company",
		template: {
			name: "company_country",
			type: "customArray",
			semanticType: SemanticColumnType.COMPANY_COUNTRY,
			customOptions: ["Romania", "USA", "UK", "Germany", "France", "Italy", "Spain"],
			defaultValue: "Romania",
			required: true,
			description: "Company country of registration",
		},
	},
];

// Helper: Get template by semantic type
export function getTemplateBySemanticType(semanticType: SemanticColumnType): SemanticTypeTemplate | null {
	return SEMANTIC_TYPE_TEMPLATES.find((t) => t.semanticType === semanticType) || null;
}

// Helper: Get templates by category
export function getTemplatesByCategory(category: string): SemanticTypeTemplate[] {
	return SEMANTIC_TYPE_TEMPLATES.filter((t) => t.category === category);
}

// Helper: Get all categories
export function getTemplateCategories(): string[] {
	return Array.from(new Set(SEMANTIC_TYPE_TEMPLATES.map((t) => t.category)));
}

// Helper: Apply template to form data
export function applySemanticTemplate(
	semanticType: SemanticColumnType,
	currentData?: Partial<CreateColumnRequest>
): Partial<CreateColumnRequest> {
	const template = getTemplateBySemanticType(semanticType);
	
	if (!template) {
		return currentData || {};
	}

	// Merge template with current data (template values take precedence)
	return {
		...currentData,
		...template.template,
		// Keep user's name if they already typed something
		name: currentData?.name || template.template.name,
	};
}

