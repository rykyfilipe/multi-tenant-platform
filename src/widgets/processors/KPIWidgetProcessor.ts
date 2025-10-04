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
 * Single metric configuration
 */
export interface MetricConfig {
  field: string; // Column name
  label: string; // Display name
  aggregations: Array<{
    function: 'sum' | 'avg' | 'count' | 'min' | 'max';
    label: string; // Display name for this aggregation
  }>;
  format?: 'number' | 'currency' | 'percentage' | 'decimal';
  showTrend?: boolean;
  showComparison?: boolean;
  target?: number; // Optional target value
}

/**
 * Complete KPI configuration
 */
export interface KPIConfig {
  dataSource: DataSourceConfig;
  metrics: MetricConfig[];
  filters: FilterConfig[];
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
 * Processed KPI result
 */
export interface KPIResult {
  metric: string;
  label: string;
  value: number;
  aggregation: string;
  format: string;
  trend?: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
  comparison?: {
    target: number;
    percentage: number;
    status: 'above' | 'below' | 'on-target';
  };
}

// ============================================================================
// VALIDATION SCHEMAS - Using Zod for runtime validation
// ============================================================================

export const kpiConfigSchema = z.object({
  dataSource: z.object({
    databaseId: z.number().positive(),
    tableId: z.string().min(1),
  }),
  metrics: z.array(z.object({
    field: z.string().min(1, "Field is required"),
    label: z.string().min(1, "Label is required"),
    aggregations: z.array(z.object({
      function: z.enum(["sum", "avg", "count", "min", "max"]),
      label: z.string().min(1, "Aggregation label is required"),
    })).min(1, "At least one aggregation is required"),
    format: z.enum(["number", "currency", "percentage", "decimal"]).optional(),
    showTrend: z.boolean().optional(),
    showComparison: z.boolean().optional(),
    target: z.number().optional(),
  })).min(1, "At least one metric is required"),
  filters: z.array(z.object({
    column: z.string(),
    operator: z.enum(["=", "!=", ">", "<", ">=", "<=", "contains", "startsWith", "endsWith"]),
    value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
  })),
  refresh: z.object({
    enabled: z.boolean(),
    interval: z.number().int().positive(),
  }).optional(),
});

// ============================================================================
// KPI DATA PROCESSOR CLASS
// ============================================================================

export class KPIWidgetProcessor {
  /**
   * Validates KPI configuration using Zod schema
   */
  static validate(config: KPIConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate using Zod schema
      kpiConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Additional business logic validations
    if (config.metrics.length > 12) {
      warnings.push('More than 12 metrics may impact performance and readability');
    }

    // Check for duplicate metric fields with same aggregation
    const duplicates = new Set<string>();
    config.metrics.forEach(metric => {
      metric.aggregations.forEach(agg => {
        const key = `${metric.field}-${agg.function}`;
        if (duplicates.has(key)) {
          errors.push(`Duplicate aggregation: ${agg.function} on ${metric.field}`);
        }
        duplicates.add(key);
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Gets suggested configuration based on available columns
   */
  static getSuggestedConfig(columns: Array<{ name: string; type: string }>): Partial<KPIConfig> {
    const numericColumns = columns.filter(col => 
      ['number', 'integer', 'decimal', 'float', 'double'].includes(col.type)
    );

    if (numericColumns.length === 0) {
      return {
        metrics: [],
      };
    }

    // Suggest up to 4 metrics with common aggregations
    const suggestedMetrics: MetricConfig[] = numericColumns.slice(0, 4).map(column => ({
      field: column.name,
      label: `${column.name.charAt(0).toUpperCase() + column.name.slice(1)}`,
      aggregations: [
        { function: 'sum' as const, label: 'Total' },
        { function: 'avg' as const, label: 'Average' },
      ],
      format: 'number' as const,
      showTrend: true,
      showComparison: false,
    }));

    return {
      metrics: suggestedMetrics,
      filters: [],
    };
  }

  /**
   * Processes raw data through the KPI pipeline
   */
  static process(rawData: RawDataRow[], config: KPIConfig): KPIResult[] {
    console.log('🚀 [KPIWidgetProcessor] Starting data processing pipeline...');

    // Step 1: Normalize data
    const normalizedData = this.normalizeData(rawData);
    if (normalizedData.length === 0) {
      console.log('❌ [KPIWidgetProcessor] No data to process');
      return [];
    }

    // Step 2: Apply filters (already done at API level)
    console.log('✅ [KPIWidgetProcessor] Filters applied at API level');

    // Step 3: Process metrics
    const results: KPIResult[] = [];
    
    config.metrics.forEach(metric => {
      metric.aggregations.forEach(aggregation => {
        const value = this.calculateAggregation(normalizedData, metric.field, aggregation.function);
        
        const result: KPIResult = {
          metric: `${metric.field}-${aggregation.function}`,
          label: aggregation.label,
          value,
          aggregation: aggregation.function,
          format: metric.format || 'number',
        };

        // Calculate trend if enabled
        if (metric.showTrend) {
          result.trend = this.calculateTrend(normalizedData, metric.field, aggregation.function);
        }

        // Calculate comparison if enabled and target provided
        if (metric.showComparison && metric.target !== undefined) {
          result.comparison = this.calculateComparison(value, metric.target);
        }

        results.push(result);
      });
    });

    console.log(`✅ [KPIWidgetProcessor] Generated ${results.length} KPI results`);
    return results;
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
   * Calculate aggregation for a specific field and function
   */
  private static calculateAggregation(
    data: NormalizedRow[], 
    field: string, 
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  ): number {
    const values = this.extractNumericValues(data, field);
    
    if (values.length === 0) {
      return 0;
    }

    switch (aggregation) {
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

  /**
   * Calculate trend (simplified - compares first half vs second half)
   */
  private static calculateTrend(
    data: NormalizedRow[], 
    field: string, 
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  ): { value: number; percentage: number; direction: 'up' | 'down' | 'stable' } {
    if (data.length < 4) {
      return { value: 0, percentage: 0, direction: 'stable' };
    }

    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);

    const firstValue = this.calculateAggregation(firstHalf, field, aggregation);
    const secondValue = this.calculateAggregation(secondHalf, field, aggregation);

    const difference = secondValue - firstValue;
    const percentage = firstValue !== 0 ? (difference / firstValue) * 100 : 0;

    return {
      value: difference,
      percentage: Math.abs(percentage),
      direction: percentage > 1 ? 'up' : percentage < -1 ? 'down' : 'stable'
    };
  }

  /**
   * Calculate comparison with target
   */
  private static calculateComparison(
    value: number, 
    target: number
  ): { target: number; percentage: number; status: 'above' | 'below' | 'on-target' } {
    const percentage = target !== 0 ? ((value - target) / target) * 100 : 0;
    
    let status: 'above' | 'below' | 'on-target';
    if (percentage > 5) {
      status = 'above';
    } else if (percentage < -5) {
      status = 'below';
    } else {
      status = 'on-target';
    }

    return {
      target,
      percentage: Math.abs(percentage),
      status
    };
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
}
