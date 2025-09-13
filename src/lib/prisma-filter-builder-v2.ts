/**
 * Optimized Prisma filter builder v2
 * Uses parameterized SQL queries for proper JSON field handling
 */

import { FilterConfig, ColumnType } from '@/types/filtering-enhanced';
import { FilterValidator } from './filter-validator';
import { ValueCoercion } from './value-coercion';
import prisma from './prisma';

export interface FilterQueryResult {
  whereClause: any;
  parameters: any[];
  postProcessFilters: Array<{
    columnId: number;
    operator: string;
    value: any;
    columnType: string;
  }>;
  hasPostProcessFilters: boolean;
}

export class PrismaFilterBuilderV2 {
  private tableId: number;
  private tableColumns: any[];
  private parameters: any[] = [];
  private parameterIndex = 1;
  private postProcessFilters: Array<{
    columnId: number;
    operator: string;
    value: any;
    columnType: string;
  }> = [];

  constructor(tableId: number, tableColumns: any[]) {
    this.tableId = tableId;
    this.tableColumns = tableColumns;
  }

  /**
   * Add global search to the where clause
   */
  addGlobalSearch(searchTerm: string): this {
    if (!searchTerm || !searchTerm.trim()) {
      return this;
    }

    const trimmedSearch = searchTerm.trim();
    const paramIndex = this.getNextParameterIndex();
    this.parameters.push(`%${trimmedSearch}%`);

    // Add global search condition using raw SQL
    this.addRawCondition(`EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."value"#>>'{}' ILIKE $${paramIndex}
    )`);

    return this;
  }

  /**
   * Add column filters to the where clause
   */
  addColumnFilters(filters: FilterConfig[]): this {
    if (!filters || filters.length === 0) {
      return this;
    }

    const validFilters = filters.filter(filter => this.isValidFilter(filter));
    
    if (validFilters.length === 0) {
      return this;
    }

    for (const filter of validFilters) {
      this.addSingleFilter(filter);
    }

    return this;
  }

  /**
   * Add a single filter condition
   */
  private addSingleFilter(filter: FilterConfig): void {
    const { columnId, operator, value, secondValue, columnType } = filter;
    
    // Convert values to correct types
    const convertedValue = FilterValidator.convertFilterValue(value, columnType as ColumnType);
    const convertedSecondValue = secondValue ? 
      FilterValidator.convertFilterValue(secondValue, columnType as ColumnType) : null;

    // Handle empty value filters
    if (['is_empty', 'is_not_empty'].includes(operator)) {
      this.addEmptyValueCondition(columnId, operator);
      return;
    }

    // Handle range filters
    if (['between', 'not_between'].includes(operator)) {
      this.addRangeCondition(columnId, operator, convertedValue, convertedSecondValue, columnType);
      return;
    }

    // Handle date filters
    if (this.isDateColumn(columnType)) {
      this.addDateCondition(columnId, operator, convertedValue, columnType);
      return;
    }

    // Handle numeric filters
    if (this.isNumericColumn(columnType)) {
      this.addNumericCondition(columnId, operator, convertedValue, columnType);
      return;
    }

    // Handle text filters
    if (this.isTextColumn(columnType)) {
      this.addTextCondition(columnId, operator, convertedValue, columnType);
      return;
    }

    // Handle boolean filters
    if (this.isBooleanColumn(columnType)) {
      this.addBooleanCondition(columnId, operator, convertedValue, columnType);
      return;
    }

    // Handle reference filters
    if (this.isReferenceColumn(columnType)) {
      this.addReferenceCondition(columnId, operator, convertedValue, columnType);
      return;
    }

    console.warn(`Unsupported column type: ${columnType} for filter:`, filter);
  }

  /**
   * Add empty value conditions
   */
  private addEmptyValueCondition(columnId: number, operator: string): void {
    const isEmpty = operator === 'is_empty';
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${this.getNextParameterIndex()}
      AND (
        ${isEmpty ? '' : 'NOT ('}
        c."value" IS NULL 
        OR c."value" = 'null'::jsonb
        OR c."value" = '""'::jsonb
        OR c."value" = '""'::jsonb
        ${isEmpty ? '' : ')'}
      )
    )`;
    
    this.parameters.push(columnId);
    this.addRawCondition(condition);
  }

  /**
   * Add range conditions
   */
  private addRangeCondition(columnId: number, operator: string, value: any, secondValue: any, columnType: string): void {
    const isBetween = operator === 'between';
    const param1Index = this.getNextParameterIndex();
    const param2Index = this.getNextParameterIndex();
    const columnIdParam = this.getNextParameterIndex();
    
    this.parameters.push(columnId);
    this.parameters.push(value);
    this.parameters.push(secondValue);

    let castExpression: string;
    if (this.isNumericColumn(columnType)) {
      castExpression = '(c."value"#>>\'{}\')::numeric';
    } else if (this.isDateColumn(columnType)) {
      castExpression = 'c."value"#>>\'{}\'';
    } else {
      castExpression = 'c."value"#>>\'{}\'';
    }

    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND ${castExpression} ${isBetween ? 'BETWEEN' : 'NOT BETWEEN'} $${param1Index}::numeric AND $${param2Index}::numeric
    )`;
    
    this.addRawCondition(condition);
  }

  /**
   * Add date conditions
   */
  private addDateCondition(columnId: number, operator: string, value: any, columnType: string): void {
    const columnIdParam = this.getNextParameterIndex();
    this.parameters.push(columnId);

    switch (operator) {
      case 'equals':
        this.addDateEqualsCondition(columnIdParam, value);
        break;
      case 'not_equals':
        this.addDateNotEqualsCondition(columnIdParam, value);
        break;
      case 'before':
        this.addDateBeforeCondition(columnIdParam, value);
        break;
      case 'after':
        this.addDateAfterCondition(columnIdParam, value);
        break;
      case 'today':
        this.addDateTodayCondition(columnIdParam);
        break;
      case 'yesterday':
        this.addDateYesterdayCondition(columnIdParam);
        break;
      case 'this_week':
        this.addDateThisWeekCondition(columnIdParam);
        break;
      case 'this_month':
        this.addDateThisMonthCondition(columnIdParam);
        break;
      case 'this_year':
        this.addDateThisYearCondition(columnIdParam);
        break;
      case 'last_week':
        this.addDateLastWeekCondition(columnIdParam);
        break;
      case 'last_month':
        this.addDateLastMonthCondition(columnIdParam);
        break;
      case 'last_year':
        this.addDateLastYearCondition(columnIdParam);
        break;
      default:
        console.warn(`Unsupported date operator: ${operator}`);
    }
  }

  /**
   * Add numeric conditions
   */
  private addNumericCondition(columnId: number, operator: string, value: any, columnType: string): void {
    const columnIdParam = this.getNextParameterIndex();
    const valueParam = this.getNextParameterIndex();
    
    this.parameters.push(columnId);
    this.parameters.push(value);

    const sqlOperator = ValueCoercion.getSqlOperator(operator, columnType as ColumnType);
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND (c."value"#>>'{}')::numeric ${sqlOperator} $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  /**
   * Add text conditions
   */
  private addTextCondition(columnId: number, operator: string, value: any, columnType: string): void {
    const columnIdParam = this.getNextParameterIndex();
    this.parameters.push(columnId);

    switch (operator) {
      case 'contains':
        this.addTextContainsCondition(columnIdParam, value);
        break;
      case 'not_contains':
        this.addTextNotContainsCondition(columnIdParam, value);
        break;
      case 'equals':
        this.addTextEqualsCondition(columnIdParam, value);
        break;
      case 'not_equals':
        this.addTextNotEqualsCondition(columnIdParam, value);
        break;
      case 'starts_with':
        this.addTextStartsWithCondition(columnIdParam, value);
        break;
      case 'ends_with':
        this.addTextEndsWithCondition(columnIdParam, value);
        break;
      case 'regex':
        this.addTextRegexCondition(columnIdParam, value);
        break;
      default:
        console.warn(`Unsupported text operator: ${operator}`);
    }
  }

  /**
   * Add boolean conditions
   */
  private addBooleanCondition(columnId: number, operator: string, value: any, columnType: string): void {
    const columnIdParam = this.getNextParameterIndex();
    const valueParam = this.getNextParameterIndex();
    
    this.parameters.push(columnId);
    this.parameters.push(value);

    const sqlOperator = operator === 'equals' ? '=' : '!=';
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"::boolean ${sqlOperator} $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  /**
   * Add reference conditions
   */
  private addReferenceCondition(columnId: number, operator: string, value: any, columnType: string): void {
    const columnIdParam = this.getNextParameterIndex();
    this.parameters.push(columnId);

    if (operator === 'equals') {
      this.addReferenceEqualsCondition(columnIdParam, value);
    } else if (operator === 'not_equals') {
      this.addReferenceNotEqualsCondition(columnIdParam, value);
    }
  }

  // Helper methods for specific conditions
  private addTextContainsCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(`%${value}%`);
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' ILIKE $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addTextNotContainsCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(`%${value}%`);
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' NOT ILIKE $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addTextEqualsCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(value);
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' = $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addTextNotEqualsCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(value);
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' != $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addTextStartsWithCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(`${value}%`);
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' ILIKE $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addTextEndsWithCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(`%${value}`);
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' ILIKE $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addTextRegexCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(value);
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' ~ $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addReferenceEqualsCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(JSON.stringify(value));
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND (c."value" @> $${valueParam}::jsonb OR c."value" = $${valueParam}::jsonb)
    )`;
    
    this.addRawCondition(condition);
  }

  private addReferenceNotEqualsCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(JSON.stringify(value));
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND NOT (c."value" @> $${valueParam}::jsonb OR c."value" = $${valueParam}::jsonb)
    )`;
    
    this.addRawCondition(condition);
  }

  // Date condition helpers
  private addDateEqualsCondition(columnIdParam: number, value: any): void {
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    const startDate = new Date(value);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    this.parameters.push(startDate.toISOString());
    this.parameters.push(endDate.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateNotEqualsCondition(columnIdParam: number, value: any): void {
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    const startDate = new Date(value);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    this.parameters.push(startDate.toISOString());
    this.parameters.push(endDate.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND NOT (c."value"#>>'{}' >= $${startParam} AND c."value"#>>'{}' < $${endParam})
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateBeforeCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(new Date(value).toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' < $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateAfterCondition(columnIdParam: number, value: any): void {
    const valueParam = this.getNextParameterIndex();
    this.parameters.push(new Date(value).toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' > $${valueParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateTodayCondition(columnIdParam: number): void {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    this.parameters.push(startOfDay.toISOString());
    this.parameters.push(endOfDay.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateYesterdayCondition(columnIdParam: number): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
    
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    this.parameters.push(startOfDay.toISOString());
    this.parameters.push(endOfDay.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateThisWeekCondition(columnIdParam: number): void {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    this.parameters.push(startOfWeek.toISOString());
    this.parameters.push(endOfWeek.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateThisMonthCondition(columnIdParam: number): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    this.parameters.push(startOfMonth.toISOString());
    this.parameters.push(endOfMonth.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateThisYearCondition(columnIdParam: number): void {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    this.parameters.push(startOfYear.toISOString());
    this.parameters.push(endOfYear.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateLastWeekCondition(columnIdParam: number): void {
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    const startOfLastWeek = new Date(lastWeek);
    startOfLastWeek.setDate(lastWeek.getDate() - lastWeek.getDay());
    startOfLastWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
    
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    this.parameters.push(startOfLastWeek.toISOString());
    this.parameters.push(endOfLastWeek.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateLastMonthCondition(columnIdParam: number): void {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    this.parameters.push(lastMonth.toISOString());
    this.parameters.push(endOfLastMonth.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  private addDateLastYearCondition(columnIdParam: number): void {
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear(), 0, 1);
    
    const startParam = this.getNextParameterIndex();
    const endParam = this.getNextParameterIndex();
    
    this.parameters.push(lastYear.toISOString());
    this.parameters.push(endOfLastYear.toISOString());
    
    const condition = `EXISTS (
      SELECT 1 FROM "Cell" c 
      WHERE c."rowId" = "Row"."id" 
      AND c."columnId" = $${columnIdParam}
      AND c."value"#>>'{}' >= $${startParam}
      AND c."value"#>>'{}' < $${endParam}
    )`;
    
    this.addRawCondition(condition);
  }

  // Utility methods
  private addRawCondition(condition: string): void {
    if (!this.rawConditions) {
      this.rawConditions = [];
    }
    this.rawConditions.push(condition);
  }

  private getNextParameterIndex(): number {
    return this.parameterIndex++;
  }

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

  private isDateColumn(columnType: string): boolean {
    return ['date', 'datetime', 'time'].includes(columnType);
  }

  private isNumericColumn(columnType: string): boolean {
    return ['number', 'integer', 'decimal'].includes(columnType);
  }

  private isTextColumn(columnType: string): boolean {
    return ['text', 'string', 'email', 'url'].includes(columnType);
  }

  private isBooleanColumn(columnType: string): boolean {
    return columnType === 'boolean';
  }

  private isReferenceColumn(columnType: string): boolean {
    return columnType === 'reference';
  }

  // Public properties
  private rawConditions: string[] = [];

  /**
   * Get the final where clause for Prisma
   */
  getWhereClause(): any {
    const baseWhere = { tableId: this.tableId };
    
    if (this.rawConditions.length === 0) {
      return baseWhere;
    }

    // Use raw SQL for complex filtering
    return {
      tableId: this.tableId,
      // This will be handled by the API route using raw SQL
      _rawConditions: this.rawConditions,
      _parameters: this.parameters
    };
  }

  /**
   * Get parameters for raw SQL query
   */
  getParameters(): any[] {
    return this.parameters;
  }

  /**
   * Get raw SQL conditions
   */
  getRawConditions(): string[] {
    return this.rawConditions;
  }

  /**
   * Build complete SQL query
   */
  buildSqlQuery(): { sql: string; parameters: any[] } {
    if (this.rawConditions.length === 0) {
      return {
        sql: 'SELECT * FROM "Row" WHERE "tableId" = $1',
        parameters: [this.tableId]
      };
    }

    const conditions = this.rawConditions.join(' AND ');
    const sql = `SELECT * FROM "Row" WHERE "tableId" = $1 AND ${conditions}`;
    
    return {
      sql,
      parameters: [this.tableId, ...this.parameters]
    };
  }

  /**
   * Get post-process filters that need to be applied after Prisma query
   */
  getPostProcessFilters(): Array<{
    columnId: number;
    operator: string;
    value: any;
    columnType: string;
  }> {
    return this.postProcessFilters;
  }

  /**
   * Check if there are any post-process filters
   */
  hasPostProcessFilters(): boolean {
    return this.postProcessFilters.length > 0;
  }

  /**
   * Apply post-process filters to the results
   */
  applyPostProcessFilters(rows: any[]): any[] {
    if (this.postProcessFilters.length === 0) {
      return rows;
    }

    return rows.filter(row => {
      return this.postProcessFilters.every(filter => {
        const cell = row.cells?.find((c: any) => c.columnId === filter.columnId);
        if (!cell) return false;

        const cellValue = String(cell.value || '');
        const filterValue = String(filter.value || '');

        switch (filter.operator) {
          case 'starts_with':
            return cellValue.startsWith(filterValue);
          case 'ends_with':
            return cellValue.endsWith(filterValue);
          default:
            return true;
        }
      });
    });
  }
}
