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
  // Theme & Colors
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).default("platinum"),
  backgroundColor: z.string().default("#FFFFFF"),
  textColor: z.string().default("#000000"),
  accentColor: z.string().optional(),
  
  // Typography
  fontSize: z.enum(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]).default("2xl"),
  fontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("bold"),
  
  // Layout
  padding: z.enum(["none", "xs", "sm", "md", "lg", "xl", "2xl"]).default("lg"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("xl"),
  gap: z.enum(["xs", "sm", "md", "lg", "xl"]).default("md"),
  
  // KPI specific styling
  valueSize: z.enum(["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]).default("3xl"),
  labelSize: z.enum(["xs", "sm", "base", "lg"]).default("sm"),
  trendSize: z.enum(["xs", "sm", "base"]).default("xs"),
  
  // Effects
  shadow: z.enum(["none", "subtle", "medium", "bold", "glow"]).default("medium"),
  glassEffect: z.boolean().default(false),
  shine: z.boolean().default(false),
  glow: z.boolean().default(false),
  
  // Color coding
  positiveColor: z.string().default("#16a34a"), // Green
  negativeColor: z.string().default("#dc2626"), // Red
  neutralColor: z.string().default("#6b7280"), // Gray
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
  metrics: z.array(kpiMetricSchema).min(1, "At least one metric is required"),
});

export const kpiWidgetConfigSchemaV2 = baseWidgetConfigSchema.extend({
  settings: kpiSettingsSchema,
  style: kpiStyleSchema,
  data: kpiDataSchema,
});

export type KPIWidgetConfigV2 = z.infer<typeof kpiWidgetConfigSchemaV2>;
export type KPIMetric = z.infer<typeof kpiMetricSchema>;
