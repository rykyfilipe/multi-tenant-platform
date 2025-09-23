/**
 * Widget Aggregation Utilities
 * Common utilities for data aggregation and validation across all widget types
 */

export type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count';
export type ColumnType = 'string' | 'text' | 'number' | 'integer' | 'decimal' | 'float' | 'double' | 'boolean' | 'date' | 'datetime' | 'time' | 'email' | 'url' | 'json' | 'customArray';

export interface ColumnMeta {
  id: number;
  name: string;
  type: ColumnType;
  tableId: number;
  isRequired?: boolean;
  order?: number;
}

export interface FilterConfig {
  id: string;
  columnId: number;
  columnName: string;
  columnType: ColumnType;
  operator: string;
  value: any;
  secondValue?: any;
}

export interface AggregationResult {
  value: number;
  count: number;
  isValid: boolean;
  error?: string;
}

/**
 * Validates if an aggregation function is compatible with a column type
 */
export function validateAggregationCompatibility(
  aggregation: AggregationFunction,
  columnType: ColumnType
): { isValid: boolean; error?: string } {
  const numericTypes: ColumnType[] = ['number', 'integer', 'decimal', 'float', 'double'];
  const textTypes: ColumnType[] = ['string', 'text', 'email', 'url'];
  
  switch (aggregation) {
    case 'sum':
    case 'avg':
      if (!numericTypes.includes(columnType)) {
        return {
          isValid: false,
          error: `Cannot apply ${aggregation.toUpperCase()} on ${columnType} column. Only numeric columns are supported.`
        };
      }
      break;
      
    case 'min':
    case 'max':
      if (!numericTypes.includes(columnType) && !textTypes.includes(columnType)) {
        return {
          isValid: false,
          error: `Cannot apply ${aggregation.toUpperCase()} on ${columnType} column. Only numeric or text columns are supported.`
        };
      }
      break;
      
    case 'count':
      // COUNT can be applied to any column type
      break;
      
    default:
      return {
        isValid: false,
        error: `Unknown aggregation function: ${aggregation}`
      };
  }
  
  return { isValid: true };
}

/**
 * Validates widget configuration for chart widgets
 */
export function validateChartWidgetConfig(
  xAxisColumn: ColumnMeta,
  yAxisColumns: ColumnMeta[],
  aggregation?: AggregationFunction
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate X-axis (should be categorical/temporal for most charts)
  const categoricalTypes: ColumnType[] = ['string', 'text', 'date', 'datetime', 'time'];
  if (!categoricalTypes.includes(xAxisColumn.type)) {
    errors.push(`X-axis column "${xAxisColumn.name}" should be categorical or temporal (${xAxisColumn.type} not suitable)`);
  }
  
  // Validate Y-axis columns (should be numeric)
  const numericTypes: ColumnType[] = ['number', 'integer', 'decimal', 'float', 'double'];
  yAxisColumns.forEach(yColumn => {
    if (!numericTypes.includes(yColumn.type)) {
      errors.push(`Y-axis column "${yColumn.name}" should be numeric (${yColumn.type} not suitable)`);
    }
  });
  
  // Validate aggregation compatibility
  if (aggregation) {
    yAxisColumns.forEach(yColumn => {
      const validation = validateAggregationCompatibility(aggregation, yColumn.type);
      if (!validation.isValid && validation.error) {
        errors.push(validation.error);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates widget configuration for metric widgets
 */
export function validateMetricWidgetConfig(
  column: ColumnMeta,
  aggregation: AggregationFunction
): { isValid: boolean; error?: string } {
  return validateAggregationCompatibility(aggregation, column.type);
}

/**
 * Validates widget configuration for table widgets
 */
export function validateTableWidgetConfig(
  columns: ColumnMeta[],
  aggregations: Record<string, AggregationFunction>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  Object.entries(aggregations).forEach(([columnName, aggregation]) => {
    const column = columns.find(col => col.name === columnName);
    if (!column) {
      errors.push(`Column "${columnName}" not found`);
      return;
    }
    
    const validation = validateAggregationCompatibility(aggregation, column.type);
    if (!validation.isValid && validation.error) {
      errors.push(validation.error);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Applies aggregation function to an array of numeric values
 */
export function applyAggregation(
  values: number[],
  aggregation: AggregationFunction
): AggregationResult {
  if (!Array.isArray(values) || values.length === 0) {
    return {
      value: 0,
      count: 0,
      isValid: false,
      error: 'No values provided for aggregation'
    };
  }
  
  const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
  
  if (numericValues.length === 0) {
    return {
      value: 0,
      count: 0,
      isValid: false,
      error: 'No valid numeric values found'
    };
  }
  
  let result: number;
  
  switch (aggregation) {
    case 'sum':
      result = numericValues.reduce((sum, val) => sum + val, 0);
      break;
      
    case 'avg':
      result = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      break;
      
    case 'min':
      result = Math.min(...numericValues);
      break;
      
    case 'max':
      result = Math.max(...numericValues);
      break;
      
    case 'count':
      result = numericValues.length;
      break;
      
    default:
      return {
        value: 0,
        count: 0,
        isValid: false,
        error: `Unknown aggregation function: ${aggregation}`
      };
  }
  
  return {
    value: result,
    count: numericValues.length,
    isValid: true
  };
}

/**
 * Extracts numeric values from a column in processed data
 */
export function extractNumericValues(
  data: any[],
  columnName: string
): number[] {
  return data
    .map(row => {
      const value = row[columnName];
      if (value === null || value === undefined) return null;
      
      const numericValue = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(numericValue) ? null : numericValue;
    })
    .filter(val => val !== null) as number[];
}

/**
 * Groups data by a categorical column and applies aggregation to numeric columns
 */
export function groupAndAggregate(
  data: any[],
  groupByColumn: string,
  aggregateColumns: { column: string; function: AggregationFunction }[]
): Record<string, Record<string, number>> {
  const groups: Record<string, any[]> = {};
  
  // Group data by the specified column
  data.forEach(row => {
    const groupKey = String(row[groupByColumn] || 'Unknown');
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(row);
  });
  
  // Apply aggregation to each group
  const result: Record<string, Record<string, number>> = {};
  
  Object.entries(groups).forEach(([groupKey, groupData]) => {
    result[groupKey] = {};
    
    aggregateColumns.forEach(({ column, function: aggFunc }) => {
      const values = extractNumericValues(groupData, column);
      const aggregationResult = applyAggregation(values, aggFunc);
      
      if (aggregationResult.isValid) {
        result[groupKey][column] = aggregationResult.value;
      } else {
        result[groupKey][column] = 0;
      }
    });
  });
  
  return result;
}

/**
 * Maps raw database rows to processed data format
 */
export function mapRawRowsToProcessedData(rows: any[]): any[] {
  return rows.map(row => {
    const processedRow: any = { id: row.id };
    
    if (row.cells && Array.isArray(row.cells)) {
      row.cells.forEach((cell: any) => {
        if (cell?.column?.name) {
          // Use the appropriate value field based on column type
          const value = cell.stringValue ?? 
                       cell.numberValue ?? 
                       cell.dateValue ?? 
                       cell.booleanValue ?? 
                       cell.value ?? 
                       null;
          
          processedRow[cell.column.name] = value;
        }
      });
    }
    
    return processedRow;
  });
}

/**
 * Gets the appropriate aggregation function for a column type
 */
export function getDefaultAggregationForColumnType(columnType: ColumnType): AggregationFunction {
  const numericTypes: ColumnType[] = ['number', 'integer', 'decimal', 'float', 'double'];
  
  if (numericTypes.includes(columnType)) {
    return 'sum';
  }
  
  return 'count';
}

/**
 * Gets all available aggregation functions for a column type
 */
export function getAvailableAggregationsForColumnType(columnType: ColumnType): AggregationFunction[] {
  const numericTypes: ColumnType[] = ['number', 'integer', 'decimal', 'float', 'double'];
  const textTypes: ColumnType[] = ['string', 'text', 'email', 'url'];
  
  if (numericTypes.includes(columnType)) {
    return ['sum', 'avg', 'min', 'max', 'count'];
  }
  
  if (textTypes.includes(columnType)) {
    return ['min', 'max', 'count'];
  }
  
  return ['count'];
}
