import { TableWidgetProcessor } from '../TableWidgetProcessor';

describe('TableWidgetProcessor', () => {
  const mockRawData = [
    {
      cells: [
        { column: { name: 'region' }, value: 'North' },
        { column: { name: 'sales' }, value: 1000 },
        { column: { name: 'profit' }, value: 200 },
      ]
    },
    {
      cells: [
        { column: { name: 'region' }, value: 'South' },
        { column: { name: 'sales' }, value: 1500 },
        { column: { name: 'profit' }, value: 300 },
      ]
    },
    {
      cells: [
        { column: { name: 'region' }, value: 'North' },
        { column: { name: 'sales' }, value: 800 },
        { column: { name: 'profit' }, value: 150 },
      ]
    },
  ];

  const validConfig = {
    dataSource: {
      databaseId: 1,
      tableId: 'table1',
    },
    aggregation: {
      enabled: true,
      columns: [
        {
          column: 'sales',
          aggregations: [
            { function: 'sum' as const, label: 'Total Sales' },
            { function: 'avg' as const, label: 'Average Sales' },
          ],
        },
        {
          column: 'profit',
          aggregations: [
            { function: 'max' as const, label: 'Max Profit' },
          ],
        },
      ],
      showSummaryRow: true,
      showGroupTotals: false,
    },
    filters: [],
  };

  describe('validate', () => {
    it('should validate correct configuration', () => {
      const result = TableWidgetProcessor.validate(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without aggregation columns when enabled', () => {
      const invalidConfig = {
        ...validConfig,
        aggregation: { ...validConfig.aggregation, columns: [] }
      };
      const result = TableWidgetProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('aggregation.columns: At least one column aggregation is required');
    });

    it('should reject aggregation column without field', () => {
      const invalidConfig = {
        ...validConfig,
        aggregation: {
          ...validConfig.aggregation,
          columns: [{ ...validConfig.aggregation.columns[0], column: '' }]
        }
      };
      const result = TableWidgetProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('aggregation.columns.0.column: Column is required');
    });

    it('should reject aggregation column without aggregations', () => {
      const invalidConfig = {
        ...validConfig,
        aggregation: {
          ...validConfig.aggregation,
          columns: [{ ...validConfig.aggregation.columns[0], aggregations: [] }]
        }
      };
      const result = TableWidgetProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('aggregation.columns.0.aggregations: At least one aggregation is required');
    });

    it('should warn about too many aggregation columns', () => {
      const manyColumns = Array(12).fill(null).map((_, i) => ({
        column: `column${i}`,
        aggregations: [{ function: 'sum' as const, label: 'Total' }],
      }));
      
      const config = {
        ...validConfig,
        aggregation: { ...validConfig.aggregation, columns: manyColumns }
      };
      const result = TableWidgetProcessor.validate(config);
      
      expect(result.warnings).toContain('More than 10 aggregation columns may impact performance');
    });

    it('should detect duplicate column aggregations', () => {
      const config = {
        ...validConfig,
        aggregation: {
          ...validConfig.aggregation,
          columns: [
            { column: 'sales', aggregations: [{ function: 'sum' as const, label: 'Total' }] },
            { column: 'sales', aggregations: [{ function: 'avg' as const, label: 'Average' }] }, // Duplicate
          ]
        }
      };
      
      const result = TableWidgetProcessor.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate column aggregations: sales');
    });

    it('should validate groupBy column exists in aggregation columns', () => {
      const config = {
        ...validConfig,
        aggregation: {
          ...validConfig.aggregation,
          groupBy: 'region', // Not in aggregation columns
        }
      };
      
      const result = TableWidgetProcessor.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Group by column must be included in aggregation columns');
    });
  });

  describe('getSuggestedConfig', () => {
    it('should suggest configuration based on numeric columns', () => {
      const columns = [
        { name: 'region', type: 'string' },
        { name: 'revenue', type: 'number' },
        { name: 'customers', type: 'number' },
        { name: 'profit', type: 'decimal' },
        { name: 'description', type: 'text' },
      ];

      const suggestion = TableWidgetProcessor.getSuggestedConfig(columns);
      
      expect(suggestion.aggregation?.columns).toHaveLength(3); // revenue, customers, profit
      expect(suggestion.aggregation?.columns?.[0].column).toBe('revenue');
      expect(suggestion.aggregation?.columns?.[0].aggregations).toHaveLength(2);
      expect(suggestion.aggregation?.columns?.[0].aggregations[0].function).toBe('sum');
      expect(suggestion.aggregation?.columns?.[0].aggregations[1].function).toBe('avg');
      expect(suggestion.pagination?.enabled).toBe(true);
      expect(suggestion.sorting?.enabled).toBe(true);
    });

    it('should return disabled aggregation when no numeric columns', () => {
      const columns = [
        { name: 'region', type: 'string' },
        { name: 'description', type: 'text' },
      ];

      const suggestion = TableWidgetProcessor.getSuggestedConfig(columns);
      
      expect(suggestion.aggregation?.enabled).toBe(false);
      expect(suggestion.aggregation?.columns).toEqual([]);
    });
  });

  describe('process', () => {
    it('should process data correctly with summary row', () => {
      const result = TableWidgetProcessor.process(mockRawData, validConfig);
      
      expect(result.data).toHaveLength(3); // Original rows
      expect(result.summary).toBeDefined();
      // With chained aggregations: SUM([1000, 1500, 800]) = 3300 → AVG([3300]) = 3300
      expect(result.summary?.sales?.avg).toBe(3300); // Chained result
      expect(result.summary?.sales?.value).toBeDefined(); // Final value also stored here
      expect(result.summary?.profit?.max).toBe(300);
      expect(result.totalRows).toBe(3);
    });

    it('should process grouped aggregation correctly', () => {
      const config = {
        ...validConfig,
        aggregation: {
          ...validConfig.aggregation,
          groupBy: 'region',
          columns: [
            {
              column: 'region',
              aggregations: [{ function: 'first' as const, label: 'Region' }],
            },
            {
              column: 'sales',
              aggregations: [
                { function: 'sum' as const, label: 'Total Sales' },
                { function: 'avg' as const, label: 'Average Sales' },
              ],
            },
          ],
        }
      };

      const result = TableWidgetProcessor.process(mockRawData, config);
      
      expect(result.data).toHaveLength(2); // North and South groups
      expect(result.data[0]._groupKey).toBe('North');
      expect(result.data[0]._count).toBe(2);
      // With chained aggregations: SUM(1800) → AVG(1800) = 1800
      expect(result.data[0].sales).toBe(1800); // Final result stored with column name
      expect(result.data[0].sales_avg).toBe(1800); // Also stored with last aggregation function
      expect(result.data[1]._groupKey).toBe('South');
      expect(result.data[1]._count).toBe(1);
      expect(result.data[1].sales).toBe(1500); // SUM(1500) → AVG(1500) = 1500
    });

    it('should handle aggregation disabled', () => {
      const config = {
        ...validConfig,
        aggregation: {
          ...validConfig.aggregation,
          enabled: false,
        }
      };

      const result = TableWidgetProcessor.process(mockRawData, config);
      
      expect(result.data).toHaveLength(3); // Original rows
      expect(result.summary).toBeUndefined();
      expect(result.totalRows).toBe(3);
    });

    it('should handle empty data gracefully', () => {
      const result = TableWidgetProcessor.process([], validConfig);
      expect(result.data).toEqual([]);
      expect(result.totalRows).toBe(0);
    });

    it('should handle invalid data gracefully', () => {
      const result = TableWidgetProcessor.process(null as any, validConfig);
      expect(result.data).toEqual([]);
      expect(result.totalRows).toBe(0);
    });
  });

  describe('applySorting', () => {
    it('should sort data correctly in ascending order', () => {
      const data = [
        { name: 'Charlie', value: 30 },
        { name: 'Alice', value: 10 },
        { name: 'Bob', value: 20 },
      ];

      const sorted = TableWidgetProcessor.applySorting(data, 'value', 'asc');
      expect(sorted[0].value).toBe(10);
      expect(sorted[1].value).toBe(20);
      expect(sorted[2].value).toBe(30);
    });

    it('should sort data correctly in descending order', () => {
      const data = [
        { name: 'Alice', value: 10 },
        { name: 'Bob', value: 20 },
        { name: 'Charlie', value: 30 },
      ];

      const sorted = TableWidgetProcessor.applySorting(data, 'value', 'desc');
      expect(sorted[0].value).toBe(30);
      expect(sorted[1].value).toBe(20);
      expect(sorted[2].value).toBe(10);
    });
  });

  describe('applyPagination', () => {
    it('should paginate data correctly', () => {
      const data = Array(25).fill(null).map((_, i) => ({ id: i, name: `Item ${i}` }));

      const page1 = TableWidgetProcessor.applyPagination(data, 1, 10);
      expect(page1).toHaveLength(10);
      expect(page1[0].id).toBe(0);
      expect(page1[9].id).toBe(9);

      const page2 = TableWidgetProcessor.applyPagination(data, 2, 10);
      expect(page2).toHaveLength(10);
      expect(page2[0].id).toBe(10);
      expect(page2[9].id).toBe(19);

      const page3 = TableWidgetProcessor.applyPagination(data, 3, 10);
      expect(page3).toHaveLength(5);
      expect(page3[0].id).toBe(20);
      expect(page3[4].id).toBe(24);
    });
  });
});
