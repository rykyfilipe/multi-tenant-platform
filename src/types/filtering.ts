/**
 * Type definitions for the new POST-based filtering system
 * Provides clear structure for filter payloads and responses
 */

// Base filter configuration interface
export interface FilterConfig {
	id: string; // Unique identifier for each filter
	columnId: number;
	columnName: string;
	columnType: string;
	operator: string;
	value: any;
	secondValue?: any; // For range filters (between, not_between)
}

// Filter operators by column type
export type TextFilterOperator = 
	| 'contains'
	| 'not_contains'
	| 'equals'
	| 'not_equals'
	| 'starts_with'
	| 'ends_with'
	| 'regex'
	| 'is_empty'
	| 'is_not_empty';

export type NumericFilterOperator = 
	| 'equals'
	| 'not_equals'
	| 'greater_than'
	| 'greater_than_or_equal'
	| 'less_than'
	| 'less_than_or_equal'
	| 'between'
	| 'not_between'
	| 'is_empty'
	| 'is_not_empty';

export type BooleanFilterOperator = 
	| 'equals'
	| 'not_equals'
	| 'is_empty'
	| 'is_not_empty';

export type DateFilterOperator = 
	| 'equals'
	| 'not_equals'
	| 'before'
	| 'after'
	| 'between'
	| 'not_between'
	| 'today'
	| 'yesterday'
	| 'this_week'
	| 'this_month'
	| 'this_year'
	| 'is_empty'
	| 'is_not_empty';

export type ReferenceFilterOperator = 
	| 'equals'
	| 'not_equals'
	| 'is_empty'
	| 'is_not_empty';

export type FilterOperator = 
	| TextFilterOperator
	| NumericFilterOperator
	| BooleanFilterOperator
	| DateFilterOperator
	| ReferenceFilterOperator;

// Main filter payload interface
export interface FilterPayload {
	page: number;
	pageSize: number;
	includeCells?: boolean;
	globalSearch?: string;
	filters?: FilterConfig[];
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

// Pagination information
export interface PaginationInfo {
	page: number;
	pageSize: number;
	totalRows: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

// Filter information in response
export interface FilterInfo {
	applied: boolean;
	globalSearch: string;
	columnFilters: FilterConfig[];
	validFiltersCount: number;
}

// Performance metrics
export interface PerformanceMetrics {
	queryTime: number;
	filteredRows: number;
	originalTableSize: number;
}

// Main API response interface
export interface FilteredRowsResponse {
	data: any[]; // Array of rows
	pagination: PaginationInfo;
	filters: FilterInfo;
	performance?: PerformanceMetrics; // Optional, only in /filtered endpoint
}

// Validation schemas for different filter types
export interface TextFilterValidation {
	columnType: 'text' | 'string' | 'email' | 'url';
	operator: TextFilterOperator;
	value: string;
	secondValue?: never;
}

export interface NumericFilterValidation {
	columnType: 'number' | 'integer' | 'decimal';
	operator: NumericFilterOperator;
	value: number;
	secondValue?: number; // Required for 'between' and 'not_between'
}

export interface BooleanFilterValidation {
	columnType: 'boolean';
	operator: BooleanFilterOperator;
	value: boolean;
	secondValue?: never;
}

export interface DateFilterValidation {
	columnType: 'date' | 'datetime';
	operator: DateFilterOperator;
	value: string | Date; // ISO string or Date object
	secondValue?: string | Date; // Required for 'between' and 'not_between'
}

export interface ReferenceFilterValidation {
	columnType: 'reference';
	operator: ReferenceFilterOperator;
	value: string | number;
	secondValue?: never;
}

export type ValidatedFilter = 
	| TextFilterValidation
	| NumericFilterValidation
	| BooleanFilterValidation
	| DateFilterValidation
	| ReferenceFilterValidation;

// Error response interface
export interface FilterErrorResponse {
	error: string;
	code?: string;
	details?: any;
}

// API endpoint configuration
export interface FilterEndpointConfig {
	baseUrl: string;
	tenantId: string;
	databaseId: string;
	tableId: string;
	authToken: string;
}

// Helper type for creating filter configurations
export interface CreateFilterConfig {
	columnId: number;
	columnName: string;
	columnType: string;
	operator: FilterOperator;
	value: any;
	secondValue?: any;
}

// Utility type for filter validation results
export interface FilterValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

// Constants for filter operators by column type
export const FILTER_OPERATORS_BY_TYPE = {
	text: [
		'contains', 'not_contains', 'equals', 'not_equals',
		'starts_with', 'ends_with', 'regex', 'is_empty', 'is_not_empty'
	] as const,
	number: [
		'equals', 'not_equals', 'greater_than', 'greater_than_or_equal',
		'less_than', 'less_than_or_equal', 'between', 'not_between',
		'is_empty', 'is_not_empty'
	] as const,
	boolean: [
		'equals', 'not_equals', 'is_empty', 'is_not_empty'
	] as const,
	date: [
		'equals', 'not_equals', 'before', 'after', 'between', 'not_between',
		'today', 'yesterday', 'this_week', 'this_month', 'this_year',
		'is_empty', 'is_not_empty'
	] as const,
	reference: [
		'equals', 'not_equals', 'is_empty', 'is_not_empty'
	] as const
} as const;

// Default filter payload values
export const DEFAULT_FILTER_PAYLOAD: Partial<FilterPayload> = {
	page: 1,
	pageSize: 25,
	includeCells: true,
	globalSearch: '',
	filters: [],
	sortBy: 'id',
	sortOrder: 'asc'
} as const;
