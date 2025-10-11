import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const kpiMetricSchema = z.object({
  field: z.string().min(1, "Field is required"),
  label: z.string().min(1, "Label is required"),
  // Group by field for complex aggregations (e.g., group by product, then sum quantity)
  groupBy: z.string().optional(),
  aggregations: z.array(z.object({
    function: z.enum(["sum", "avg", "count", "min", "max"]),
    label: z.string().min(1, "Aggregation label is required"),
  })).min(1, "At least one aggregation is required"),
  format: z.enum(["number", "currency", "percentage", "decimal"]).default("number"),
  showTrend: z.boolean().default(true),
  showComparison: z.boolean().default(false),
  target: z.number().optional(),
});

export const kpiSettingsSchema = z.object({
  // Layout configuration
  layout: z.enum(["grid", "list", "cards"]).default("grid"),
  columns: z.number().int().min(1).max(4).default(2),
  
  // Display options
  showTrend: z.boolean().default(true),
  showComparison: z.boolean().default(false),
  showTargets: z.boolean().default(false),
  
  // Refresh settings
  refreshInterval: z.number().int().positive().max(3600).default(60),
});

export const kpiStyleSchema = z.object({
  // === CARD STYLING ===
  backgroundColor: z.string().default("#FFFFFF"),
  borderRadius: z.union([
    z.number().min(0).max(50),
    z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]) // Backward compatibility
  ]).default(12).optional().transform((val) => typeof val === 'string' ? 12 : val ?? 12),
  backgroundGradient: z.object({
    enabled: z.boolean().default(false),
    from: z.string().default("#FFFFFF"),
    to: z.string().default("#F3F4F6"),
    direction: z.enum(["to-r", "to-br", "to-b", "to-bl"]).default("to-br"),
  }).optional().default({
    enabled: false,
    from: "#FFFFFF",
    to: "#F3F4F6",
    direction: "to-br",
  }),
  border: z.object({
    enabled: z.boolean().default(true),
    width: z.number().min(0).max(10).default(1),
    color: z.string().default("rgba(0, 0, 0, 0.1)"),
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  }).optional().default({
    enabled: true,
    width: 1,
    color: "rgba(0, 0, 0, 0.1)",
    style: "solid",
  }),
  shadow: z.union([
    z.object({
      enabled: z.boolean().default(true),
      size: z.enum(["sm", "md", "lg", "xl"]).default("sm"),
      color: z.string().default("rgba(0, 0, 0, 0.1)"),
    }),
    z.enum(["none", "sm", "md", "lg", "medium", "subtle", "bold"]) // Backward compatibility
  ]).optional().default({
    enabled: true,
    size: "sm",
    color: "rgba(0, 0, 0, 0.1)",
  }).transform((val) => {
    if (typeof val === 'string') {
      const shadowMap: Record<string, any> = {
        none: { enabled: false, size: "sm", color: "rgba(0, 0, 0, 0.1)" },
        sm: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.1)" },
        md: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
        medium: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
        lg: { enabled: true, size: "lg", color: "rgba(0, 0, 0, 0.1)" },
        subtle: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.05)" },
        bold: { enabled: true, size: "xl", color: "rgba(0, 0, 0, 0.15)" },
      };
      return shadowMap[val] || { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.1)" };
    }
    return val;
  }),
  padding: z.union([
    z.object({
      x: z.number().min(0).max(100).default(24),
      y: z.number().min(0).max(100).default(20),
    }),
    z.enum(["tight", "comfortable", "spacious", "sm", "md", "lg"]) // Backward compatibility
  ]).optional().default({ x: 24, y: 20 }).transform((val) => {
    if (typeof val === 'string') {
      const paddingMap: Record<string, any> = {
        tight: { x: 12, y: 10 },
        sm: { x: 12, y: 10 },
        comfortable: { x: 24, y: 20 },
        md: { x: 24, y: 20 },
        spacious: { x: 36, y: 30 },
        lg: { x: 36, y: 30 },
      };
      return paddingMap[val] || { x: 24, y: 20 };
    }
    return val;
  }),
  
  // === VALUE STYLING ===
  value: z.object({
    fontSize: z.number().min(16).max(80).default(36),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["400", "500", "600", "700", "800"]).default("700"),
    color: z.string().default("#111827"),
    gradient: z.object({
      enabled: z.boolean().default(false),
      from: z.string().default("#3B82F6"),
      to: z.string().default("#8B5CF6"),
    }).default({
      enabled: false,
      from: "#3B82F6",
      to: "#8B5CF6",
    }),
  }).default({
    fontSize: 36,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "700",
    color: "#111827",
    gradient: {
      enabled: false,
      from: "#3B82F6",
      to: "#8B5CF6",
    },
  }),
  
  // === LABEL STYLING ===
  label: z.object({
    fontSize: z.number().min(8).max(24).default(14),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600", "700"]).default("500"),
    color: z.string().default("#6B7280"),
    textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).default("none"),
    letterSpacing: z.number().min(-2).max(5).default(0),
  }).default({
    fontSize: 14,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "none",
    letterSpacing: 0,
  }),
  
  // === TREND INDICATOR ===
  trend: z.object({
    positive: z.object({
      color: z.string().default("#10B981"),
      backgroundColor: z.string().default("rgba(16, 185, 129, 0.1)"),
      iconSize: z.number().min(12).max(32).default(16),
    }).default({
      color: "#10B981",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      iconSize: 16,
    }),
    negative: z.object({
      color: z.string().default("#EF4444"),
      backgroundColor: z.string().default("rgba(239, 68, 68, 0.1)"),
      iconSize: z.number().min(12).max(32).default(16),
    }).default({
      color: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      iconSize: 16,
    }),
    fontSize: z.number().min(10).max(24).default(12),
    fontWeight: z.enum(["400", "500", "600", "700"]).default("600"),
    showIcon: z.boolean().default(true),
    showPercentage: z.boolean().default(true),
  }).default({
    positive: {
      color: "#10B981",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      iconSize: 16,
    },
    negative: {
      color: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      iconSize: 16,
    },
    fontSize: 12,
    fontWeight: "600",
    showIcon: true,
    showPercentage: true,
  }),
  
  // === ICON STYLING ===
  icon: z.object({
    enabled: z.boolean().default(false),
    size: z.number().min(16).max(64).default(24),
    color: z.string().default("#3B82F6"),
    backgroundColor: z.string().default("rgba(59, 130, 246, 0.1)"),
    position: z.enum(["top", "left", "right"]).default("left"),
  }).default({
    enabled: false,
    size: 24,
    color: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    position: "left",
  }),
  
  // === HOVER EFFECT ===
  hover: z.object({
    enabled: z.boolean().default(true),
    scale: z.number().min(1).max(1.2).default(1.02),
    shadow: z.boolean().default(true),
    transition: z.number().min(0).max(1000).default(200),
  }).default({
    enabled: true,
    scale: 1.02,
    shadow: true,
    transition: 200,
  }),
  
  // === ANIMATION ===
  animation: z.object({
    enabled: z.boolean().default(true),
    duration: z.number().min(0).max(2000).default(500),
    delay: z.number().min(0).max(1000).default(0),
  }).default({
    enabled: true,
    duration: 500,
    delay: 0,
  }),
  
  // Deprecated - kept for backward compatibility
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontSize: z.enum(["sm", "md", "lg", "xl", "2xl", "3xl"]).optional(),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  labelSize: z.enum(["xs", "sm", "base", "lg"]).optional(),
  valueSize: z.enum(["sm", "md", "lg", "xl", "2xl", "3xl"]).optional(),
  trendSize: z.enum(["xs", "sm", "md"]).optional(),
  positiveColor: z.string().optional(),
  negativeColor: z.string().optional(),
  neutralColor: z.string().optional(),
  gap: z.enum(["none", "sm", "md", "lg"]).optional(),
  shine: z.boolean().optional(),
  glow: z.boolean().optional(),
  glassEffect: z.boolean().optional(),
}).passthrough();

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
  // Single metric with chained aggregation pipeline
  metric: kpiMetricSchema.optional(),
});

export const kpiWidgetConfigSchemaV2 = baseWidgetConfigSchema.extend({
  settings: kpiSettingsSchema,
  style: kpiStyleSchema.passthrough(), // Allow extra properties for backward compatibility
  data: kpiDataSchema,
});

export type KPIWidgetConfigV2 = z.infer<typeof kpiWidgetConfigSchemaV2>;
export type KPIMetric = z.infer<typeof kpiMetricSchema>;
