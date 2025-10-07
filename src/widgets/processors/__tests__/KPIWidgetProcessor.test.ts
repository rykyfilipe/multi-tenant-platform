import { KPIWidgetProcessor } from '../KPIWidgetProcessor';

describe('KPIWidgetProcessor', () => {
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
    metric: {
      field: 'sales',
      label: 'Total Sales',
      aggregations: [
        { function: 'sum' as const, label: 'Total' },
      ],
      format: 'currency' as const,
      showTrend: true,
      showComparison: false,
    },
    filters: [],
  };

  describe('validate', () => {
    it('should validate correct configuration', () => {
      const result = KPIWidgetProcessor.validate(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject metric without field', () => {
      const invalidConfig = {
        ...validConfig,
        metric: { ...validConfig.metric, field: '' }
      };
      const result = KPIWidgetProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('field'))).toBe(true);
    });

    it('should reject metric without aggregations', () => {
      const invalidConfig = {
        ...validConfig,
        metric: { ...validConfig.metric, aggregations: [] }
      };
      const result = KPIWidgetProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('aggregation'))).toBe(true);
    });

    it('should warn about too many chained aggregations', () => {
      const config = {
        ...validConfig,
        metric: {
          ...validConfig.metric,
          aggregations: [
            { function: 'sum' as const, label: 'Total' },
            { function: 'avg' as const, label: 'Average' },
            { function: 'max' as const, label: 'Maximum' },
            { function: 'min' as const, label: 'Minimum' },
            { function: 'count' as const, label: 'Count' },
            { function: 'sum' as const, label: 'Sum Again' }, // 6th
          ]
        }
      };
      
      const result = KPIWidgetProcessor.validate(config);
      expect(result.warnings).toContain('More than 5 chained aggregations may be hard to interpret');
    });

    it('should warn about COUNT followed by other aggregations', () => {
      const config = {
        ...validConfig,
        metric: {
          ...validConfig.metric,
          aggregations: [
            { function: 'count' as const, label: 'Count' },
            { function: 'avg' as const, label: 'Average' }, // After COUNT
          ]
        }
      };
      
      const result = KPIWidgetProcessor.validate(config);
      expect(result.warnings).toContain('Chaining aggregations after COUNT may produce unexpected results');
    });
  });

  describe('getSuggestedConfig', () => {
    it('should suggest single metric based on first numeric column', () => {
      const columns = [
        { name: 'region', type: 'string' },
        { name: 'revenue', type: 'number' },
        { name: 'customers', type: 'number' },
        { name: 'profit', type: 'decimal' },
        { name: 'description', type: 'text' },
      ];

      const suggestion = KPIWidgetProcessor.getSuggestedConfig(columns);
      
      expect(suggestion.metric).toBeDefined();
      expect(suggestion.metric?.field).toBe('revenue');
      expect(suggestion.metric?.aggregations).toHaveLength(1);
      expect(suggestion.metric?.aggregations[0].function).toBe('sum');
      expect(suggestion.metric?.label).toBe('Total Revenue');
    });

    it('should return undefined metric when no numeric columns', () => {
      const columns = [
        { name: 'region', type: 'string' },
        { name: 'description', type: 'text' },
      ];

      const suggestion = KPIWidgetProcessor.getSuggestedConfig(columns);
      
      expect(suggestion.metric).toBeUndefined();
    });
  });

  describe('process', () => {
    it('should process data correctly with single aggregation', () => {
      const result = KPIWidgetProcessor.process(mockRawData, validConfig);
      
      expect(result).toBeDefined();
      expect(result.value).toBe(3300); // 1000 + 1500 + 800
      expect(result.aggregation).toBe('Total');
      expect(result.label).toBe('Total Sales');
      expect(result.metric).toBe('sales');
    });

    it('should apply multiple aggregations independently', () => {
      const config = {
        ...validConfig,
        metric: {
          ...validConfig.metric,
          aggregations: [
            { function: 'sum' as const, label: 'Total' },
            { function: 'avg' as const, label: 'Average' },
          ]
        }
      };

      const result = KPIWidgetProcessor.process(mockRawData, config);
      
      // Each aggregation is applied independently to original values:
      // SUM([1000, 1500, 800]) = 3300
      // AVG([1000, 1500, 800]) = 1100
      // Result shows last aggregation (AVG)
      expect(result.value).toBe(1100);
      expect(result.aggregation).toBe('Average'); // Final aggregation label
      expect(result.allAggregations).toBeDefined();
      expect(result.allAggregations).toHaveLength(2);
      expect(result.allAggregations?.[0].value).toBe(3300); // SUM
      expect(result.allAggregations?.[1].value).toBe(1100); // AVG
    });

    it('should calculate trend correctly', () => {
      const config = {
        ...validConfig,
        metric: {
          ...validConfig.metric,
          showTrend: true,
        }
      };

      const result = KPIWidgetProcessor.process(mockRawData, config);
      
      expect(result.trend).toBeDefined();
      expect(result.trend?.direction).toBeDefined();
      expect(['up', 'down', 'stable']).toContain(result.trend?.direction);
    });

    it('should calculate comparison correctly when target is provided', () => {
      const config = {
        ...validConfig,
        metric: {
          ...validConfig.metric,
          showComparison: true,
          target: 3000,
        }
      };

      const result = KPIWidgetProcessor.process(mockRawData, config);
      
      expect(result.comparison).toBeDefined();
      expect(result.comparison?.target).toBe(3000);
      expect(result.comparison?.status).toBe('above'); // 3300 > 3000
    });

    it('should handle empty data gracefully', () => {
      const result = KPIWidgetProcessor.process([], validConfig);
      expect(result.value).toBe(0);
      expect(result.metric).toBe('sales');
    });

    it('should handle multiple independent aggregations', () => {
      const config = {
        ...validConfig,
        metric: {
          field: 'sales',
          label: 'Complex KPI',
          aggregations: [
            { function: 'sum' as const, label: 'Total' },
            { function: 'max' as const, label: 'Max' },
            { function: 'avg' as const, label: 'Average' },
          ],
        }
      };

      const result = KPIWidgetProcessor.process(mockRawData, config);
      
      // Each aggregation is applied independently to original values:
      // SUM([1000, 1500, 800]) = 3300
      // MAX([1000, 1500, 800]) = 1500
      // AVG([1000, 1500, 800]) = 1100
      // Result shows last aggregation (AVG)
      expect(result.value).toBe(1100);
      expect(result.aggregation).toBe('Average'); // Final label
      expect(result.allAggregations).toHaveLength(3);
      expect(result.allAggregations?.[0].value).toBe(3300); // SUM
      expect(result.allAggregations?.[1].value).toBe(1500); // MAX
      expect(result.allAggregations?.[2].value).toBe(1100); // AVG
    });
  });
});
