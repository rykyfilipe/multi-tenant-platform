/**
 * Tests for Widget Aggregation Utilities
 */

import {
  validateAggregationCompatibility,
  validateMetricWidgetConfig,
  validateChartWidgetConfig,
  validateTableWidgetConfig,
  applyAggregation,
  extractNumericValues,
  groupAndAggregate,
  mapRawRowsToProcessedData,
  getDefaultAggregationForColumnType,
  getAvailableAggregationsForColumnType,
  type AggregationFunction,
  type ColumnType,
  type ColumnMeta,
  type FilterConfig
} from '../widget-aggregation';

describe('Widget Aggregation Utilities', () => {
  describe('validateAggregationCompatibility', () => {
    test('should validate SUM aggregation on numeric columns', () => {
      const result = validateAggregationCompatibility('sum', 'number');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject SUM aggregation on string columns', () => {
      const result = validateAggregationCompatibility('sum', 'string');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot apply SUM on string column');
    });

    test('should validate COUNT aggregation on any column type', () => {
      const result1 = validateAggregationCompatibility('count', 'number');
      const result2 = validateAggregationCompatibility('count', 'string');
      const result3 = validateAggregationCompatibility('count', 'date');
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result3.isValid).toBe(true);
    });

    test('should validate MIN/MAX on numeric and text columns', () => {
      const numericResult = validateAggregationCompatibility('min', 'number');
      const textResult = validateAggregationCompatibility('max', 'string');
      const dateResult = validateAggregationCompatibility('min', 'date');
      
      expect(numericResult.isValid).toBe(true);
      expect(textResult.isValid).toBe(true);
      expect(dateResult.isValid).toBe(false);
    });
  });

  describe('applyAggregation', () => {
    test('should calculate SUM correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const result = applyAggregation(values, 'sum');
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(15);
      expect(result.count).toBe(5);
    });

    test('should calculate AVG correctly', () => {
      const values = [10, 20, 30];
      const result = applyAggregation(values, 'avg');
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(20);
      expect(result.count).toBe(3);
    });

    test('should calculate MIN correctly', () => {
      const values = [5, 2, 8, 1, 9];
      const result = applyAggregation(values, 'min');
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(1);
      expect(result.count).toBe(5);
    });

    test('should calculate MAX correctly', () => {
      const values = [3, 7, 1, 9, 4];
      const result = applyAggregation(values, 'max');
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(9);
      expect(result.count).toBe(5);
    });

    test('should calculate COUNT correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const result = applyAggregation(values, 'count');
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.count).toBe(5);
    });

    test('should handle empty array', () => {
      const result = applyAggregation([], 'sum');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No values provided');
    });

    test('should handle array with no valid numeric values', () => {
      const values = [NaN, null, undefined, 'invalid'];
      const result = applyAggregation(values as number[], 'sum');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No valid numeric values found');
    });

    test('should filter out non-numeric values', () => {
      const values = [1, 2, NaN, 3, 'invalid', 4];
      const result = applyAggregation(values as number[], 'sum');
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(10); // 1 + 2 + 3 + 4
      expect(result.count).toBe(4);
    });
  });

  describe('extractNumericValues', () => {
    test('should extract numeric values from data', () => {
      const data = [
        { price: 100 },
        { price: 200 },
        { price: '300' },
        { price: null },
        { price: undefined },
        { price: 'invalid' }
      ];
      
      const values = extractNumericValues(data, 'price');
      
      expect(values).toEqual([100, 200, 300]);
    });

    test('should handle missing column', () => {
      const data = [{ name: 'test' }];
      const values = extractNumericValues(data, 'price');
      
      expect(values).toEqual([]);
    });

    test('should handle empty data', () => {
      const values = extractNumericValues([], 'price');
      
      expect(values).toEqual([]);
    });
  });

  describe('mapRawRowsToProcessedData', () => {
    test('should map raw database rows to processed data', () => {
      const rawRows = [
        {
          id: 1,
          cells: [
            { column: { name: 'name' }, stringValue: 'Product A' },
            { column: { name: 'price' }, numberValue: 100 }
          ]
        },
        {
          id: 2,
          cells: [
            { column: { name: 'name' }, stringValue: 'Product B' },
            { column: { name: 'price' }, numberValue: 200 }
          ]
        }
      ];
      
      const processed = mapRawRowsToProcessedData(rawRows);
      
      expect(processed).toEqual([
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 }
      ]);
    });

    test('should handle rows without cells', () => {
      const rawRows = [{ id: 1 }];
      const processed = mapRawRowsToProcessedData(rawRows);
      
      expect(processed).toEqual([{ id: 1 }]);
    });

    test('should handle empty rows array', () => {
      const processed = mapRawRowsToProcessedData([]);
      
      expect(processed).toEqual([]);
    });
  });

  describe('groupAndAggregate', () => {
    test('should group data and apply aggregation', () => {
      const data = [
        { category: 'Electronics', price: 100 },
        { category: 'Electronics', price: 200 },
        { category: 'Clothing', price: 50 },
        { category: 'Clothing', price: 75 }
      ];
      
      const result = groupAndAggregate(data, 'category', [
        { column: 'price', function: 'sum' }
      ]);
      
      expect(result).toEqual({
        'Electronics': { price: 300 },
        'Clothing': { price: 125 }
      });
    });

    test('should handle multiple aggregation functions', () => {
      const data = [
        { category: 'Electronics', price: 100, quantity: 2 },
        { category: 'Electronics', price: 200, quantity: 1 },
        { category: 'Clothing', price: 50, quantity: 3 }
      ];
      
      const result = groupAndAggregate(data, 'category', [
        { column: 'price', function: 'sum' },
        { column: 'quantity', function: 'avg' }
      ]);
      
      expect(result['Electronics'].price).toBe(300);
      expect(result['Electronics'].quantity).toBe(1.5);
      expect(result['Clothing'].price).toBe(50);
      expect(result['Clothing'].quantity).toBe(3);
    });
  });

  describe('validateMetricWidgetConfig', () => {
    test('should validate valid metric configuration', () => {
      const column: ColumnMeta = {
        id: 1,
        name: 'price',
        type: 'number',
        tableId: 1
      };
      
      const result = validateMetricWidgetConfig(column, 'sum');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject invalid metric configuration', () => {
      const column: ColumnMeta = {
        id: 1,
        name: 'name',
        type: 'string',
        tableId: 1
      };
      
      const result = validateMetricWidgetConfig(column, 'sum');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot apply SUM on string column');
    });
  });

  describe('validateChartWidgetConfig', () => {
    test('should validate valid chart configuration', () => {
      const xAxisColumn: ColumnMeta = {
        id: 1,
        name: 'category',
        type: 'string',
        tableId: 1
      };
      
      const yAxisColumns: ColumnMeta[] = [
        {
          id: 2,
          name: 'price',
          type: 'number',
          tableId: 1
        }
      ];
      
      const result = validateChartWidgetConfig(xAxisColumn, yAxisColumns, 'sum');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject chart with numeric X-axis', () => {
      const xAxisColumn: ColumnMeta = {
        id: 1,
        name: 'price',
        type: 'number',
        tableId: 1
      };
      
      const yAxisColumns: ColumnMeta[] = [
        {
          id: 2,
          name: 'quantity',
          type: 'number',
          tableId: 1
        }
      ];
      
      const result = validateChartWidgetConfig(xAxisColumn, yAxisColumns, 'sum');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('should be categorical or temporal');
    });
  });

  describe('validateTableWidgetConfig', () => {
    test('should validate valid table configuration', () => {
      const columns: ColumnMeta[] = [
        { id: 1, name: 'price', type: 'number', tableId: 1 },
        { id: 2, name: 'quantity', type: 'number', tableId: 1 }
      ];
      
      const aggregations = {
        'price': 'sum' as AggregationFunction,
        'quantity': 'avg' as AggregationFunction
      };
      
      const result = validateTableWidgetConfig(columns, aggregations);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject invalid table configuration', () => {
      const columns: ColumnMeta[] = [
        { id: 1, name: 'name', type: 'string', tableId: 1 },
        { id: 2, name: 'quantity', type: 'number', tableId: 1 }
      ];
      
      const aggregations = {
        'name': 'sum' as AggregationFunction,
        'quantity': 'avg' as AggregationFunction
      };
      
      const result = validateTableWidgetConfig(columns, aggregations);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Cannot apply SUM on string column');
    });
  });

  describe('getDefaultAggregationForColumnType', () => {
    test('should return sum for numeric columns', () => {
      expect(getDefaultAggregationForColumnType('number')).toBe('sum');
      expect(getDefaultAggregationForColumnType('integer')).toBe('sum');
      expect(getDefaultAggregationForColumnType('decimal')).toBe('sum');
    });

    test('should return count for non-numeric columns', () => {
      expect(getDefaultAggregationForColumnType('string')).toBe('count');
      expect(getDefaultAggregationForColumnType('date')).toBe('count');
      expect(getDefaultAggregationForColumnType('boolean')).toBe('count');
    });
  });

  describe('getAvailableAggregationsForColumnType', () => {
    test('should return all aggregations for numeric columns', () => {
      const aggregations = getAvailableAggregationsForColumnType('number');
      
      expect(aggregations).toEqual(['sum', 'avg', 'min', 'max', 'count']);
    });

    test('should return limited aggregations for text columns', () => {
      const aggregations = getAvailableAggregationsForColumnType('string');
      
      expect(aggregations).toEqual(['min', 'max', 'count']);
    });

    test('should return only count for other column types', () => {
      const aggregations = getAvailableAggregationsForColumnType('boolean');
      
      expect(aggregations).toEqual(['count']);
    });
  });
});
