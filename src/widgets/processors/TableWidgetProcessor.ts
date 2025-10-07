import { z } from "zod";

// ============================================================================
// TYPE DEFINITIONS - Strict TypeScript interfaces
// ============================================================================

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  databaseId: number;
  tableId: string;
}

/**
 * Column aggregation configuration
 */
export interface ColumnAggregation {
  column: string;
  aggregations: Array<{
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
    label: string;
  }>;
}

/**
 * Table aggregation configuration
 */
export interface TableAggregationConfig {
  enabled: boolean;
  groupBy?: string;
  columns: ColumnAggregation[];
  showSummaryRow: boolean;
  showGroupTotals: boolean;
}

/**
 * Complete table configuration
 */
export interface TableConfig {
  dataSource: DataSourceConfig;
  aggregation: TableAggregationConfig;
  filters: FilterConfig[];
  pagination?: {
    enabled: boolean;
    pageSize: number;
  };
  sorting?: {
    enabled: boolean;
    defaultColumn?: string;
    defaultDirection?: 'asc' | 'desc';
  };
  refresh?: {
    enabled: boolean;
    interval: number;
  };
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
  value: string | number | boolean | Date;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Raw data row from API
 */
export interface RawDataRow {
  cells: Array<{
    column: { name: string };
    value: any;
  }>;
}

/**
 * Normalized data row
 */
export interface NormalizedRow {
  [columnName: string]: any;
}

/**
 * Aggregated row (for grouped data)
 */
export interface AggregatedRow {
  [columnName: string]: any;
  _groupKey?: string;
  _count?: number;
}

/**
 * Table processing result
 */
export interface TableResult {
  data: (NormalizedRow | AggregatedRow)[];
  summary?: {
    [columnName: string]: {
      [aggregationFunction: string]: number;
    };
  };
  totalRows: number;
  groupedRows?: number;
}

// ============================================================================
// VALIDATION SCHEMAS - Using Zod for runtime validation
// ============================================================================

export const columnAggregationSchema = z.object({
  column: z.string().min(1, "Column is required"),
  aggregations: z.array(z.object({
    function: z.enum(["sum", "avg", "count", "min", "max", "first", "last"]),
    label: z.string().min(1, "Aggregation label is required"),
  })).min(1, "At least one aggregation is required"),
});

export const tableAggregationConfigSchema = z.object({
  enabled: z.boolean(),
  groupBy: z.string().optional(),
  columns: z.array(columnAggregationSchema).min(1, "At least one column aggregation is required"),
  showSummaryRow: z.boolean(),
  showGroupTotals: z.boolean(),
});

export const tableConfigSchema = z.object({
  dataSource: z.object({
    databaseId: z.number().positive(),
    tableId: z.string().min(1),
  }),
  aggregation: tableAggregationConfigSchema,
  filters: z.array(z.object({
    column: z.string(),
    operator: z.enum(["=", "!=", ">", "<", ">=", "<=", "contains", "startsWith", "endsWith"]),
    value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
  })),
  pagination: z.object({
    enabled: z.boolean(),
    pageSize: z.number().int().positive().max(1000),
  }).optional(),
  sorting: z.object({
    enabled: z.boolean(),
    defaultColumn: z.string().optional(),
    defaultDirection: z.enum(["asc", "desc"]).optional(),
  }).optional(),
  refresh: z.object({
    enabled: z.boolean(),
    interval: z.number().int().positive(),
  }).optional(),
});

// ============================================================================
// TABLE DATA PROCESSOR CLASS
// ============================================================================

export class TableWidgetProcessor {
  /**
   * Validates table configuration using Zod schema
   */
  static validate(config: TableConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate using Zod schema
      tableConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Additional business logic validations
    if (config.aggregation.enabled && config.aggregation.columns.length > 10) {
      warnings.push('More than 10 aggregation columns may impact performance');
    }

    // Check for duplicate column aggregations
    const columnNames = config.aggregation.columns.map(col => col.column);
    const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate column aggregations: ${duplicates.join(', ')}`);
    }

    // Validate groupBy column exists in aggregation columns
    if (config.aggregation.enabled && config.aggregation.groupBy) {
      const groupByColumn = config.aggregation.columns.find(col => col.column === config.aggregation.groupBy);
      if (!groupByColumn) {
        errors.push('Group by column must be included in aggregation columns');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Gets suggested configuration based on available columns
   */
  static getSuggestedConfig(columns: Array<{ name: string; type: string }>): Partial<TableConfig> {
    const numericColumns = columns.filter(col => 
      ['number', 'integer', 'decimal', 'float', 'double'].includes(col.type)
    );

    if (numericColumns.length === 0) {
      return {
        aggregation: {
          enabled: false,
          columns: [],
          showSummaryRow: false,
          showGroupTotals: false,
        },
      };
    }

    // Suggest aggregations for numeric columns
    const suggestedColumns: ColumnAggregation[] = numericColumns.slice(0, 5).map(column => ({
      column: column.name,
      aggregations: [
        { function: 'sum' as const, label: 'Total' },
        { function: 'avg' as const, label: 'Average' },
      ],
    }));

    return {
      aggregation: {
        enabled: true,
        columns: suggestedColumns,
        showSummaryRow: true,
        showGroupTotals: false,
      },
      pagination: {
        enabled: true,
        pageSize: 50,
      },
      sorting: {
        enabled: true,
      },
    };
  }

  /**
   * Processes raw data through the table pipeline
   */
  static process(rawData: RawDataRow[], config: TableConfig): TableResult {
    console.log('🚀 [TableWidgetProcessor] Starting data processing pipeline...');

    // Step 1: Normalize data
    const normalizedData = this.normalizeData(rawData);
    if (normalizedData.length === 0) {
      console.log('❌ [TableWidgetProcessor] No data to process');
      return { data: [], totalRows: 0 };
    }

    // Step 2: Apply filters (already done at API level)
    console.log('✅ [TableWidgetProcessor] Filters applied at API level');

    // Step 3: Process aggregation if enabled
    let processedData: (NormalizedRow | AggregatedRow)[] = normalizedData;
    let summary: any = undefined;

    if (config.aggregation.enabled) {
      if (config.aggregation.groupBy) {
        // Grouped aggregation
        processedData = this.processGroupedAggregation(normalizedData, config.aggregation);
      } else {
        // Simple aggregation (summary row only)
        processedData = normalizedData;
        if (config.aggregation.showSummaryRow) {
          summary = this.calculateSummaryRow(normalizedData, config.aggregation.columns);
        }
      }
    }

    console.log(`✅ [TableWidgetProcessor] Processing complete: ${processedData.length} rows`);
    
    return {
      data: processedData,
      summary,
      totalRows: normalizedData.length,
      groupedRows: config.aggregation.enabled && config.aggregation.groupBy ? processedData.length : undefined,
    };
  }

  /**
   * Step 1: Normalize raw API data to key-value objects
   */
  private static normalizeData(rawData: RawDataRow[]): NormalizedRow[] {
    console.log('📋 [Step 1: Normalize] Converting raw data...');

    if (!rawData || !Array.isArray(rawData)) {
      console.warn('⚠️ [Step 1: Normalize] Invalid data provided');
      return [];
    }

    return rawData.map((row, index) => {
      const normalized: NormalizedRow = {};

      if (row.cells && Array.isArray(row.cells)) {
        row.cells.forEach((cell) => {
          if (cell.column && cell.column.name) {
            normalized[cell.column.name] = cell.value;
          }
        });
      }

      return normalized;
    });
  }

  /**
   * Process grouped aggregation
   */
  private static processGroupedAggregation(
    data: NormalizedRow[], 
    config: TableAggregationConfig
  ): AggregatedRow[] {
    console.log('🔄 [Step 3: Grouped Aggregation] Processing grouped data...');

    if (!config.groupBy) {
      return data;
    }

    // Group data by the specified column
    const groups = new Map<string, NormalizedRow[]>();
    
    data.forEach(row => {
      const groupKey = String(row[config.groupBy!] || 'Unknown');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    });

    // Aggregate each group
    const aggregatedRows: AggregatedRow[] = [];
    
    groups.forEach((groupRows, groupKey) => {
      const aggregatedRow: AggregatedRow = {
        [config.groupBy!]: groupKey,
        _groupKey: groupKey,
        _count: groupRows.length,
      };

      // Calculate aggregations for each configured column
      config.columns.forEach(colConfig => {
        // Use multiple aggregations method for complex queries
        // Apply chained aggregations (pipeline)
        const finalValue = this.calculateChainedAggregations(groupRows, colConfig.column, colConfig.aggregations);
        
        // Use the final aggregation label
        const finalAggLabel = colConfig.aggregations[colConfig.aggregations.length - 1].function;
        aggregatedRow[`${colConfig.column}_${finalAggLabel}`] = finalValue;
        // Also add with just column name for easier access
        aggregatedRow[colConfig.column] = finalValue;
      });

      aggregatedRows.push(aggregatedRow);
    });

    return aggregatedRows;
  }

  /**
   * Calculate summary row for all data
   */
  private static calculateSummaryRow(
    data: NormalizedRow[], 
    columns: ColumnAggregation[]
  ): any {
    console.log('📊 [Step 3: Summary] Calculating summary row...');

    const summary: any = {};

    columns.forEach(colConfig => {
      // Apply chained aggregations (pipeline) and get final result
      const finalValue = this.calculateChainedAggregations(data, colConfig.column, colConfig.aggregations);
      
      if (!summary[colConfig.column]) {
        summary[colConfig.column] = {};
      }
      
      // Store final result with the last aggregation function name
      const finalAggFunction = colConfig.aggregations[colConfig.aggregations.length - 1].function;
      summary[colConfig.column][finalAggFunction] = finalValue;
      // Also store as "value" for easier access
      summary[colConfig.column].value = finalValue;
    });

    return summary;
  }

  /**
   * Calculate aggregation for a specific field and function
   */
  private static calculateAggregation(
    data: NormalizedRow[], 
    field: string, 
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last'
  ): number | string | any {
    const values = this.extractValues(data, field);
    
    if (values.length === 0) {
      return aggregation === 'count' ? 0 : (aggregation === 'first' || aggregation === 'last' ? null : 0);
    }

    switch (aggregation) {
      case 'sum':
        return values.filter(v => typeof v === 'number').reduce((sum, val) => sum + val, 0);
      case 'avg':
        const numericValues = values.filter(v => typeof v === 'number');
        return numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
      case 'count':
        return values.length;
      case 'min':
        return typeof values[0] === 'number' ? Math.min(...values.filter(v => typeof v === 'number')) : values[0];
      case 'max':
        return typeof values[0] === 'number' ? Math.max(...values.filter(v => typeof v === 'number')) : values[values.length - 1];
      case 'first':
        return values[0];
      case 'last':
        return values[values.length - 1];
      default:
        return 0;
    }
  }

  /**
   * Calculate independent aggregations for a column
   * Each aggregation is applied to the original data independently
   * Example: [100, 200, 300] → SUM(600), AVG(200), MAX(300) (all independent)
   */
  private static calculateChainedAggregations(
    data: NormalizedRow[], 
    field: string, 
    aggregations: Array<{ function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last'; label: string }>
  ): number | string | any {
    console.log(`🔗 [Table Chained Aggregations] Processing ${aggregations.length} aggregations in cascade on column: ${field}`);
    
    // Extract initial values
    const initialValues = this.extractValues(data, field);
    
    // Start with array of values or data, chain through aggregations
    let currentValue: any = initialValues;
    let currentData: NormalizedRow[] | null = data; // Keep data reference for first/last
    const results: any[] = [];

    aggregations.forEach((agg, index) => {
      const isFirstStep = index === 0;
      const inputDescription = isFirstStep 
        ? `${data.length} original rows` 
        : `result from previous step`;
      
      console.log(`   Step ${index + 1}: ${agg.function.toUpperCase()} on ${inputDescription}`);
      
      // Apply aggregation to current value(s) or data
      let result: any;
      if (isFirstStep) {
        // First step: use original data
        result = this.calculateAggregation(currentData!, field, agg.function);
      } else {
        // Subsequent steps: operate on previous result
        if (Array.isArray(currentValue)) {
          // Still have array of values, aggregate it
          result = this.applyAggregationOnArray(currentValue, agg.function);
        } else {
          // Already a single value from previous step
          result = currentValue; // Pass through single values
        }
      }
      
      console.log(`   ↳ Input: ${isFirstStep ? `[${data.length} rows]` : (Array.isArray(currentValue) ? `[${currentValue.length} values]` : currentValue)}`);
      console.log(`   ↳ Output: ${result}`);
      
      results.push(result);
      
      // Update current value for next step
      currentValue = result;
      currentData = null; // After first step, work with values not data
    });

    // Return the last aggregation result as the primary value
    return results[results.length - 1];
  }
  
  /**
   * Helper: Apply aggregation function directly to array of values
   */
  private static applyAggregationOnArray(values: any[], func: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last'): number | any {
    if (!values || values.length === 0) return 0;
    
    switch (func) {
      case 'sum':
        return values.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
      case 'avg':
        const numericValues = values.filter(v => typeof v === 'number');
        return numericValues.length > 0 
          ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length 
          : 0;
      case 'count':
        return values.length;
      case 'min':
        const numericMin = values.filter(v => typeof v === 'number');
        return numericMin.length > 0 ? Math.min(...numericMin) : 0;
      case 'max':
        const numericMax = values.filter(v => typeof v === 'number');
        return numericMax.length > 0 ? Math.max(...numericMax) : 0;
      case 'first':
        return values[0] ?? 0;
      case 'last':
        return values[values.length - 1] ?? 0;
      default:
        return 0;
    }
  }

  /**
   * Helper: Extract values from rows for a column
   */
  private static extractValues(rows: NormalizedRow[], columnName: string): any[] {
    return rows
      .map(row => {
        const value = row[columnName];
        if (value === null || value === undefined) return null;
        
        // For numeric values, ensure integers stay integers
        if (typeof value === 'number') {
          return value;
        }
        
        // Parse string to number if it looks numeric
        const strValue = String(value).trim();
        if (/^\d+$/.test(strValue)) {
          // Integer string → return as integer
          return parseInt(strValue, 10);
        } else if (/^\d+\.\d+$/.test(strValue)) {
          // Decimal string → return as float
          return parseFloat(strValue);
        }
        
        // Non-numeric value, return as-is
        return value;
      })
      .filter(value => value !== null && value !== undefined);
  }

  /**
   * Apply sorting to data
   */
  static applySorting(
    data: (NormalizedRow | AggregatedRow)[], 
    column: string, 
    direction: 'asc' | 'desc'
  ): (NormalizedRow | AggregatedRow)[] {
    return [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Apply pagination to data
   */
  static applyPagination(
    data: (NormalizedRow | AggregatedRow)[], 
    page: number, 
    pageSize: number
  ): (NormalizedRow | AggregatedRow)[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }
}
