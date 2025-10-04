import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const chartSettingsSchema = z.object({
  chartType: z.enum(["line", "bar", "area", "pie", "radar", "scatter"]),
  refreshInterval: z.number().int().positive().max(3600).default(60),
  // Data processing mode - simplified
  processingMode: z.enum(["raw", "grouped"]).default("raw"),
  // Aggregation (only for grouped mode)
  aggregationFunction: z.enum(["sum", "avg", "count", "min", "max"]).default("sum"),
  // Multiple aggregations on same data (for complex queries)
  multipleAggregations: z.array(z.object({
    function: z.enum(["sum", "avg", "count", "min", "max"]),
    label: z.string().min(1, "Aggregation label is required"),
  })).optional(),
  // Grouping
  groupByColumn: z.string().optional(),
  // Top N - simplified (auto-sort by default)
  enableTopN: z.boolean().default(false),
  topNCount: z.number().int().positive().max(100).default(10),
  // Removed: aggregationColumns, sortByColumn, sortDirection (redundant)
});

export const chartStyleSchema = z.object({
  // Theme & Colors
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).default("platinum"),
  backgroundColor: z.string().default("#FFFFFF"),
  textColor: z.string().default("#000000"),
  accentColor: z.string().optional(),
  gridColor: z.string().optional(),
  borderColor: z.string().optional(),
  
  // Typography
  fontSize: z.enum(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]).default("sm"),
  fontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("normal"),
  
  // Layout
  padding: z.enum(["none", "xs", "sm", "md", "lg", "xl", "2xl"]).default("md"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("xl"),
  borderWidth: z.number().int().min(0).max(4).default(1),
  
  // Chart specific styling
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  legendPosition: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
  chartOpacity: z.number().min(0).max(1).default(1),
  
  // Effects
  shadow: z.enum(["none", "subtle", "medium", "bold", "glow"]).default("medium"),
  glassEffect: z.boolean().default(false),
  backdropBlur: z.enum(["none", "sm", "md", "lg"]).default("none"),
  shine: z.boolean().default(false),
  glow: z.boolean().default(false),
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
