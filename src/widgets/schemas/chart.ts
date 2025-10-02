import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const chartSettingsSchema = z.object({
  chartType: z.enum(["line", "bar", "area", "pie", "radar", "scatter"]),
  refreshInterval: z.number().int().positive().max(3600).default(60),
  // Data processing mode
  processingMode: z.enum(["raw", "grouped"]).default("raw"),
  // Aggregation (only for grouped mode)
  aggregationFunction: z.enum(["sum", "avg", "count", "min", "max"]).default("sum"),
  aggregationColumns: z.array(z.string()).default([]),
  // Grouping
  groupByColumn: z.string().optional(),
  // Top N
  enableTopN: z.boolean().default(false),
  topNCount: z.number().int().positive().max(100).default(10),
  sortByColumn: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const chartStyleSchema = z.object({
  theme: z.enum(["premium-light", "premium-dark", "auto"]).default("premium-light"),
  backgroundColor: z.string().default("#ffffff"),
  textColor: z.string().default("#000000"),
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
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
    y: z.union([z.array(z.string()), z.string()]).transform(val => Array.isArray(val) ? val : val ? [val] : []).default([]), // Multi-column support for Y axis
    group: z.string().optional(),
    series: z.string().optional(),
    color: z.string().optional(),
  }).default({ y: [] }),
});

export const chartWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: chartSettingsSchema,
  style: chartStyleSchema,
  data: chartDataSchema,
});

export type ChartWidgetConfig = z.infer<typeof chartWidgetConfigSchema>;
