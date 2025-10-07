/** @format */

/**
 * Column Type Visual System
 * Colors, icons, and styling for column types based on UX redesign
 */

import {
	Type,
	Hash,
	Mail,
	Link as LinkIcon,
	ToggleLeft,
	Calendar,
	Clock,
	ArrowRight,
	FileIcon,
	Braces,
	Phone,
	MapPin,
	DollarSign,
	Percent,
	Binary,
} from "lucide-react";

// Column type colors (using OKLCH system colors)
export const COLUMN_TYPE_COLORS = {
	text: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
	number: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
	boolean:
		"bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
	date: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
	datetime:
		"bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
	reference:
		"bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
	email: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
	url: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
	phone: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
	address: "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800",
	currency:
		"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
	percentage:
		"bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
	json: "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
	file: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
	default:
		"bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800",
} as const;

// Column type icons
export const COLUMN_TYPE_ICONS = {
	text: Type,
	number: Hash,
	email: Mail,
	url: LinkIcon,
	boolean: ToggleLeft,
	date: Calendar,
	datetime: Clock,
	reference: ArrowRight,
	file: FileIcon,
	json: Braces,
	phone: Phone,
	address: MapPin,
	currency: DollarSign,
	percentage: Percent,
	default: Binary,
} as const;

// Get color classes for a column type
export function getColumnTypeColor(type: string): string {
	const normalizedType = type.toLowerCase();
	return COLUMN_TYPE_COLORS[normalizedType as keyof typeof COLUMN_TYPE_COLORS] || COLUMN_TYPE_COLORS.default;
}

// Get icon component for a column type
export function getColumnTypeIcon(type: string) {
	const normalizedType = type.toLowerCase();
	const IconComponent = COLUMN_TYPE_ICONS[normalizedType as keyof typeof COLUMN_TYPE_ICONS] || COLUMN_TYPE_ICONS.default;
	return IconComponent;
}

// Column type labels for display
export const COLUMN_TYPE_LABELS = {
	text: "Text",
	number: "Number",
	email: "Email",
	url: "URL",
	boolean: "Boolean",
	date: "Date",
	datetime: "Date & Time",
	reference: "Reference",
	file: "File",
	json: "JSON",
	phone: "Phone",
	address: "Address",
	currency: "Currency",
	percentage: "Percentage",
} as const;

// Column type examples
export const COLUMN_TYPE_EXAMPLES = {
	text: "John Doe",
	number: "42",
	email: "user@example.com",
	url: "https://example.com",
	boolean: "true / false",
	date: "2025-01-15",
	datetime: "2025-01-15 14:30",
	reference: "→ Related table",
	file: "document.pdf",
	json: '{"key": "value"}',
	phone: "+1 234 567 8900",
	address: "123 Main St, City",
	currency: "$99.99",
	percentage: "75%",
} as const;

// Constraint badge colors
export const CONSTRAINT_BADGE_COLORS = {
	required: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
	unique: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
	primary: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
	foreign: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
	indexed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
} as const;

