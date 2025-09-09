/**
 * Strict filter validation system
 * Ensures type safety and operator compatibility
 */

import { 
  FilterConfig, 
  FilterValidationResult, 
  ColumnType, 
  FilterOperator, 
  OPERATOR_COMPATIBILITY,
  VALUE_TYPE_MAPPING 
} from '@/types/filtering-enhanced';

export class FilterValidator {
  /**
   * Validate a single filter configuration
   */
  static validateFilter(filter: FilterConfig, availableColumns: any[]): FilterValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if column exists
    const column = availableColumns.find(col => col.id === filter.columnId);
    if (!column) {
      errors.push(`Column with ID ${filter.columnId} not found`);
      return { isValid: false, errors, warnings };
    }

    // Validate column type
    if (!this.isValidColumnType(filter.columnType)) {
      errors.push(`Invalid column type: ${filter.columnType}`);
      return { isValid: false, errors, warnings };
    }

    // Validate operator compatibility
    const validOperators = OPERATOR_COMPATIBILITY[filter.columnType as ColumnType];
    if (!validOperators || !validOperators.includes(filter.operator as any)) {
      errors.push(`Operator '${filter.operator}' is not compatible with column type '${filter.columnType}'`);
      return { isValid: false, errors, warnings };
    }

    // Validate value type
    if (filter.value !== null && filter.value !== undefined) {
      const expectedType = VALUE_TYPE_MAPPING[filter.columnType as ColumnType];
      const actualType = typeof filter.value;
      
      if (expectedType === 'number' && actualType !== 'number') {
        if (actualType === 'string' && !isNaN(Number(filter.value))) {
          warnings.push(`Value '${filter.value}' will be converted to number`);
        } else {
          errors.push(`Expected number value for column type '${filter.columnType}', got ${actualType}`);
        }
      } else if (expectedType === 'boolean' && actualType !== 'boolean') {
        if (actualType === 'string' && ['true', 'false'].includes(String(filter.value).toLowerCase())) {
          warnings.push(`Value '${filter.value}' will be converted to boolean`);
        } else {
          errors.push(`Expected boolean value for column type '${filter.columnType}', got ${actualType}`);
        }
      } else if (expectedType === 'string' && actualType !== 'string') {
        warnings.push(`Value '${filter.value}' will be converted to string`);
      }
    }

    // Validate range filters
    if (['between', 'not_between'].includes(filter.operator)) {
      if (filter.secondValue === null || filter.secondValue === undefined) {
        errors.push(`Range operator '${filter.operator}' requires secondValue`);
      }
    }

    // Validate empty value filters
    if (['is_empty', 'is_not_empty'].includes(filter.operator)) {
      if (filter.value !== null && filter.value !== undefined && filter.value !== '') {
        warnings.push(`Value '${filter.value}' will be ignored for '${filter.operator}' operator`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate multiple filters
   */
  static validateFilters(filters: FilterConfig[], availableColumns: any[]): FilterValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (let i = 0; i < filters.length; i++) {
      const result = this.validateFilter(filters[i], availableColumns);
      if (!result.isValid) {
        allErrors.push(`Filter ${i + 1}: ${result.errors.join(', ')}`);
      }
      allWarnings.push(...result.warnings.map(w => `Filter ${i + 1}: ${w}`));
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Check if column type is valid
   */
  private static isValidColumnType(type: string): type is ColumnType {
    return Object.keys(VALUE_TYPE_MAPPING).includes(type);
  }

  /**
   * Convert filter value to correct type
   */
  static convertFilterValue(value: any, columnType: ColumnType): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (columnType) {
      case 'number':
      case 'integer':
      case 'decimal':
        return Number(value);
      
      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);
      
      case 'date':
      case 'datetime':
      case 'time':
        if (value instanceof Date) {
          return value.toISOString();
        }
        return String(value);
      
      case 'text':
      case 'string':
      case 'email':
      case 'url':
        return String(value);
      
      case 'json':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      
      case 'reference':
        return Number(value);
      
      default:
        return value;
    }
  }

  /**
   * Get available operators for a column type
   */
  static getAvailableOperators(columnType: ColumnType): FilterOperator[] {
    return OPERATOR_COMPATIBILITY[columnType] || [];
  }

  /**
   * Check if operator is valid for column type
   */
  static isOperatorValid(operator: string, columnType: ColumnType): boolean {
    const validOperators = this.getAvailableOperators(columnType);
    return validOperators.includes(operator as any);
  }
}
