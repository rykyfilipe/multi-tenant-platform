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
 * Column mapping configuration
 */
export interface ColumnMappings {
  x: string; // X-axis column (category/label)
  y: string[]; // Y-axis columns (values) - multi-select support
}

/**
 * Data processing configuration (SIMPLIFIED)
 * Automatic grouping by X axis when aggregations are configured
 */
export interface ProcessingConfig {
  // Chained aggregations per Y column (e.g., { "revenue": [SUM, AVG, MAX] })
  // If configured, automatically groups by X axis
  yColumnAggregations?: Record<string, Array<{
    function: 'sum' | 'avg' | 'count' | 'min' | 'max';
    label: string;
  }>>;
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
 * Top N configuration
 */
export interface TopNConfig {
  enabled: boolean;
  count: number;
  autoSort: boolean; // Auto-sort on first Y column
}

/**
 * Complete chart configuration
 */
export interface ChartConfig {
  dataSource: DataSourceConfig;
  mappings: ColumnMappings;
  processing: ProcessingConfig;
  filters: FilterConfig[];
  topN?: TopNConfig;
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
 * Chart data point ready for visualization
 */
export interface ChartDataPoint {
  name: string;
  [dataKey: string]: any;
}

// ============================================================================
// VALIDATION SCHEMAS - Using Zod for runtime validation
// ============================================================================

export const chartConfigSchema = z.object({
  dataSource: z.object({
    databaseId: z.number().positive(),
    tableId: z.string().min(1),
  }),
  mappings: z.object({
    x: z.string().min(1, "X axis is required"),
    y: z.array(z.string()).min(1, "At least one Y axis column is required"),
  }),
  processing: z.object({
    // Chained aggregations per Y column
    // Automatically groups by X axis when configured
    yColumnAggregations: z.record(
      z.string(),
      z.array(z.object({
        function: z.enum(["sum", "avg", "count", "min", "max"]),
        label: z.string().min(1),
      }))
    ).optional(),
  }),
  filters: z.array(z.object({
    column: z.string(),
    operator: z.enum(["=", "!=", ">", "<", ">=", "<=", "contains", "startsWith", "endsWith"]),
    value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
  })),
  topN: z.object({
    enabled: z.boolean(),
    count: z.number().int().positive().max(100),
    autoSort: z.boolean(),
  }).optional(),
});

// ============================================================================
// CHART DATA PROCESSOR CLASS
// ============================================================================

export class ChartDataProcessor {
  /**
   * Validates chart configuration using Zod schema
   */
  static validate(config: ChartConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate using Zod schema
      chartConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Additional business logic validations
    if (config.topN?.enabled && config.topN.count > 50) {
      warnings.push('Large Top N count may impact performance');
    }

    // Warn about complex aggregation pipelines
    if (config.processing.yColumnAggregations) {
      Object.entries(config.processing.yColumnAggregations).forEach(([column, aggs]) => {
        if (aggs.length > 5) {
          warnings.push(`Column "${column}" has ${aggs.length} chained aggregations - may be hard to interpret`);
        }
      });
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
  static getSuggestedConfig(columns: Array<{ name: string; type: string }>): Partial<ChartConfig> {
    const textColumns = columns.filter(col => ['string', 'text', 'date'].includes(col.type));
    const numericColumns = columns.filter(col => ['number', 'integer', 'decimal', 'float', 'double'].includes(col.type));

    const suggestedX = textColumns[0]?.name;
    const suggestedY = numericColumns.slice(0, 3).map(col => col.name); // Suggest up to 3 numeric columns

    return {
      mappings: {
        x: suggestedX || '',
        y: suggestedY,
      },
      processing: {
        // Aggregations are optional - configured per Y column
        yColumnAggregations: undefined,
      },
      filters: [],
      topN: {
        enabled: false,
        count: 10,
        autoSort: true,
      },
    };
  }

  /**
   * Processes raw data through the SIMPLIFIED pipeline
   * AUTOMATIC grouping by X axis when aggregations are configured
   */
  static process(rawData: RawDataRow[], config: ChartConfig): ChartDataPoint[] {
    console.log('🚀 [ChartDataProcessor] Starting SIMPLIFIED processing pipeline...');

    // Step 1: Normalize data
    const normalizedData = this.normalizeData(rawData);
    if (normalizedData.length === 0) {
      console.log('❌ [ChartDataProcessor] No data to process');
      return [];
    }

    // Step 2: Apply filters (already done at API level)
    console.log('✅ [ChartDataProcessor] Filters applied at API level');

    // Step 3: Auto-detect if aggregation is needed
    const hasAggregations = config.processing.yColumnAggregations && 
      Object.keys(config.processing.yColumnAggregations).length > 0;

    let processedData: ChartDataPoint[];
    
    if (hasAggregations) {
      // AUTOMATIC grouping by X axis + apply aggregations
      console.log('📊 [Auto-Aggregation] Grouping by X axis:', config.mappings.x);
      processedData = this.processWithAggregations(normalizedData, config);
    } else {
      // RAW mode: simple pass-through
      console.log('📊 [Raw Mode] Pass-through data');
      processedData = this.processRawData(normalizedData, config);
    }

    // Step 4: Apply Top N if enabled
    if (config.topN?.enabled) {
      processedData = this.applyTopN(processedData, config);
    }

    console.log(`✅ [ChartDataProcessor] Processing complete: ${processedData.length} data points`);
    return processedData;
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
   * Step 3a: Process raw data (simple pass-through)
   */
  private static processRawData(data: NormalizedRow[], config: ChartConfig): ChartDataPoint[] {
    console.log('📊 [Raw Mode] Simple pass-through...');

    return data.map((row, index) => {
      const chartPoint: ChartDataPoint = {
        name: row[config.mappings.x] !== undefined 
          ? String(row[config.mappings.x])
          : `Row ${index + 1}`,
      };

      // Add all Y-axis columns as-is
      config.mappings.y.forEach(yColumn => {
        if (row[yColumn] !== undefined) {
          chartPoint[yColumn] = row[yColumn];
        }
      });

      return chartPoint;
    });
  }

  /**
   * Step 3b: Process with aggregations (AUTOMATIC grouping by X axis)
   */
  private static processWithAggregations(data: NormalizedRow[], config: ChartConfig): ChartDataPoint[] {
    console.log('📊 [Auto-Aggregation] Grouping by X axis and applying pipelines...');

    // AUTOMATIC grouping by X axis column
    const groupByColumn = config.mappings.x;
    console.log(`   Grouping by: ${groupByColumn}`);

    // Group data by X axis
    const grouped: Record<string, NormalizedRow[]> = {};
    data.forEach(row => {
      const groupKey = row[groupByColumn] !== undefined 
        ? String(row[groupByColumn])
        : '__NULL__';
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(row);
    });

    console.log(`   Created ${Object.keys(grouped).length} groups`);

    // Apply aggregation pipelines to each group
    const aggregated: ChartDataPoint[] = [];
    Object.entries(grouped).forEach(([groupKey, groupRows]) => {
      const chartPoint: ChartDataPoint = {
        name: groupKey === '__NULL__' ? 'N/A' : groupKey,
      };

      // Apply chained aggregations for each Y-axis column
      config.mappings.y.forEach(yColumn => {
        const values = this.extractNumericValues(groupRows, yColumn);
        const columnAggregations = config.processing.yColumnAggregations?.[yColumn];
        
        if (columnAggregations && columnAggregations.length > 0) {
          // Apply chained aggregations (pipeline)
          const finalValue = this.applyChainedAggregations(values, columnAggregations);
          chartPoint[yColumn] = finalValue;
        } else {
          // No pipeline configured - use simple SUM as default
          const sum = values.reduce((acc, val) => acc + val, 0);
          chartPoint[yColumn] = sum;
        }
      });

      aggregated.push(chartPoint);
    });

    return aggregated;
  }

  /**
   * Step 4: Apply Top N filtering
   */
  private static applyTopN(data: ChartDataPoint[], config: ChartConfig): ChartDataPoint[] {
    console.log('🔝 [Step 4: Top N] Applying Top N filtering...');

    if (!config.topN?.enabled) {
      return data;
    }

    // Determine sort column
    let sortColumn: string;
    if (config.topN.autoSort) {
      // Auto-sort on first Y column
      sortColumn = config.mappings.y[0];
    } else {
      // Use first available numeric column
      const numericColumns = Object.keys(data[0]).filter(key => 
        key !== 'name' && typeof data[0][key] === 'number'
      );
      sortColumn = numericColumns[0] || 'name';
    }

    // Sort data
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return bVal - aVal; // Descending by default
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return bVal.localeCompare(aVal);
      }
      
      return 0;
    });

    // Apply limit
    return sorted.slice(0, config.topN.count);
  }

  /**
   * Apply independent aggregations on array of values
   * Each aggregation is applied to the original values independently
   * Example: [100, 200, 300] → SUM(600), AVG(200), MAX(300) (all independent)
   */
  private static applyChainedAggregations(
    initialValues: number[],
    aggregations: Array<{ function: 'sum' | 'avg' | 'count' | 'min' | 'max'; label: string }>
  ): number {
    console.log(`🔗 [Independent Aggregations] Processing ${aggregations.length} aggregations on ${initialValues.length} values`);
    
    // Apply each aggregation independently to original values
    const results: number[] = [];
    
    aggregations.forEach((aggregation, index) => {
      console.log(`   Step ${index + 1}: ${aggregation.function.toUpperCase()} on ${initialValues.length} original values`);
      
      // Apply each aggregation independently to the original values
      const result = this.applyAggregationFunction(initialValues, aggregation.function);
      console.log(`   ↳ Result: ${result}`);
      results.push(result);
    });

    // Return the last aggregation result as the primary value
    return results[results.length - 1];
  }

  /**
   * Helper: Extract numeric values from rows for a column
   */
  private static extractNumericValues(rows: NormalizedRow[], columnName: string): number[] {
    return rows
      .map(row => {
        const value = row[columnName];
        if (value === null || value === undefined) return null;
        
        // If already a number, use it as-is
        if (typeof value === 'number') {
          return value;
        }
        
        // Parse string to number
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) return null;
        
        // If original value looks like an integer string, return integer
        if (/^\d+$/.test(String(value).trim())) {
          return Math.floor(numericValue);
        }
        
        return numericValue;
      })
      .filter((val): val is number => val !== null);
  }

  /**
   * Helper: Apply aggregation function to numeric values
   */
  private static applyAggregationFunction(values: number[], func: 'sum' | 'avg' | 'count' | 'min' | 'max'): number {
    if (!values.length) return 0;

    switch (func) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'count':
        return values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return 0;
    }
  }
}
