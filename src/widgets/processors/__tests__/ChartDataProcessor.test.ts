import { ChartDataProcessor } from '../ChartDataProcessor';

describe('ChartDataProcessor', () => {
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
    mappings: {
      x: 'region',
      y: ['sales', 'profit'],
    },
    processing: {
      mode: 'raw' as const,
    },
    filters: [],
  };

  describe('validate', () => {
    it('should validate correct configuration', () => {
      const result = ChartDataProcessor.validate(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without X axis', () => {
      const invalidConfig = { ...validConfig, mappings: { ...validConfig.mappings, x: '' } };
      const result = ChartDataProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('mappings.x: X axis is required');
    });

    it('should reject configuration without Y axis', () => {
      const invalidConfig = { ...validConfig, mappings: { ...validConfig.mappings, y: [] } };
      const result = ChartDataProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('mappings.y: At least one Y axis column is required');
    });

    it('should reject aggregated mode without group by', () => {
      const invalidConfig = {
        ...validConfig,
        processing: { mode: 'aggregated' as const }
      };
      const result = ChartDataProcessor.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Group By column is required for aggregated mode');
    });
  });

  describe('getSuggestedConfig', () => {
    it('should suggest configuration based on columns', () => {
      const columns = [
        { name: 'month', type: 'string' },
        { name: 'revenue', type: 'number' },
        { name: 'customers', type: 'number' },
      ];

      const suggestion = ChartDataProcessor.getSuggestedConfig(columns);
      
      expect(suggestion.mappings?.x).toBe('month');
      expect(suggestion.mappings?.y).toEqual(['revenue', 'customers']);
      expect(suggestion.processing?.mode).toBe('raw');
    });

    it('should suggest aggregated mode when no numeric columns', () => {
      const columns = [
        { name: 'category', type: 'string' },
        { name: 'description', type: 'text' },
      ];

      const suggestion = ChartDataProcessor.getSuggestedConfig(columns);
      
      expect(suggestion.mappings?.x).toBe('category');
      expect(suggestion.mappings?.y).toEqual([]);
      expect(suggestion.processing?.mode).toBe('aggregated');
    });
  });

  describe('process', () => {
    it('should process raw data correctly', () => {
      const result = ChartDataProcessor.process(mockRawData, validConfig);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: 'North',
        sales: 1000,
        profit: 200,
      });
      expect(result[1]).toEqual({
        name: 'South',
        sales: 1500,
        profit: 300,
      });
      expect(result[2]).toEqual({
        name: 'North',
        sales: 800,
        profit: 150,
      });
    });

    it('should process aggregated data correctly', () => {
      const aggregatedConfig = {
        ...validConfig,
        processing: {
          mode: 'aggregated' as const,
          groupBy: 'region',
          aggregationFunction: 'sum' as const,
        },
      };

      const result = ChartDataProcessor.process(mockRawData, aggregatedConfig);
      
      expect(result).toHaveLength(2);
      
      const northGroup = result.find(r => r.name === 'North');
      const southGroup = result.find(r => r.name === 'South');
      
      expect(northGroup?.sales).toBe(1800); // 1000 + 800
      expect(northGroup?.profit).toBe(350); // 200 + 150
      expect(southGroup?.sales).toBe(1500);
      expect(southGroup?.profit).toBe(300);
    });

    it('should apply Top N filtering', () => {
      const topNConfig = {
        ...validConfig,
        topN: {
          enabled: true,
          count: 2,
          autoSort: true,
        },
      };

      const result = ChartDataProcessor.process(mockRawData, topNConfig);
      
      expect(result).toHaveLength(2);
      // Should be sorted by first Y column (sales) in descending order
      expect(result[0].sales).toBeGreaterThanOrEqual(result[1].sales);
    });

    it('should handle empty data gracefully', () => {
      const result = ChartDataProcessor.process([], validConfig);
      expect(result).toEqual([]);
    });

    it('should handle invalid data gracefully', () => {
      const result = ChartDataProcessor.process(null as any, validConfig);
      expect(result).toEqual([]);
    });
  });
});
