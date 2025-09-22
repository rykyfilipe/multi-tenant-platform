/**
 * Unit tests for FilterValidator
 */

import { FilterValidator } from '../filter-validator';
import { FilterConfig, ColumnType } from '@/types/filtering';

describe('FilterValidator', () => {
  const mockColumns = [
    { id: 1, name: 'text_column', type: 'text' },
    { id: 2, name: 'number_column', type: 'number' },
    { id: 3, name: 'date_column', type: 'date' },
    { id: 4, name: 'boolean_column', type: 'boolean' },
  ];

  describe('validateFilter', () => {
    it('should validate a valid text filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 1,
        columnName: 'text_column',
        columnType: 'text',
        operator: 'contains',
        value: 'test',
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid number filter', () => {
      const filter: FilterConfig = {
        id: 'test-2',
        columnId: 2,
        columnName: 'number_column',
        columnType: 'number',
        operator: 'greater_than',
        value: 10,
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid date filter', () => {
      const filter: FilterConfig = {
        id: 'test-3',
        columnId: 3,
        columnName: 'date_column',
        columnType: 'date',
        operator: 'today',
        value: undefined,
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid boolean filter', () => {
      const filter: FilterConfig = {
        id: 'test-4',
        columnId: 4,
        columnName: 'boolean_column',
        columnType: 'boolean',
        operator: 'equals',
        value: true,
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid column ID', () => {
      const filter: FilterConfig = {
        id: 'test-5',
        columnId: 999,
        columnName: 'nonexistent_column',
        columnType: 'text',
        operator: 'contains',
        value: 'test',
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Column with ID 999 not found');
    });

    it('should reject invalid column type', () => {
      const filter: FilterConfig = {
        id: 'test-6',
        columnId: 1,
        columnName: 'text_column',
        columnType: 'invalid_type' as ColumnType,
        operator: 'contains',
        value: 'test',
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid column type: invalid_type');
    });

    it('should reject incompatible operator for column type', () => {
      const filter: FilterConfig = {
        id: 'test-7',
        columnId: 2,
        columnName: 'number_column',
        columnType: 'number',
        operator: 'contains', // contains is not valid for number type
        value: 'test',
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Operator 'contains' is not compatible with column type 'number'");
    });

    it('should validate empty value filters', () => {
      const filter: FilterConfig = {
        id: 'test-8',
        columnId: 1,
        columnName: 'text_column',
        columnType: 'text',
        operator: 'is_empty',
        value: null,
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate not empty value filters', () => {
      const filter: FilterConfig = {
        id: 'test-9',
        columnId: 1,
        columnName: 'text_column',
        columnType: 'text',
        operator: 'is_not_empty',
        value: null,
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate range filters with secondValue', () => {
      const filter: FilterConfig = {
        id: 'test-10',
        columnId: 2,
        columnName: 'number_column',
        columnType: 'number',
        operator: 'between',
        value: 10,
        secondValue: 20,
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject range filters without secondValue', () => {
      const filter: FilterConfig = {
        id: 'test-11',
        columnId: 2,
        columnName: 'number_column',
        columnType: 'number',
        operator: 'between',
        value: 10,
        secondValue: null,
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Range operator 'between' requires secondValue");
    });

    it('should warn about value type conversion', () => {
      const filter: FilterConfig = {
        id: 'test-12',
        columnId: 2,
        columnName: 'number_column',
        columnType: 'number',
        operator: 'equals',
        value: '10', // string that can be converted to number
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Value '10' will be converted to number");
    });

    it('should error on invalid value type conversion', () => {
      const filter: FilterConfig = {
        id: 'test-13',
        columnId: 2,
        columnName: 'number_column',
        columnType: 'number',
        operator: 'equals',
        value: 'not_a_number',
      };

      const result = FilterValidator.validateFilter(filter, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Expected number value for column type 'number', got string");
    });
  });

  describe('validateFilters', () => {
    it('should validate multiple filters', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
        {
          id: 'test-2',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'greater_than',
          value: 10,
        },
      ];

      const result = FilterValidator.validateFilters(filters, mockColumns);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors from multiple filters', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 999, // invalid column ID
          columnName: 'nonexistent_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
        {
          id: 'test-2',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'contains', // invalid operator for number
          value: 'test',
        },
      ];

      const result = FilterValidator.validateFilters(filters, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('Filter 1: Column with ID 999 not found');
      expect(result.errors[1]).toContain("Filter 2: Operator 'contains' is not compatible with column type 'number'");
    });
  });

  describe('getAvailableOperators', () => {
    it('should return correct operators for text column', () => {
      const operators = FilterValidator.getAvailableOperators('text');
      expect(operators).toContain('contains');
      expect(operators).toContain('equals');
      expect(operators).toContain('is_empty');
      expect(operators).not.toContain('greater_than');
    });

    it('should return correct operators for number column', () => {
      const operators = FilterValidator.getAvailableOperators('number');
      expect(operators).toContain('equals');
      expect(operators).toContain('greater_than');
      expect(operators).toContain('less_than');
      expect(operators).toContain('between');
      expect(operators).not.toContain('contains');
    });

    it('should return correct operators for date column', () => {
      const operators = FilterValidator.getAvailableOperators('date');
      expect(operators).toContain('equals');
      expect(operators).toContain('before');
      expect(operators).toContain('after');
      expect(operators).toContain('today');
      expect(operators).toContain('this_week');
      expect(operators).toContain('last_week');
    });

    it('should return correct operators for boolean column', () => {
      const operators = FilterValidator.getAvailableOperators('boolean');
      expect(operators).toContain('equals');
      expect(operators).toContain('not_equals');
      expect(operators).toContain('is_empty');
      expect(operators).not.toContain('contains');
    });
  });

  describe('isOperatorValid', () => {
    it('should return true for valid operator', () => {
      expect(FilterValidator.isOperatorValid('contains', 'text')).toBe(true);
      expect(FilterValidator.isOperatorValid('greater_than', 'number')).toBe(true);
      expect(FilterValidator.isOperatorValid('today', 'date')).toBe(true);
    });

    it('should return false for invalid operator', () => {
      expect(FilterValidator.isOperatorValid('contains', 'number')).toBe(false);
      expect(FilterValidator.isOperatorValid('greater_than', 'text')).toBe(false);
      expect(FilterValidator.isOperatorValid('today', 'boolean')).toBe(false);
    });
  });

  describe('convertFilterValue', () => {
    it('should convert string to number', () => {
      const result = FilterValidator.convertFilterValue('123', 'number');
      expect(result).toBe(123);
    });

    it('should convert string to boolean', () => {
      const result = FilterValidator.convertFilterValue('true', 'boolean');
      expect(result).toBe(true);
    });

    it('should convert string to date', () => {
      const result = FilterValidator.convertFilterValue('2023-01-01', 'date');
      expect(result).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should handle null values', () => {
      const result = FilterValidator.convertFilterValue(null, 'text');
      expect(result).toBe(null);
    });

    it('should handle undefined values', () => {
      const result = FilterValidator.convertFilterValue(undefined, 'text');
      expect(result).toBe(null);
    });
  });
});
