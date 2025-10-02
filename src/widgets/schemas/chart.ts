import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";
import { strictDataFlowSchema, StrictDataFlowConfig } from "./strictDataFlow";

export const chartSettingsSchema = z.object({
  chartType: z.enum(["line", "bar", "area", "pie", "radar", "scatter"]),
  refreshInterval: z.number().int().positive().max(3600).default(60),
  
  // Data processing settings
  processingMode: z.enum(["raw", "grouped", "aggregated"]).default("raw"),
  aggregationFunction: z.enum(["sum", "count", "avg", "min", "max"]).default("sum"),
  aggregationColumns: z.array(z.string()).default([]),
  groupByColumn: z.string().optional(),
  enableTopN: z.boolean().default(false),
  topNCount: z.number().int().positive().max(100).default(10),
  sortByColumn: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const chartStyleSchema = z.object({
  // Theme & Colors
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).default("platinum"),
  backgroundColor: z.string().default("#FFFFFF"),
  backgroundGradient: z.string().optional(),
  textColor: z.string().default("#000000"),
  headingColor: z.string().optional(),
  gridColor: z.string().default("#E5E5E5"),
  accentColor: z.string().optional(),
  
  // Typography
  fontFamily: z.string().optional(),
  fontSize: z.enum(["xs", "sm", "base", "lg"]).default("sm"),
  fontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("normal"),
  
  // Layout
  padding: z.enum(["none", "xs", "sm", "md", "lg", "xl", "2xl"]).default("md"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("xl"),
  
  // Borders
  borderWidth: z.number().min(0).max(8).default(1),
  borderColor: z.string().optional(),
  
  // Shadows
  shadow: z.enum(["none", "subtle", "medium", "bold", "glow"]).default("medium"),
  
  // Effects
  glassEffect: z.boolean().default(false),
  backdropBlur: z.enum(["none", "sm", "md", "lg"]).default("none"),
  
  // Chart specific
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  legendPosition: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
  chartOpacity: z.number().min(0).max(1).default(1),
  
  // Premium effects
  shine: z.boolean().default(false),
  glow: z.boolean().default(false),
});

// Legacy data schema for backward compatibility
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
  // Use strict data flow schema for new configurations
  dataFlow: strictDataFlowSchema.optional(),
  // Keep legacy data schema for backward compatibility
  data: chartDataSchema.optional(),
});

export type ChartWidgetConfig = z.infer<typeof chartWidgetConfigSchema>;
