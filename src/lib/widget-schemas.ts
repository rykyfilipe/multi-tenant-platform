/**
 * Zod Schemas for Widget Configuration Validation
 * Provides type-safe validation for all widget configurations and data sources
 */

import { z } from 'zod';
import { WidgetType, ChartType } from '@/types/widgets';

// Base position schema
export const PositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1).max(12),
  height: z.number().min(1).max(20),
});

// Filter configuration schema
export const FilterConfigSchema = z.object({
  id: z.string(),
  column: z.string(),
  columnId: z.number(),
  columnName: z.string(),
  columnType: z.enum(['string', 'number', 'boolean', 'date', 'datetime']),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'between', 'in', 'not_in']),
  value: z.union([z.string(), z.number(), z.boolean(), z.date(), z.null()]).optional(),
  secondValue: z.union([z.string(), z.number(), z.boolean(), z.date(), z.null()]).optional(),
  type: z.string().optional(),
});

// Data source schema
export const DataSourceSchema = z.object({
  type: z.enum(['table', 'manual', 'api']),
  tableId: z.number().nullable().optional(),
  mapping: z.record(z.string(), z.string()).optional(),
  columns: z.array(z.string()).optional(),
  columnX: z.string().nullable().optional(),
  columnY: z.string().nullable().optional(),
  column: z.string().nullable().optional(),
  filters: z.array(FilterConfigSchema).optional(),
  content: z.string().optional(),
  apiUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  refreshInterval: z.number().min(30).optional(),
}).passthrough(); // Allow additional properties

// Base widget configuration schema
export const BaseWidgetConfigSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.enum(['chart', 'table', 'metric', 'text', 'tasks', 'clock', 'calendar', 'weather']),
  title: z.string().min(1).max(100),
  position: PositionSchema,
  config: z.record(z.any()).optional(),
  isVisible: z.boolean().default(true),
  order: z.number().min(0).default(0),
  style: z.record(z.any()).optional(),
  dataSource: DataSourceSchema.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Chart-specific configuration schema
export const ChartConfigSchema = z.object({
  chartType: z.enum(['line', 'bar', 'pie']).default('line'),
  dataSource: DataSourceSchema.optional(),
  options: z.object({
    title: z.string().optional(),
    xAxisLabel: z.string().optional(),
    yAxisLabel: z.string().optional(),
    colors: z.array(z.string()).optional(),
    showLegend: z.boolean().default(true),
    showGrid: z.boolean().default(true),
    strokeWidth: z.number().min(1).max(10).default(2),
    dotSize: z.number().min(1).max(20).default(4),
    curveType: z.enum(['linear', 'monotone', 'step', 'stepBefore', 'stepAfter']).default('monotone'),
  }).optional(),
  xAxis: z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['category', 'number', 'date']),
  }).optional(),
  yAxis: z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['category', 'number', 'date']),
  }).optional(),
});

// Table-specific configuration schema
export const TableConfigSchema = z.object({
  dataSource: DataSourceSchema.optional(),
  options: z.object({
    pageSize: z.number().min(1).max(100).default(10),
    showPagination: z.boolean().default(true),
    showSearch: z.boolean().default(true),
    showExport: z.boolean().default(true),
    showColumnSelector: z.boolean().default(true),
    showHeader: z.boolean().default(true),
    sortable: z.boolean().default(true),
  }).optional(),
  sortBy: z.string().nullable().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Metric/KPI-specific configuration schema
export const MetricConfigSchema = z.object({
  dataSource: DataSourceSchema.optional(),
  options: z.object({
    format: z.enum(['number', 'currency', 'percentage', 'duration']).default('number'),
    decimals: z.number().min(0).max(10).default(0),
    prefix: z.string().default(''),
    suffix: z.string().default(''),
    showChange: z.boolean().default(true),
    showTrend: z.boolean().default(true),
    showPreviousValue: z.boolean().default(true),
    showPercentage: z.boolean().default(true),
  }).optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).default('sum'),
});

// Text-specific configuration schema
export const TextConfigSchema = z.object({
  dataSource: z.object({
    type: z.literal('manual'),
    content: z.string(),
  }).optional(),
  options: z.object({
    fontSize: z.number().min(8).max(72).default(16),
    fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('normal'),
    color: z.string().default('#000000'),
    textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
    backgroundColor: z.string().default(''),
    padding: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']).default('md'),
    showBorder: z.boolean().default(true),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full']).default('md'),
  }).optional(),
});

// Tasks-specific configuration schema
export const TasksConfigSchema = z.object({
  dataSource: z.object({
    type: z.literal('manual'),
    tasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean().default(false),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      dueDate: z.date().optional(),
      description: z.string().optional(),
    })).default([]),
  }).optional(),
  options: z.object({
    showCompleted: z.boolean().default(true),
    maxTasks: z.number().min(1).max(100).default(10),
    allowAdd: z.boolean().default(true),
    allowEdit: z.boolean().default(true),
    allowDelete: z.boolean().default(true),
    showPriority: z.boolean().default(false),
  }).optional(),
});

// Clock-specific configuration schema
export const ClockConfigSchema = z.object({
  dataSource: z.object({
    type: z.literal('manual'),
  }).optional(),
  options: z.object({
    format: z.enum(['12h', '24h']).default('24h'),
    timezone: z.string().default('UTC'),
    showSeconds: z.boolean().default(true),
    showDate: z.boolean().default(true),
    showTimezone: z.boolean().default(true),
    size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
  }).optional(),
});

// Calendar-specific configuration schema
export const CalendarConfigSchema = z.object({
  dataSource: z.object({
    type: z.literal('manual'),
    events: z.array(z.object({
      id: z.string(),
      title: z.string(),
      start: z.date(),
      end: z.date(),
      allDay: z.boolean().default(false),
      color: z.string().optional(),
      description: z.string().optional(),
    })).default([]),
  }).optional(),
  options: z.object({
    view: z.enum(['month', 'week', 'day']).default('month'),
    showWeekends: z.boolean().default(true),
    allowAdd: z.boolean().default(true),
    allowEdit: z.boolean().default(true),
    allowDelete: z.boolean().default(true),
    maxEvents: z.number().min(1).max(1000).default(10),
  }).optional(),
});

// Weather-specific configuration schema
export const WeatherConfigSchema = z.object({
  dataSource: z.object({
    type: z.literal('manual'),
    location: z.string().default('New York, NY'),
    weatherData: z.any().nullable().optional(),
  }).optional(),
  options: z.object({
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius'),
    showForecast: z.boolean().default(true),
    showDetails: z.boolean().default(true),
    autoRefresh: z.boolean().default(true),
    refreshInterval: z.number().min(30).max(3600).default(30),
  }).optional(),
});

// Widget type-specific schemas
export const WidgetConfigSchemas = {
  chart: ChartConfigSchema,
  table: TableConfigSchema,
  metric: MetricConfigSchema,
  text: TextConfigSchema,
  tasks: TasksConfigSchema,
  clock: ClockConfigSchema,
  calendar: CalendarConfigSchema,
  weather: WeatherConfigSchema,
} as const;

// Main widget validation function
export function validateWidgetConfig(widget: any): { isValid: boolean; errors: string[]; data?: any } {
  try {
    // First validate base structure
    const baseResult = BaseWidgetConfigSchema.safeParse(widget);
    if (!baseResult.success) {
      return {
        isValid: false,
        errors: baseResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }

    // Then validate type-specific configuration
    const widgetType = widget.type as WidgetType;
    const typeSchema = WidgetConfigSchemas[widgetType];
    
    if (typeSchema && widget.config) {
      const configResult = typeSchema.safeParse(widget.config);
      if (!configResult.success) {
        return {
          isValid: false,
          errors: configResult.error.errors.map(err => `config.${err.path.join('.')}: ${err.message}`)
        };
      }
    }

    return {
      isValid: true,
      errors: [],
      data: baseResult.data
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

// Data source validation function
export function validateDataSource(dataSource: any, widgetType: WidgetType): { isValid: boolean; errors: string[] } {
  try {
    const result = DataSourceSchema.safeParse(dataSource);
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }

    // Additional validation based on widget type
    const errors: string[] = [];
    
    if (dataSource.type === 'table') {
      if (!dataSource.tableId) {
        errors.push('Table ID is required for table data source');
      }
      
      // Check required mapping fields based on widget type
      const requiredFields = getRequiredMappingFields(widgetType);
      if (requiredFields.length > 0 && (!dataSource.mapping || Object.keys(dataSource.mapping).length === 0)) {
        errors.push(`Column mapping is required. Required fields: ${requiredFields.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Data source validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

// Get required mapping fields for each widget type
export function getRequiredMappingFields(widgetType: WidgetType): string[] {
  switch (widgetType) {
    case 'chart':
      return ['x', 'y'];
    case 'table':
      return []; // No specific required fields
    case 'metric':
      return ['value'];
    case 'calendar':
      return ['date', 'title'];
    case 'tasks':
      return ['title', 'status'];
    case 'text':
    case 'clock':
    case 'weather':
      return []; // Manual data sources
    default:
      return [];
  }
}

// Type exports for use in other files
export type BaseWidgetConfig = z.infer<typeof BaseWidgetConfigSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type FilterConfig = z.infer<typeof FilterConfigSchema>;
export type ChartConfig = z.infer<typeof ChartConfigSchema>;
export type TableConfig = z.infer<typeof TableConfigSchema>;
export type MetricConfig = z.infer<typeof MetricConfigSchema>;
export type TextConfig = z.infer<typeof TextConfigSchema>;
export type TasksConfig = z.infer<typeof TasksConfigSchema>;
export type ClockConfig = z.infer<typeof ClockConfigSchema>;
export type CalendarConfig = z.infer<typeof CalendarConfigSchema>;
export type WeatherConfig = z.infer<typeof WeatherConfigSchema>;
