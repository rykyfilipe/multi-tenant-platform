/**
 * Tests for PrismaFilterBuilderV2
 */

import { PrismaFilterBuilderV2 } from '../prisma-filter-builder-v2';
import { FilterConfig } from '@/types/filtering-enhanced';

describe('PrismaFilterBuilderV2', () => {
  const mockTableColumns = [
    { id: 1, name: 'name', type: 'text' },
    { id: 2, name: 'age', type: 'number' },
    { id: 3, name: 'active', type: 'boolean' },
    { id: 4, name: 'created_at', type: 'date' },
    { id: 5, name: 'tags', type: 'reference' }
  ];

  let filterBuilder: PrismaFilterBuilderV2;

  beforeEach(() => {
    filterBuilder = new PrismaFilterBuilderV2(1, mockTableColumns);
  });

  describe('Global Search', () => {
    it('should add global search condition', () => {
      filterBuilder.addGlobalSearch('test');
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('ILIKE');
      expect(result.parameters).toContain('%test%');
    });

    it('should ignore empty search terms', () => {
      filterBuilder.addGlobalSearch('');
      filterBuilder.addGlobalSearch('   ');
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toBe('SELECT * FROM "Row" WHERE "tableId" = $1');
      expect(result.parameters).toEqual([1]);
    });
  });

  describe('Text Filters', () => {
    it('should build contains filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 1,
        columnName: 'name',
        columnType: 'text',
        operator: 'contains',
        value: 'test'
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('ILIKE');
      expect(result.parameters).toContain('%test%');
    });

    it('should build equals filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 1,
        columnName: 'name',
        columnType: 'text',
        operator: 'equals',
        value: 'test'
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('=');
      expect(result.parameters).toContain('test');
    });

    it('should build starts_with filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 1,
        columnName: 'name',
        columnType: 'text',
        operator: 'starts_with',
        value: 'test'
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('ILIKE');
      expect(result.parameters).toContain('test%');
    });

    it('should build regex filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 1,
        columnName: 'name',
        columnType: 'text',
        operator: 'regex',
        value: '^[A-Z]'
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('~');
      expect(result.parameters).toContain('^[A-Z]');
    });
  });

  describe('Numeric Filters', () => {
    it('should build greater_than filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 2,
        columnName: 'age',
        columnType: 'number',
        operator: 'greater_than',
        value: 25
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('(c."value"::text)::numeric >');
      expect(result.parameters).toContain(25);
    });

    it('should build between filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 2,
        columnName: 'age',
        columnType: 'number',
        operator: 'between',
        value: 25,
        secondValue: 35
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('BETWEEN');
      expect(result.parameters).toContain(25);
      expect(result.parameters).toContain(35);
    });
  });

  describe('Boolean Filters', () => {
    it('should build boolean equals filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 3,
        columnName: 'active',
        columnType: 'boolean',
        operator: 'equals',
        value: true
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('c."value"::boolean =');
      expect(result.parameters).toContain(true);
    });
  });

  describe('Date Filters', () => {
    it('should build date equals filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 4,
        columnName: 'created_at',
        columnType: 'date',
        operator: 'equals',
        value: '2024-01-15'
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('c."value"::text >=');
      expect(result.sql).toContain('c."value"::text <');
    });

    it('should build today filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 4,
        columnName: 'created_at',
        columnType: 'date',
        operator: 'today',
        value: null
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('c."value"::text >=');
      expect(result.sql).toContain('c."value"::text <');
    });
  });

  describe('Reference Filters', () => {
    it('should build reference equals filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 5,
        columnName: 'tags',
        columnType: 'reference',
        operator: 'equals',
        value: 'tag1'
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('@>');
      expect(result.parameters).toContain('"tag1"');
    });
  });

  describe('Empty Value Filters', () => {
    it('should build is_empty filter', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 1,
        columnName: 'name',
        columnType: 'text',
        operator: 'is_empty',
        value: null
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('IS NULL');
      expect(result.sql).toContain('= \'null\'::jsonb');
    });
  });

  describe('Multiple Filters', () => {
    it('should combine multiple filters with AND', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'name',
          columnType: 'text',
          operator: 'contains',
          value: 'test'
        },
        {
          id: 'test-2',
          columnId: 2,
          columnName: 'age',
          columnType: 'number',
          operator: 'greater_than',
          value: 25
        }
      ];

      filterBuilder.addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('AND');
      expect(result.parameters).toContain('%test%');
      expect(result.parameters).toContain(25);
    });
  });

  describe('Combined Search and Filters', () => {
    it('should combine global search with column filters', () => {
      const filters: FilterConfig[] = [
        {
          id: 'test-1',
          columnId: 1,
          columnName: 'name',
          columnType: 'text',
          operator: 'contains',
          value: 'test'
        }
      ];

      filterBuilder
        .addGlobalSearch('important')
        .addColumnFilters(filters);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toContain('AND');
      expect(result.parameters).toContain('%important%');
      expect(result.parameters).toContain('%test%');
    });
  });

  describe('Invalid Filters', () => {
    it('should ignore invalid filters', () => {
      const invalidFilter: FilterConfig = {
        id: 'test-1',
        columnId: 999, // Non-existent column
        columnName: 'invalid',
        columnType: 'text',
        operator: 'contains',
        value: 'test'
      };

      filterBuilder.addColumnFilters([invalidFilter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toBe('SELECT * FROM "Row" WHERE "tableId" = $1');
    });

    it('should ignore filters with null values', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 1,
        columnName: 'name',
        columnType: 'text',
        operator: 'contains',
        value: null
      };

      filterBuilder.addColumnFilters([filter]);
      
      const result = filterBuilder.buildSqlQuery();
      expect(result.sql).toBe('SELECT * FROM "Row" WHERE "tableId" = $1');
    });
  });

  describe('Post-process Filters', () => {
    it('should track post-process filters', () => {
      const filter: FilterConfig = {
        id: 'test-1',
        columnId: 1,
        columnName: 'name',
        columnType: 'text',
        operator: 'starts_with',
        value: 'test'
      };

      filterBuilder.addColumnFilters([filter]);
      
      expect(filterBuilder.hasPostProcessFilters()).toBe(false);
      expect(filterBuilder.getPostProcessFilters()).toEqual([]);
    });
  });
});
