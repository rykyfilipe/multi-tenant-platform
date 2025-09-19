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
import ContainerWidget from './ContainerWidget';

// Register main widget types
WidgetRegistry.register('table', TableWidget);
WidgetRegistry.register('metric', KPIWidget);
WidgetRegistry.register('text', TextWidget);
WidgetRegistry.register('tasks', TasksWidget);
WidgetRegistry.register('clock', ClockWidget);
WidgetRegistry.register('calendar', CalendarWidget);
WidgetRegistry.register('weather', WeatherWidget);
WidgetRegistry.register('container', ContainerWidget);

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
export { default as ContainerWidget } from './ContainerWidget';

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
