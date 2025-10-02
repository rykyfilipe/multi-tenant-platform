import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const kpiSettingsSchema = z.object({
  valueField: z.string().min(1, "Value field is required"),
  displayField: z.string().optional(), // Deprecated: kept for backward compatibility
  displayFields: z.array(z.string()).optional(), // New: multiple fields to display from extreme value row
  label: z.string().min(1, "Label is required"),
  format: z.enum(["number", "currency", "percentage", "duration"]).default("number"),
  showTrend: z.boolean().default(true),
  showComparison: z.boolean().default(false),
  comparisonField: z.string().optional(),
  aggregation: z.enum(["sum", "avg", "count", "min", "max"]).default("sum"),
  selectedAggregations: z.array(z.enum(["sum", "avg", "count", "min", "max"])).default(["sum"]),
  showExtremeValueDetails: z.boolean().default(false), // New: show additional details from extreme value row
  extremeValueMode: z.enum(["max", "min"]).default("max"), // New: which extreme value to find
});

export const kpiStyleSchema = z.object({
  theme: z.enum(["premium-light", "premium-dark", "auto"]).default("premium-light"),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  valueColor: z.string().optional(),
  labelColor: z.string().optional(),
  trendColor: z.string().optional(),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  alignment: z.enum(["left", "center", "right"]).default("center"),
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
});

export const kpiWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: kpiSettingsSchema,
  style: kpiStyleSchema,
  data: kpiDataSchema,
});

export type KPIWidgetConfig = z.infer<typeof kpiWidgetConfigSchema>;
