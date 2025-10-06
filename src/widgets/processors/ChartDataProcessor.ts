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
 * Data processing configuration
 */
export interface ProcessingConfig {
  mode: 'raw' | 'aggregated';
  groupBy?: string; // Required for aggregated mode
  aggregationFunction?: 'sum' | 'avg' | 'count' | 'min' | 'max'; // Required for aggregated mode
  // Chained aggregations per Y column (e.g., { "revenue": [SUM, AVG, MAX] })
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
    mode: z.enum(["raw", "aggregated"]),
    groupBy: z.string().optional(),
    aggregationFunction: z.enum(["sum", "avg", "count", "min", "max"]).optional(),
  }).refine(
    (data) => {
      if (data.mode === "aggregated") {
        return data.groupBy && data.aggregationFunction;
      }
      return true;
    },
    {
      message: "Group By and Aggregation Function are required for aggregated mode",
      path: ["processing"],
    }
  ),
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
    if (config.processing.mode === 'aggregated') {
      if (!config.processing.groupBy) {
        errors.push('Group By column is required for aggregated mode');
      }
      if (!config.processing.aggregationFunction) {
        errors.push('Aggregation function is required for aggregated mode');
      }
    }

    if (config.topN?.enabled && !config.topN.autoSort && config.topN.count > 50) {
      warnings.push('Large Top N count without auto-sort may impact performance');
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
        mode: suggestedY.length > 0 ? 'raw' : 'aggregated',
        groupBy: textColumns[0]?.name,
        aggregationFunction: 'sum',
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
   * Processes raw data through the simplified pipeline
   */
  static process(rawData: RawDataRow[], config: ChartConfig): ChartDataPoint[] {
    console.log('🚀 [ChartDataProcessor] Starting data processing pipeline...');

    // Step 1: Normalize data
    const normalizedData = this.normalizeData(rawData);
    if (normalizedData.length === 0) {
      console.log('❌ [ChartDataProcessor] No data to process');
      return [];
    }

    // Step 2: Apply filters (already done at API level)
    console.log('✅ [ChartDataProcessor] Filters applied at API level');

    // Step 3: Process data based on mode
    let processedData: ChartDataPoint[];
    if (config.processing.mode === 'raw') {
      processedData = this.processRawData(normalizedData, config);
    } else {
      processedData = this.processAggregatedData(normalizedData, config);
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
   * Step 3a: Process raw data (pass-through with mapping)
   * Note: Chained aggregations în raw mode se aplică pe toate datele odată
   */
  private static processRawData(data: NormalizedRow[], config: ChartConfig): ChartDataPoint[] {
    console.log('📊 [Step 3a: Raw] Processing raw data...');

    // Check if we have chained aggregations for any column
    const hasChainedAggregations = config.processing.yColumnAggregations && 
      Object.keys(config.processing.yColumnAggregations).length > 0;

    if (hasChainedAggregations) {
      // Apply chained aggregations to entire dataset
      const chartPoint: ChartDataPoint = {
        name: 'Aggregated Result',
      };

      config.mappings.y.forEach(yColumn => {
        const allValues = this.extractNumericValues(data, yColumn);
        const columnAggregations = config.processing.yColumnAggregations?.[yColumn];
        
        if (columnAggregations && columnAggregations.length > 0) {
          const finalValue = this.applyChainedAggregations(allValues, columnAggregations);
          chartPoint[yColumn] = finalValue;
        } else {
          // No chaining, just take average or first value
          chartPoint[yColumn] = allValues.length > 0 ? allValues[0] : 0;
        }
      });

      return [chartPoint];
    }

    // Normal raw mode: pass-through with mapping
    return data.map((row, index) => {
      const chartPoint: ChartDataPoint = {
        name: row[config.mappings.x] !== undefined 
          ? String(row[config.mappings.x])
          : `Row ${index + 1}`,
      };

      // Add all Y-axis columns
      config.mappings.y.forEach(yColumn => {
        if (row[yColumn] !== undefined) {
          chartPoint[yColumn] = row[yColumn];
        }
      });

      return chartPoint;
    });
  }

  /**
   * Step 3b: Process aggregated data (group by + aggregate)
   */
  private static processAggregatedData(data: NormalizedRow[], config: ChartConfig): ChartDataPoint[] {
    console.log('📊 [Step 3b: Aggregated] Processing aggregated data...');

    if (!config.processing.groupBy) {
      throw new Error('Group By is required for aggregated mode');
    }

    // Group data by the specified column
    const grouped: Record<string, NormalizedRow[]> = {};
    data.forEach(row => {
      const groupKey = row[config.processing.groupBy!] !== undefined 
        ? String(row[config.processing.groupBy!])
        : '__NULL__';
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(row);
    });

    // Apply aggregation to each group
    const aggregated: ChartDataPoint[] = [];
    Object.entries(grouped).forEach(([groupKey, groupRows]) => {
      const chartPoint: ChartDataPoint = {
        name: groupKey === '__NULL__' ? 'N/A' : groupKey,
      };

      // Apply aggregation function(s) to each Y-axis column
      config.mappings.y.forEach(yColumn => {
        const values = this.extractNumericValues(groupRows, yColumn);
        
        // Check if this column has chained aggregations
        const columnAggregations = config.processing.yColumnAggregations?.[yColumn];
        
        if (columnAggregations && columnAggregations.length > 0) {
          // Apply chained aggregations (pipeline)
          const finalValue = this.applyChainedAggregations(values, columnAggregations);
          chartPoint[yColumn] = finalValue;
        } else if (config.processing.aggregationFunction) {
          // Single aggregation (backwards compatibility)
          const aggregatedValue = this.applyAggregationFunction(values, config.processing.aggregationFunction);
          chartPoint[yColumn] = aggregatedValue;
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
   * Apply chained aggregations (pipeline) on array of values
   * Example: [100, 200, 300] → SUM(600) → AVG(600) → MAX(600) = 600
   */
  private static applyChainedAggregations(
    initialValues: number[],
    aggregations: Array<{ function: 'sum' | 'avg' | 'count' | 'min' | 'max'; label: string }>
  ): number {
    console.log(`🔗 [Chained Aggregations] Processing ${aggregations.length} steps on ${initialValues.length} values`);
    
    let currentValue = 0;
    let intermediateValues = initialValues;

    aggregations.forEach((aggregation, index) => {
      console.log(`   Step ${index + 1}: ${aggregation.function.toUpperCase()} on ${intermediateValues.length} values`);
      
      if (index === 0) {
        // First aggregation: apply to original values
        currentValue = this.applyAggregationFunction(intermediateValues, aggregation.function);
        console.log(`   ↳ Result: ${currentValue}`);
      } else {
        // Subsequent aggregations: apply to the single result from previous step
        intermediateValues = [currentValue];
        currentValue = this.applyAggregationFunction(intermediateValues, aggregation.function);
        console.log(`   ↳ Chained result: ${currentValue}`);
      }
    });

    return currentValue;
  }

  /**
   * Helper: Extract numeric values from rows for a column
   */
  private static extractNumericValues(rows: NormalizedRow[], columnName: string): number[] {
    return rows
      .map(row => {
        const value = row[columnName];
        if (value === null || value === undefined) return null;
        const numericValue = typeof value === 'number' ? value : parseFloat(value);
        return isNaN(numericValue) ? null : numericValue;
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
