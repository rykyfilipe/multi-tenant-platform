/**
 * Tests for ValueCoercion utility
 */

import { ValueCoercion } from '../value-coercion';
import { ColumnType } from '@/types/filtering-enhanced';

describe('ValueCoercion', () => {
  describe('coerceValue', () => {
    describe('String types', () => {
      const stringTypes: ColumnType[] = ['text', 'string', 'email', 'url'];

      stringTypes.forEach(type => {
        it(`should coerce string values for ${type}`, () => {
          const result = ValueCoercion.coerceValue('test', type);
          expect(result.success).toBe(true);
          expect(result.value).toBe('test');
          expect(result.targetType).toBe(type);
        });

        it(`should coerce number to string for ${type}`, () => {
          const result = ValueCoercion.coerceValue(123, type);
          expect(result.success).toBe(true);
          expect(result.value).toBe('123');
        });

        it(`should coerce boolean to string for ${type}`, () => {
          const result = ValueCoercion.coerceValue(true, type);
          expect(result.success).toBe(true);
          expect(result.value).toBe('true');
        });

        it(`should handle null values for ${type}`, () => {
          const result = ValueCoercion.coerceValue(null, type);
          expect(result.success).toBe(true);
          expect(result.value).toBe(null);
        });
      });
    });

    describe('Numeric types', () => {
      const numericTypes: ColumnType[] = ['number', 'integer', 'decimal'];

      numericTypes.forEach(type => {
        it(`should coerce number values for ${type}`, () => {
          const result = ValueCoercion.coerceValue(123.45, type);
          expect(result.success).toBe(true);
          expect(result.value).toBe(123.45);
        });

        it(`should coerce string numbers for ${type}`, () => {
          const result = ValueCoercion.coerceValue('123.45', type);
          expect(result.success).toBe(true);
          expect(result.value).toBe(123.45);
        });

        it(`should coerce boolean to number for ${type}`, () => {
          const result = ValueCoercion.coerceValue(true, type);
          expect(result.success).toBe(true);
          expect(result.value).toBe(1);
        });

        it(`should fail for invalid string numbers for ${type}`, () => {
          const result = ValueCoercion.coerceValue('invalid', type);
          expect(result.success).toBe(false);
          expect(result.error).toContain('Cannot convert');
        });
      });
    });

    describe('Boolean type', () => {
      it('should coerce boolean values', () => {
        const result = ValueCoercion.coerceValue(true, 'boolean');
        expect(result.success).toBe(true);
        expect(result.value).toBe(true);
      });

      it('should coerce string "true" to boolean', () => {
        const result = ValueCoercion.coerceValue('true', 'boolean');
        expect(result.success).toBe(true);
        expect(result.value).toBe(true);
      });

      it('should coerce string "false" to boolean', () => {
        const result = ValueCoercion.coerceValue('false', 'boolean');
        expect(result.success).toBe(true);
        expect(result.value).toBe(false);
      });

      it('should coerce number 1 to boolean', () => {
        const result = ValueCoercion.coerceValue(1, 'boolean');
        expect(result.success).toBe(true);
        expect(result.value).toBe(true);
      });

      it('should coerce number 0 to boolean', () => {
        const result = ValueCoercion.coerceValue(0, 'boolean');
        expect(result.success).toBe(true);
        expect(result.value).toBe(false);
      });

      it('should fail for invalid boolean strings', () => {
        const result = ValueCoercion.coerceValue('maybe', 'boolean');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot convert');
      });
    });

    describe('Date types', () => {
      const dateTypes: ColumnType[] = ['date', 'datetime', 'time'];

      dateTypes.forEach(type => {
        it(`should coerce Date objects for ${type}`, () => {
          const date = new Date('2024-01-15T10:30:00Z');
          const result = ValueCoercion.coerceValue(date, type);
          expect(result.success).toBe(true);
          expect(result.value).toBe(date.toISOString());
        });

        it(`should coerce ISO string dates for ${type}`, () => {
          const dateStr = '2024-01-15T10:30:00Z';
          const result = ValueCoercion.coerceValue(dateStr, type);
          expect(result.success).toBe(true);
          expect(result.value).toBe('2024-01-15T10:30:00.000Z'); // Date constructor normalizes the format
        });

        it(`should coerce timestamp numbers for ${type}`, () => {
          const timestamp = 1705312200000; // 2024-01-15T10:30:00Z
          const result = ValueCoercion.coerceValue(timestamp, type);
          expect(result.success).toBe(true);
          expect(new Date(result.value).getTime()).toBe(timestamp);
        });

        it(`should fail for invalid date strings for ${type}`, () => {
          const result = ValueCoercion.coerceValue('invalid-date', type);
          expect(result.success).toBe(false);
          expect(result.error).toContain('Invalid date');
        });
      });
    });

    describe('JSON type', () => {
      it('should coerce objects to JSON', () => {
        const obj = { key: 'value' };
        const result = ValueCoercion.coerceValue(obj, 'json');
        expect(result.success).toBe(true);
        expect(result.value).toEqual(obj);
      });

      it('should parse JSON strings', () => {
        const jsonStr = '{"key": "value"}';
        const result = ValueCoercion.coerceValue(jsonStr, 'json');
        expect(result.success).toBe(true);
        expect(result.value).toEqual({ key: 'value' });
      });

      it('should return string as-is if not valid JSON', () => {
        const result = ValueCoercion.coerceValue('not-json', 'json');
        expect(result.success).toBe(true);
        expect(result.value).toBe('not-json');
      });
    });

    describe('Reference type', () => {
      it('should coerce single values to string', () => {
        const result = ValueCoercion.coerceValue(123, 'reference');
        expect(result.success).toBe(true);
        expect(result.value).toBe('123');
      });

      it('should coerce arrays to string array', () => {
        const result = ValueCoercion.coerceValue([123, 456], 'reference');
        expect(result.success).toBe(true);
        expect(result.value).toEqual(['123', '456']);
      });
    });
  });

  describe('getSqlCast', () => {
    it('should return correct cast for text types', () => {
      expect(ValueCoercion.getSqlCast('text')).toBe('value::text');
      expect(ValueCoercion.getSqlCast('string')).toBe('value::text');
      expect(ValueCoercion.getSqlCast('email')).toBe('value::text');
    });

    it('should return correct cast for numeric types', () => {
      expect(ValueCoercion.getSqlCast('number')).toBe('(value::text)::numeric');
      expect(ValueCoercion.getSqlCast('integer')).toBe('(value::text)::numeric');
      expect(ValueCoercion.getSqlCast('decimal')).toBe('(value::text)::numeric');
    });

    it('should return correct cast for boolean type', () => {
      expect(ValueCoercion.getSqlCast('boolean')).toBe('value::boolean');
    });

    it('should return correct cast for date types', () => {
      expect(ValueCoercion.getSqlCast('date')).toBe('value::text');
      expect(ValueCoercion.getSqlCast('datetime')).toBe('value::text');
    });
  });

  describe('getSqlOperator', () => {
    it('should return correct operators for text types', () => {
      expect(ValueCoercion.getSqlOperator('contains', 'text')).toBe('ILIKE');
      expect(ValueCoercion.getSqlOperator('equals', 'text')).toBe('=');
      expect(ValueCoercion.getSqlOperator('regex', 'text')).toBe('~');
    });

    it('should return correct operators for numeric types', () => {
      expect(ValueCoercion.getSqlOperator('greater_than', 'number')).toBe('>');
      expect(ValueCoercion.getSqlOperator('equals', 'number')).toBe('=');
    });

    it('should return correct operators for JSON types', () => {
      expect(ValueCoercion.getSqlOperator('contains', 'json')).toBe('@>');
      expect(ValueCoercion.getSqlOperator('equals', 'json')).toBe('=');
    });
  });

  describe('formatValueForSql', () => {
    it('should format contains values with wildcards', () => {
      expect(ValueCoercion.formatValueForSql('test', 'contains', 'text')).toBe('%test%');
    });

    it('should format starts_with values', () => {
      expect(ValueCoercion.formatValueForSql('test', 'starts_with', 'text')).toBe('test%');
    });

    it('should format ends_with values', () => {
      expect(ValueCoercion.formatValueForSql('test', 'ends_with', 'text')).toBe('%test');
    });

    it('should format JSON contains values', () => {
      expect(ValueCoercion.formatValueForSql('test', 'contains', 'json')).toBe('"test"');
    });

    it('should return values as-is for other operators', () => {
      expect(ValueCoercion.formatValueForSql('test', 'equals', 'text')).toBe('test');
      expect(ValueCoercion.formatValueForSql(123, 'greater_than', 'number')).toBe(123);
    });
  });
});
