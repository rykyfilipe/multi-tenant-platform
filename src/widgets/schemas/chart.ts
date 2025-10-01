import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const chartSettingsSchema = z.object({
  chartType: z.enum(["line", "bar", "area", "pie", "radar", "scatter"]),
  xAxis: z.string().min(1, "xAxis is required"),
  yAxis: z.string().min(1, "yAxis is required"),
  groupBy: z.string().optional(),
  valueFormat: z.enum(["number", "currency", "percentage", "duration"]).default("number"),
  refreshInterval: z.number().int().positive().max(3600).default(60),
  // Advanced features - mutually exclusive
  enableAggregation: z.boolean().default(false),
  aggregationFunction: z.enum(["sum", "avg", "count", "min", "max"]).default("sum"),
  aggregationColumns: z.array(z.string()).default([]),
  enableGrouping: z.boolean().default(false),
  groupByColumn: z.string().optional(),
  enableTopN: z.boolean().default(false),
  topNCount: z.number().int().positive().max(100).default(10),
  sortByColumn: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
}).refine((data) => {
  // Ensure aggregation and grouping are mutually exclusive
  if (data.enableAggregation && data.enableGrouping) {
    return false;
  }
  return true;
}, {
  message: "Aggregation and grouping cannot be enabled at the same time",
  path: ["enableGrouping"]
}).refine((data) => {
  // Ensure aggregation columns are specified when aggregation is enabled
  if (data.enableAggregation && data.aggregationColumns.length === 0) {
    return false;
  }
  return true;
}, {
  message: "At least one aggregation column must be specified when aggregation is enabled",
  path: ["aggregationColumns"]
}).refine((data) => {
  // Ensure group by column is specified when grouping is enabled
  if (data.enableGrouping && !data.groupByColumn) {
    return false;
  }
  return true;
}, {
  message: "Group by column must be specified when grouping is enabled",
  path: ["groupByColumn"]
}).refine((data) => {
  // Ensure aggregation columns are specified when grouping is enabled
  if (data.enableGrouping && data.aggregationColumns.length === 0) {
    return false;
  }
  return true;
}, {
  message: "At least one aggregation column must be specified when grouping is enabled",
  path: ["aggregationColumns"]
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
  mappings: z
    .record(z.enum(["x", "y", "group", "series", "color" ]), z.string().optional())
    .default({}),
  // Advanced data processing options
  aggregationConfig: z.object({
    columns: z.array(z.string()).default([]),
    functions: z.record(z.string(), z.enum(["sum", "avg", "count", "min", "max"])).default({}),
  }).optional(),
  groupingConfig: z.object({
    groupByColumns: z.array(z.string()).default([]),
    aggregateColumns: z.array(z.string()).default([]),
  }).optional(),
  topNConfig: z.object({
    enabled: z.boolean().default(false),
    count: z.number().int().positive().max(100).default(10),
    sortBy: z.string().optional(),
    sortDirection: z.enum(["asc", "desc"]).default("desc"),
  }).optional(),
});

export const chartWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: chartSettingsSchema,
  style: chartStyleSchema,
  data: chartDataSchema,
});

export type ChartWidgetConfig = z.infer<typeof chartWidgetConfigSchema>;

