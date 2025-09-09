/**
 * Enhanced filtering system with strict type safety and validation
 * Replaces the old filtering types with a more robust implementation
 */

// Base filter configuration with strict typing
export interface FilterConfig {
  id: string;
  columnId: number;
  columnName: string;
  columnType: ColumnType;
  operator: FilterOperator;
  value: FilterValue | null | undefined;
  secondValue?: FilterValue | null | undefined; // For range filters
}

// Strict column types
export type ColumnType = 
  | 'text' 
  | 'string' 
  | 'email' 
  | 'url' 
  | 'number' 
  | 'integer' 
  | 'decimal' 
  | 'boolean' 
  | 'date' 
  | 'datetime' 
  | 'time' 
  | 'json' 
  | 'reference'
  | 'customArray';

// Strict filter values based on column type
export type FilterValue = 
  | string 
  | number 
  | boolean 
  | Date 
  | null 
  | undefined;

// Operator mapping by column type
export interface OperatorMapping {
  text: TextOperator[];
  number: NumberOperator[];
  boolean: BooleanOperator[];
  date: DateOperator[];
  reference: ReferenceOperator[];
  customArray: ReferenceOperator[];
}

// Text operators
export type TextOperator = 
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'regex'
  | 'is_empty'
  | 'is_not_empty';

// Number operators
export type NumberOperator = 
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

// Boolean operators
export type BooleanOperator = 
  | 'equals'
  | 'not_equals'
  | 'is_empty'
  | 'is_not_empty';

// Date operators
export type DateOperator = 
  | 'equals'
  | 'not_equals'
  | 'before'
  | 'after'
  | 'between'
  | 'not_between'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'is_empty'
  | 'is_not_empty';

// Reference operators
export type ReferenceOperator = 
  | 'equals'
  | 'not_equals'
  | 'is_empty'
  | 'is_not_empty';

// Union of all operators
export type FilterOperator = 
  | TextOperator 
  | NumberOperator 
  | BooleanOperator 
  | DateOperator 
  | ReferenceOperator;

// Filter validation result
export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Enhanced filter payload
export interface FilterPayload {
  filters: FilterConfig[];
  globalSearch: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

// Filter response
export interface FilteredRowsResponse {
  data: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: FilterConfig[];
  appliedFilters: FilterConfig[];
  globalSearch: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  executionTime: number;
  cacheHit: boolean;
}

// Cache key structure
export interface CacheKey {
  tableId: number;
  filters: string; // JSON stringified filters
  globalSearch: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  pageSize: number;
}

// Operator compatibility matrix
export const OPERATOR_COMPATIBILITY: OperatorMapping = {
  text: ['contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with', 'regex', 'is_empty', 'is_not_empty'],
  number: ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'between', 'not_between', 'is_empty', 'is_not_empty'],
  boolean: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  date: ['equals', 'not_equals', 'before', 'after', 'between', 'not_between', 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'is_empty', 'is_not_empty'],
  reference: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  customArray: ['equals', 'not_equals', 'is_empty', 'is_not_empty']
};

// Value type mapping
export const VALUE_TYPE_MAPPING: Record<ColumnType, string> = {
  text: 'string',
  string: 'string',
  email: 'string',
  url: 'string',
  number: 'number',
  integer: 'number',
  decimal: 'number',
  boolean: 'boolean',
  date: 'string',
  datetime: 'string',
  time: 'string',
  json: 'object',
  reference: 'number',
  customArray: 'string'
};
