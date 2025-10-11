import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const kpiMetricSchema = z.object({
  field: z.string().min(1, "Field is required"),
  label: z.string().min(1, "Label is required"),
  // Group by field for complex aggregations (e.g., group by product, then sum quantity)
  groupBy: z.string().optional(),
  aggregations: z.array(z.object({
    function: z.enum(["sum", "avg", "count", "min", "max"]),
    label: z.string().min(1, "Aggregation label is required"),
  })).min(1, "At least one aggregation is required"),
  format: z.enum(["number", "currency", "percentage", "decimal"]).default("number"),
  showTrend: z.boolean().default(true),
  showComparison: z.boolean().default(false),
  target: z.number().optional(),
});

export const kpiSettingsSchema = z.object({
  // Layout configuration
  layout: z.enum(["grid", "list", "cards"]).default("grid"),
  columns: z.number().int().min(1).max(4).default(2),
  
  // Display options
  showTrend: z.boolean().default(true),
  showComparison: z.boolean().default(false),
  showTargets: z.boolean().default(false),
  
  // Refresh settings
  refreshInterval: z.number().int().positive().max(3600).default(60),
});

export const kpiStyleSchema = z.object({
  // Only property actually used in renderer
  backgroundColor: z.string().default("#FFFFFF"),
});

export const kpiDataSchema = z.object({
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
  // Single metric with chained aggregation pipeline
  metric: kpiMetricSchema.optional(),
});

export const kpiWidgetConfigSchemaV2 = baseWidgetConfigSchema.extend({
  settings: kpiSettingsSchema,
  style: kpiStyleSchema,
  data: kpiDataSchema,
});

export type KPIWidgetConfigV2 = z.infer<typeof kpiWidgetConfigSchemaV2>;
export type KPIMetric = z.infer<typeof kpiMetricSchema>;
