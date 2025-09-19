/**
 * Widget Factory Tests
 */

import { WidgetFactory } from '../WidgetFactory';
import { BaseWidget, WidgetType } from '@/types/widgets';

describe('WidgetFactory', () => {
  describe('Widget Creation', () => {
    it('should create a chart widget with default config', () => {
      const widget = WidgetFactory.create('chart');
      
      expect(widget.type).toBe('chart');
      expect(widget.title).toBe('New chart Widget');
      expect(widget.config.chartType).toBe('line');
      expect(widget.config.dataSource.type).toBe('table');
      expect(widget.position).toEqual({ x: 0, y: 0, width: 8, height: 6 });
    });

    it('should create a table widget with default config', () => {
      const widget = WidgetFactory.create('table');
      
      expect(widget.type).toBe('table');
      expect(widget.title).toBe('New table Widget');
      expect(widget.config.dataSource.type).toBe('table');
      expect(widget.config.options.pageSize).toBe(10);
    });

    it('should create a metric widget with default config', () => {
      const widget = WidgetFactory.create('metric');
      
      expect(widget.type).toBe('metric');
      expect(widget.title).toBe('New metric Widget');
      expect(widget.config.dataSource.type).toBe('table');
      expect(widget.config.dataSource.aggregation).toBe('sum');
    });

    it('should create a text widget with default config', () => {
      const widget = WidgetFactory.create('text');
      
      expect(widget.type).toBe('text');
      expect(widget.title).toBe('New text Widget');
      expect(widget.config.dataSource.type).toBe('manual');
      expect(widget.config.dataSource.content).toBe('Enter your text content here...');
    });

    it('should apply custom overrides', () => {
      const widget = WidgetFactory.create('chart', {
        title: 'Custom Chart',
        position: { x: 10, y: 20, width: 12, height: 8 }
      });
      
      expect(widget.title).toBe('Custom Chart');
      expect(widget.position).toEqual({ x: 10, y: 20, width: 12, height: 8 });
    });
  });

  describe('Multiple Widget Creation', () => {
    it('should create multiple widgets of the same type', () => {
      const widgets = WidgetFactory.createMultiple('chart', 3);
      
      expect(widgets).toHaveLength(3);
      expect(widgets[0].type).toBe('chart');
      expect(widgets[1].type).toBe('chart');
      expect(widgets[2].type).toBe('chart');
    });

    it('should apply base overrides to all widgets', () => {
      const widgets = WidgetFactory.createMultiple('chart', 2, {
        title: 'Base Chart'
      });
      
      expect(widgets[0].title).toBe('Base Chart 1');
      expect(widgets[1].title).toBe('Base Chart 2');
    });
  });

  describe('Widget Cloning', () => {
    it('should clone existing widget', () => {
      const originalWidget: BaseWidget = {
        id: '1',
        type: 'chart',
        title: 'Original Chart',
        position: { x: 0, y: 0, width: 8, height: 6 },
        config: { chartType: 'line' },
        isVisible: true,
        order: 0
      };

      const clonedWidget = WidgetFactory.clone(originalWidget);
      
      expect(clonedWidget.type).toBe(originalWidget.type);
      expect(clonedWidget.title).toBe('Original Chart (Copy)');
      expect(clonedWidget.config).toEqual(originalWidget.config);
      expect(clonedWidget.id).not.toBe(originalWidget.id);
    });

    it('should apply overrides when cloning', () => {
      const originalWidget: BaseWidget = {
        id: '1',
        type: 'chart',
        title: 'Original Chart',
        position: { x: 0, y: 0, width: 8, height: 6 },
        config: { chartType: 'line' },
        isVisible: true,
        order: 0
      };

      const clonedWidget = WidgetFactory.clone(originalWidget, {
        title: 'Cloned Chart',
        position: { x: 10, y: 10, width: 10, height: 8 }
      });
      
      expect(clonedWidget.title).toBe('Cloned Chart');
      expect(clonedWidget.position).toEqual({ x: 10, y: 10, width: 10, height: 8 });
    });
  });

  describe('Widget Validation', () => {
    it('should validate correct widget', () => {
      const widget = WidgetFactory.create('chart');
      const validation = WidgetFactory.validate(widget);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidWidget = {
        id: '',
        type: 'chart',
        title: '',
        position: { x: -1, y: -1, width: 0, height: 0 },
        config: {},
        isVisible: true,
        order: 0
      } as BaseWidget;

      const validation = WidgetFactory.validate(invalidWidget);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Smart Positioning', () => {
    it('should find smart position for new widget', () => {
      const existingWidgets: BaseWidget[] = [
        {
          id: '1',
          type: 'chart',
          title: 'Widget 1',
          position: { x: 0, y: 0, width: 8, height: 6 },
          config: {},
          isVisible: true,
          order: 0
        }
      ];

      const newWidget = WidgetFactory.createWithSmartPosition('table', existingWidgets);
      
      expect(newWidget.position.x).toBe(0);
      expect(newWidget.position.y).toBe(6); // Should be below existing widget
    });
  });

  describe('Utility Functions', () => {
    it('should return available widget types', () => {
      const types = WidgetFactory.getAvailableTypes();
      expect(types).toContain('chart');
      expect(types).toContain('table');
      expect(types).toContain('metric');
      expect(types).toContain('text');
    });

    it('should return type display names', () => {
      expect(WidgetFactory.getTypeDisplayName('chart')).toBe('Chart');
      expect(WidgetFactory.getTypeDisplayName('table')).toBe('Table');
      expect(WidgetFactory.getTypeDisplayName('metric')).toBe('KPI/Metric');
      expect(WidgetFactory.getTypeDisplayName('text')).toBe('Text');
    });

    it('should return type descriptions', () => {
      expect(WidgetFactory.getTypeDescription('chart')).toContain('charts');
      expect(WidgetFactory.getTypeDescription('table')).toContain('tabular');
      expect(WidgetFactory.getTypeDescription('metric')).toContain('indicators');
      expect(WidgetFactory.getTypeDescription('text')).toContain('text content');
    });

    it('should return type icons', () => {
      expect(WidgetFactory.getTypeIcon('chart')).toBe('BarChart3');
      expect(WidgetFactory.getTypeIcon('table')).toBe('Database');
      expect(WidgetFactory.getTypeIcon('metric')).toBe('TrendingUp');
      expect(WidgetFactory.getTypeIcon('text')).toBe('FileText');
    });
  });
});
