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
  
  // Date grouping for groupBy column when it's a date
  dateGrouping: z.object({
    enabled: z.boolean().default(false),
    granularity: z.enum(["hour", "day", "week", "month", "quarter", "year"]).default("day"),
  }).optional().default({
    enabled: false,
    granularity: "day",
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
  // === THEME ===
  themeName: z.string().optional(),
  
  // === GENERAL STYLING ===
  backgroundColor: z.string().default("#FFFFFF"),
  backgroundOpacity: z.number().min(0).max(1).default(1).optional(),
  borderRadius: z.union([
    z.number().min(0).max(50),
    z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]) // Backward compatibility
  ]).default(8).transform((val) => typeof val === 'string' ? 8 : val),
  border: z.object({
    enabled: z.boolean().default(true),
    width: z.number().min(0).max(10).default(1),
    color: z.string().default("rgba(0, 0, 0, 0.1)"),
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  }).default({
    enabled: true,
    width: 1,
    color: "rgba(0, 0, 0, 0.1)",
    style: "solid",
  }),
  
  // === HEADER STYLING ===
  header: z.object({
    backgroundColor: z.string().default("#F9FAFB"),
    textColor: z.string().default("#111827"),
    fontSize: z.number().min(8).max(24).default(14),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600", "700", "800"]).default("600"),
    textAlign: z.enum(["left", "center", "right"]).default("left"),
    textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).default("none"),
    letterSpacing: z.number().min(-2).max(5).default(0),
    padding: z.object({
      x: z.number().min(0).max(50).default(16),
      y: z.number().min(0).max(50).default(12),
    }).default({ x: 16, y: 12 }),
    borderBottom: z.object({
      enabled: z.boolean().default(true),
      width: z.number().min(0).max(10).default(2),
      color: z.string().default("rgba(0, 0, 0, 0.1)"),
    }).default({
      enabled: true,
      width: 2,
      color: "rgba(0, 0, 0, 0.1)",
    }),
    sticky: z.boolean().default(true),
  }).default({
    backgroundColor: "#F9FAFB",
    textColor: "#111827",
    fontSize: 14,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "600",
    textAlign: "left",
    textTransform: "none",
    letterSpacing: 0,
    padding: { x: 16, y: 12 },
    borderBottom: {
      enabled: true,
      width: 2,
      color: "rgba(0, 0, 0, 0.1)",
    },
    sticky: true,
  }),
  
  // === ROW STYLING ===
  rows: z.object({
    fontSize: z.number().min(8).max(24).default(14),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600", "700"]).default("400"),
    textColor: z.string().default("#374151"),
    textAlign: z.enum(["left", "center", "right"]).default("left"),
    padding: z.object({
      x: z.number().min(0).max(50).default(16),
      y: z.number().min(0).max(50).default(12),
    }).default({ x: 16, y: 12 }),
    height: z.number().min(20).max(200).optional(),
    minHeight: z.number().min(20).max(200).default(48),
    
    // Alternating row colors
    alternateColors: z.object({
      enabled: z.boolean().default(true),
      even: z.string().default("#FFFFFF"),
      odd: z.string().default("#F9FAFB"),
    }).default({
      enabled: true,
      even: "#FFFFFF",
      odd: "#F9FAFB",
    }),
    
    // Hover effect
    hover: z.object({
      enabled: z.boolean().default(true),
      backgroundColor: z.string().default("#F3F4F6"),
      textColor: z.string().optional(),
      transition: z.number().min(0).max(1000).default(150),
    }).default({
      enabled: true,
      backgroundColor: "#F3F4F6",
      transition: 150,
    }),
    
    // Row borders
    borderBottom: z.object({
      enabled: z.boolean().default(true),
      width: z.number().min(0).max(10).default(1),
      color: z.string().default("rgba(0, 0, 0, 0.05)"),
      style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
    }).default({
      enabled: true,
      width: 1,
      color: "rgba(0, 0, 0, 0.05)",
      style: "solid",
    }),
  }).default({
    fontSize: 14,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "400",
    textColor: "#374151",
    textAlign: "left",
    padding: { x: 16, y: 12 },
    minHeight: 48,
    alternateColors: {
      enabled: true,
      even: "#FFFFFF",
      odd: "#F9FAFB",
    },
    hover: {
      enabled: true,
      backgroundColor: "#F3F4F6",
      transition: 150,
    },
    borderBottom: {
      enabled: true,
      width: 1,
      color: "rgba(0, 0, 0, 0.05)",
      style: "solid",
    },
  }),
  
  // === CELL STYLING ===
  cells: z.object({
    // Vertical borders between cells
    verticalBorder: z.object({
      enabled: z.boolean().default(false),
      width: z.number().min(0).max(10).default(1),
      color: z.string().default("rgba(0, 0, 0, 0.05)"),
    }).default({
      enabled: false,
      width: 1,
      color: "rgba(0, 0, 0, 0.05)",
    }),
    
    // Compact mode
    compact: z.boolean().default(false),
  }).default({
    verticalBorder: {
      enabled: false,
      width: 1,
      color: "rgba(0, 0, 0, 0.05)",
    },
    compact: false,
  }),
  
  // === SELECTION STYLING ===
  selection: z.object({
    enabled: z.boolean().default(true),
    backgroundColor: z.string().default("rgba(59, 130, 246, 0.1)"),
    borderColor: z.string().default("rgba(59, 130, 246, 0.5)"),
    borderWidth: z.number().min(0).max(5).default(2),
  }).default({
    enabled: true,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.5)",
    borderWidth: 2,
  }),
  
  // === FOOTER STYLING (for summary row) ===
  footer: z.object({
    backgroundColor: z.string().default("#F9FAFB"),
    textColor: z.string().default("#111827"),
    fontSize: z.number().min(8).max(24).default(14),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600", "700", "800"]).default("600"),
    padding: z.object({
      x: z.number().min(0).max(50).default(16),
      y: z.number().min(0).max(50).default(12),
    }).default({ x: 16, y: 12 }),
    borderTop: z.object({
      enabled: z.boolean().default(true),
      width: z.number().min(0).max(10).default(2),
      color: z.string().default("rgba(0, 0, 0, 0.1)"),
    }).default({
      enabled: true,
      width: 2,
      color: "rgba(0, 0, 0, 0.1)",
    }),
  }).default({
    backgroundColor: "#F9FAFB",
    textColor: "#111827",
    fontSize: 14,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "600",
    padding: { x: 16, y: 12 },
    borderTop: {
      enabled: true,
      width: 2,
      color: "rgba(0, 0, 0, 0.1)",
    },
  }),
  
  // === SCROLLBAR STYLING ===
  scrollbar: z.object({
    width: z.number().min(4).max(20).default(8),
    trackColor: z.string().default("rgba(0, 0, 0, 0.05)"),
    thumbColor: z.string().default("rgba(0, 0, 0, 0.2)"),
    thumbHoverColor: z.string().default("rgba(0, 0, 0, 0.3)"),
  }).default({
    width: 8,
    trackColor: "rgba(0, 0, 0, 0.05)",
    thumbColor: "rgba(0, 0, 0, 0.2)",
    thumbHoverColor: "rgba(0, 0, 0, 0.3)",
  }),
  
  // === EMPTY STATE ===
  emptyState: z.object({
    textColor: z.string().default("#9CA3AF"),
    fontSize: z.number().min(10).max(24).default(14),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
  }).default({
    textColor: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Inter, system-ui, sans-serif",
  }),
  
  // Deprecated - kept for backward compatibility
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).optional(),
  shadow: z.enum(["none", "sm", "md", "lg", "medium", "subtle", "bold"]).optional(),
  transparentBackground: z.boolean().optional(),
  showBorders: z.boolean().optional(),
  showHeader: z.boolean().optional(),
  showFooter: z.boolean().optional(),
  stripedRows: z.boolean().optional(),
  hoverEffect: z.boolean().optional(),
  headerStyle: z.enum(["solid", "transparent", "gradient"]).optional(),
  cellPadding: z.enum(["compact", "normal", "comfortable"]).optional(),
  fontSize: z.enum(["xs", "sm", "base", "lg"]).optional(),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  borderColor: z.string().optional(),
  headerBg: z.string().optional(),
  headerTextColor: z.string().optional(),
  rowTextColor: z.string().optional(),
  alternateRowBg: z.string().optional(),
}).passthrough();

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
  style: tableStyleSchema.passthrough(), // Allow extra properties for backward compatibility
  data: tableDataSchema,
});

export type TableWidgetConfigV2 = z.infer<typeof tableWidgetConfigSchemaV2>;
export type ColumnAggregation = z.infer<typeof columnAggregationSchema>;
