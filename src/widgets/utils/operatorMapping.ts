/**
 * Operator mapping between backend format (less_than) and frontend format (<)
 */

export type BackendOperator = 
  | 'less_than'
  | 'less_than_or_equal'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'between'
  | 'not_between'
  | 'before'
  | 'after'
  | 'is_empty'
  | 'is_not_empty'
  | 'regex'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year';

export type FrontendOperator = 
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'contains'
  | 'startsWith'
  | 'endsWith';

/**
 * Maps backend operators to frontend operators for widget schemas
 */
export const backendToFrontendOperator: Record<BackendOperator, FrontendOperator | null> = {
  // Comparison operators
  'equals': '=',
  'not_equals': '!=',
  'greater_than': '>',
  'less_than': '<',
  'greater_than_or_equal': '>=',
  'less_than_or_equal': '<=',
  
  // Text operators
  'contains': 'contains',
  'starts_with': 'startsWith',
  'ends_with': 'endsWith',
  
  // Operators not supported in widget schema (use null)
  'not_contains': null,
  'between': null,
  'not_between': null,
  'before': null,
  'after': null,
  'is_empty': null,
  'is_not_empty': null,
  'regex': null,
  'today': null,
  'yesterday': null,
  'this_week': null,
  'last_week': null,
  'this_month': null,
  'last_month': null,
  'this_year': null,
  'last_year': null,
};

/**
 * Maps frontend operators back to backend operators
 */
export const frontendToBackendOperator: Record<FrontendOperator, BackendOperator> = {
  '=': 'equals',
  '!=': 'not_equals',
  '>': 'greater_than',
  '<': 'less_than',
  '>=': 'greater_than_or_equal',
  '<=': 'less_than_or_equal',
  'contains': 'contains',
  'startsWith': 'starts_with',
  'endsWith': 'ends_with',
};

/**
 * Converts a backend operator to frontend format for widget schemas
 */
export function convertBackendToFrontend(operator: string | undefined): FrontendOperator | undefined {
  if (!operator) return undefined;
  
  const mapped = backendToFrontendOperator[operator as BackendOperator];
  return mapped || undefined;
}

/**
 * Converts a frontend operator to backend format for API calls
 */
export function convertFrontendToBackend(operator: string | undefined): BackendOperator | undefined {
  if (!operator) return undefined;
  
  return frontendToBackendOperator[operator as FrontendOperator] || operator as BackendOperator;
}

/**
 * Converts filter operators from backend to frontend format
 */
export function convertFiltersToFrontend(filters: any[]): any[] {
  return filters.map(filter => ({
    ...filter,
    operator: convertBackendToFrontend(filter.operator)
  })).filter(filter => filter.operator !== undefined && filter.operator !== null);
}

/**
 * Converts filter operators from frontend to backend format
 */
export function convertFiltersToBackend(filters: any[]): any[] {
  return filters.map(filter => ({
    ...filter,
    operator: convertFrontendToBackend(filter.operator)
  }));
}

