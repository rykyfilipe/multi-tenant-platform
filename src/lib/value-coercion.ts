/**
 * Value coercion utility for filtering
 * Handles conversion from JSON cell values to proper types for filtering
 */

import { ColumnType } from '@/types/filtering-enhanced';

export interface CoercionResult {
  value: any;
  success: boolean;
  error?: string;
  originalValue: any;
  targetType: ColumnType;
}

export class ValueCoercion {
  /**
   * Coerce a JSON cell value to the appropriate type for filtering
   */
  static coerceValue(value: any, columnType: ColumnType): CoercionResult {
    const originalValue = value;
    
    try {
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return {
          value: null,
          success: true,
          originalValue,
          targetType: columnType
        };
      }

      // Handle empty strings
      if (value === '') {
        return {
          value: '',
          success: true,
          originalValue,
          targetType: columnType
        };
      }

      let coercedValue: any;

      switch (columnType) {
        case 'text':
        case 'string':
        case 'email':
        case 'url':
          coercedValue = this.coerceToString(value);
          break;

        case 'number':
        case 'integer':
        case 'decimal':
          coercedValue = this.coerceToNumber(value);
          break;

        case 'boolean':
          coercedValue = this.coerceToBoolean(value);
          break;

        case 'date':
        case 'datetime':
          coercedValue = this.coerceToDate(value);
          break;

        case 'time':
          coercedValue = this.coerceToTime(value);
          break;

        case 'json':
          coercedValue = this.coerceToJson(value);
          break;

        case 'reference':
          coercedValue = this.coerceToReference(value);
          break;

        case 'customArray':
          coercedValue = this.coerceToString(value);
          break;

        default:
          return {
            value: originalValue,
            success: false,
            error: `Unknown column type: ${columnType}`,
            originalValue,
            targetType: columnType
          };
      }

      return {
        value: coercedValue,
        success: true,
        originalValue,
        targetType: columnType
      };

    } catch (error) {
      return {
        value: originalValue,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown coercion error',
        originalValue,
        targetType: columnType
      };
    }
  }

  /**
   * Coerce value to string
   */
  private static coerceToString(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Coerce value to number
   */
  private static coerceToNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw new Error(`Cannot convert "${value}" to number`);
      }
      return parsed;
    }
    
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    
    throw new Error(`Cannot convert ${typeof value} to number`);
  }

  /**
   * Coerce value to boolean
   */
  private static coerceToBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(lower)) {
        return true;
      }
      if (['false', '0', 'no', 'off', ''].includes(lower)) {
        return false;
      }
      throw new Error(`Cannot convert "${value}" to boolean`);
    }
    
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    throw new Error(`Cannot convert ${typeof value} to boolean`);
  }

  /**
   * Coerce value to Date
   */
  private static coerceToDate(value: any): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: "${value}"`);
      }
      return date.toISOString();
    }
    
    if (typeof value === 'number') {
      // Assume timestamp
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp: ${value}`);
      }
      return date.toISOString();
    }
    
    throw new Error(`Cannot convert ${typeof value} to date`);
  }

  /**
   * Coerce value to time string
   */
  private static coerceToTime(value: any): string {
    if (typeof value === 'string') {
      // Validate time format (HH:MM:SS or HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (timeRegex.test(value)) {
        return value;
      }
      throw new Error(`Invalid time format: "${value}"`);
    }
    
    if (value instanceof Date) {
      return value.toTimeString().split(' ')[0];
    }
    
    throw new Error(`Cannot convert ${typeof value} to time`);
  }

  /**
   * Coerce value to JSON
   */
  private static coerceToJson(value: any): any {
    if (typeof value === 'object' && value !== null) {
      return value;
    }
    
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if not valid JSON
      }
    }
    
    return value;
  }

  /**
   * Coerce value to reference (handle both single values and arrays)
   */
  private static coerceToReference(value: any): string | string[] {
    if (Array.isArray(value)) {
      return value.map(v => String(v));
    }
    
    return String(value);
  }

  /**
   * Get SQL cast expression for a column type
   */
  static getSqlCast(columnType: ColumnType): string {
    switch (columnType) {
      case 'text':
      case 'string':
      case 'email':
      case 'url':
      case 'customArray':
        return 'value::text';
      
      case 'number':
      case 'integer':
      case 'decimal':
        return '(value::text)::numeric';
      
      case 'boolean':
        return 'value::boolean';
      
      case 'date':
      case 'datetime':
      case 'time':
        return 'value::text';
      
      case 'json':
        return 'value';
      
      case 'reference':
        return 'value';
      
      default:
        return 'value::text';
    }
  }

  /**
   * Get SQL operator for filtering
   */
  static getSqlOperator(operator: string, columnType: ColumnType): string {
    switch (operator) {
      case 'contains':
        return columnType === 'json' ? '@>' : 'ILIKE';
      
      case 'not_contains':
        return columnType === 'json' ? 'NOT @>' : 'NOT ILIKE';
      
      case 'equals':
        return '=';
      
      case 'not_equals':
        return '!=';
      
      case 'starts_with':
        return 'ILIKE';
      
      case 'ends_with':
        return 'ILIKE';
      
      case 'regex':
        return '~';
      
      case 'greater_than':
        return '>';
      
      case 'greater_than_or_equal':
        return '>=';
      
      case 'less_than':
        return '<';
      
      case 'less_than_or_equal':
        return '<=';
      
      case 'before':
        return '<';
      
      case 'after':
        return '>';
      
      case 'between':
        return 'BETWEEN';
      
      case 'not_between':
        return 'NOT BETWEEN';
      
      default:
        return '=';
    }
  }

  /**
   * Format value for SQL query
   */
  static formatValueForSql(value: any, operator: string, columnType: ColumnType): any {
    switch (operator) {
      case 'contains':
        if (columnType === 'json') {
          return JSON.stringify(value);
        }
        return `%${value}%`;
      
      case 'not_contains':
        if (columnType === 'json') {
          return JSON.stringify(value);
        }
        return `%${value}%`;
      
      case 'starts_with':
        return `${value}%`;
      
      case 'ends_with':
        return `%${value}`;
      
      case 'regex':
        return value;
      
      case 'between':
      case 'not_between':
        return value; // Will be handled separately
      
      default:
        return value;
    }
  }
}
