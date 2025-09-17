/**
 * Dashboard and Widget Validation Utilities
 * Comprehensive validation for dashboard operations
 */

import { z } from 'zod';

// Widget types enum
export const WIDGET_TYPES = [
  'chart',
  'table',
  'metric',
  'text',
  'filter',
  'image',
  'iframe',
  'calendar',
  'map',
  'gauge',
  'progress',
  'list',
  'form',
  'button',
  'divider',
] as const;

export type WidgetType = typeof WIDGET_TYPES[number];

// Dashboard validation schemas
export const DashboardValidation = {
  create: z.object({
    name: z
      .string()
      .min(1, 'Dashboard name is required')
      .max(100, 'Dashboard name must be 100 characters or less')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Dashboard name can only contain letters, numbers, spaces, hyphens, and underscores'),
    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .optional(),
    mode: z
      .enum(['view', 'edit'], {
        errorMap: () => ({ message: 'Mode must be either "view" or "edit"' }),
      })
      .default('view'),
    isPublic: z
      .boolean()
      .default(false),
    isDefault: z
      .boolean()
      .default(false),
  }),

  update: z.object({
    name: z
      .string()
      .min(1, 'Dashboard name is required')
      .max(100, 'Dashboard name must be 100 characters or less')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Dashboard name can only contain letters, numbers, spaces, hyphens, and underscores')
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .optional(),
    mode: z
      .enum(['view', 'edit'], {
        errorMap: () => ({ message: 'Mode must be either "view" or "edit"' }),
      })
      .optional(),
    isPublic: z
      .boolean()
      .optional(),
    isDefault: z
      .boolean()
      .optional(),
  }),

  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .transform(Number)
      .refine(n => n > 0, 'Page must be greater than 0')
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
      .default('20'),
    search: z
      .string()
      .max(100, 'Search term too long')
      .optional(),
    mode: z
      .enum(['view', 'edit'])
      .optional(),
    isPublic: z
      .string()
      .regex(/^(true|false)$/)
      .transform(val => val === 'true')
      .optional(),
  }),
};

// Widget validation schemas
export const WidgetValidation = {
  create: z.object({
    type: z
      .enum(WIDGET_TYPES, {
        errorMap: () => ({ message: `Type must be one of: ${WIDGET_TYPES.join(', ')}` }),
      }),
    title: z
      .string()
      .max(100, 'Title must be 100 characters or less')
      .optional(),
    position: z
      .object({
        x: z
          .number()
          .int('X position must be an integer')
          .min(0, 'X position must be non-negative'),
        y: z
          .number()
          .int('Y position must be an integer')
          .min(0, 'Y position must be non-negative'),
        width: z
          .number()
          .int('Width must be an integer')
          .min(1, 'Width must be at least 1')
          .max(12, 'Width cannot exceed 12 grid units'),
        height: z
          .number()
          .int('Height must be an integer')
          .min(1, 'Height must be at least 1')
          .max(20, 'Height cannot exceed 20 grid units'),
      }),
    config: z
      .record(z.any())
      .default({}),
    isVisible: z
      .boolean()
      .default(true),
    order: z
      .number()
      .int('Order must be an integer')
      .min(0, 'Order must be non-negative')
      .default(0),
  }),

  update: z.object({
    type: z
      .enum(WIDGET_TYPES, {
        errorMap: () => ({ message: `Type must be one of: ${WIDGET_TYPES.join(', ')}` }),
      })
      .optional(),
    title: z
      .string()
      .max(100, 'Title must be 100 characters or less')
      .optional(),
    position: z
      .object({
        x: z
          .number()
          .int('X position must be an integer')
          .min(0, 'X position must be non-negative'),
        y: z
          .number()
          .int('Y position must be an integer')
          .min(0, 'Y position must be non-negative'),
        width: z
          .number()
          .int('Width must be an integer')
          .min(1, 'Width must be at least 1')
          .max(12, 'Width cannot exceed 12 grid units'),
        height: z
          .number()
          .int('Height must be an integer')
          .min(1, 'Height must be at least 1')
          .max(20, 'Height cannot exceed 20 grid units'),
      })
      .optional(),
    config: z
      .record(z.any())
      .optional(),
    isVisible: z
      .boolean()
      .optional(),
    order: z
      .number()
      .int('Order must be an integer')
      .min(0, 'Order must be non-negative')
      .optional(),
  }),

  query: z.object({
    type: z
      .enum(WIDGET_TYPES)
      .optional(),
    isVisible: z
      .string()
      .regex(/^(true|false)$/)
      .transform(val => val === 'true')
      .optional(),
  }),
};

// Widget type-specific configuration schemas
export const WidgetConfigValidation = {
  chart: z.object({
    chartType: z.enum(['line', 'bar', 'pie', 'doughnut', 'area', 'scatter']),
    dataSource: z.object({
      tableId: z.number().int().positive(),
      columnX: z.string().min(1),
      columnY: z.string().min(1),
      filters: z.array(z.any()).optional(),
    }),
    options: z.object({
      title: z.string().optional(),
      xAxisLabel: z.string().optional(),
      yAxisLabel: z.string().optional(),
      colors: z.array(z.string()).optional(),
      showLegend: z.boolean().default(true),
      showGrid: z.boolean().default(true),
    }).optional(),
    // Additional fields for LineChartWidget compatibility
    xAxis: z.object({
      key: z.string(),
      label: z.string().optional(),
      type: z.enum(['category', 'number', 'time']).optional(),
    }).optional(),
    yAxis: z.object({
      key: z.string(),
      label: z.string().optional(),
      type: z.enum(['number']).optional(),
    }).optional(),
  }),

  table: z.object({
    dataSource: z.object({
      tableId: z.number().int().positive(),
      columns: z.array(z.string()).min(1),
      filters: z.array(z.any()).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
    options: z.object({
      pageSize: z.number().int().min(1).max(100).default(10),
      showPagination: z.boolean().default(true),
      showSearch: z.boolean().default(true),
      showExport: z.boolean().default(false),
    }).optional(),
  }),

  metric: z.object({
    dataSource: z.object({
      type: z.enum(['table', 'manual']),
      tableId: z.number().int().positive().optional(),
      column: z.string().min(1).optional(),
      aggregation: z.enum(['sum', 'count', 'avg', 'min', 'max']).optional(),
      filters: z.array(z.any()).optional(),
    }),
    options: z.object({
      format: z.enum(['number', 'currency', 'percentage']).optional(),
      decimals: z.number().int().min(0).max(10).optional(),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      showChange: z.boolean().optional(),
      showTrend: z.boolean().optional(),
      thresholds: z.object({
        warning: z.number().optional(),
        danger: z.number().optional(),
        success: z.number().optional(),
      }).optional(),
      colors: z.object({
        positive: z.string().optional(),
        negative: z.string().optional(),
        neutral: z.string().optional(),
      }).optional(),
    }).optional(),
  }),

  text: z.object({
    content: z.string().min(1, 'Content is required'),
    type: z.enum(['markdown', 'html', 'plain']).default('plain'),
    options: z.object({
      fontSize: z.enum(['sm', 'base', 'lg', 'xl', '2xl']).optional(),
      textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      padding: z.enum(['sm', 'md', 'lg']).optional(),
      showBorder: z.boolean().optional(),
      borderRadius: z.enum(['none', 'sm', 'md', 'lg']).optional(),
    }).optional(),
  }),

  filter: z.object({
    dataSource: z.object({
      tableId: z.number().int().positive(),
      column: z.string().min(1),
      filterType: z.enum(['text', 'number', 'date', 'select', 'multiselect']),
    }),
    options: z.object({
      label: z.string().optional(),
      placeholder: z.string().optional(),
      required: z.boolean().default(false),
      multiple: z.boolean().default(false),
    }).optional(),
  }),
};

// Validation helper functions
export class DashboardValidators {
  /**
   * Validate dashboard creation data
   */
  static validateCreate(data: unknown) {
    return DashboardValidation.create.parse(data);
  }

  /**
   * Validate dashboard update data
   */
  static validateUpdate(data: unknown) {
    return DashboardValidation.update.parse(data);
  }

  /**
   * Validate dashboard query parameters
   */
  static validateQuery(params: URLSearchParams) {
    const data = Object.fromEntries(params.entries());
    return DashboardValidation.query.parse(data);
  }

  /**
   * Validate widget creation data
   */
  static validateWidgetCreate(data: unknown) {
    return WidgetValidation.create.parse(data);
  }

  /**
   * Validate widget update data
   */
  static validateWidgetUpdate(data: unknown) {
    return WidgetValidation.update.parse(data);
  }

  /**
   * Validate widget query parameters
   */
  static validateWidgetQuery(params: URLSearchParams) {
    const data = Object.fromEntries(params.entries());
    return WidgetValidation.query.parse(data);
  }

  /**
   * Validate widget configuration based on type
   */
  static validateWidgetConfig(type: WidgetType, config: unknown) {
    switch (type) {
      case 'chart':
        return WidgetConfigValidation.chart.parse(config);
      case 'table':
        return WidgetConfigValidation.table.parse(config);
      case 'metric':
        return WidgetConfigValidation.metric.parse(config);
      case 'text':
        return WidgetConfigValidation.text.parse(config);
      case 'filter':
        return WidgetConfigValidation.filter.parse(config);
      default:
        return z.record(z.any()).parse(config);
    }
  }

  /**
   * Validate dashboard name uniqueness
   */
  static validateDashboardName(name: string, tenantId: number, excludeId?: number) {
    if (!name || name.trim().length === 0) {
      throw new Error('Dashboard name is required');
    }

    if (name.length > 100) {
      throw new Error('Dashboard name must be 100 characters or less');
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      throw new Error('Dashboard name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    return true;
  }

  /**
   * Validate widget position
   */
  static validateWidgetPosition(position: { x: number; y: number; width: number; height: number }) {
    if (position.x < 0 || position.y < 0) {
      throw new Error('Widget position must be non-negative');
    }

    if (position.width < 1 || position.width > 12) {
      throw new Error('Widget width must be between 1 and 12 grid units');
    }

    if (position.height < 1 || position.height > 20) {
      throw new Error('Widget height must be between 1 and 20 grid units');
    }

    return true;
  }

  /**
   * Validate widget type
   */
  static validateWidgetType(type: string): type is WidgetType {
    return WIDGET_TYPES.includes(type as WidgetType);
  }
}

// Error handling utilities
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: unknown): ValidationError {
  if (error instanceof z.ZodError) {
    const firstError = error.errors[0];
    return new ValidationError(
      firstError.message,
      firstError.path.join('.'),
      firstError.code
    );
  }

  if (error instanceof ValidationError) {
    return error;
  }

  return new ValidationError('Validation failed');
}
