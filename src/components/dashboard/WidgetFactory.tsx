/**
 * Widget Factory Pattern
 * Centralized widget creation with default configurations
 */

import { BaseWidget, WidgetType, WidgetConfig, Position, WidgetFactoryOptions } from '@/types/widgets';

export class WidgetFactory {
  private static readonly DEFAULT_POSITION: Position = { x: 0, y: 0, width: 8, height: 6 };
  
  /**
   * Create a new widget with default configuration
   */
  static create(type: WidgetType, overrides: WidgetFactoryOptions = {}): BaseWidget {
    const baseWidget: BaseWidget = {
      id: this.generateId(),
      type,
      title: overrides.title || `New ${type} Widget`,
      position: { ...this.DEFAULT_POSITION, ...overrides.position },
      config: this.getDefaultConfig(type, overrides.config),
      isVisible: overrides.isVisible ?? true,
      order: overrides.order ?? 0,
      style: overrides.style,
      parentId: overrides.parentId
    };

    return baseWidget;
  }

  /**
   * Create multiple widgets of the same type
   */
  static createMultiple(
    type: WidgetType, 
    count: number, 
    baseOverrides: WidgetFactoryOptions = {}
  ): BaseWidget[] {
    const widgets: BaseWidget[] = [];
    
    for (let i = 0; i < count; i++) {
      const overrides = {
        ...baseOverrides,
        title: baseOverrides.title ? `${baseOverrides.title} ${i + 1}` : undefined,
        position: baseOverrides.position ? {
          ...baseOverrides.position,
          x: (baseOverrides.position.x || 0) + (i * 2)
        } : undefined
      };
      
      widgets.push(this.create(type, overrides));
    }
    
    return widgets;
  }

  /**
   * Create a widget from existing configuration
   */
  static fromConfig(config: Partial<BaseWidget>): BaseWidget {
    const type = config.type || 'text';
    const baseWidget = this.create(type as WidgetType);
    
    return {
      ...baseWidget,
      ...config,
      id: config.id || baseWidget.id,
      type: type as WidgetType
    };
  }

  /**
   * Clone an existing widget with optional modifications
   */
  static clone(widget: BaseWidget, overrides: Partial<BaseWidget> = {}): BaseWidget {
    return {
      ...widget,
      ...overrides,
      id: overrides.id || this.generateId(),
      title: overrides.title || `${widget.title} (Copy)`
    };
  }

  /**
   * Get default configuration for a widget type
   */
  private static getDefaultConfig(type: WidgetType, customConfig?: Partial<WidgetConfig>): WidgetConfig {
    const configs: Record<WidgetType, WidgetConfig> = {
      chart: {
        chartType: 'line',
        dataSource: {
          type: 'table',
          tableId: null,
          columnX: null,
          columnY: null,
          filters: []
        },
        options: {
          title: '',
          xAxisLabel: 'X Axis',
          yAxisLabel: 'Y Axis',
          colors: ['#3B82F6'],
          showLegend: true,
          showGrid: true,
          strokeWidth: 2,
          dotSize: 4,
          curveType: 'monotone'
        },
        xAxis: { key: 'x', label: 'X Axis', type: 'category' },
        yAxis: { key: 'y', label: 'Y Axis', type: 'number' }
      },
      table: {
        dataSource: {
          type: 'table',
          tableId: null,
          columns: [],
          filters: [],
          sortBy: null,
          sortOrder: 'asc'
        },
        options: {
          pageSize: 10,
          showPagination: true,
          showSearch: true,
          showExport: true,
          showColumnSelector: true,
          showHeader: true,
          sortable: true
        }
      },
      metric: {
        dataSource: {
          type: 'table',
          tableId: null,
          column: null,
          aggregation: 'sum',
          filters: []
        },
        options: {
          format: 'number',
          decimals: 0,
          prefix: '',
          suffix: '',
          showChange: true,
          showTrend: true,
          showPreviousValue: true,
          showPercentage: true
        }
      },
      text: {
        dataSource: {
          type: 'manual',
          content: 'Enter your text content here...'
        },
        options: {
          fontSize: 16,
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'left',
          backgroundColor: '',
          padding: 'md',
          showBorder: true,
          borderRadius: 'md'
        }
      },
      tasks: {
        dataSource: {
          type: 'manual',
          tasks: []
        },
        options: {
          showCompleted: true,
          maxTasks: 10,
          allowAdd: true,
          allowEdit: true,
          allowDelete: true,
          showPriority: false
        }
      },
      clock: {
        dataSource: {
          type: 'manual'
        },
        options: {
          format: '24h',
          timezone: 'UTC',
          showSeconds: true,
          showDate: true,
          showTimezone: true,
          size: 'md'
        }
      },
      calendar: {
        dataSource: {
          type: 'manual',
          events: []
        },
        options: {
          view: 'month',
          showWeekends: true,
          allowAdd: true,
          allowEdit: true,
          allowDelete: true,
          maxEvents: 10
        }
      },
      weather: {
        dataSource: {
          type: 'manual',
          location: 'New York, NY',
          weatherData: null
        },
        options: {
          unit: 'celsius',
          showForecast: true,
          showDetails: true,
          autoRefresh: true,
          refreshInterval: 30
        }
      },
      container: {
        dataSource: {
          type: 'manual'
        },
        options: {
          layout: 'grid',
          columns: 2,
          gap: 16,
          padding: 16,
          backgroundColor: '#f8fafc',
          borderColor: '#e2e8f0',
          borderRadius: 8,
          showBorder: true,
          showBackground: true
        }
      }
    };

    const defaultConfig = configs[type];
    return customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig;
  }

  /**
   * Generate a unique widget ID
   */
  private static generateId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate widget configuration
   */
  static validate(widget: BaseWidget): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!widget.id) errors.push('Widget ID is required');
    if (!widget.type) errors.push('Widget type is required');
    if (!widget.title) errors.push('Widget title is required');
    if (!widget.position) errors.push('Widget position is required');
    if (!widget.config) errors.push('Widget config is required');

    // Validate position
    if (widget.position) {
      if (widget.position.x < 0) errors.push('Position X must be non-negative');
      if (widget.position.y < 0) errors.push('Position Y must be non-negative');
      if (widget.position.width < 1) errors.push('Position width must be at least 1');
      if (widget.position.height < 1) errors.push('Position height must be at least 1');
    }

    // Validate config based on type
    if (widget.config && widget.type) {
      const configErrors = this.validateConfig(widget.type, widget.config);
      errors.push(...configErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate widget configuration based on type
   */
  private static validateConfig(type: WidgetType, config: WidgetConfig): string[] {
    const errors: string[] = [];

    switch (type) {
      case 'chart':
        if (!config.chartType) errors.push('Chart type is required');
        if (!config.dataSource) errors.push('Data source is required');
        break;
      
      case 'table':
        if (!config.dataSource) errors.push('Data source is required');
        if (config.dataSource?.type !== 'table') {
          errors.push('Table widget must have table data source');
        }
        break;
      
      case 'metric':
        if (!config.dataSource) errors.push('Data source is required');
        if (!config.dataSource?.column) {
          errors.push('Metric widget must have a column selected');
        }
        break;
      
      case 'text':
        if (!config.dataSource?.content) {
          errors.push('Text widget must have content');
        }
        break;
    }

    return errors;
  }

  /**
   * Get available widget types
   */
  static getAvailableTypes(): WidgetType[] {
    return ['chart', 'table', 'metric', 'text'];
  }

  /**
   * Get widget type display name
   */
  static getTypeDisplayName(type: WidgetType): string {
    const displayNames: Record<WidgetType, string> = {
      chart: 'Chart',
      table: 'Table',
      metric: 'KPI/Metric',
      text: 'Text',
      tasks: 'Tasks',
      clock: 'Clock',
      calendar: 'Calendar',
      weather: 'Weather',
      container: 'Container'
    };
    
    return displayNames[type] || type;
  }

  /**
   * Get widget type description
   */
  static getTypeDescription(type: WidgetType): string {
    const descriptions: Record<WidgetType, string> = {
      chart: 'Display data as interactive charts (line, bar, pie)',
      table: 'Display data in a tabular format with sorting and filtering',
      metric: 'Display key performance indicators and metrics',
      text: 'Display custom text content with formatting options',
      tasks: 'Manage and track tasks with add, edit, and delete functionality',
      clock: 'Display current time with timezone support and customizable format',
      calendar: 'Show calendar with events and date navigation',
      weather: 'Display weather information with forecasts and location support',
      container: 'Organize widgets in a container with customizable layout and styling'
    };
    
    return descriptions[type] || 'Unknown widget type';
  }

  /**
   * Get widget type icon (for UI purposes)
   */
  static getTypeIcon(type: WidgetType): string {
    const icons: Record<WidgetType, string> = {
      chart: 'BarChart3',
      table: 'Database',
      metric: 'TrendingUp',
      text: 'FileText',
      tasks: 'CheckSquare',
      clock: 'Clock',
      calendar: 'Calendar',
      weather: 'Cloud',
      container: 'Layout'
    };
    
    return icons[type] || 'Settings';
  }

  /**
   * Create a widget with smart positioning
   */
  static createWithSmartPosition(
    type: WidgetType, 
    existingWidgets: BaseWidget[], 
    overrides: WidgetFactoryOptions = {}
  ): BaseWidget {
    const widget = this.create(type, overrides);
    const smartPosition = this.findSmartPosition(existingWidgets, widget.position);
    
    return {
      ...widget,
      position: smartPosition
    };
  }

  /**
   * Find the best position for a new widget
   */
  private static findSmartPosition(existingWidgets: BaseWidget[], preferredPosition: Position): Position {
    const gridWidth = 12;
    const maxY = 20;
    
    // Create a grid to track occupied positions
    const occupied = new Set<string>();
    
    existingWidgets.forEach(widget => {
      if (widget.position) {
        const { x, y, width, height } = widget.position;
        for (let dy = 0; dy < height; dy++) {
          for (let dx = 0; dx < width; dx++) {
            occupied.add(`${x + dx},${y + dy}`);
          }
        }
      }
    });
    
    // Try to place at preferred position first
    if (this.canPlaceAt(preferredPosition, occupied, gridWidth)) {
      return preferredPosition;
    }
    
    // Find the first available position
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x <= gridWidth - preferredPosition.width; x++) {
        const testPosition = { ...preferredPosition, x, y };
        if (this.canPlaceAt(testPosition, occupied, gridWidth)) {
          return testPosition;
        }
      }
    }
    
    // If no position found, place at the bottom
    const lowestY = Math.max(0, ...existingWidgets.map(w => 
      (w.position?.y || 0) + (w.position?.height || 6)
    ));
    
    return { ...preferredPosition, y: lowestY };
  }

  /**
   * Check if a position is available
   */
  private static canPlaceAt(position: Position, occupied: Set<string>, gridWidth: number): boolean {
    if (position.x + position.width > gridWidth) return false;
    
    for (let dy = 0; dy < position.height; dy++) {
      for (let dx = 0; dx < position.width; dx++) {
        if (occupied.has(`${position.x + dx},${position.y + dy}`)) {
          return false;
        }
      }
    }
    
    return true;
  }
}

export default WidgetFactory;
