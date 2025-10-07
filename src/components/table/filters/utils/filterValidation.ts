/** @format */

import { FilterConfig, FilterOperator, ColumnType } from "@/types/filtering";

export interface FilterValidationError {
	filterId: string;
	field: string;
	message: string;
}

export interface FilterValidationResult {
	isValid: boolean;
	errors: FilterValidationError[];
	warnings: string[];
}

/**
 * Validates a single filter configuration
 */
export function validateFilter(filter: FilterConfig): FilterValidationResult {
	const errors: FilterValidationError[] = [];
	const warnings: string[] = [];

	// Check if filter has required fields
	if (!filter.columnId) {
		errors.push({
			filterId: filter.id,
			field: "columnId",
			message: "Column is required",
		});
	}

	if (!filter.operator) {
		errors.push({
			filterId: filter.id,
			field: "operator",
			message: "Operator is required",
		});
	}

	// Check if value is required for this operator
	if (operatorRequiresValue(filter.operator)) {
		if (filter.value === null || filter.value === undefined || filter.value === "") {
			errors.push({
				filterId: filter.id,
				field: "value",
				message: "Value is required for this operator",
			});
		}
	}

	// Check if second value is required (for range operators)
	if (requiresSecondValue(filter.operator)) {
		if (
			filter.secondValue === null ||
			filter.secondValue === undefined ||
			filter.secondValue === ""
		) {
			errors.push({
				filterId: filter.id,
				field: "secondValue",
				message: "Second value is required for range operators",
			});
		}

		// Validate range values
		if (filter.columnType === "number" || filter.columnType === "integer" || filter.columnType === "decimal") {
			const val1 = Number(filter.value);
			const val2 = Number(filter.secondValue);
			if (!isNaN(val1) && !isNaN(val2) && val1 >= val2) {
				warnings.push("First value should be less than second value for range filters");
			}
		}
	}

	// Type-specific validation
	switch (filter.columnType) {
		case "number":
		case "integer":
		case "decimal":
			if (filter.value !== null && filter.value !== undefined && filter.value !== "") {
				if (isNaN(Number(filter.value))) {
					errors.push({
						filterId: filter.id,
						field: "value",
						message: "Value must be a valid number",
					});
				}
			}
			break;

		case "date":
		case "datetime":
			if (filter.value && typeof filter.value === "string") {
				const date = new Date(filter.value);
				if (isNaN(date.getTime())) {
					errors.push({
						filterId: filter.id,
						field: "value",
						message: "Value must be a valid date",
					});
				}
			}
			break;

		case "email":
			if (filter.value && typeof filter.value === "string") {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(filter.value)) {
					warnings.push("Value doesn't appear to be a valid email address");
				}
			}
			break;

		case "url":
			if (filter.value && typeof filter.value === "string") {
				try {
					new URL(filter.value);
				} catch {
					warnings.push("Value doesn't appear to be a valid URL");
				}
			}
			break;
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validates multiple filters
 */
export function validateFilters(filters: FilterConfig[]): FilterValidationResult {
	const allErrors: FilterValidationError[] = [];
	const allWarnings: string[] = [];

	filters.forEach((filter) => {
		const result = validateFilter(filter);
		allErrors.push(...result.errors);
		allWarnings.push(...result.warnings);
	});

	// Check for duplicate filters
	const duplicates = findDuplicateFilters(filters);
	if (duplicates.length > 0) {
		allWarnings.push(`Found ${duplicates.length} duplicate filter(s)`);
	}

	return {
		isValid: allErrors.length === 0,
		errors: allErrors,
		warnings: allWarnings,
	};
}

/**
 * Check if operator requires a value
 */
export function operatorRequiresValue(operator: FilterOperator): boolean {
	const noValueOperators: FilterOperator[] = [
		"is_empty",
		"is_not_empty",
		"today",
		"yesterday",
		"this_week",
		"last_week",
		"this_month",
		"last_month",
		"this_year",
		"last_year",
	];
	return !noValueOperators.includes(operator);
}

/**
 * Check if operator requires a second value (range operators)
 */
export function requiresSecondValue(operator: FilterOperator): boolean {
	return operator === "between" || operator === "not_between";
}

/**
 * Find duplicate filters
 */
function findDuplicateFilters(filters: FilterConfig[]): FilterConfig[] {
	const seen = new Set<string>();
	const duplicates: FilterConfig[] = [];

	filters.forEach((filter) => {
		const key = `${filter.columnId}-${filter.operator}-${filter.value}`;
		if (seen.has(key)) {
			duplicates.push(filter);
		}
		seen.add(key);
	});

	return duplicates;
}

/**
 * Get validation error message for a specific filter field
 */
export function getFilterFieldError(
	filter: FilterConfig,
	field: string,
	validationResult: FilterValidationResult,
): string | undefined {
	const error = validationResult.errors.find(
		(e) => e.filterId === filter.id && e.field === field,
	);
	return error?.message;
}

