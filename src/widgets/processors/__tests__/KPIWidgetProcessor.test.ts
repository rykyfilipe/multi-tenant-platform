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
    metrics: [
      {
        field: 'sales',
        label: 'Total Sales',
        aggregations: [
          { function: 'sum' as const, label: 'Total' },
          { function: 'avg' as const, label: 'Average' },
        ],
        format: 'currency' as const,
        showTrend: true,
        showComparison: false,
      }
    ],
    filters: [],
  };

  describe('validate', () => {
    it('should validate correct configuration', () => {
      const result = KPIWidgetProcessor.validate(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without metrics', () => {
      const invalidConfig = { ...validConfig, metrics: [] };
      const result = KPIWidgetProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('metrics: At least one metric is required');
    });

    it('should reject metric without field', () => {
      const invalidConfig = {
        ...validConfig,
        metrics: [{ ...validConfig.metrics[0], field: '' }]
      };
      const result = KPIWidgetProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('metrics.0.field: Field is required');
    });

    it('should reject metric without aggregations', () => {
      const invalidConfig = {
        ...validConfig,
        metrics: [{ ...validConfig.metrics[0], aggregations: [] }]
      };
      const result = KPIWidgetProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('metrics.0.aggregations: At least one aggregation is required');
    });

    it('should warn about too many metrics', () => {
      const manyMetrics = Array(15).fill(null).map((_, i) => ({
        field: `field${i}`,
        label: `Metric ${i}`,
        aggregations: [{ function: 'sum' as const, label: 'Total' }],
      }));
      
      const config = { ...validConfig, metrics: manyMetrics };
      const result = KPIWidgetProcessor.validate(config);
      
      expect(result.warnings).toContain('More than 12 metrics may impact performance and readability');
    });

    it('should detect duplicate aggregations', () => {
      const config = {
        ...validConfig,
        metrics: [{
          field: 'sales',
          label: 'Sales',
          aggregations: [
            { function: 'sum' as const, label: 'Total 1' },
            { function: 'sum' as const, label: 'Total 2' }, // Duplicate
          ],
        }]
      };
      
      const result = KPIWidgetProcessor.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate aggregation: sum on sales');
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

      const suggestion = KPIWidgetProcessor.getSuggestedConfig(columns);
      
      expect(suggestion.metrics).toHaveLength(3); // revenue, customers, profit
      expect(suggestion.metrics?.[0].field).toBe('revenue');
      expect(suggestion.metrics?.[0].aggregations).toHaveLength(2);
      expect(suggestion.metrics?.[0].aggregations[0].function).toBe('sum');
      expect(suggestion.metrics?.[0].aggregations[1].function).toBe('avg');
    });

    it('should return empty metrics when no numeric columns', () => {
      const columns = [
        { name: 'region', type: 'string' },
        { name: 'description', type: 'text' },
      ];

      const suggestion = KPIWidgetProcessor.getSuggestedConfig(columns);
      
      expect(suggestion.metrics).toEqual([]);
    });
  });

  describe('process', () => {
    it('should process data correctly with multiple aggregations', () => {
      const result = KPIWidgetProcessor.process(mockRawData, validConfig);
      
      expect(result).toHaveLength(2); // sum and avg
      
      const sumResult = result.find(r => r.aggregation === 'sum');
      const avgResult = result.find(r => r.aggregation === 'avg');
      
      expect(sumResult?.value).toBe(3300); // 1000 + 1500 + 800
      expect(avgResult?.value).toBe(1100); // 3300 / 3
      expect(sumResult?.label).toBe('Total');
      expect(avgResult?.label).toBe('Average');
    });

    it('should calculate trend correctly', () => {
      const config = {
        ...validConfig,
        metrics: [{
          ...validConfig.metrics[0],
          showTrend: true,
        }]
      };

      const result = KPIWidgetProcessor.process(mockRawData, config);
      
      const sumResult = result.find(r => r.aggregation === 'sum');
      expect(sumResult?.trend).toBeDefined();
      expect(sumResult?.trend?.direction).toBeDefined();
    });

    it('should calculate comparison correctly when target is provided', () => {
      const config = {
        ...validConfig,
        metrics: [{
          ...validConfig.metrics[0],
          showComparison: true,
          target: 3000,
        }]
      };

      const result = KPIWidgetProcessor.process(mockRawData, config);
      
      const sumResult = result.find(r => r.aggregation === 'sum');
      expect(sumResult?.comparison).toBeDefined();
      expect(sumResult?.comparison?.target).toBe(3000);
      expect(sumResult?.comparison?.status).toBe('above'); // 3300 > 3000
    });

    it('should handle empty data gracefully', () => {
      const result = KPIWidgetProcessor.process([], validConfig);
      expect(result).toEqual([]);
    });

    it('should handle invalid data gracefully', () => {
      const result = KPIWidgetProcessor.process(null as any, validConfig);
      expect(result).toEqual([]);
    });

    it('should process multiple metrics correctly', () => {
      const config = {
        ...validConfig,
        metrics: [
          {
            field: 'sales',
            label: 'Sales',
            aggregations: [{ function: 'sum' as const, label: 'Total' }],
          },
          {
            field: 'profit',
            label: 'Profit',
            aggregations: [{ function: 'max' as const, label: 'Maximum' }],
          }
        ]
      };

      const result = KPIWidgetProcessor.process(mockRawData, config);
      
      expect(result).toHaveLength(2);
      
      const salesResult = result.find(r => r.metric === 'sales-sum');
      const profitResult = result.find(r => r.metric === 'profit-max');
      
      expect(salesResult?.value).toBe(3300); // sum of sales
      expect(profitResult?.value).toBe(300); // max profit
    });
  });
});
