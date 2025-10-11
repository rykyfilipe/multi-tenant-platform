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
  groupBy?: string; // Optional group by field for complex aggregations
  aggregations: Array<{
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
    label: string; // Display name for this aggregation
  }>;
  format?: 'number' | 'currency' | 'percentage' | 'decimal' | 'text';
  showTrend?: boolean;
  showComparison?: boolean;
  target?: number; // Optional target value
  // Display column - when last aggregation returns single row (max/min/first/last)
  displayColumn?: string; // Column to display from the result row
  displayFormat?: 'text' | 'number' | 'currency' | 'date';
}

/**
 * Complete KPI configuration (Single metric with chained aggregations)
 */
export interface KPIConfig {
  dataSource: DataSourceConfig;
  metric: MetricConfig; // Single metric only
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
  // Display value - when displayColumn is set and last aggregation returns single row
  displayValue?: string | number; // Value from displayColumn
  displayFormat?: 'text' | 'number' | 'currency' | 'date';
  resultRow?: any; // Complete row when aggregation returns single row
  // All aggregation results (chained sequence: each step uses result from previous)
  allAggregations?: Array<{
    function: string;
    label: string;
    value: number;
  }>;
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
  // Single metric with chained aggregation pipeline
  metric: z.object({
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
  }),
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
    if (config.metric?.aggregations && config.metric.aggregations.length > 5) {
      warnings.push('More than 5 chained aggregations may be hard to interpret');
    }

    // Warn about inefficient aggregation chains
    if (config.metric?.aggregations && config.metric.aggregations.length > 1) {
      const functions = config.metric.aggregations.map(a => a.function);
      // COUNT followed by anything doesn't make sense mathematically
      if (functions[0] === 'count' && functions.length > 1) {
        warnings.push('Chaining aggregations after COUNT may produce unexpected results');
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
  static getSuggestedConfig(columns: Array<{ name: string; type: string }>): Partial<KPIConfig> {
    const numericColumns = columns.filter(col => 
      ['number', 'integer', 'decimal', 'float', 'double'].includes(col.type)
    );

    if (numericColumns.length === 0) {
      return {
        filters: [],
      };
    }

    // Suggest first numeric column with simple sum aggregation
    const firstColumn = numericColumns[0];
    const suggestedMetric: MetricConfig = {
      field: firstColumn.name,
      label: `Total ${firstColumn.name.charAt(0).toUpperCase() + firstColumn.name.slice(1).replace(/_/g, ' ')}`,
      aggregations: [
        { function: 'sum' as const, label: 'Total' },
      ],
      format: 'number' as const,
      showTrend: true,
      showComparison: false,
    };

    return {
      metric: suggestedMetric,
      filters: [],
    };
  }

  /**
   * Processes raw data through the KPI pipeline (Single metric with multiple independent aggregations)
   */
  static process(rawData: RawDataRow[], config: KPIConfig): KPIResult {
    console.log('🚀 [KPIWidgetProcessor] Starting aggregation pipeline...');

    // Step 1: Normalize data
    const normalizedData = this.normalizeData(rawData);
    if (normalizedData.length === 0) {
      console.log('❌ [KPIWidgetProcessor] No data to process');
      return {
        metric: config.metric.field,
        label: config.metric.label,
        value: 0,
        aggregation: config.metric.aggregations[0]?.function || 'sum',
        format: config.metric.format || 'number',
      };
    }

    // Step 2: Check if GROUP BY is configured
    if (config.metric.groupBy) {
      console.log(`🔀 [Step 2] GROUP BY "${config.metric.groupBy}" detected - processing groups`);
      return this.processWithGroupBy(normalizedData, config);
    }

    // Step 2 (No GroupBy): Extract column values
    const columnValues = this.extractNumericValues(normalizedData, config.metric.field);
    console.log(`📊 [KPIWidgetProcessor] Extracted ${columnValues.length} values from column: ${config.metric.field}`);

    // Step 3: Apply aggregations in CHAINED sequence (cascading)
    // Each aggregation is applied to the RESULT of the previous one
    const aggregationResults: Array<{ function: string; label: string; value: number }> = [];
    let currentValue: number | number[] = columnValues; // Start with array of values
    let resultRow: any = null; // Store result row for max/min/first/last

    config.metric.aggregations.forEach((aggregation, aggIndex) => {
      const isFirstStep = aggIndex === 0;
      const isLastStep = aggIndex === config.metric.aggregations.length - 1;
      const inputDescription = isFirstStep 
        ? `${columnValues.length} original values` 
        : `result from previous step`;
      
      console.log(`🔗 [Step ${aggIndex + 1}] Applying ${aggregation.function.toUpperCase()} on ${inputDescription}`);
      
      // For last step with max/min/first/last, find and return the complete row
      if (isFirstStep && isLastStep && ['max', 'min', 'first', 'last'].includes(aggregation.function) && config.metric.displayColumn) {
        console.log(`🎯 [KPI] Detecting single-row aggregation with displayColumn: ${config.metric.displayColumn}`);
        
        // Find the row with max/min value
        if (aggregation.function === 'max') {
          const maxValue = Math.max(...(currentValue as number[]));
          const maxIndex = (currentValue as number[]).indexOf(maxValue);
          resultRow = normalizedData[maxIndex];
          console.log(`   → Found MAX value: ${maxValue} at index ${maxIndex}`);
          console.log(`   → Result row:`, resultRow);
        } else if (aggregation.function === 'min') {
          const minValue = Math.min(...(currentValue as number[]));
          const minIndex = (currentValue as number[]).indexOf(minValue);
          resultRow = normalizedData[minIndex];
          console.log(`   → Found MIN value: ${minValue} at index ${minIndex}`);
          console.log(`   → Result row:`, resultRow);
        } else if (aggregation.function === 'first') {
          resultRow = normalizedData[0];
          console.log(`   → Result row (first):`, resultRow);
        } else if (aggregation.function === 'last') {
          resultRow = normalizedData[normalizedData.length - 1];
          console.log(`   → Result row (last):`, resultRow);
        }
        
        if (resultRow) {
          console.log(`   → Display column value: ${resultRow[config.metric.displayColumn]}`);
        }
      }
      
      // Apply aggregation to current value(s)
      const aggregatedValue = Array.isArray(currentValue)
        ? this.calculateAggregationOnArray(currentValue, aggregation.function as any)
        : currentValue; // If already a single value, return as-is
      
      console.log(`   ↳ Input: ${Array.isArray(currentValue) ? `[${currentValue.length} values]` : currentValue}`);
      console.log(`   ↳ Output: ${aggregatedValue}`);
      
      aggregationResults.push({
        function: aggregation.function,
        label: aggregation.label,
        value: aggregatedValue
      });

      // Update current value for next step (single number, not array)
      currentValue = aggregatedValue;
    });

    // Use the last aggregation result as the primary display value
    const finalAggregation = aggregationResults[aggregationResults.length - 1];
    
    // Extract display value from resultRow if displayColumn is configured
    const displayValue = resultRow && config.metric.displayColumn ? resultRow[config.metric.displayColumn] : undefined;
    
    if (config.metric.displayColumn) {
      console.log(`🎨 [Display Column] ${config.metric.displayColumn}:`, displayValue);
      console.log(`   → resultRow exists:`, !!resultRow);
      console.log(`   → resultRow keys:`, resultRow ? Object.keys(resultRow) : 'N/A');
    }
    
    const result: KPIResult = {
      metric: config.metric.field,
      label: config.metric.label,
      value: finalAggregation.value,
      aggregation: finalAggregation.label || finalAggregation.function,
      format: config.metric.format || 'number',
      // Store all aggregation results for display
      allAggregations: aggregationResults,
      // Store result row if available
      resultRow: resultRow,
      // Extract display value from resultRow if displayColumn is configured
      displayValue: displayValue,
      displayFormat: config.metric.displayFormat,
    };

    // Calculate trend if enabled - using FULL PIPELINE not just first aggregation
    if (config.metric.showTrend) {
      result.trend = this.calculateTrendWithPipeline(
        normalizedData, 
        config.metric.field, 
        config.metric.aggregations
      );
    }

    // Calculate comparison if enabled and target provided
    if (config.metric.showComparison && config.metric.target !== undefined) {
      result.comparison = this.calculateComparison(finalAggregation.value, config.metric.target);
    }

    console.log(`✅ [KPIWidgetProcessor] All aggregation results:`, aggregationResults);
    return result;
  }

  /**
   * Calculate aggregation on array of numbers (for chaining)
   */
  private static calculateAggregationOnArray(
    values: number[], 
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  ): number {
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
   * Process data with GROUP BY - groups rows, applies pipeline to each group, then aggregates results
   */
  private static processWithGroupBy(normalizedData: NormalizedRow[], config: KPIConfig): KPIResult {
    const groupByField = config.metric.groupBy!;
    console.log(`🔀 [GROUP BY] Grouping ${normalizedData.length} rows by "${groupByField}"`);

    // Step 1: Group rows by the groupBy field
    const groups: Record<string, NormalizedRow[]> = {};
    normalizedData.forEach(row => {
      const groupKey = String(row[groupByField] ?? '__NULL__');
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(row);
    });

    const groupKeys = Object.keys(groups);
    console.log(`   Created ${groupKeys.length} groups:`, groupKeys.slice(0, 10));

    // Step 2: Apply aggregation pipeline to each group
    const groupResults: Array<{ group: string; value: number; rows: NormalizedRow[] }> = [];
    
    groupKeys.forEach((groupKey, groupIndex) => {
      const groupRows = groups[groupKey];
      const groupValues = this.extractNumericValues(groupRows, config.metric.field);
      
      console.log(`   Group ${groupIndex + 1}/${groupKeys.length} "${groupKey}": ${groupValues.length} rows`);
      
      // Apply chained aggregations to this group
      let currentValue: number | number[] = groupValues;
      config.metric.aggregations.forEach(agg => {
        currentValue = Array.isArray(currentValue)
          ? this.calculateAggregationOnArray(currentValue, agg.function as any)
          : currentValue;
      });
      
      const groupFinalValue = typeof currentValue === 'number' ? currentValue : 0;
      console.log(`      → Pipeline result for "${groupKey}": ${groupFinalValue}`);
      groupResults.push({ group: groupKey, value: groupFinalValue, rows: groupRows });
    });

    // Step 3: Aggregate all group results using the last aggregation function
    const finalAgg = config.metric.aggregations[config.metric.aggregations.length - 1];
    const groupValues = groupResults.map(g => g.value);
    
    console.log(`🎯 [GROUP BY] Applying ${finalAgg.function.toUpperCase()} to ${groupResults.length} group results:`, groupValues);
    
    const finalValue = this.calculateAggregationOnArray(groupValues, finalAgg.function as any);
    console.log(`   → Final aggregated value: ${finalValue}`);

    // Find the winning group (the one that produced the final value)
    let winningGroup: typeof groupResults[0] | null = null;
    let resultRow: any = null;
    let displayValue: string | number | undefined = undefined;

    if (['max', 'min', 'first', 'last'].includes(finalAgg.function)) {
      // Find which group produced the final value
      if (finalAgg.function === 'max') {
        winningGroup = groupResults.find(g => g.value === finalValue) || null;
      } else if (finalAgg.function === 'min') {
        winningGroup = groupResults.find(g => g.value === finalValue) || null;
      } else if (finalAgg.function === 'first') {
        winningGroup = groupResults[0] || null;
      } else if (finalAgg.function === 'last') {
        winningGroup = groupResults[groupResults.length - 1] || null;
      }

      if (winningGroup && config.metric.displayColumn) {
        console.log(`🎯 [GROUP BY + displayColumn] Winning group: "${winningGroup.group}"`);
        console.log(`   → Group has ${winningGroup.rows.length} rows`);
        console.log(`   → Looking for row with ${config.metric.field} = ${finalValue}`);
        
        // Find the specific row from the winning group that has the aggregated value
        const groupField = config.metric.field;
        if (finalAgg.function === 'min' || finalAgg.function === 'max') {
          // Find the row with the specific min/max value
          resultRow = winningGroup.rows.find(row => {
            const rowValue = parseFloat(String(row[groupField]));
            return rowValue === finalValue;
          });
          console.log(`   → Found row with ${groupField} = ${finalValue}:`, !!resultRow);
        } else if (finalAgg.function === 'first') {
          resultRow = winningGroup.rows[0];
        } else if (finalAgg.function === 'last') {
          resultRow = winningGroup.rows[winningGroup.rows.length - 1];
        }
        
        if (resultRow) {
          displayValue = resultRow[config.metric.displayColumn];
          console.log(`   → Display value from row[${config.metric.displayColumn}]: ${displayValue}`);
          console.log(`   → Full row keys:`, Object.keys(resultRow).slice(0, 10));
        } else {
          console.log(`   ⚠️ No matching row found in winning group`);
        }
      }
    }

    return {
      metric: config.metric.field,
      label: config.metric.label,
      value: finalValue,
      aggregation: `${finalAgg.label} (grouped by ${groupByField})`,
      format: config.metric.format || 'number',
      resultRow: resultRow,
      displayValue: displayValue,
      displayFormat: config.metric.displayFormat,
      allAggregations: [{
        function: finalAgg.function,
        label: `${finalAgg.label} across ${groupResults.length} groups`,
        value: finalValue,
      }],
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
   * Calculate trend using FULL AGGREGATION PIPELINE based on created_at timestamp
   * Compares older half vs newer half (chronologically sorted)
   */
  private static calculateTrendWithPipeline(
    data: NormalizedRow[], 
    field: string, 
    aggregations: Array<{ function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last'; label: string }>
  ): { value: number; percentage: number; direction: 'up' | 'down' | 'stable' } {
    if (data.length < 4) {
      return { value: 0, percentage: 0, direction: 'stable' };
    }

    // Try to sort by created_at for chronological comparison
    let sortedData = [...data];
    const hasCreatedAt = data[0] && ('created_at' in data[0] || 'createdAt' in data[0]);
    
    if (hasCreatedAt) {
      // Sort chronologically (oldest to newest)
      sortedData.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateA - dateB;
      });
      console.log(`📅 [Trend] Sorted ${sortedData.length} rows by created_at (chronological)`);
    } else {
      console.log(`⚠️ [Trend] No created_at field found - using row order as-is`);
    }

    // Split into older half (first) and newer half (second)
    const midPoint = Math.floor(sortedData.length / 2);
    const olderHalf = sortedData.slice(0, midPoint);
    const newerHalf = sortedData.slice(midPoint);

    // Apply ENTIRE PIPELINE to both periods
    const olderHalfValues = this.extractNumericValues(olderHalf, field);
    const newerHalfValues = this.extractNumericValues(newerHalf, field);

    // Apply chained aggregations to older period
    let olderValue: number | number[] = olderHalfValues;
    aggregations.forEach(agg => {
      olderValue = Array.isArray(olderValue)
        ? this.calculateAggregationOnArray(olderValue, agg.function as any)
        : olderValue;
    });

    // Apply chained aggregations to newer period
    let newerValue: number | number[] = newerHalfValues;
    aggregations.forEach(agg => {
      newerValue = Array.isArray(newerValue)
        ? this.calculateAggregationOnArray(newerValue, agg.function as any)
        : newerValue;
    });

    const olderNum = typeof olderValue === 'number' ? olderValue : 0;
    const newerNum = typeof newerValue === 'number' ? newerValue : 0;

    const difference = newerNum - olderNum;
    const percentage = olderNum !== 0 ? (difference / olderNum) * 100 : 0;

    console.log(`📈 [Trend Calculation] Older period: ${olderNum}, Newer period: ${newerNum}, Change: ${percentage.toFixed(2)}%`);

    return {
      value: difference,
      percentage: Math.abs(percentage),
      direction: percentage > 1 ? 'up' : percentage < -1 ? 'down' : 'stable'
    };
  }

  /**
   * Calculate trend (OLD - kept for backward compatibility)
   * @deprecated Use calculateTrendWithPipeline instead
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
   * Group data by a specific field
   */
  private static groupDataByField(data: NormalizedRow[], groupByField: string): NormalizedRow[] {
    const groups = new Map<string, NormalizedRow[]>();
    
    data.forEach(row => {
      const groupKey = String(row[groupByField] || 'Unknown');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    });

    // Return grouped data as array of objects with group info
    const groupedData: NormalizedRow[] = [];
    groups.forEach((groupRows, groupKey) => {
      groupedData.push({
        _groupKey: groupKey,
        _groupRows: groupRows,
        _groupCount: groupRows.length
      });
    });

    return groupedData;
  }

  /**
   * Calculate aggregation by group (for grouped data)
   */
  private static calculateAggregationByGroup(
    groupedData: NormalizedRow[], 
    field: string, 
    groupByField: string, 
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  ): NormalizedRow[] {
    const results: NormalizedRow[] = [];
    
    groupedData.forEach(group => {
      if (group._groupRows) {
        const groupRows = group._groupRows as NormalizedRow[];
        const groupValue = this.calculateAggregation(groupRows, field, aggregation);
        
        results.push({
          value: groupValue,
          groupKey: group._groupKey,
          groupCount: group._groupCount
        });
      }
    });

    return results;
  }

  /**
   * Apply aggregation to dataset and return processed data
   */
  private static applyAggregationToDataset(
    data: NormalizedRow[], 
    field: string, 
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  ): NormalizedRow[] {
    // This method is used for chaining aggregations
    // For example: first sum by group, then find max of sums
    
    const value = this.calculateAggregation(data, field, aggregation);
    
    // Return a single row with the aggregated value
    return [{
      [field]: value,
      _aggregated: true,
      _aggregation_type: aggregation
    }];
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
        
        // If original value looks like an integer string (quantity, count, etc.), return integer
        if (/^\d+$/.test(String(value).trim())) {
          return Math.floor(numericValue);
        }
        
        return numericValue;
      })
      .filter((val): val is number => val !== null);
  }
}
