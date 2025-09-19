/**
 * Widget Registry Pattern
 * Centralized registry for widget components and their rendering logic
 */

import React from 'react';
import { WidgetType, ChartType, WidgetComponent, WidgetProps, BaseWidget } from '@/types/widgets';

export class WidgetRegistry {
  private static widgets = new Map<WidgetType, WidgetComponent>();
  private static chartSubTypes = new Map<ChartType, WidgetComponent>();

  /**
   * Register a main widget type
   */
  static register(type: WidgetType, component: WidgetComponent) {
    this.widgets.set(type, component);
  }

  /**
   * Register a chart sub-type
   */
  static registerChartSubType(chartType: ChartType, component: WidgetComponent) {
    this.chartSubTypes.set(chartType, component);
  }

  /**
   * Render a widget based on its type and configuration
   */
  static render(widget: BaseWidget, props: Omit<WidgetProps, 'widget'>): React.ReactElement | null {
    try {
      // Handle chart widgets with sub-types
      if (widget.type === 'chart') {
        const chartType = widget.config?.chartType || 'line';
        const Component = this.chartSubTypes.get(chartType as ChartType);
        
        if (Component) {
          return React.createElement(Component, { ...props, widget });
        }
        
        // Fallback to line chart if sub-type not found
        const LineComponent = this.chartSubTypes.get('line');
        if (LineComponent) {
          return React.createElement(LineComponent, { ...props, widget });
        }
      }
      
      // Handle main widget types
      const Component = this.widgets.get(widget.type);
      if (Component) {
        return React.createElement(Component, { ...props, widget });
      }
      
      // Fallback to default widget
      return this.renderDefaultWidget(widget, props);
    } catch (error) {
      console.error(`[WidgetRegistry] Error rendering widget ${widget.type}:`, error);
      return this.renderErrorWidget(widget, props, error as Error);
    }
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
