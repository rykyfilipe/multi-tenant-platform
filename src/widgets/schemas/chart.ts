import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const chartSettingsSchema = z.object({
  chartType: z.enum(["line", "bar", "area", "pie", "radar", "scatter"]),
  xAxis: z.string().min(1, "xAxis is required"),
  yAxis: z.string().min(1, "yAxis is required"),
  groupBy: z.string().optional(),
  valueFormat: z.enum(["number", "currency", "percentage", "duration"]).default("number"),
  refreshInterval: z.number().int().positive().max(3600).default(60),
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
});

export const chartWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: chartSettingsSchema,
  style: chartStyleSchema,
  data: chartDataSchema,
});

export type ChartWidgetConfig = z.infer<typeof chartWidgetConfigSchema>;

