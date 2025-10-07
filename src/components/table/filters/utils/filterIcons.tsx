/** @format */

import React from "react";
import {
	Type,
	Hash,
	Calendar,
	ToggleLeft,
	Link as LinkIcon,
	List,
	Mail,
	Globe,
	FileJson,
	Equals,
	NotEqual,
	MoreHorizontal,
	LucideIcon,
} from "lucide-react";
import { ColumnType, FilterOperator } from "@/types/filtering";

interface TypeIconProps {
	type: ColumnType | string;
	className?: string;
}

/**
 * Get icon component for column type
 */
export const TypeIcon: React.FC<TypeIconProps> = ({ type, className }) => {
	const iconProps = { className: className || "w-4 h-4" };

	switch (type) {
		case "text":
		case "string":
			return <Type {...iconProps} />;
		case "email":
			return <Mail {...iconProps} />;
		case "url":
			return <Globe {...iconProps} />;
		case "number":
		case "integer":
		case "decimal":
			return <Hash {...iconProps} />;
		case "boolean":
			return <ToggleLeft {...iconProps} />;
		case "date":
		case "datetime":
		case "time":
			return <Calendar {...iconProps} />;
		case "reference":
			return <LinkIcon {...iconProps} />;
		case "customArray":
			return <List {...iconProps} />;
		case "json":
			return <FileJson {...iconProps} />;
		default:
			return <MoreHorizontal {...iconProps} />;
	}
};

/**
 * Get color classes for column type
 */
export function getTypeColor(type: ColumnType | string): string {
	switch (type) {
		case "text":
		case "string":
		case "email":
		case "url":
			return "text-blue-600 bg-blue-50 border-blue-200";
		case "number":
		case "integer":
		case "decimal":
			return "text-emerald-600 bg-emerald-50 border-emerald-200";
		case "boolean":
			return "text-amber-600 bg-amber-50 border-amber-200";
		case "date":
		case "datetime":
		case "time":
			return "text-purple-600 bg-purple-50 border-purple-200";
		case "reference":
			return "text-indigo-600 bg-indigo-50 border-indigo-200";
		case "customArray":
			return "text-pink-600 bg-pink-50 border-pink-200";
		case "json":
			return "text-cyan-600 bg-cyan-50 border-cyan-200";
		default:
			return "text-gray-600 bg-gray-50 border-gray-200";
	}
}

interface OperatorIconProps {
	operator: FilterOperator;
	className?: string;
}

/**
 * Get icon for operator (simplified, reusing existing icons)
 */
export const OperatorIcon: React.FC<OperatorIconProps> = ({ operator, className }) => {
	const iconProps = { className: className || "w-3.5 h-3.5" };

	if (operator === "equals") return <Equals {...iconProps} />;
	if (operator === "not_equals") return <NotEqual {...iconProps} />;
	
	// For other operators, use a generic icon
	return <MoreHorizontal {...iconProps} />;
};

/**
 * Get user-friendly label for operator
 */
export function getOperatorLabel(operator: FilterOperator): string {
	const labels: Record<string, string> = {
		contains: "Contains",
		not_contains: "Does not contain",
		equals: "Equals",
		not_equals: "Does not equal",
		starts_with: "Starts with",
		ends_with: "Ends with",
		regex: "Matches regex",
		greater_than: "Greater than",
		greater_than_or_equal: "Greater than or equal",
		less_than: "Less than",
		less_than_or_equal: "Less than or equal",
		between: "Between",
		not_between: "Not between",
		before: "Before",
		after: "After",
		today: "Today",
		yesterday: "Yesterday",
		this_week: "This week",
		last_week: "Last week",
		this_month: "This month",
		last_month: "Last month",
		this_year: "This year",
		last_year: "Last year",
		is_empty: "Is empty",
		is_not_empty: "Is not empty",
	};

	return labels[operator] || operator.replace(/_/g, " ");
}

/**
 * Get preset icon options
 */
export const PRESET_ICONS: Array<{ value: string; icon: LucideIcon; label: string }> = [
	{ value: "star", icon: require("lucide-react").Star, label: "Star" },
	{ value: "bookmark", icon: require("lucide-react").Bookmark, label: "Bookmark" },
	{ value: "heart", icon: require("lucide-react").Heart, label: "Heart" },
	{ value: "flag", icon: require("lucide-react").Flag, label: "Flag" },
	{ value: "tag", icon: require("lucide-react").Tag, label: "Tag" },
	{ value: "zap", icon: require("lucide-react").Zap, label: "Zap" },
];

