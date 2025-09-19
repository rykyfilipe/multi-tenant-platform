/**
 * Dashboard Components Index
 * Centralized exports and widget registration
 */

import { WidgetRegistry } from './WidgetRegistry';

// Import all widget components
import TableWidget from './TableWidget';
import { KPIWidget } from './KPIWidget';
import { TextWidget } from './TextWidget';
import { LineChartWidget } from './LineChartWidget';
import BarChartWidget from './BarChartWidget';
import PieChartWidget from './PieChartWidget';
import { TasksWidget } from './TasksWidget';
import { ClockWidget } from './ClockWidget';
import { CalendarWidget } from './CalendarWidget';
import { WeatherWidget } from './WeatherWidget';
// Register main widget types with metadata
WidgetRegistry.register('table', TableWidget, {
  requiredFields: ['titleColumn', 'valueColumn'],
  defaultConfig: { dataSource: { type: 'table', tableId: null, mapping: {} } },
  dataSourceTypes: ['table', 'manual'],
  description: 'Display data in a tabular format',
  icon: 'Table'
});

WidgetRegistry.register('metric', KPIWidget, {
  requiredFields: ['valueColumn'],
  defaultConfig: { dataSource: { type: 'table', tableId: null, mapping: {} } },
  dataSourceTypes: ['table', 'manual'],
  description: 'Display key performance indicators',
  icon: 'TrendingUp'
});

WidgetRegistry.register('text', TextWidget, {
  requiredFields: [],
  defaultConfig: { dataSource: { type: 'manual', content: '' } },
  dataSourceTypes: ['manual'],
  description: 'Display custom text content',
  icon: 'FileText'
});

WidgetRegistry.register('tasks', TasksWidget, {
  requiredFields: ['titleColumn', 'statusColumn'],
  defaultConfig: { dataSource: { type: 'table', tableId: null, mapping: {} } },
  dataSourceTypes: ['table', 'manual'],
  description: 'Manage and display task lists',
  icon: 'CheckSquare'
});

WidgetRegistry.register('clock', ClockWidget, {
  requiredFields: [],
  defaultConfig: { dataSource: { type: 'manual' } },
  dataSourceTypes: ['manual'],
  description: 'Display current time and date',
  icon: 'Clock'
});

WidgetRegistry.register('calendar', CalendarWidget, {
  requiredFields: ['dateColumn', 'titleColumn'],
  defaultConfig: { dataSource: { type: 'table', tableId: null, mapping: {} } },
  dataSourceTypes: ['table', 'manual'],
  description: 'Display events and appointments',
  icon: 'Calendar'
});

WidgetRegistry.register('weather', WeatherWidget, {
  requiredFields: ['locationColumn'],
  defaultConfig: { dataSource: { type: 'table', tableId: null, mapping: {} } },
  dataSourceTypes: ['table', 'manual', 'api'],
  description: 'Display weather information',
  icon: 'Cloud'
});

// Register chart sub-types
WidgetRegistry.registerChartSubType('line', LineChartWidget);
WidgetRegistry.registerChartSubType('bar', BarChartWidget);
WidgetRegistry.registerChartSubType('pie', PieChartWidget);

// Export the registry and factory for use in other components
export { WidgetRegistry } from './WidgetRegistry';
export { WidgetFactory } from './WidgetFactory';

// Export individual components for direct use if needed
export { default as TableWidget } from './TableWidget';
export { KPIWidget } from './KPIWidget';
export { TextWidget } from './TextWidget';
export { LineChartWidget } from './LineChartWidget';
export { default as BarChartWidget } from './BarChartWidget';
export { default as PieChartWidget } from './PieChartWidget';
export { TasksWidget } from './TasksWidget';
export { ClockWidget } from './ClockWidget';
export { CalendarWidget } from './CalendarWidget';
export { WeatherWidget } from './WeatherWidget';

// Export other dashboard components
export { default as BaseWidget } from './BaseWidget';
export { WidgetEditor } from './WidgetEditor';
export { DashboardSelector } from './DashboardSelector';
export { DashboardDetailsEditor } from './DashboardDetailsEditor';
export { DataEditor } from './DataEditor';
export { FilterBuilder } from './FilterBuilder';
export { TableSelector } from './TableSelector';

// Export types
export type { 
  BaseWidget, 
  WidgetType, 
  ChartType, 
  WidgetProps, 
  WidgetConfig, 
  WidgetStyleConfig,
  WidgetPreset,
  Position,
  DataSource,
  FilterConfig,
  ChartDataPoint
} from '@/types/widgets';
