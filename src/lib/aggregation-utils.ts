/**
 * Data Aggregation Utilities
 * Professional aggregation functions for widgets and charts
 */

export type AggregationType = 
  | 'sum' 
  | 'average' 
  | 'mean' 
  | 'median' 
  | 'min' 
  | 'max' 
  | 'count' 
  | 'count_distinct' 
  | 'first' 
  | 'last' 
  | 'std_dev' 
  | 'variance' 
  | 'percentile_25' 
  | 'percentile_50' 
  | 'percentile_75' 
  | 'percentile_90' 
  | 'percentile_95' 
  | 'percentile_99';

export interface AggregationResult {
  value: number;
  formatted: string;
  type: AggregationType;
  count: number;
}

export interface AggregationOptions {
  type: AggregationType;
  column: string;
  precision?: number;
  format?: 'number' | 'currency' | 'percentage' | 'decimal';
  currency?: string;
  locale?: string;
}

/**
 * Calculate aggregation for a dataset
 */
export function calculateAggregation(
  data: any[], 
  options: AggregationOptions
): AggregationResult {
  const { type, column, precision = 2, format = 'number', currency = 'USD', locale = 'en-US' } = options;
  
  // Extract values from the specified column
  const values = data
    .map(item => {
      const value = item[column];
      return typeof value === 'number' ? value : parseFloat(value);
    })
    .filter(value => !isNaN(value));

  if (values.length === 0) {
    return {
      value: 0,
      formatted: '0',
      type,
      count: 0
    };
  }

  let result: number;

  switch (type) {
    case 'sum':
      result = values.reduce((sum, val) => sum + val, 0);
      break;
    
    case 'average':
    case 'mean':
      result = values.reduce((sum, val) => sum + val, 0) / values.length;
      break;
    
    case 'median':
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      result = sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
      break;
    
    case 'min':
      result = Math.min(...values);
      break;
    
    case 'max':
      result = Math.max(...values);
      break;
    
    case 'count':
      result = values.length;
      break;
    
    case 'count_distinct':
      result = new Set(values).size;
      break;
    
    case 'first':
      result = values[0];
      break;
    
    case 'last':
      result = values[values.length - 1];
      break;
    
    case 'std_dev':
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      result = Math.sqrt(variance);
      break;
    
    case 'variance':
      const meanVar = values.reduce((sum, val) => sum + val, 0) / values.length;
      result = values.reduce((sum, val) => sum + Math.pow(val - meanVar, 2), 0) / values.length;
      break;
    
    case 'percentile_25':
      result = calculatePercentile(values, 25);
      break;
    
    case 'percentile_50':
      result = calculatePercentile(values, 50);
      break;
    
    case 'percentile_75':
      result = calculatePercentile(values, 75);
      break;
    
    case 'percentile_90':
      result = calculatePercentile(values, 90);
      break;
    
    case 'percentile_95':
      result = calculatePercentile(values, 95);
      break;
    
    case 'percentile_99':
      result = calculatePercentile(values, 99);
      break;
    
    default:
      result = 0;
  }

  return {
    value: result,
    formatted: formatValue(result, format, precision, currency, locale),
    type,
    count: values.length
  };
}

/**
 * Calculate percentile for a dataset
 */
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  }
  
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Format value based on type and options
 */
function formatValue(
  value: number, 
  format: string, 
  precision: number, 
  currency: string, 
  locale: string
): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(value);
    
    case 'percentage':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(value / 100);
    
    case 'decimal':
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(value);
    
    case 'number':
    default:
      if (Number.isInteger(value)) {
        return new Intl.NumberFormat(locale).format(value);
      }
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(value);
  }
}

/**
 * Get available aggregation types for a column type
 */
export function getAvailableAggregations(columnType: string): AggregationType[] {
  const normalizedType = columnType.toLowerCase();
  
  if (['number', 'integer', 'decimal', 'float', 'double', 'numeric'].includes(normalizedType)) {
    return [
      'sum', 'average', 'mean', 'median', 'min', 'max', 'count', 'count_distinct',
      'first', 'last', 'std_dev', 'variance',
      'percentile_25', 'percentile_50', 'percentile_75', 'percentile_90', 'percentile_95', 'percentile_99'
    ];
  }
  
  if (['text', 'string', 'varchar', 'char', 'email', 'url'].includes(normalizedType)) {
    return ['count', 'count_distinct', 'first', 'last'];
  }
  
  if (['date', 'datetime', 'timestamp', 'time'].includes(normalizedType)) {
    return ['count', 'count_distinct', 'first', 'last', 'min', 'max'];
  }
  
  if (['boolean', 'bool'].includes(normalizedType)) {
    return ['count', 'count_distinct'];
  }
  
  return ['count', 'count_distinct'];
}

/**
 * Get human-readable name for aggregation type
 */
export function getAggregationLabel(type: AggregationType): string {
  const labels: Record<AggregationType, string> = {
    sum: 'Sum',
    average: 'Average',
    mean: 'Mean',
    median: 'Median',
    min: 'Minimum',
    max: 'Maximum',
    count: 'Count',
    count_distinct: 'Unique Count',
    first: 'First Value',
    last: 'Last Value',
    std_dev: 'Standard Deviation',
    variance: 'Variance',
    percentile_25: '25th Percentile',
    percentile_50: '50th Percentile (Median)',
    percentile_75: '75th Percentile',
    percentile_90: '90th Percentile',
    percentile_95: '95th Percentile',
    percentile_99: '99th Percentile'
  };
  
  return labels[type] || type;
}

/**
 * Get aggregation description
 */
export function getAggregationDescription(type: AggregationType): string {
  const descriptions: Record<AggregationType, string> = {
    sum: 'Total of all values',
    average: 'Arithmetic mean of all values',
    mean: 'Arithmetic mean of all values',
    median: 'Middle value when sorted',
    min: 'Smallest value',
    max: 'Largest value',
    count: 'Total number of values',
    count_distinct: 'Number of unique values',
    first: 'First value in the dataset',
    last: 'Last value in the dataset',
    std_dev: 'Measure of data spread',
    variance: 'Average of squared differences from mean',
    percentile_25: 'Value below which 25% of data falls',
    percentile_50: 'Value below which 50% of data falls (median)',
    percentile_75: 'Value below which 75% of data falls',
    percentile_90: 'Value below which 90% of data falls',
    percentile_95: 'Value below which 95% of data falls',
    percentile_99: 'Value below which 99% of data falls'
  };
  
  return descriptions[type] || '';
}

/**
 * Calculate multiple aggregations for a dataset
 */
export function calculateMultipleAggregations(
  data: any[], 
  column: string, 
  types: AggregationType[]
): Record<AggregationType, AggregationResult> {
  const results: Record<AggregationType, AggregationResult> = {} as any;
  
  for (const type of types) {
    results[type] = calculateAggregation(data, { type, column });
  }
  
  return results;
}

/**
 * Get trend direction (up, down, stable) based on current vs previous value
 */
export function getTrendDirection(current: number, previous: number, threshold: number = 0.01): 'up' | 'down' | 'stable' {
  if (previous === 0) return 'stable';
  
  const change = (current - previous) / previous;
  
  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'up' : 'down';
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
