/**
 * Unit tests for PrismaFilterBuilderV2
 */

import { PrismaFilterBuilderV2 } from '../prisma-filter-builder-v2';
import { FilterConfig } from '@/types/filtering-enhanced';

describe('PrismaFilterBuilderV2', () => {
  let filterBuilder: PrismaFilterBuilderV2;
  const mockTableColumns = [
    { id: 1, name: 'text_column', type: 'text' },
    { id: 2, name: 'number_column', type: 'number' },
    { id: 3, name: 'date_column', type: 'date' },
    { id: 4, name: 'boolean_column', type: 'boolean' },
  ];

  beforeEach(() => {
    filterBuilder = new PrismaFilterBuilderV2(1, mockTableColumns);
  });

  describe('addGlobalSearch', () => {
    it('should add global search condition', () => {
      filterBuilder.addGlobalSearch('test');
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('ILIKE');
      expect(result.parameters).toContain('%test%');
    });

    it('should not add global search for empty string', () => {
      filterBuilder.addGlobalSearch('');
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toBe('SELECT * FROM "Row" WHERE "tableId" = $1');
      expect(result.parameters).toEqual([1]);
    });

    it('should not add global search for whitespace only', () => {
      filterBuilder.addGlobalSearch('   ');
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toBe('SELECT * FROM "Row" WHERE "tableId" = $1');
      expect(result.parameters).toEqual([1]);
    });
  });

  describe('addColumnFilters', () => {
    it('should add text filter with contains operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('ILIKE');
      expect(result.parameters).toContain('%test%');
    });

    it('should add number filter with greater_than operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-2',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'greater_than',
          value: 10,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>');
      expect(result.parameters).toContain(10);
    });

    it('should add date filter with today operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-3',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'today',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });

    it('should add boolean filter with equals operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-4',
          columnId: 4,
          columnName: 'boolean_column',
          columnType: 'boolean',
          operator: 'equals',
          value: true,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('=');
      expect(result.parameters).toContain(true);
    });

    it('should add empty value filter', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-5',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'is_empty',
          value: null,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('IS NULL');
      expect(result.sql).toContain('null');
    });

    it('should add not empty value filter', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-6',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'is_not_empty',
          value: null,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('NOT');
    });

    it('should add range filter with between operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-7',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'between',
          value: 10,
          secondValue: 20,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('BETWEEN');
      expect(result.parameters).toContain(10);
      expect(result.parameters).toContain(20);
    });

    it('should add multiple filters', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-8',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
        {
          id: 'test-9',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'greater_than',
          value: 10,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('AND');
      expect(result.parameters).toContain('%test%');
      expect(result.parameters).toContain(10);
    });

    it('should skip invalid filters', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-10',
          columnId: 999, // invalid column ID
          columnName: 'nonexistent_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
        {
          id: 'test-11',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.parameters).toContain('%test%');
      expect(result.parameters).not.toContain(999);
    });

    it('should handle empty filters array', () => {
      filterBuilder.addColumnFilters([]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toBe('SELECT * FROM "Row" WHERE "tableId" = $1');
      expect(result.parameters).toEqual([1]);
    });
  });

  describe('buildSqlQuery', () => {
    it('should build query with only table ID when no filters', () => {
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toBe('SELECT * FROM "Row" WHERE "tableId" = $1');
      expect(result.parameters).toEqual([1]);
    });

    it('should build query with filters', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('SELECT * FROM "Row" WHERE "tableId" = $1 AND');
      expect(result.parameters).toContain(1);
      expect(result.parameters).toContain('%test%');
    });

    it('should build query with global search and filters', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
      ];

      filterBuilder.addGlobalSearch('search');
      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('SELECT * FROM "Row" WHERE "tableId" = $1 AND');
      expect(result.parameters).toContain(1);
      expect(result.parameters).toContain('%search%');
      expect(result.parameters).toContain('%test%');
    });
  });

  describe('getWhereClause', () => {
    it('should return base where clause when no filters', () => {
      const result = filterBuilder.getWhereClause();
      expect(result).toEqual({ tableId: 1 });
    });

    it('should return where clause with raw conditions when filters exist', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.getWhereClause();
      expect(result.tableId).toBe(1);
      expect(result._rawConditions).toBeDefined();
      expect(result._parameters).toBeDefined();
    });
  });

  describe('getParameters', () => {
    it('should return empty array when no filters', () => {
      const result = filterBuilder.getParameters();
      expect(result).toEqual([]);
    });

    it('should return parameters when filters exist', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.getParameters();
      expect(result).toContain(1); // columnId
      expect(result).toContain('%test%'); // value
    });
  });

  describe('getRawConditions', () => {
    it('should return empty array when no filters', () => {
      const result = filterBuilder.getRawConditions();
      expect(result).toEqual([]);
    });

    it('should return raw conditions when filters exist', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'contains',
          value: 'test',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.getRawConditions();
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('EXISTS');
      expect(result[0]).toContain('ILIKE');
    });
  });

  describe('date operators', () => {
    it('should handle today operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'today',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });

    it('should handle yesterday operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-2',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'yesterday',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });

    it('should handle this_week operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-3',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'this_week',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });

    it('should handle last_week operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-4',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'last_week',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });

    it('should handle this_month operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-5',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'this_month',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });

    it('should handle last_month operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-6',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'last_month',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });

    it('should handle this_year operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-7',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'this_year',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });

    it('should handle last_year operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-8',
          columnId: 3,
          columnName: 'date_column',
          columnType: 'date',
          operator: 'last_year',
          value: undefined,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.sql).toContain('<');
    });
  });

  describe('text operators', () => {
    it('should handle starts_with operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'starts_with',
          value: 'test',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('ILIKE');
      expect(result.parameters).toContain('test%');
    });

    it('should handle ends_with operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-2',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'ends_with',
          value: 'test',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('ILIKE');
      expect(result.parameters).toContain('%test');
    });

    it('should handle regex operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-3',
          columnId: 1,
          columnName: 'text_column',
          columnType: 'text',
          operator: 'regex',
          value: '^test.*',
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('~');
      expect(result.parameters).toContain('^test.*');
    });
  });

  describe('number operators', () => {
    it('should handle less_than operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'less_than',
          value: 10,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('<');
      expect(result.parameters).toContain(10);
    });

    it('should handle less_than_or_equal operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-2',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'less_than_or_equal',
          value: 10,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('<=');
      expect(result.parameters).toContain(10);
    });

    it('should handle greater_than_or_equal operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-3',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'greater_than_or_equal',
          value: 10,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('>=');
      expect(result.parameters).toContain(10);
    });

    it('should handle not_between operator', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-4',
          columnId: 2,
          columnName: 'number_column',
          columnType: 'number',
          operator: 'not_between',
          value: 10,
          secondValue: 20,
        },
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('EXISTS');
      expect(result.sql).toContain('NOT BETWEEN');
      expect(result.parameters).toContain(10);
      expect(result.parameters).toContain(20);
    });
  });
});
