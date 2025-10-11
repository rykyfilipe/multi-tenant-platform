import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const columnAggregationSchema = z.object({
  column: z.string().min(1, "Column is required"),
  aggregations: z.array(z.object({
    function: z.enum(["sum", "avg", "count", "min", "max", "first", "last"]),
    label: z.string().min(1, "Aggregation label is required"),
  })).min(1, "At least one aggregation is required"),
});

export const tableSettingsSchema = z.object({
  // Aggregation settings
  aggregation: z.object({
    enabled: z.boolean().default(false),
    groupBy: z.string().optional(),
    columns: z.array(columnAggregationSchema).default([]),
    showSummaryRow: z.boolean().default(true),
    showGroupTotals: z.boolean().default(false),
  }),
  
  // Pagination
  pagination: z.object({
    enabled: z.boolean().default(true),
    pageSize: z.number().int().min(1).max(1000).default(50),
  }),
  
  // Sorting
  sorting: z.object({
    enabled: z.boolean().default(true),
    defaultColumn: z.string().optional(),
    defaultDirection: z.enum(["asc", "desc"]).default("asc"),
  }),
  
  // Display options
  showRowNumbers: z.boolean().default(true),
  showColumnHeaders: z.boolean().default(true),
  alternateRowColors: z.boolean().default(true),
  
  // Refresh settings
  refreshInterval: z.number().int().positive().max(3600).default(60),
});

export const tableStyleSchema = z.object({
  // Simplified - most properties not used in renderer
  // Using UI component defaults instead
});

export const tableDataSchema = z.object({
  databaseId: z.number().optional(),
  tableId: z.string().optional(),
  filters: z
    .array(
      z.object({
        column: z.string().optional(),
        operator: z.enum(["=", "!=", ">", "<", ">=", "<=", "contains", "startsWith", "endsWith"]).optional(),
        value: z.union([z.string(), z.number(), z.boolean(), z.date()]).optional(),
      })
    )
    .default([]),
  
  // Column configuration
  columns: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    width: z.number().optional(),
    visible: z.boolean().default(true),
    sortable: z.boolean().default(true),
    filterable: z.boolean().default(true),
    format: z.enum(["text", "number", "currency", "percentage", "date", "boolean"]).default("text"),
  })).default([]),
});

export const tableWidgetConfigSchemaV2 = baseWidgetConfigSchema.extend({
  settings: tableSettingsSchema,
  style: tableStyleSchema,
  data: tableDataSchema,
});

export type TableWidgetConfigV2 = z.infer<typeof tableWidgetConfigSchemaV2>;
export type ColumnAggregation = z.infer<typeof columnAggregationSchema>;
