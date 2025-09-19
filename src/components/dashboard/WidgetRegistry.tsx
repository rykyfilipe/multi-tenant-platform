/**
 * Enhanced Widget Registry Pattern
 * Centralized registry for widget components with data source mapping and validation
 */

import React from 'react';
import { WidgetType, ChartType, WidgetComponent, WidgetProps, BaseWidget } from '@/types/widgets';
import { AbstractBaseWidget, BaseWidgetConfig } from './AbstractBaseWidget';

export interface WidgetMetadata {
  component: WidgetComponent;
  requiredFields: string[];
  defaultConfig: any;
  dataSourceTypes: ('table' | 'manual' | 'api')[];
  description: string;
  icon: string;
}

export class WidgetRegistry {
  private static widgets = new Map<WidgetType, WidgetMetadata>();
  private static chartSubTypes = new Map<ChartType, WidgetMetadata>();
  private static widgetClasses = new Map<WidgetType, typeof AbstractBaseWidget>();

  /**
   * Register a main widget type with metadata
   */
  static register(
    type: WidgetType, 
    component: WidgetComponent, 
    metadata: Omit<WidgetMetadata, 'component'>
  ) {
    this.widgets.set(type, { component, ...metadata });
  }

  /**
   * Register a chart sub-type with metadata
   */
  static registerChartSubType(
    chartType: ChartType, 
    component: WidgetComponent, 
    metadata: Omit<WidgetMetadata, 'component'>
  ) {
    this.chartSubTypes.set(chartType, { component, ...metadata });
  }

  /**
   * Register a widget class for advanced functionality
   */
  static registerWidgetClass(type: WidgetType, widgetClass: typeof AbstractBaseWidget) {
    this.widgetClasses.set(type, widgetClass);
  }

  /**
   * Render a widget based on its type and configuration
   */
  static render(widget: BaseWidget, props: Omit<WidgetProps, 'widget'>): React.ReactElement | null {
    try {
      // Handle chart widgets with sub-types
      if (widget.type === 'chart') {
        const chartType = widget.config?.chartType || 'line';
        const metadata = this.chartSubTypes.get(chartType as ChartType);
        
        if (metadata) {
          return React.createElement(metadata.component, { ...props, widget });
        }
        
        // Fallback to line chart if sub-type not found
        const lineMetadata = this.chartSubTypes.get('line');
        if (lineMetadata) {
          return React.createElement(lineMetadata.component, { ...props, widget });
        }
      }
      
      // Handle main widget types
      const metadata = this.widgets.get(widget.type);
      if (metadata) {
        return React.createElement(metadata.component, { ...props, widget });
      }
      
      // Fallback to default widget
      return this.renderDefaultWidget(widget, props);
    } catch (error) {
      console.error(`[WidgetRegistry] Error rendering widget ${widget.type}:`, error);
      return this.renderErrorWidget(widget, props, error as Error);
    }
  }

  /**
   * Validate widget configuration against its metadata
   */
  static validateWidget(widget: BaseWidget): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Get widget metadata
    const metadata = this.getWidgetMetadata(widget.type);
    if (!metadata) {
      errors.push(`Unknown widget type: ${widget.type}`);
      return { isValid: false, errors };
    }

    // Check required fields
    for (const field of metadata.requiredFields) {
      if (!widget.config?.[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate data source
    if (widget.config?.dataSource) {
      const dataSourceValidation = this.validateDataSource(widget.config.dataSource, metadata);
      if (!dataSourceValidation.isValid) {
        errors.push(...dataSourceValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate data source configuration
   */
  static validateDataSource(
    dataSource: any, 
    metadata: WidgetMetadata
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dataSource.type) {
      errors.push('Data source type is required');
      return { isValid: false, errors };
    }

    if (!metadata.dataSourceTypes.includes(dataSource.type)) {
      errors.push(`Data source type '${dataSource.type}' is not supported for this widget`);
    }

    if (dataSource.type === 'table') {
      if (!dataSource.tableId) {
        errors.push('Table ID is required for table data source');
      }
      if (!dataSource.mapping || Object.keys(dataSource.mapping).length === 0) {
        errors.push('Column mapping is required for table data source');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get widget metadata
   */
  static getWidgetMetadata(type: WidgetType): WidgetMetadata | undefined {
    return this.widgets.get(type);
  }

  /**
   * Get chart metadata
   */
  static getChartMetadata(chartType: ChartType): WidgetMetadata | undefined {
    return this.chartSubTypes.get(chartType);
  }

  /**
   * Get widget class
   */
  static getWidgetClass(type: WidgetType): typeof AbstractBaseWidget | undefined {
    return this.widgetClasses.get(type);
  }

  /**
   * Create widget instance with proper class
   */
  static createWidgetInstance(
    config: BaseWidgetConfig, 
    lifecycle?: any
  ): AbstractBaseWidget | null {
    const WidgetClass = this.getWidgetClass(config.type);
    if (WidgetClass) {
      return new WidgetClass(config, lifecycle);
    }
    return null;
  }

  /**
   * Get all available widget types
   */
  static getAvailableTypes(): WidgetType[] {
    return Array.from(this.widgets.keys());
  }

  /**
   * Get all available chart types
   */
  static getAvailableChartTypes(): ChartType[] {
    return Array.from(this.chartSubTypes.keys());
  }

  /**
   * Check if a widget type is registered
   */
  static isRegistered(type: WidgetType): boolean {
    return this.widgets.has(type);
  }

  /**
   * Check if a chart type is registered
   */
  static isChartTypeRegistered(chartType: ChartType): boolean {
    return this.chartSubTypes.has(chartType);
  }

  /**
   * Get widget component by type
   */
  static getWidgetComponent(type: WidgetType): WidgetComponent | undefined {
    return this.widgets.get(type);
  }

  /**
   * Get chart component by type
   */
  static getChartComponent(chartType: ChartType): WidgetComponent | undefined {
    return this.chartSubTypes.get(chartType);
  }

  /**
   * Render default widget when type is not found
   */
  private static renderDefaultWidget(widget: BaseWidget, props: Omit<WidgetProps, 'widget'>): React.ReactElement {
    return React.createElement(DefaultWidget, { ...props, widget });
  }

  /**
   * Render error widget when rendering fails
   */
  private static renderErrorWidget(
    widget: BaseWidget, 
    props: Omit<WidgetProps, 'widget'>, 
    error: Error
  ): React.ReactElement {
    return React.createElement(ErrorWidget, { 
      ...props, 
      widget: {
        ...widget,
        title: `Error: ${widget.title || 'Unknown Widget'}`
      },
      error: error.message
    });
  }

  /**
   * Clear all registrations (useful for testing)
   */
  static clear() {
    this.widgets.clear();
    this.chartSubTypes.clear();
  }

  /**
   * Get registry statistics
   */
  static getStats() {
    return {
      widgetTypes: this.widgets.size,
      chartTypes: this.chartSubTypes.size,
      totalRegistrations: this.widgets.size + this.chartSubTypes.size
    };
  }
}

/**
 * Default Widget Component
 * Rendered when a widget type is not found
 */
function DefaultWidget({ widget, ...props }: WidgetProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="text-gray-500 text-sm font-medium mb-2">
          Unknown Widget Type
        </div>
        <div className="text-gray-400 text-xs">
          Type: {widget.type}
        </div>
        {widget.title && (
          <div className="text-gray-400 text-xs mt-1">
            Title: {widget.title}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Error Widget Component
 * Rendered when widget rendering fails
 */
function ErrorWidget({ widget, error, ...props }: WidgetProps & { error: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px] bg-red-50 rounded-lg border-2 border-dashed border-red-300">
      <div className="text-center">
        <div className="text-red-600 text-sm font-medium mb-2">
          Widget Error
        </div>
        <div className="text-red-500 text-xs">
          {error}
        </div>
        {widget.title && (
          <div className="text-red-400 text-xs mt-1">
            Widget: {widget.title}
          </div>
        )}
      </div>
    </div>
  );
}

export default WidgetRegistry;
