/**
 * Simplified Widget Registry
 * Centralized registry for widget editors and data mappers
 */

import React from 'react';
import { 
  WidgetType, 
  WidgetEditorProps,
  MappedData,
  WidgetTypeSpecificConfig
} from '@/types/widget';

// Fallback editor component
const FallbackEditor: React.FC<WidgetEditorProps> = ({ widget, onCancel }) => {
  return React.createElement('div', { className: 'p-6 text-center' },
    React.createElement('div', { className: 'text-red-500 text-lg font-semibold mb-2' }, 'No Editor Available'),
    React.createElement('p', { className: 'text-gray-600 mb-4' }, 
      'No editor is available for widget type: ',
      React.createElement('code', { className: 'bg-gray-100 px-2 py-1 rounded' }, widget.type)
    ),
    React.createElement('button', {
      onClick: onCancel,
      className: 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600'
    }, 'Close')
  );
};

// Widget Editors Registry - simplified approach with any type to avoid complex type issues
export const WIDGET_EDITORS: Record<string, React.ComponentType<any>> = {
  line: React.lazy(() => import('@/components/dashboard/editors/LineChartEditor')),
  bar: React.lazy(() => import('@/components/dashboard/editors/BarChartEditor')),
  pie: React.lazy(() => import('@/components/dashboard/editors/PieChartEditor')),
  area: React.lazy(() => import('@/components/dashboard/editors/LineChartEditor')), // Reuse line chart editor
  scatter: React.lazy(() => import('@/components/dashboard/editors/LineChartEditor')), // Reuse line chart editor
  table: React.lazy(() => import('@/components/dashboard/editors/TableEditor')),
  metric: React.lazy(() => import('@/components/dashboard/editors/MetricEditor')),
  text: React.lazy(() => import('@/components/dashboard/editors/TextEditor')),
  image: React.lazy(() => import('@/components/dashboard/editors/TextEditor')), // Reuse text editor
  calendar: React.lazy(() => import('@/components/dashboard/editors/CalendarEditor')),
  tasks: React.lazy(() => import('@/components/dashboard/editors/TasksEditor')),
  clock: React.lazy(() => import('@/components/dashboard/editors/ClockEditor')),
  weather: React.lazy(() => import('@/components/dashboard/editors/WeatherEditor')),
  gauge: React.lazy(() => import('@/components/dashboard/editors/MetricEditor')), // Reuse metric editor
  funnel: React.lazy(() => import('@/components/dashboard/editors/BarChartEditor')), // Reuse bar chart editor
  heatmap: React.lazy(() => import('@/components/dashboard/editors/TableEditor')), // Reuse table editor
  treemap: React.lazy(() => import('@/components/dashboard/editors/PieChartEditor')), // Reuse pie chart editor
};

// Centralized data mapping function
export function mapWidgetData(
  widgetType: WidgetType,
  rawData: any[],
  config: WidgetTypeSpecificConfig
): MappedData {
  try {
    // Basic data transformation based on widget type
    let mappedData: any = rawData;

    switch (widgetType) {
      case 'line':
      case 'bar':
      case 'area':
      case 'scatter':
        // Chart data transformation
        if (config && 'xAxis' in config && 'yAxis' in config) {
          mappedData = rawData.map(row => ({
            x: row[config.xAxis],
            y: row[config.yAxis],
          }));
        }
        break;

      case 'pie':
        // Pie chart data transformation
        if (config && 'labelColumn' in config && 'valueColumn' in config) {
          mappedData = rawData.map(row => ({
            label: row[config.labelColumn],
            value: row[config.valueColumn]
          }));
        }
        break;

      case 'table':
        // Table data transformation
        if (config && 'columns' in config) {
          mappedData = {
            headers: config.columns,
            rows: rawData.map(row => 
              config.columns.map((col: string) => row[col])
            ),
            totalRows: rawData.length
          };
        }
        break;

      case 'metric':
        // Metric data transformation with flexible aggregation
        if (config && 'dataSource' in config) {
          const dataSource = config.dataSource as any;
          const targetColumn = dataSource.yAxis?.columns?.[0] || 
                              dataSource.columnY;
          
          if (targetColumn) {
            const values = rawData.map(row => row[targetColumn]).filter(val => val != null);
            const aggregation = (config as any).aggregation || 'sum';
            
            let result: number;
            switch (aggregation) {
              case 'sum':
                result = values.reduce((acc, val) => acc + Number(val), 0);
                break;
              case 'avg':
                result = values.length > 0 ? values.reduce((acc, val) => acc + Number(val), 0) / values.length : 0;
                break;
              case 'min':
                result = values.length > 0 ? Math.min(...values.map(val => Number(val))) : 0;
                break;
              case 'max':
                result = values.length > 0 ? Math.max(...values.map(val => Number(val))) : 0;
                break;
              case 'count':
                result = values.length;
                break;
              default:
                result = values.reduce((acc, val) => acc + Number(val), 0);
            }
            
            mappedData = { 
              value: result, 
              count: values.length,
              aggregation,
              column: targetColumn
            };
          }
        }
        break;

      case 'calendar':
        // Calendar data transformation
        if (config && 'dateColumn' in config) {
          mappedData = rawData.map(row => ({
            id: row.id || Math.random().toString(36).substr(2, 9),
            title: row[config.titleColumn || 'title'] || 'Event',
            start: new Date(row[config.dateColumn]),
            end: row[config.dateColumn + '_end'] ? new Date(row[config.dateColumn + '_end']) : new Date(row[config.dateColumn]),
          }));
        }
        break;

      case 'tasks':
        // Tasks data transformation
        if (config && 'titleColumn' in config && 'statusColumn' in config) {
          mappedData = rawData.map(row => ({
            id: row.id || Math.random().toString(36).substr(2, 9),
            title: row[config.titleColumn],
            status: row[config.statusColumn],
            priority: row[config.priorityColumn || 'priority'] || 'medium',
            completed: row[config.statusColumn] === 'completed'
          }));
        }
        break;

      case 'text':
        // Text data transformation
        mappedData = {
          content: config && 'content' in config ? config.content : '',
          style: {
            fontSize: config && 'fontSize' in config ? config.fontSize : 14,
            color: config && 'color' in config ? config.color : '#000000',
          }
        };
        break;

      case 'clock':
      case 'weather':
        // These widgets don't transform raw data
        mappedData = { type: widgetType, config };
        break;

      default:
        // Fallback - return raw data
        mappedData = rawData;
    }

    return {
      type: widgetType,
      data: mappedData,
      metadata: {
        totalRows: rawData.length,
        lastUpdated: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error(`Error mapping data for widget type ${widgetType}:`, error);
    
    return {
      type: widgetType,
      data: rawData,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown mapping error',
        totalRows: rawData.length,
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

// Get widget editor component with safe fallback
export function getWidgetEditor(widgetType: WidgetType): React.ComponentType<any> {
  const editor = WIDGET_EDITORS[widgetType];
  
  if (!editor) {
    console.warn(`No editor found for widget type: ${widgetType}, using fallback`);
    return FallbackEditor;
  }

  // Wrap the editor with error boundary for additional safety
  const SafeEditor: React.FC<any> = (props) => {
    try {
      const EditorComponent = editor;
      return React.createElement(EditorComponent, props);
    } catch (error) {
      console.error(`Error rendering editor for widget type ${widgetType}:`, error);
      return React.createElement(FallbackEditor, props);
    }
  };

  return SafeEditor;
}

// Validate widget type
export function isValidWidgetType(type: string): type is WidgetType {
  return type in WIDGET_EDITORS || ['line', 'bar', 'pie', 'area', 'scatter', 'table', 'metric', 'text', 'image', 'calendar', 'tasks', 'clock', 'weather', 'gauge', 'funnel', 'heatmap', 'treemap'].includes(type);
}
