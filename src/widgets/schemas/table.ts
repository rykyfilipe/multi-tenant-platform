import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const tableColumnSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  width: z.number().int().positive().max(800).optional(),
  sortable: z.boolean().default(true),
  format: z.enum(["text", "number", "currency", "date", "percentage", "badge", "link"]).default("text"),
  // Column-level aggregation (for footer statistics)
  showStatistics: z.boolean().default(false),
  statisticFunction: z.enum(["sum", "avg", "count", "min", "max"]).optional(),
});

export const tableSettingsSchema = z.object({
  columns: z.array(tableColumnSchema).min(1),
  pageSize: z.number().int().positive().max(200).default(25),
  enableExport: z.boolean().default(false),
  stickyHeader: z.boolean().default(true),
  // Data processing
  processingMode: z.enum(["raw", "grouped"]).default("raw"),
  groupByColumn: z.string().optional(),
  showGroupSummary: z.boolean().default(false),
  // Footer statistics
  showFooterStatistics: z.boolean().default(false),
});

export const tableStyleSchema = z.object({
  // Theme & Colors
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).default("platinum"),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  headerBgColor: z.string().optional(),
  headerTextColor: z.string().optional(),
  borderColor: z.string().optional(),
  hoverColor: z.string().optional(),
  
  // Typography
  fontFamily: z.string().optional(),
  fontSize: z.enum(["xs", "sm", "base"]).default("xs"),
  fontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("normal"),
  headerFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).default("semibold"),
  
  // Layout
  density: z.enum(["comfortable", "compact", "expanded"]).default("comfortable"),
  padding: z.enum(["none", "xs", "sm", "md", "lg"]).default("sm"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl"]).default("lg"),
  
  // Borders
  showRowBorders: z.boolean().default(false),
  borderWidth: z.number().min(0).max(4).default(1),
  headerBorderWidth: z.number().min(0).max(8).default(2),
  
  // Stripes & Patterns
  zebraStripes: z.boolean().default(true),
  zebraOpacity: z.number().min(0).max(1).default(0.05),
  
  // Header
  headerStyle: z.enum(["default", "bold", "accent", "gradient"]).default("bold"),
  stickyHeader: z.boolean().default(true),
  
  // Shadows & Effects
  shadow: z.enum(["none", "subtle", "medium", "bold"]).default("subtle"),
  rowHoverEffect: z.enum(["none", "highlight", "lift", "glow"]).default("highlight"),
  
  // Premium Effects
  glassEffect: z.boolean().default(false),
  shine: z.boolean().default(false),
});

export const tableDataSchema = z.object({
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
  sort: z
    .array(
      z.object({
        column: z.string().min(1),
        direction: z.enum(["asc", "desc"]),
      })
    )
    .default([]),
});

export const tableWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: tableSettingsSchema,
  style: tableStyleSchema,
  data: tableDataSchema,
});

export type TableWidgetConfig = z.infer<typeof tableWidgetConfigSchema>;
