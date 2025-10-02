import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";
import { strictDataFlowSchema, StrictDataFlowConfig } from "./strictDataFlow";

export const kpiSettingsSchema = z.object({
  label: z.string().min(1, "Label is required"),
  format: z.enum(["number", "currency", "percentage", "duration"]).default("number"),
  showTrend: z.boolean().default(true),
  showComparison: z.boolean().default(false),
  showExtremeValueDetails: z.boolean().default(false),
  extremeValueMode: z.enum(["max", "min"]).default("max"),
});

export const kpiStyleSchema = z.object({
  // Theme & Colors
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).default("platinum"),
  backgroundColor: z.string().optional(),
  backgroundGradient: z.string().optional(),
  textColor: z.string().optional(),
  valueColor: z.string().optional(),
  labelColor: z.string().optional(),
  trendColor: z.string().optional(),
  
  // Typography
  fontFamily: z.string().optional(),
  valueFontSize: z.enum(["xl", "2xl", "3xl", "4xl", "5xl", "6xl"]).default("4xl"),
  valueFontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("bold"),
  labelFontSize: z.enum(["xs", "sm", "base", "lg"]).default("sm"),
  letterSpacing: z.enum(["tighter", "tight", "normal", "wide", "wider"]).default("normal"),
  
  // Layout
  size: z.enum(["small", "medium", "large", "xl"]).default("medium"),
  alignment: z.enum(["left", "center", "right"]).default("center"),
  padding: z.enum(["none", "xs", "sm", "md", "lg", "xl", "2xl"]).default("lg"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("xl"),
  
  // Borders
  borderWidth: z.number().min(0).max(8).default(0),
  borderColor: z.string().optional(),
  borderStyle: z.enum(["none", "solid", "dashed", "dotted"]).default("none"),
  
  // Shadows & Effects
  shadow: z.enum(["none", "subtle", "medium", "bold", "glow"]).default("medium"),
  glassEffect: z.boolean().default(false),
  backdropBlur: z.enum(["none", "sm", "md", "lg"]).default("none"),
  
  // Premium effects
  shine: z.boolean().default(false),
  glow: z.boolean().default(false),
  pulse: z.boolean().default(false),
});

// Legacy data schema for backward compatibility
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

// Legacy settings schema for backward compatibility
export const legacyKpiSettingsSchema = z.object({
  valueField: z.string().min(1, "Value field is required"),
  displayField: z.string().optional(),
  displayFields: z.array(z.string()).optional(),
  label: z.string().min(1, "Label is required"),
  format: z.enum(["number", "currency", "percentage", "duration"]).default("number"),
  showTrend: z.boolean().default(true),
  showComparison: z.boolean().default(false),
  comparisonField: z.string().optional(),
  aggregation: z.enum(["sum", "avg", "count", "min", "max"]).default("sum"),
  selectedAggregations: z.array(z.enum(["sum", "avg", "count", "min", "max"])).default(["sum"]),
  showExtremeValueDetails: z.boolean().default(false),
  extremeValueMode: z.enum(["max", "min"]).default("max"),
});

export const kpiWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: kpiSettingsSchema,
  style: kpiStyleSchema,
  // Use strict data flow schema for new configurations
  dataFlow: strictDataFlowSchema.optional(),
  // Keep legacy data and settings schemas for backward compatibility
  data: kpiDataSchema.optional(),
  legacySettings: legacyKpiSettingsSchema.optional(),
});

export type KPIWidgetConfig = z.infer<typeof kpiWidgetConfigSchema>;
