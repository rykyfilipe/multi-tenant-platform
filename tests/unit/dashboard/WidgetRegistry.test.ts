import React from 'react';
import { WidgetRegistry } from '@/components/dashboard/WidgetRegistry';
import { WidgetType } from '@/types/widgets';

// Mock components
const MockWidget = () => React.createElement('div', null, 'Mock Widget');
const MockChartWidget = () => React.createElement('div', null, 'Mock Chart Widget');

describe('WidgetRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    WidgetRegistry.clear();
  });

  describe('Widget Registration', () => {
    it('should register a widget with metadata', () => {
      const metadata = {
        requiredFields: ['titleColumn', 'valueColumn'],
        defaultConfig: { dataSource: { type: 'table' as const, tableId: null, mapping: {} } },
        dataSourceTypes: ['table' as const, 'manual' as const],
        description: 'Test widget',
        icon: 'Test'
      };

      WidgetRegistry.register('table', MockWidget, metadata);

      expect(WidgetRegistry.isRegistered('table')).toBe(true);
      const widgetMetadata = WidgetRegistry.getWidgetComponent('table');
      expect(widgetMetadata?.component).toBe(MockWidget);
    });

    it('should register a chart sub-type', () => {
      const metadata = {
        requiredFields: ['xColumn', 'yColumn'],
        defaultConfig: { dataSource: { type: 'table' as const, tableId: null, mapping: {} } },
        dataSourceTypes: ['table' as const, 'manual' as const],
        description: 'Test chart',
        icon: 'BarChart'
      };

      WidgetRegistry.registerChartSubType('bar', MockChartWidget, metadata);

      expect(WidgetRegistry.isChartTypeRegistered('bar')).toBe(true);
      const chartMetadata = WidgetRegistry.getChartComponent('bar');
      expect(chartMetadata?.component).toBe(MockChartWidget);
    });
  });

  describe('Widget Validation', () => {
    beforeEach(() => {
      // Register test widgets
      WidgetRegistry.register('table', MockWidget, {
        requiredFields: ['titleColumn', 'valueColumn'],
        defaultConfig: { dataSource: { type: 'table' as const, tableId: null, mapping: {} } },
        dataSourceTypes: ['table' as const, 'manual' as const],
        description: 'Test widget',
        icon: 'Test'
      });

      WidgetRegistry.register('text', MockWidget, {
        requiredFields: [],
        defaultConfig: { dataSource: { type: 'manual' as const, content: '' } },
        dataSourceTypes: ['manual' as const],
        description: 'Text widget',
        icon: 'Text'
      });
    });

    it('should validate widget with complete configuration', () => {
      const widget = {
        id: 1,
        type: 'table' as WidgetType,
        title: 'Test Widget',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {
          titleColumn: 'name', // Required field at config level
          valueColumn: 'amount', // Required field at config level
          dataSource: {
            type: 'table' as const,
            tableId: 1,
            mapping: {
              titleColumn: 'name',
              valueColumn: 'amount'
            }
          }
        },
        isVisible: true,
        order: 1
      };

      const result = WidgetRegistry.validateWidget(widget);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate widget with missing required fields', () => {
      const widget = {
        id: 1,
        type: 'table' as WidgetType,
        title: 'Test Widget',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {
          dataSource: {
            type: 'table' as const,
            tableId: 1,
            mapping: {
              titleColumn: 'name'
              // Missing valueColumn
            }
          }
        },
        isVisible: true,
        order: 1
      };

      const result = WidgetRegistry.validateWidget(widget);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Required field 'valueColumn' is missing");
    });

    it('should validate widget with invalid data source type', () => {
      const widget = {
        id: 1,
        type: 'text' as WidgetType,
        title: 'Test Widget',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {
          dataSource: {
            type: 'table' as const,
            tableId: 1,
            mapping: {}
          }
        },
        isVisible: true,
        order: 1
      };

      const result = WidgetRegistry.validateWidget(widget);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Data source type 'table' is not supported for this widget");
    });

    it('should validate widget with incomplete table data source', () => {
      const widget = {
        id: 1,
        type: 'table' as WidgetType,
        title: 'Test Widget',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {
          dataSource: {
            type: 'table' as const,
            // Missing tableId
            mapping: {
              titleColumn: 'name',
              valueColumn: 'amount'
            }
          }
        },
        isVisible: true,
        order: 1
      };

      const result = WidgetRegistry.validateWidget(widget);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table ID is required for table data source');
    });

    it('should validate widget with empty column mapping', () => {
      const widget = {
        id: 1,
        type: 'table' as WidgetType,
        title: 'Test Widget',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {
          dataSource: {
            type: 'table' as const,
            tableId: 1,
            mapping: {} // Empty mapping
          }
        },
        isVisible: true,
        order: 1
      };

      const result = WidgetRegistry.validateWidget(widget);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Column mapping is required for table data source');
    });
  });

  describe('Data Source Validation', () => {
    beforeEach(() => {
      WidgetRegistry.register('table', MockWidget, {
        requiredFields: ['titleColumn', 'valueColumn'],
        defaultConfig: { dataSource: { type: 'table' as const, tableId: null, mapping: {} } },
        dataSourceTypes: ['table' as const, 'manual' as const],
        description: 'Test widget',
        icon: 'Test'
      });
    });

    it('should validate table data source', () => {
      const dataSource = {
        type: 'table' as const,
        tableId: 1,
        mapping: {
          titleColumn: 'name',
          valueColumn: 'amount'
        }
      };

      const metadata = WidgetRegistry.getWidgetMetadata('table')!;
      const result = WidgetRegistry.validateDataSource(dataSource, metadata);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate manual data source', () => {
      const dataSource = {
        type: 'manual' as const,
        content: 'Test content'
      };

      const metadata = WidgetRegistry.getWidgetMetadata('table')!;
      const result = WidgetRegistry.validateDataSource(dataSource, metadata);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject unsupported data source type', () => {
      const dataSource = {
        type: 'api' as const,
        endpoint: 'https://api.example.com'
      };

      const metadata = WidgetRegistry.getWidgetMetadata('table')!;
      const result = WidgetRegistry.validateDataSource(dataSource, metadata);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Data source type 'api' is not supported for this widget");
    });
  });

  describe('Widget Metadata', () => {
    beforeEach(() => {
      WidgetRegistry.register('table', MockWidget, {
        requiredFields: ['titleColumn', 'valueColumn'],
        defaultConfig: { dataSource: { type: 'table' as const, tableId: null, mapping: {} } },
        dataSourceTypes: ['table' as const, 'manual' as const],
        description: 'Test widget',
        icon: 'Test'
      });
    });

    it('should get widget metadata', () => {
      const metadata = WidgetRegistry.getWidgetMetadata('table');
      expect(metadata).toBeDefined();
      expect(metadata?.requiredFields).toEqual(['titleColumn', 'valueColumn']);
      expect(metadata?.description).toBe('Test widget');
      expect(metadata?.icon).toBe('Test');
    });

    it('should return undefined for unknown widget type', () => {
      const metadata = WidgetRegistry.getWidgetMetadata('unknown' as WidgetType);
      expect(metadata).toBeUndefined();
    });

    it('should get available widget types', () => {
      const types = WidgetRegistry.getAvailableTypes();
      expect(types).toContain('table');
    });

    it('should get available chart types', () => {
      WidgetRegistry.registerChartSubType('bar', MockChartWidget, {
        requiredFields: ['xColumn', 'yColumn'],
        defaultConfig: { dataSource: { type: 'table' as const, tableId: null, mapping: {} } },
        dataSourceTypes: ['table' as const, 'manual' as const],
        description: 'Bar chart',
        icon: 'BarChart'
      });

      const chartTypes = WidgetRegistry.getAvailableChartTypes();
      expect(chartTypes).toContain('bar');
    });
  });

  describe('Registry Statistics', () => {
    it('should return correct statistics', () => {
      WidgetRegistry.register('table', MockWidget, {
        requiredFields: [],
        defaultConfig: {},
        dataSourceTypes: ['manual' as const],
        description: 'Test',
        icon: 'Test'
      });

      WidgetRegistry.registerChartSubType('bar', MockChartWidget, {
        requiredFields: [],
        defaultConfig: {},
        dataSourceTypes: ['manual' as const],
        description: 'Test',
        icon: 'Test'
      });

      const stats = WidgetRegistry.getStats();
      expect(stats.widgetTypes).toBe(1);
      expect(stats.chartTypes).toBe(1);
      expect(stats.totalRegistrations).toBe(2);
    });
  });
});
