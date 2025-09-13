/**
 * Unit tests for ValueCoercion
 */

import { ValueCoercion } from '../value-coercion';
import { ColumnType } from '@/types/filtering-enhanced';

describe('ValueCoercion', () => {
  describe('coerceValue', () => {
    it('should coerce string to number', () => {
      const result = ValueCoercion.coerceValue('123', 'number');
      expect(result.value).toBe(123);
      expect(result.success).toBe(true);
    });

    it('should coerce string to boolean', () => {
      const result = ValueCoercion.coerceValue('true', 'boolean');
      expect(result.value).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should coerce string to date', () => {
      const result = ValueCoercion.coerceValue('2023-01-01', 'date');
      expect(result.value).toBe('2023-01-01T00:00:00.000Z');
      expect(result.success).toBe(true);
    });

    it('should coerce string to datetime', () => {
      const result = ValueCoercion.coerceValue('2023-01-01T12:00:00Z', 'datetime');
      expect(result.value).toBe('2023-01-01T12:00:00.000Z');
      expect(result.success).toBe(true);
    });

    it('should coerce string to time', () => {
      const result = ValueCoercion.coerceValue('12:00:00', 'time');
      expect(result.value).toBe('12:00:00');
      expect(result.success).toBe(true);
    });

    it('should coerce string to json', () => {
      const result = ValueCoercion.coerceValue('{"key": "value"}', 'json');
      expect(result.value).toEqual({ key: 'value' });
      expect(result.success).toBe(true);
    });

    it('should coerce string to customArray', () => {
      const result = ValueCoercion.coerceValue('["item1", "item2"]', 'customArray');
      expect(result.value).toBe('["item1", "item2"]');
      expect(result.success).toBe(true);
    });

    it('should return string as is for text type', () => {
      const result = ValueCoercion.coerceValue('test', 'text');
      expect(result.value).toBe('test');
      expect(result.success).toBe(true);
    });

    it('should return string as is for reference type', () => {
      const result = ValueCoercion.coerceValue('ref123', 'reference');
      expect(result.value).toBe('ref123');
      expect(result.success).toBe(true);
    });

    it('should handle invalid number', () => {
      const result = ValueCoercion.coerceValue('invalid', 'number');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot convert');
    });

    it('should handle invalid boolean', () => {
      const result = ValueCoercion.coerceValue('invalid', 'boolean');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot convert');
    });

    it('should handle invalid date', () => {
      const result = ValueCoercion.coerceValue('invalid', 'date');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date string');
    });

    it('should handle invalid json', () => {
      const result = ValueCoercion.coerceValue('invalid', 'json');
      expect(result.value).toBe('invalid');
      expect(result.success).toBe(true);
    });

    it('should handle invalid customArray', () => {
      const result = ValueCoercion.coerceValue('invalid', 'customArray');
      expect(result.value).toBe('invalid');
      expect(result.success).toBe(true);
    });

    it('should handle null value', () => {
      const result = ValueCoercion.coerceValue(null, 'text');
      expect(result.value).toBe(null);
      expect(result.success).toBe(true);
    });

    it('should handle undefined value', () => {
      const result = ValueCoercion.coerceValue(undefined, 'text');
      expect(result.value).toBe(null);
      expect(result.success).toBe(true);
    });
  });

  describe('getSqlCast', () => {
    it('should return correct cast expression for text', () => {
      const result = ValueCoercion.getSqlCast('text');
      expect(result).toBe('value::text');
    });

    it('should return correct cast expression for number', () => {
      const result = ValueCoercion.getSqlCast('number');
      expect(result).toBe('(value::text)::numeric');
    });

    it('should return correct cast expression for boolean', () => {
      const result = ValueCoercion.getSqlCast('boolean');
      expect(result).toBe('value::boolean');
    });

    it('should return correct cast expression for date', () => {
      const result = ValueCoercion.getSqlCast('date');
      expect(result).toBe('value::text');
    });

    it('should return correct cast expression for datetime', () => {
      const result = ValueCoercion.getSqlCast('datetime');
      expect(result).toBe('value::text');
    });

    it('should return correct cast expression for time', () => {
      const result = ValueCoercion.getSqlCast('time');
      expect(result).toBe('value::text');
    });

    it('should return correct cast expression for json', () => {
      const result = ValueCoercion.getSqlCast('json');
      expect(result).toBe('value');
    });

    it('should return correct cast expression for customArray', () => {
      const result = ValueCoercion.getSqlCast('customArray');
      expect(result).toBe('value::text');
    });

    it('should return correct cast expression for reference', () => {
      const result = ValueCoercion.getSqlCast('reference');
      expect(result).toBe('value');
    });
  });

  describe('getSqlOperator', () => {
    it('should return correct operator for contains with text', () => {
      const result = ValueCoercion.getSqlOperator('contains', 'text');
      expect(result).toBe('ILIKE');
    });

    it('should return correct operator for equals with number', () => {
      const result = ValueCoercion.getSqlOperator('equals', 'number');
      expect(result).toBe('=');
    });

    it('should return correct operator for equals with boolean', () => {
      const result = ValueCoercion.getSqlOperator('equals', 'boolean');
      expect(result).toBe('=');
    });

    it('should return correct operator for equals with date', () => {
      const result = ValueCoercion.getSqlOperator('equals', 'date');
      expect(result).toBe('=');
    });

    it('should return correct operator for equals with datetime', () => {
      const result = ValueCoercion.getSqlOperator('equals', 'datetime');
      expect(result).toBe('=');
    });

    it('should return correct operator for equals with time', () => {
      const result = ValueCoercion.getSqlOperator('equals', 'time');
      expect(result).toBe('=');
    });

    it('should return correct operator for contains with json', () => {
      const result = ValueCoercion.getSqlOperator('contains', 'json');
      expect(result).toBe('@>');
    });

    it('should return correct operator for equals with customArray', () => {
      const result = ValueCoercion.getSqlOperator('equals', 'customArray');
      expect(result).toBe('=');
    });

    it('should return correct operator for equals with reference', () => {
      const result = ValueCoercion.getSqlOperator('equals', 'reference');
      expect(result).toBe('=');
    });
  });

  describe('formatValueForSql', () => {
    it('should format contains value for text', () => {
      const result = ValueCoercion.formatValueForSql('test', 'contains', 'text');
      expect(result).toBe('%test%');
    });

    it('should format contains value for json', () => {
      const result = ValueCoercion.formatValueForSql({ key: 'value' }, 'contains', 'json');
      expect(result).toBe('{"key":"value"}');
    });

    it('should format starts_with value', () => {
      const result = ValueCoercion.formatValueForSql('test', 'starts_with', 'text');
      expect(result).toBe('test%');
    });

    it('should format ends_with value', () => {
      const result = ValueCoercion.formatValueForSql('test', 'ends_with', 'text');
      expect(result).toBe('%test');
    });

    it('should format regex value', () => {
      const result = ValueCoercion.formatValueForSql('^test.*', 'regex', 'text');
      expect(result).toBe('^test.*');
    });

    it('should format equals value', () => {
      const result = ValueCoercion.formatValueForSql('test', 'equals', 'text');
      expect(result).toBe('test');
    });
  });
});