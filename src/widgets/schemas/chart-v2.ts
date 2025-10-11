import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const chartSettingsSchema = z.object({
  chartType: z.enum(["line", "bar", "area", "pie", "radar", "scatter"]),
  refreshInterval: z.number().int().positive().max(3600).default(60),
  // Aggregation pipeline for each Y column (chained)
  // When configured, automatically groups by X axis
  yColumnAggregations: z.record(
    z.string(), // column name
    z.array(z.object({
      function: z.enum(["sum", "avg", "count", "min", "max"]),
      label: z.string().min(1, "Aggregation label is required"),
    }))
  ).optional(),
  // Colors for each Y column
  yColumnColors: z.record(
    z.string(), // column name
    z.string() // hex color
  ).optional(),
  // Top N - simplified (auto-sort by default)
  enableTopN: z.boolean().default(false),
  topNCount: z.number().int().positive().max(100).default(10),
});

export const chartStyleSchema = z.object({
  // Theme & Colors (used)
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).default("platinum"),
  backgroundColor: z.string().default("#FFFFFF"),
  textColor: z.string().default("#000000"),
  gridColor: z.string().optional(),
  borderColor: z.string().optional(),
  
  // Chart specific styling (used)
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  legendPosition: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
});

export const chartDataSchema = z.object({
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
  mappings: z.object({
    x: z.string().optional(),
    y: z.array(z.string()).default([]),
  }),
});

export const chartWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: chartSettingsSchema,
  style: chartStyleSchema,
  data: chartDataSchema,
});

export type ChartWidgetConfig = z.infer<typeof chartWidgetConfigSchema>;
