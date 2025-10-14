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
 * Date grouping configuration
 */
export interface DateGroupingConfig {
  enabled: boolean;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  column?: string; // Auto-detect if not specified
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
  // Date grouping for time-series
  dateGrouping?: DateGroupingConfig;
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
  sortColumn?: string; // Specific column to sort by (overrides autoSort)
  sortOrder?: 'asc' | 'desc'; // Sort order: ascending or descending
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
    sortColumn: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
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
        sortColumn: undefined,
        sortOrder: 'desc',
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
   * Step 3a: Process raw data (simple pass-through with numeric conversion)
   */
  private static processRawData(data: NormalizedRow[], config: ChartConfig): ChartDataPoint[] {
    console.log('📊 [Raw Mode] Simple pass-through with numeric conversion...');
    console.log(`   Processing ${data.length} rows with Y columns:`, config.mappings.y);

    const result = data.map((row, index) => {
      const chartPoint: ChartDataPoint = {
        name: row[config.mappings.x] !== undefined 
          ? String(row[config.mappings.x])
          : `Row ${index + 1}`,
      };

      // Add all Y-axis columns with numeric conversion
      config.mappings.y.forEach(yColumn => {
        if (row[yColumn] !== undefined && row[yColumn] !== null) {
          const value = row[yColumn];
          
          // Convert to number if it's a string
          if (typeof value === 'number') {
            chartPoint[yColumn] = value;
          } else if (typeof value === 'string') {
            const numericValue = parseFloat(value);
            // Only use if it's a valid number, otherwise set to 0
            chartPoint[yColumn] = !isNaN(numericValue) ? numericValue : 0;
            
            if (isNaN(numericValue)) {
              console.warn(`⚠️ [Raw Mode] Non-numeric value for column "${yColumn}": "${value}" - using 0`);
            }
          } else {
            // Try to coerce to number
            const numericValue = Number(value);
            chartPoint[yColumn] = !isNaN(numericValue) ? numericValue : 0;
          }
        } else {
          // Set to 0 if value is undefined or null
          chartPoint[yColumn] = 0;
        }
      });

      return chartPoint;
    });

    // Log sample of processed data for debugging
    if (result.length > 0) {
      console.log('   Sample processed row:', result[0]);
      console.log(`   Total ${result.length} data points created`);
    }

    return result;
  }

  /**
   * Format date based on granularity
   */
  private static formatDateByGranularity(value: any, granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'): string {
    if (!value) return '__NULL__';
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return String(value); // Not a date, return as-is
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    
    switch (granularity) {
      case 'hour':
        return `${year}-${month}-${day} ${hour}:00`;
      
      case 'day':
        return `${year}-${month}-${day}`;
      
      case 'week':
        // Get week number (ISO week)
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${year}-W${String(weekNum).padStart(2, '0')}`;
      
      case 'month':
        return `${year}-${month}`;
      
      case 'quarter':
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        return `${year}-Q${quarter}`;
      
      case 'year':
        return `${year}`;
      
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Detect if a column contains date values
   */
  private static isDateColumn(data: NormalizedRow[], columnName: string): boolean {
    // Check first few non-null values
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const value = data[i]?.[columnName];
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return true; // Found a valid date
        }
      }
    }
    return false;
  }

  /**
   * Step 3b: Process with aggregations (AUTOMATIC grouping by X axis)
   */
  private static processWithAggregations(data: NormalizedRow[], config: ChartConfig): ChartDataPoint[] {
    console.log('📊 [Auto-Aggregation] Grouping by X axis and applying pipelines...');
    console.log(`   Y columns to aggregate:`, config.mappings.y);

    // AUTOMATIC grouping by X axis column
    const groupByColumn = config.mappings.x;
    console.log(`   Grouping by: ${groupByColumn}`);

    // Check if date grouping is enabled
    const dateGrouping = config.processing.dateGrouping;
    const isDateGroupingEnabled = dateGrouping?.enabled && dateGrouping.granularity;
    
    // Auto-detect if X column is a date
    const isXAxisDate = this.isDateColumn(data, groupByColumn);
    
    if (isDateGroupingEnabled && isXAxisDate) {
      console.log(`   📅 DATE GROUPING ENABLED - Granularity: ${dateGrouping.granularity}`);
    }

    // Group data by X axis with smart date handling
    const grouped: Record<string, NormalizedRow[]> = {};
    data.forEach(row => {
      const rawValue = row[groupByColumn];
      let groupKey: string;
      
      if (rawValue === undefined || rawValue === null) {
        groupKey = '__NULL__';
      } else if (isDateGroupingEnabled && isXAxisDate) {
        // Format date based on granularity
        groupKey = this.formatDateByGranularity(rawValue, dateGrouping.granularity);
      } else {
        // Regular string grouping
        groupKey = String(rawValue);
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(row);
    });

    console.log(`   Created ${Object.keys(grouped).length} groups`);

    // Sort groups if using date grouping (chronological order)
    let sortedGroups = Object.entries(grouped);
    if (isDateGroupingEnabled && isXAxisDate) {
      sortedGroups = sortedGroups.sort(([keyA], [keyB]) => {
        if (keyA === '__NULL__') return 1;
        if (keyB === '__NULL__') return -1;
        return keyA.localeCompare(keyB); // Alphabetical = chronological for ISO dates
      });
      console.log(`   📅 Sorted groups chronologically`);
    }

    // Apply aggregation pipelines to each group
    const aggregated: ChartDataPoint[] = [];
    sortedGroups.forEach(([groupKey, groupRows]) => {
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

    // Log sample of aggregated data for debugging
    if (aggregated.length > 0) {
      console.log('   Sample aggregated row:', aggregated[0]);
      console.log(`   Total ${aggregated.length} aggregated data points`);
    }

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
    if (config.topN.sortColumn) {
      // Use explicitly selected column
      sortColumn = config.topN.sortColumn;
    } else if (config.topN.autoSort) {
      // Auto-sort on first Y column
      sortColumn = config.mappings.y[0];
    } else {
      // Use first available numeric column
      const numericColumns = Object.keys(data[0]).filter(key => 
        key !== 'name' && typeof data[0][key] === 'number'
      );
      sortColumn = numericColumns[0] || 'name';
    }

    const sortOrder = config.topN.sortOrder || 'desc';
    console.log(`  📊 Sorting by column: ${sortColumn} (${sortOrder})`);
    console.log(`  🔢 Top N count: ${config.topN.count}`);

    // Sort data
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        // Apply sort order
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        // Apply sort order for strings
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return 0;
    });

    // Apply limit
    return sorted.slice(0, config.topN.count);
  }

  /**
   * Apply chained aggregations on array of values (CASCADING PIPELINE)
   * Each aggregation is applied to the RESULT of the previous one
   * Example: [100, 200, 300] → SUM(600) → AVG(600) = 600 → MAX(600) = 600
   */
  private static applyChainedAggregations(
    initialValues: number[],
    aggregations: Array<{ function: 'sum' | 'avg' | 'count' | 'min' | 'max'; label: string }>
  ): number {
    console.log(`🔗 [Chained Aggregations] Processing ${aggregations.length} aggregations in cascade on ${initialValues.length} values`);
    
    // Start with array of values, chain through aggregations
    let currentValue: number | number[] = initialValues;
    const results: number[] = [];
    
    aggregations.forEach((aggregation, index) => {
      const isFirstStep = index === 0;
      const inputDescription = isFirstStep 
        ? `${initialValues.length} original values` 
        : `result from previous step`;
      
      console.log(`   Step ${index + 1}: ${aggregation.function.toUpperCase()} on ${inputDescription}`);
      
      // Apply aggregation to current value(s)
      const result = Array.isArray(currentValue)
        ? this.applyAggregationFunction(currentValue, aggregation.function)
        : currentValue; // Already a number from previous step
      
      console.log(`   ↳ Input: ${Array.isArray(currentValue) ? `[${currentValue.length} values]` : currentValue}`);
      console.log(`   ↳ Output: ${result}`);
      
      results.push(result);
      
      // Update current value for next step (single number)
      currentValue = result;
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
