/**
 * Widget Registry
 * Centralized registry for widget editors and data mappers
 */

import React from 'react';
import { 
  WidgetType, 
  WidgetEditorComponent, 
  WidgetMapper, 
  WidgetEditorProps,
  DataMapper,
  MappedData,
  WidgetTypeSpecificConfig,
  LineChartConfig,
  BarChartConfig,
  PieChartConfig,
  TableConfig,
  MetricConfig,
  TextConfig,
  CalendarConfig,
  TasksConfig,
  ClockConfig,
  WeatherConfig
} from '@/types/widget-refactored';

// Import widget editors (lazy loaded)
const LineChartEditor = React.lazy(() => import('@/components/dashboard/editors/LineChartEditor'));
const BarChartEditor = React.lazy(() => import('@/components/dashboard/editors/BarChartEditor'));
const PieChartEditor = React.lazy(() => import('@/components/dashboard/editors/PieChartEditor'));
const TableEditor = React.lazy(() => import('@/components/dashboard/editors/TableEditor'));
const MetricEditor = React.lazy(() => import('@/components/dashboard/editors/MetricEditor'));
const TextEditor = React.lazy(() => import('@/components/dashboard/editors/TextEditor'));
const CalendarEditor = React.lazy(() => import('@/components/dashboard/editors/CalendarEditor'));
const TasksEditor = React.lazy(() => import('@/components/dashboard/editors/TasksEditor'));
const ClockEditor = React.lazy(() => import('@/components/dashboard/editors/ClockEditor'));
const WeatherEditor = React.lazy(() => import('@/components/dashboard/editors/WeatherEditor'));

// Fallback editor component
const FallbackEditor: React.FC<WidgetEditorProps> = ({ widget, onCancel }) => {
  return (
    <div className="p-6 text-center">
      <div className="text-red-500 text-lg font-semibold mb-2">
        No Editor Available
      </div>
      <p className="text-gray-600 mb-4">
        No editor is available for widget type: <code className="bg-gray-100 px-2 py-1 rounded">{widget.type}</code>
      </p>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Close
      </button>
    </div>
  );
};

// Widget Editors Registry
export const WIDGET_EDITORS: Record<WidgetType, WidgetEditorComponent> = {
  // Chart types
  line: { component: LineChartEditor, type: 'line' },
  bar: { component: BarChartEditor, type: 'bar' },
  pie: { component: PieChartEditor, type: 'pie' },
  area: { component: LineChartEditor, type: 'area' }, // Reuse line chart editor
  scatter: { component: LineChartEditor, type: 'scatter' }, // Reuse line chart editor
  
  // Data display types
  table: { component: TableEditor, type: 'table' },
  metric: { component: MetricEditor, type: 'metric' },
  text: { component: TextEditor, type: 'text' },
  image: { component: TextEditor, type: 'image' }, // Reuse text editor
  
  // Specialized types
  calendar: { component: CalendarEditor, type: 'calendar' },
  tasks: { component: TasksEditor, type: 'tasks' },
  clock: { component: ClockEditor, type: 'clock' },
  weather: { component: WeatherEditor, type: 'weather' },
  
  // Advanced chart types (reuse existing editors)
  gauge: { component: MetricEditor, type: 'gauge' },
  funnel: { component: BarChartEditor, type: 'funnel' },
  heatmap: { component: TableEditor, type: 'heatmap' },
  treemap: { component: PieChartEditor, type: 'treemap' },
};

// Data mappers for each widget type
export const WIDGET_MAPPERS: Record<WidgetType, WidgetMapper> = {
  // Chart mappers
  line: { 
    mapper: mapLineChartData, 
    type: 'line' 
  },
  bar: { 
    mapper: mapBarChartData, 
    type: 'bar' 
  },
  pie: { 
    mapper: mapPieChartData, 
    type: 'pie' 
  },
  area: { 
    mapper: mapLineChartData, // Reuse line chart mapper
    type: 'area' 
  },
  scatter: { 
    mapper: mapScatterChartData, 
    type: 'scatter' 
  },
  
  // Data display mappers
  table: { 
    mapper: mapTableData, 
    type: 'table' 
  },
  metric: { 
    mapper: mapMetricData, 
    type: 'metric' 
  },
  text: { 
    mapper: mapTextData, 
    type: 'text' 
  },
  image: { 
    mapper: mapTextData, // Reuse text mapper
    type: 'image' 
  },
  
  // Specialized mappers
  calendar: { 
    mapper: mapCalendarData, 
    type: 'calendar' 
  },
  tasks: { 
    mapper: mapTasksData, 
    type: 'tasks' 
  },
  clock: { 
    mapper: mapClockData, 
    type: 'clock' 
  },
  weather: { 
    mapper: mapWeatherData, 
    type: 'weather' 
  },
  
  // Advanced chart mappers
  gauge: { 
    mapper: mapGaugeData, 
    type: 'gauge' 
  },
  funnel: { 
    mapper: mapFunnelData, 
    type: 'funnel' 
  },
  heatmap: { 
    mapper: mapHeatmapData, 
    type: 'heatmap' 
  },
  treemap: { 
    mapper: mapTreemapData, 
    type: 'treemap' 
  },
};

// Centralized data mapping function
export function mapWidgetData(
  widgetType: WidgetType,
  rawData: any[],
  config: WidgetTypeSpecificConfig
): MappedData {
  const mapper = WIDGET_MAPPERS[widgetType];
  
  if (!mapper) {
    console.error(`No mapper found for widget type: ${widgetType}`);
    return {
      type: widgetType,
      data: rawData,
      metadata: {
        error: `No mapper found for widget type: ${widgetType}`,
        totalRows: rawData.length
      }
    };
  }

  try {
    const mappedData = mapper.mapper(rawData, config);
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

// Get widget editor component
export function getWidgetEditor(widgetType: WidgetType): React.ComponentType<WidgetEditorProps> {
  const editor = WIDGET_EDITORS[widgetType];
  
  if (!editor) {
    console.warn(`No editor found for widget type: ${widgetType}, using fallback`);
    return FallbackEditor;
  }

  return editor.component;
}

// Validate widget type
export function isValidWidgetType(type: string): type is WidgetType {
  return type in WIDGET_EDITORS;
}

// Data mapping functions (memoized for performance)
const memoizedMappers = new Map<string, DataMapper>();

function getMemoizedMapper(widgetType: WidgetType): DataMapper {
  const key = `mapper-${widgetType}`;
  
  if (!memoizedMappers.has(key)) {
    const mapper = WIDGET_MAPPERS[widgetType];
    if (mapper) {
      memoizedMappers.set(key, mapper.mapper);
    }
  }
  
  return memoizedMappers.get(key) || ((data: any[]) => data);
}

// Individual data mapping functions
function mapLineChartData(rawData: any[], config: LineChartConfig): any {
  if (!config.xAxis || !config.yAxis) {
    return { error: 'Missing required axis configuration' };
  }

  return rawData.map(row => ({
    x: row[config.xAxis],
    y: row[config.yAxis],
    ...(config.series ? config.series.reduce((acc, series) => ({
      ...acc,
      [series]: row[series]
    }), {}) : {})
  }));
}

function mapBarChartData(rawData: any[], config: BarChartConfig): any {
  if (!config.xAxis || !config.yAxis) {
    return { error: 'Missing required axis configuration' };
  }

  return rawData.map(row => ({
    category: row[config.xAxis],
    value: row[config.yAxis],
    ...(config.series ? config.series.reduce((acc, series) => ({
      ...acc,
      [series]: row[series]
    }), {}) : {})
  }));
}

function mapPieChartData(rawData: any[], config: PieChartConfig): any {
  if (!config.labelColumn || !config.valueColumn) {
    return { error: 'Missing required label or value column' };
  }

  return rawData.map(row => ({
    label: row[config.labelColumn],
    value: row[config.valueColumn]
  }));
}

function mapScatterChartData(rawData: any[], config: LineChartConfig): any {
  // Similar to line chart but with different styling
  return mapLineChartData(rawData, config);
}

function mapTableData(rawData: any[], config: TableConfig): any {
  if (!config.columns || config.columns.length === 0) {
    return { error: 'No columns specified for table' };
  }

  return {
    headers: config.columns,
    rows: rawData.map(row => 
      config.columns.map(col => row[col])
    ),
    totalRows: rawData.length
  };
}

function mapMetricData(rawData: any[], config: MetricConfig): any {
  if (!config.valueColumn) {
    return { error: 'Missing value column for metric' };
  }

  const values = rawData.map(row => row[config.valueColumn]).filter(val => val != null);
  const sum = values.reduce((acc, val) => acc + Number(val), 0);
  const avg = values.length > 0 ? sum / values.length : 0;
  const max = Math.max(...values);
  const min = Math.min(...values);

  return {
    value: config.comparisonColumn ? {
      current: sum,
      previous: rawData.map(row => row[config.comparisonColumn!]).reduce((acc, val) => acc + Number(val), 0)
    } : sum,
    statistics: { sum, avg, max, min, count: values.length },
    format: config.format || 'number'
  };
}

function mapTextData(rawData: any[], config: TextConfig): any {
  return {
    content: config.content || '',
    style: {
      fontSize: config.fontSize || 14,
      fontFamily: config.fontFamily || 'inherit',
      color: config.color || '#000000',
      backgroundColor: config.backgroundColor || 'transparent',
      textAlign: config.textAlign || 'left',
      fontWeight: config.fontWeight || 'normal'
    }
  };
}

function mapCalendarData(rawData: any[], config: CalendarConfig): any {
  if (!config.dateColumn) {
    return { error: 'Missing date column for calendar' };
  }

  return rawData.map(row => ({
    id: row.id || Math.random().toString(36).substr(2, 9),
    title: row[config.titleColumn || 'title'] || 'Event',
    start: new Date(row[config.dateColumn]),
    end: row[config.dateColumn + '_end'] ? new Date(row[config.dateColumn + '_end']) : new Date(row[config.dateColumn]),
    description: row[config.descriptionColumn || 'description'],
    color: row[config.colorColumn || 'color'] || '#3788d8'
  }));
}

function mapTasksData(rawData: any[], config: TasksConfig): any {
  if (!config.titleColumn || !config.statusColumn) {
    return { error: 'Missing required columns for tasks' };
  }

  return rawData.map(row => ({
    id: row.id || Math.random().toString(36).substr(2, 9),
    title: row[config.titleColumn],
    status: row[config.statusColumn],
    priority: row[config.priorityColumn || 'priority'] || 'medium',
    assignee: row[config.assigneeColumn || 'assignee'],
    dueDate: row[config.dueDateColumn || 'dueDate'] ? new Date(row[config.dueDateColumn]) : null,
    completed: row[config.statusColumn] === 'completed'
  }));
}

function mapClockData(rawData: any[], config: ClockConfig): any {
  return {
    timezone: config.timezone || 'UTC',
    format: config.format || '24h',
    showDate: config.showDate !== false,
    showSeconds: config.showSeconds !== false,
    style: config.style || 'digital'
  };
}

function mapWeatherData(rawData: any[], config: WeatherConfig): any {
  // Weather data would typically come from an external API
  // This is a placeholder implementation
  return {
    location: config.location || 'Unknown',
    units: config.units || 'metric',
    showForecast: config.showForecast !== false,
    forecastDays: config.forecastDays || 5,
    current: rawData[0] || null,
    forecast: rawData.slice(1) || []
  };
}

function mapGaugeData(rawData: any[], config: MetricConfig): any {
  const metricData = mapMetricData(rawData, config);
  return {
    ...metricData,
    min: 0,
    max: metricData.value * 2, // Dynamic max based on data
    threshold: metricData.value * 0.8
  };
}

function mapFunnelData(rawData: any[], config: BarChartConfig): any {
  return mapBarChartData(rawData, config);
}

function mapHeatmapData(rawData: any[], config: TableConfig): any {
  return mapTableData(rawData, config);
}

function mapTreemapData(rawData: any[], config: PieChartConfig): any {
  return mapPieChartData(rawData, config);
}
