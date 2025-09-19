import { z } from 'zod';
import {
  PositionSchema,
  FilterConfigSchema,
  DataSourceSchema,
  WidgetConfigBaseSchema,
  BaseWidgetSchema,
  ChartWidgetConfigSchema,
  TableWidgetConfigSchema,
  MetricWidgetConfigSchema,
  TextWidgetConfigSchema,
  WidgetConfigSchemas,
  validateWidgetConfig
} from '@/lib/widget-schemas';

describe('Widget Schemas', () => {
  describe('PositionSchema', () => {
    it('should validate valid position', () => {
      const validPosition = {
        x: 0,
        y: 0,
        width: 4,
        height: 3
      };
      
      const result = PositionSchema.safeParse(validPosition);
      expect(result.success).toBe(true);
    });

    it('should reject invalid position', () => {
      const invalidPosition = {
        x: -1, // Invalid: negative x
        y: 0,
        width: 0, // Invalid: zero width
        height: 3
      };
      
      const result = PositionSchema.safeParse(invalidPosition);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
      }
    });

    it('should reject non-integer values', () => {
      const invalidPosition = {
        x: 1.5, // Invalid: not integer
        y: 0,
        width: 4,
        height: 3
      };
      
      const result = PositionSchema.safeParse(invalidPosition);
      expect(result.success).toBe(false);
    });
  });

  describe('FilterConfigSchema', () => {
    it('should validate valid filter config', () => {
      const validFilter = {
        id: 'filter-1',
        column: 'name',
        columnId: 1,
        columnName: 'Name',
        columnType: 'text',
        operator: 'equals',
        value: 'John',
        secondValue: null,
        type: 'text'
      };
      
      const result = FilterConfigSchema.safeParse(validFilter);
      expect(result.success).toBe(true);
    });

    it('should validate filter config with optional fields', () => {
      const validFilter = {
        id: 'filter-1',
        column: 'age',
        columnId: 2,
        columnName: 'Age',
        columnType: 'number',
        operator: 'between',
        value: 18,
        secondValue: 65
      };
      
      const result = FilterConfigSchema.safeParse(validFilter);
      expect(result.success).toBe(true);
    });
  });

  describe('DataSourceSchema', () => {
    describe('Table Data Source', () => {
      it('should validate table data source', () => {
        const validTableSource = {
          type: 'table',
          tableId: 1,
          columns: ['name', 'age'],
          columnX: 'name',
          columnY: 'age',
          column: 'name',
          filters: [],
          mapping: {
            titleColumn: 'name',
            valueColumn: 'age'
          }
        };
        
        const result = DataSourceSchema.safeParse(validTableSource);
        expect(result.success).toBe(true);
      });

      it('should validate table data source with minimal fields', () => {
        const minimalTableSource = {
          type: 'table',
          tableId: 1
        };
        
        const result = DataSourceSchema.safeParse(minimalTableSource);
        expect(result.success).toBe(true);
      });
    });

    describe('Manual Data Source', () => {
      it('should validate manual data source with content', () => {
        const validManualSource = {
          type: 'manual',
          content: 'Hello World'
        };
        
        const result = DataSourceSchema.safeParse(validManualSource);
        expect(result.success).toBe(true);
      });

      it('should validate manual data source with tasks', () => {
        const validManualSource = {
          type: 'manual',
          tasks: [
            { id: 1, title: 'Task 1', completed: false },
            { id: 2, title: 'Task 2', completed: true }
          ]
        };
        
        const result = DataSourceSchema.safeParse(validManualSource);
        expect(result.success).toBe(true);
      });

      it('should validate manual data source with events', () => {
        const validManualSource = {
          type: 'manual',
          events: [
            { id: 1, title: 'Event 1', date: '2024-01-01' },
            { id: 2, title: 'Event 2', date: '2024-01-02' }
          ]
        };
        
        const result = DataSourceSchema.safeParse(validManualSource);
        expect(result.success).toBe(true);
      });

      it('should validate manual data source with weather data', () => {
        const validManualSource = {
          type: 'manual',
          location: 'New York',
          weatherData: {
            temperature: 72,
            condition: 'sunny'
          }
        };
        
        const result = DataSourceSchema.safeParse(validManualSource);
        expect(result.success).toBe(true);
      });
    });

    describe('API Data Source', () => {
      it('should validate API data source', () => {
        const validApiSource = {
          type: 'api',
          endpoint: 'https://api.example.com/data',
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token'
          },
          body: {
            query: 'test'
          },
          mapping: {
            titleColumn: 'name',
            valueColumn: 'value'
          }
        };
        
        const result = DataSourceSchema.safeParse(validApiSource);
        expect(result.success).toBe(true);
      });

      it('should validate API data source with minimal fields', () => {
        const minimalApiSource = {
          type: 'api',
          endpoint: 'https://api.example.com/data'
        };
        
        const result = DataSourceSchema.safeParse(minimalApiSource);
        expect(result.success).toBe(true);
      });

      it('should reject invalid URL', () => {
        const invalidApiSource = {
          type: 'api',
          endpoint: 'not-a-url'
        };
        
        const result = DataSourceSchema.safeParse(invalidApiSource);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('WidgetConfigBaseSchema', () => {
    it('should validate base widget config', () => {
      const validConfig = {
        dataSource: {
          type: 'table',
          tableId: 1,
          mapping: {
            titleColumn: 'name',
            valueColumn: 'age'
          }
        },
        options: {
          showLegend: true,
          colors: ['#3b82f6']
        },
        title: 'My Widget'
      };
      
      const result = WidgetConfigBaseSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should validate config with minimal fields', () => {
      const minimalConfig = {};
      
      const result = WidgetConfigBaseSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('BaseWidgetSchema', () => {
    it('should validate complete widget', () => {
      const validWidget = {
        id: 1,
        type: 'table',
        title: 'My Table',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {
          dataSource: {
            type: 'table',
            tableId: 1,
            mapping: {
              titleColumn: 'name',
              valueColumn: 'age'
            }
          }
        },
        isVisible: true,
        order: 1,
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb'
        }
      };
      
      const result = BaseWidgetSchema.safeParse(validWidget);
      expect(result.success).toBe(true);
    });

    it('should validate widget with string ID', () => {
      const validWidget = {
        id: 'widget-1',
        type: 'text',
        title: null,
        position: { x: 0, y: 0, width: 2, height: 2 },
        config: {
          dataSource: {
            type: 'manual',
            content: 'Hello World'
          }
        },
        isVisible: true,
        order: 1
      };
      
      const result = BaseWidgetSchema.safeParse(validWidget);
      expect(result.success).toBe(true);
    });

    it('should reject invalid widget type', () => {
      const invalidWidget = {
        id: 1,
        type: 'invalid-type',
        title: 'My Widget',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {},
        isVisible: true,
        order: 1
      };
      
      const result = BaseWidgetSchema.safeParse(invalidWidget);
      expect(result.success).toBe(false);
    });
  });

  describe('Specific Widget Config Schemas', () => {
    describe('ChartWidgetConfigSchema', () => {
      it('should validate chart widget config', () => {
        const validChartConfig = {
          dataSource: {
            type: 'table',
            tableId: 1,
            mapping: {
              xColumn: 'name',
              yColumn: 'value'
            }
          },
          chartType: 'line',
          xAxisLabel: 'Name',
          yAxisLabel: 'Value',
          colors: ['#3b82f6', '#10b981'],
          showLegend: true,
          showGrid: true
        };
        
        const result = ChartWidgetConfigSchema.safeParse(validChartConfig);
        expect(result.success).toBe(true);
      });

      it('should reject invalid chart type', () => {
        const invalidChartConfig = {
          chartType: 'invalid-chart-type',
          dataSource: { type: 'manual' }
        };
        
        const result = ChartWidgetConfigSchema.safeParse(invalidChartConfig);
        expect(result.success).toBe(false);
      });
    });

    describe('TableWidgetConfigSchema', () => {
      it('should validate table widget config', () => {
        const validTableConfig = {
          dataSource: {
            type: 'table',
            tableId: 1,
            mapping: {
              titleColumn: 'name',
              valueColumn: 'age'
            }
          },
          pageSize: 10,
          showPagination: true,
          showSearch: true,
          showExport: false,
          showColumnSelector: true,
          sortBy: 'name',
          sortOrder: 'asc'
        };
        
        const result = TableWidgetConfigSchema.safeParse(validTableConfig);
        expect(result.success).toBe(true);
      });

      it('should reject invalid page size', () => {
        const invalidTableConfig = {
          dataSource: { type: 'manual' },
          pageSize: 0 // Invalid: must be at least 1
        };
        
        const result = TableWidgetConfigSchema.safeParse(invalidTableConfig);
        expect(result.success).toBe(false);
      });
    });

    describe('MetricWidgetConfigSchema', () => {
      it('should validate metric widget config', () => {
        const validMetricConfig = {
          dataSource: {
            type: 'table',
            tableId: 1,
            mapping: {
              valueColumn: 'amount'
            }
          },
          format: 'currency',
          decimals: 2,
          prefix: '$',
          suffix: '',
          showChange: true,
          showTrend: true,
          aggregation: 'sum'
        };
        
        const result = MetricWidgetConfigSchema.safeParse(validMetricConfig);
        expect(result.success).toBe(true);
      });

      it('should reject invalid aggregation', () => {
        const invalidMetricConfig = {
          dataSource: { type: 'manual' },
          aggregation: 'invalid-aggregation'
        };
        
        const result = MetricWidgetConfigSchema.safeParse(invalidMetricConfig);
        expect(result.success).toBe(false);
      });
    });

    describe('TextWidgetConfigSchema', () => {
      it('should validate text widget config', () => {
        const validTextConfig = {
          dataSource: {
            type: 'manual',
            content: 'Hello World'
          },
          fontSize: '16px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          textColor: '#000000'
        };
        
        const result = TextWidgetConfigSchema.safeParse(validTextConfig);
        expect(result.success).toBe(true);
      });

      it('should reject empty content', () => {
        const invalidTextConfig = {
          dataSource: {
            type: 'manual',
            content: '' // Invalid: content cannot be empty
          }
        };
        
        const result = TextWidgetConfigSchema.safeParse(invalidTextConfig);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validateWidgetConfig', () => {
    it('should validate widget config for known type', () => {
      const validConfig = {
        dataSource: { type: 'manual', content: 'Hello' },
        fontSize: '16px'
      };
      
      const result = validateWidgetConfig('text', validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject widget config for unknown type', () => {
      const validConfig = {
        dataSource: { type: 'manual', content: 'Hello' }
      };
      
      const result = validateWidgetConfig('unknown-type' as any, validConfig);
      expect(result.success).toBe(false);
    });

    it('should validate all supported widget types', () => {
      const configs = {
        chart: { chartType: 'line', dataSource: { type: 'manual' } },
        table: { pageSize: 10, dataSource: { type: 'manual' } },
        metric: { format: 'number', dataSource: { type: 'manual' } },
        text: { content: 'Hello', dataSource: { type: 'manual', content: 'Hello' } },
        tasks: { dataSource: { type: 'manual' } },
        clock: { dataSource: { type: 'manual' } },
        calendar: { dataSource: { type: 'manual' } },
        weather: { dataSource: { type: 'manual' } }
      };

      Object.entries(configs).forEach(([type, config]) => {
        const result = validateWidgetConfig(type as any, config);
        expect(result.success).toBe(true);
      });
    });
  });
});
