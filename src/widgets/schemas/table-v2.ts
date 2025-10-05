import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const columnAggregationSchema = z.object({
  column: z.string().min(1, "Column is required"),
  aggregations: z.array(z.object({
    function: z.enum(["sum", "avg", "count", "min", "max", "first", "last"]),
    label: z.string().min(1, "Aggregation label is required"),
  })).min(1, "At least one aggregation is required"),
});

export const tableSettingsSchema = z.object({
  // Aggregation settings
  aggregation: z.object({
    enabled: z.boolean().default(false),
    groupBy: z.string().optional(),
    columns: z.array(columnAggregationSchema).default([]),
    showSummaryRow: z.boolean().default(true),
    showGroupTotals: z.boolean().default(false),
  }),
  
  // Pagination
  pagination: z.object({
    enabled: z.boolean().default(true),
    pageSize: z.number().int().min(1).max(1000).default(50),
  }),
  
  // Sorting
  sorting: z.object({
    enabled: z.boolean().default(true),
    defaultColumn: z.string().optional(),
    defaultDirection: z.enum(["asc", "desc"]).default("asc"),
  }),
  
  // Display options
  showRowNumbers: z.boolean().default(true),
  showColumnHeaders: z.boolean().default(true),
  alternateRowColors: z.boolean().default(true),
  
  // Refresh settings
  refreshInterval: z.number().int().positive().max(3600).default(60),
});

export const tableStyleSchema = z.object({
  // Theme & Colors
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).default("platinum"),
  backgroundColor: z.string().default("#FFFFFF"),
  textColor: z.string().default("#000000"),
  borderColor: z.string().default("#E5E7EB"),
  headerBackgroundColor: z.string().default("#F9FAFB"),
  headerTextColor: z.string().default("#374151"),
  
  // Row colors
  evenRowColor: z.string().default("#FFFFFF"),
  oddRowColor: z.string().default("#F9FAFB"),
  hoverRowColor: z.string().default("#F3F4F6"),
  selectedRowColor: z.string().default("#EBF4FF"),
  
  // Typography
  fontSize: z.enum(["xs", "sm", "base", "lg", "xl"]).default("sm"),
  headerFontSize: z.enum(["xs", "sm", "base", "lg", "xl"]).default("base"),
  fontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("normal"),
  headerFontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("semibold"),
  
  // Layout
  padding: z.enum(["xs", "sm", "md", "lg", "xl"]).default("sm"),
  borderWidth: z.enum(["0", "1", "2", "4"]).default("1"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("md"),
  
  // Column settings
  columnMinWidth: z.number().int().min(50).max(500).default(100),
  columnMaxWidth: z.number().int().min(100).max(1000).default(300),
  
  // Effects
  shadow: z.enum(["none", "subtle", "medium", "bold", "sm", "md", "lg"]).default("subtle"),
  stripedRows: z.boolean().default(true),
  hoverEffects: z.boolean().default(true),
  
  // Summary row styling
  summaryRowStyle: z.object({
    backgroundColor: z.string().default("#F3F4F6"),
    textColor: z.string().default("#374151"),
    fontWeight: z.enum(["normal", "medium", "semibold", "bold"]).default("semibold"),
    borderTop: z.boolean().default(true),
  }),
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
  
  // Column configuration
  columns: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    width: z.number().optional(),
    visible: z.boolean().default(true),
    sortable: z.boolean().default(true),
    filterable: z.boolean().default(true),
    format: z.enum(["text", "number", "currency", "percentage", "date", "boolean"]).default("text"),
  })).default([]),
});

export const tableWidgetConfigSchemaV2 = baseWidgetConfigSchema.extend({
  settings: tableSettingsSchema,
  style: tableStyleSchema,
  data: tableDataSchema,
});

export type TableWidgetConfigV2 = z.infer<typeof tableWidgetConfigSchemaV2>;
export type ColumnAggregation = z.infer<typeof columnAggregationSchema>;
