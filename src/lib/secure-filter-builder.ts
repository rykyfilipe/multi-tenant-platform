/**
 * Secure Filter Builder - Eliminates SQL injection risks
 * Uses Prisma's built-in filtering instead of raw SQL
 */

import { FilterConfig, ColumnType } from '@/types/filtering';
import { FilterValidator } from './filter-validator';
import { ValueCoercion } from './value-coercion';
import { Prisma } from '@/generated/prisma';

export interface SecureFilterResult {
  whereClause: any;
  hasFilters: boolean;
}

export class SecureFilterBuilder {
  private tableId: number;
  private tableColumns: any[];

  constructor(tableId: number, tableColumns: any[]) {
    this.tableId = tableId;
    this.tableColumns = tableColumns;
  }

  /**
   * Build secure where clause using Prisma's built-in filtering
   */
  buildWhereClause(filters: FilterConfig[], globalSearch?: string): SecureFilterResult {
    const whereConditions: any[] = [];

    // Add table ID filter
    whereConditions.push({ tableId: this.tableId });

    // Add global search
    if (globalSearch && globalSearch.trim()) {
      whereConditions.push(this.buildGlobalSearchCondition(globalSearch.trim()));
    }

    // Add column filters
    if (filters && filters.length > 0) {
      const validFilters = filters.filter(filter => this.isValidFilter(filter));
      
      for (const filter of validFilters) {
        const condition = this.buildColumnFilterCondition(filter);
        if (condition) {
          whereConditions.push(condition);
        }
      }
    }

    return {
      whereClause: whereConditions.length > 1 ? { AND: whereConditions } : whereConditions[0],
      hasFilters: whereConditions.length > 1
    };
  }

  /**
   * Build global search condition using Prisma's text search
   */
  private buildGlobalSearchCondition(searchTerm: string): any {
    const conditions: any[] = [];

    // String value search (case-insensitive)
    conditions.push({ 
      stringValue: { 
        contains: searchTerm, 
        mode: 'insensitive' 
      } 
    });

    // Numeric search if search term is a number
    if (!isNaN(Number(searchTerm))) {
      conditions.push({ 
        numberValue: { 
          equals: Number(searchTerm) 
        } 
      });
    }

    // Date search if search term looks like a date
    const dateValue = new Date(searchTerm);
    if (!isNaN(dateValue.getTime())) {
      // Search for dates that contain the search term in their string representation
      conditions.push({
        dateValue: {
          gte: new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate()),
          lt: new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate() + 1)
        }
      });
    }

    // Boolean search
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (['true', 'false', 'yes', 'no', '1', '0'].includes(lowerSearchTerm)) {
      let booleanValue = false;
      if (['true', 'yes', '1'].includes(lowerSearchTerm)) {
        booleanValue = true;
      }
      conditions.push({ 
        booleanValue: { 
          equals: booleanValue 
        } 
      });
    }

    // JSON value search for generic value field (case-insensitive)
    conditions.push({
      value: {
        path: [],
        string_contains: searchTerm
      }
    });

    return {
      cells: {
        some: {
          OR: conditions
        }
      }
    };
  }

  /**
   * Build column-specific filter condition
   */
  private buildColumnFilterCondition(filter: FilterConfig): any | null {
    const { columnId, operator, value, secondValue, columnType } = filter;
    
    // Convert values to correct types
    const convertedValue = FilterValidator.convertFilterValue(value, columnType as ColumnType);
    const convertedSecondValue = secondValue ? 
      FilterValidator.convertFilterValue(secondValue, columnType as ColumnType) : null;

    // Build cell filter condition
    const cellCondition = this.buildCellCondition(columnId, operator, convertedValue, convertedSecondValue, columnType);
    
    if (!cellCondition) return null;

    return {
      cells: {
        some: {
          columnId: columnId,
          ...cellCondition
        }
      }
    };
  }

  /**
   * Build cell condition based on column type and operator
   */
  private buildCellCondition(
    columnId: number, 
    operator: string, 
    value: any, 
    secondValue: any, 
    columnType: string
  ): any | null {
    try {
      // Validate operator compatibility with column type
      if (!this.isOperatorValid(operator, columnType)) {
        console.warn(`Invalid operator '${operator}' for column type '${columnType}'`);
        return null;
      }

      // Handle empty value filters
      if (['is_empty', 'is_not_empty'].includes(operator)) {
        return this.buildEmptyValueCondition(operator);
      }

      // Handle range filters
      if (['between', 'not_between'].includes(operator)) {
        return this.buildRangeCondition(operator, value, secondValue, columnType);
      }

      // Handle different column types
      switch (columnType) {
        case 'string':
        case 'text':
        case 'email':
        case 'url':
          return this.buildTextCondition(operator, value);
        
        case 'number':
        case 'integer':
        case 'decimal':
          return this.buildNumericCondition(operator, value);
        
        case 'boolean':
          return this.buildBooleanCondition(operator, value);
        
        case 'date':
        case 'datetime':
        case 'time':
          return this.buildDateCondition(operator, value);
        
        case 'reference':
          return this.buildReferenceCondition(operator, value);
        
        case 'customArray':
          return this.buildCustomArrayCondition(operator, value);
        
        default:
          // Fallback to JSON value search
          return this.buildJsonCondition(operator, value);
      }
    } catch (error) {
      console.error(`Error building cell condition for operator '${operator}' and column type '${columnType}':`, error);
      return null;
    }
  }

  /**
   * Build empty value conditions
   */
  private buildEmptyValueCondition(operator: string): any {
    const isEmpty = operator === 'is_empty';
    
    if (isEmpty) {
      return {
        OR: [
          { stringValue: null },
          { numberValue: null },
          { dateValue: null },
          { booleanValue: null },
          { value: null },
          { value: { equals: Prisma.JsonNull } }
        ]
      };
    } else {
      return {
        AND: [
          { stringValue: { not: null } },
          { numberValue: { not: null } },
          { dateValue: { not: null } },
          { booleanValue: { not: null } },
          { value: { not: null } },
          { value: { not: { equals: Prisma.JsonNull } } }
        ]
      };
    }
  }

  /**
   * Build range conditions
   */
  private buildRangeCondition(operator: string, value: any, secondValue: any, columnType: string): any {
    const isBetween = operator === 'between';
    
    if (this.isNumericColumn(columnType)) {
      if (isBetween) {
        return {
          numberValue: { gte: value, lte: secondValue }
        };
      } else {
        // not_between: NOT (value >= x AND x <= secondValue) = (value < x OR x > secondValue)
        return {
          OR: [
            { numberValue: { lt: value } },
            { numberValue: { gt: secondValue } }
          ]
        };
      }
    } else if (this.isDateColumn(columnType)) {
      const startDate = new Date(value);
      const endDate = new Date(secondValue);
      
      if (isBetween) {
        return {
          dateValue: { gte: startDate, lte: endDate }
        };
      } else {
        // not_between: NOT (date >= startDate AND date <= endDate) = (date < startDate OR date > endDate)
        return {
          OR: [
            { dateValue: { lt: startDate } },
            { dateValue: { gt: endDate } }
          ]
        };
      }
    }
    
    return null;
  }

  /**
   * Build text conditions
   */
  private buildTextCondition(operator: string, value: any): any {
    switch (operator) {
      case 'contains':
        return { stringValue: { contains: value, mode: 'insensitive' } };
      case 'not_contains':
        return { stringValue: { not: { contains: value, mode: 'insensitive' } } };
      case 'equals':
        return { stringValue: { equals: value } };
      case 'not_equals':
        return { stringValue: { not: { equals: value } } };
      case 'starts_with':
        return { stringValue: { startsWith: value, mode: 'insensitive' } };
      case 'ends_with':
        return { stringValue: { endsWith: value, mode: 'insensitive' } };
      case 'regex':
        // Use contains with case-insensitive mode as fallback for regex
        // Note: Prisma doesn't support regex directly, using contains as approximation
        return { stringValue: { contains: value, mode: 'insensitive' } };
      default:
        return null;
    }
  }

  /**
   * Build numeric conditions
   */
  private buildNumericCondition(operator: string, value: any): any {
    const numericValue = Number(value);

    // Try numberValue first, then fallback to value field for backward compatibility
    return {
      OR: [
        // Primary: use numberValue if it exists and is not null
        {
          AND: [
            { numberValue: { not: null } },
            this.buildSimpleNumericCondition('numberValue', operator, numericValue)
          ]
        },
        // Fallback: parse value field as string and compare
        {
          AND: [
            { numberValue: null },
            { value: { not: null } },
            this.buildJsonNumericCondition(operator, numericValue)
          ]
        }
      ]
    };
  }

  private buildSimpleNumericCondition(fieldName: string, operator: string, numericValue: number): any {
    switch (operator) {
      case 'equals':
        return { [fieldName]: { equals: numericValue } };
      case 'not_equals':
        return { [fieldName]: { not: { equals: numericValue } } };
      case 'greater_than':
        return { [fieldName]: { gt: numericValue } };
      case 'greater_than_or_equal':
        return { [fieldName]: { gte: numericValue } };
      case 'less_than':
        return { [fieldName]: { lt: numericValue } };
      case 'less_than_or_equal':
        return { [fieldName]: { lte: numericValue } };
      default:
        return null;
    }
  }

  private buildJsonNumericCondition(operator: string, numericValue: number): any {
    // For JSON value field, convert to string and use string comparison
    // This is an approximation since JSON doesn't support numeric operators directly
    switch (operator) {
      case 'equals':
        return { value: { equals: numericValue.toString() } };
      case 'not_equals':
        return { value: { not: { equals: numericValue.toString() } } };
      case 'greater_than':
        // Use string comparison - this is approximate
        return { value: { gt: numericValue.toString() } };
      case 'greater_than_or_equal':
        return { value: { gte: numericValue.toString() } };
      case 'less_than':
        return { value: { lt: numericValue.toString() } };
      case 'less_than_or_equal':
        return { value: { lte: numericValue.toString() } };
      default:
        return null;
    }
  }

  /**
   * Build boolean conditions
   */
  private buildBooleanCondition(operator: string, value: any): any {
    const booleanValue = Boolean(value);

    return {
      OR: [
        // Primary: use booleanValue if it exists and is not null
        {
          AND: [
            { booleanValue: { not: null } },
            { booleanValue: { [operator === 'equals' ? 'equals' : 'not']: booleanValue } }
          ]
        },
        // Fallback: parse value field as string
        {
          AND: [
            { booleanValue: null },
            { value: { not: null } },
            { value: { [operator === 'equals' ? 'equals' : 'not']: booleanValue.toString() } }
          ]
        }
      ]
    };
  }

  /**
   * Build date conditions
   */
  private buildDateCondition(operator: string, value: any): any {
    const dateValue = new Date(value);
    
    switch (operator) {
      case 'equals':
        const startOfDay = new Date(dateValue);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateValue);
        endOfDay.setHours(23, 59, 59, 999);
        return { 
          dateValue: { 
            gte: startOfDay, 
            lte: endOfDay 
          } 
        };
      case 'not_equals':
        const startOfDay2 = new Date(dateValue);
        startOfDay2.setHours(0, 0, 0, 0);
        const endOfDay2 = new Date(dateValue);
        endOfDay2.setHours(23, 59, 59, 999);
        // not_equals: NOT (date >= startOfDay AND date <= endOfDay) = (date < startOfDay OR date > endOfDay)
        return { 
          OR: [
            { dateValue: { lt: startOfDay2 } },
            { dateValue: { gt: endOfDay2 } }
          ]
        };
      case 'before':
        return { dateValue: { lt: dateValue } };
      case 'after':
        return { dateValue: { gt: dateValue } };
      case 'today':
        return this.buildTodayCondition();
      case 'yesterday':
        return this.buildYesterdayCondition();
      case 'this_week':
        return this.buildThisWeekCondition();
      case 'last_week':
        return this.buildLastWeekCondition();
      case 'this_month':
        return this.buildThisMonthCondition();
      case 'last_month':
        return this.buildLastMonthCondition();
      case 'this_year':
        return this.buildThisYearCondition();
      case 'last_year':
        return this.buildLastYearCondition();
      default:
        return null;
    }
  }

  /**
   * Build reference conditions
   */
  private buildReferenceCondition(operator: string, value: any): any {
    switch (operator) {
      case 'equals':
        return { 
          value: { 
            equals: Array.isArray(value) ? value : [value] 
          } 
        };
      case 'not_equals':
        return { 
          value: { 
            not: { 
              equals: Array.isArray(value) ? value : [value] 
            } 
          } 
        };
      default:
        return null;
    }
  }

  /**
   * Build custom array conditions
   */
  private buildCustomArrayCondition(operator: string, value: any): any {
    switch (operator) {
      case 'equals':
        return { value: { equals: value } };
      case 'not_equals':
        return { value: { not: { equals: value } } };
      default:
        return null;
    }
  }

  /**
   * Build JSON conditions (fallback)
   */
  private buildJsonCondition(operator: string, value: any): any {
    switch (operator) {
      case 'equals':
        return { value: { equals: value } };
      case 'not_equals':
        return { value: { not: { equals: value } } };
      case 'contains':
        return { value: { path: [], string_contains: value } };
      case 'not_contains':
        return { value: { not: { path: [], string_contains: value } } };
      case 'starts_with':
        return { value: { path: [], string_starts_with: value } };
      case 'ends_with':
        return { value: { path: [], string_ends_with: value } };
      case 'regex':
        // Use contains as fallback for regex in JSON
        return { value: { path: [], string_contains: value } };
      case 'is_empty':
        return { value: { equals: Prisma.JsonNull } };
      case 'is_not_empty':
        return { value: { not: { equals: Prisma.JsonNull } } };
      default:
        return null;
    }
  }

  // Date helper methods
  private buildTodayCondition(): any {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return { dateValue: { gte: startOfDay, lt: endOfDay } };
  }

  private buildYesterdayCondition(): any {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
    return { dateValue: { gte: startOfDay, lt: endOfDay } };
  }

  private buildThisWeekCondition(): any {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return { dateValue: { gte: startOfWeek, lt: endOfWeek } };
  }

  private buildThisMonthCondition(): any {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { dateValue: { gte: startOfMonth, lt: endOfMonth } };
  }

  private buildThisYearCondition(): any {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    return { dateValue: { gte: startOfYear, lt: endOfYear } };
  }

  private buildLastWeekCondition(): any {
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    const startOfLastWeek = new Date(lastWeek);
    startOfLastWeek.setDate(lastWeek.getDate() - lastWeek.getDay());
    startOfLastWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
    return { dateValue: { gte: startOfLastWeek, lt: endOfLastWeek } };
  }

  private buildLastMonthCondition(): any {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateValue: { gte: lastMonth, lt: endOfLastMonth } };
  }

  private buildLastYearCondition(): any {
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear(), 0, 1);
    return { dateValue: { gte: lastYear, lt: endOfLastYear } };
  }

  // Utility methods
  private isValidFilter(filter: FilterConfig): boolean {
    if (!filter || !filter.columnId || !filter.operator || !filter.columnType) {
      return false;
    }

    // Check if column exists in table columns
    const columnExists = this.tableColumns.some(col => col.id === filter.columnId);
    if (!columnExists) {
      return false;
    }

    // For operators that don't require values, allow null/undefined
    const operatorsWithoutValues = ['is_empty', 'is_not_empty', 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year'];
    if (operatorsWithoutValues.includes(filter.operator)) {
      return true;
    }

    // For other operators, require a value
    return filter.value !== null && filter.value !== undefined && filter.value !== '';
  }

  private isNumericColumn(columnType: string): boolean {
    return ['number', 'integer', 'decimal'].includes(columnType);
  }

  private isDateColumn(columnType: string): boolean {
    return ['date', 'datetime', 'time'].includes(columnType);
  }

  /**
   * Check if operator is valid for column type
   */
  private isOperatorValid(operator: string, columnType: string): boolean {
    const { OPERATOR_COMPATIBILITY } = require('@/types/filtering');
    const validOperators = OPERATOR_COMPATIBILITY[columnType];
    return validOperators ? validOperators.includes(operator) : false;
  }
}
