import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const chartSettingsSchema = z.object({
  chartType: z.enum(["line", "bar", "area", "pie", "radar", "scatter"]),
  refreshInterval: z.number().int().positive().max(3600).default(60),
  // Aggregation pipeline for each Y column (chained)
  // When configured, automatically groups by X axis
  yColumnAggregations: z.record(
    z.string(), // column name
    z.array(z.object({
      function: z.enum(["sum", "avg", "count", "min", "max"]),
      label: z.string().min(1, "Aggregation label is required"),
    }))
  ).optional(),
  // Colors for each Y column
  yColumnColors: z.record(
    z.string(), // column name
    z.string() // hex color
  ).optional(),
  // Top N - simplified (auto-sort by default)
  enableTopN: z.boolean().default(false),
  topNCount: z.number().int().positive().max(100).default(10),
});

export const chartStyleSchema = z.object({
  // === GENERAL STYLING ===
  backgroundColor: z.string().default("#FFFFFF"),
  backgroundOpacity: z.number().min(0).max(1).default(1),
  borderRadius: z.number().min(0).max(50).default(8),
  padding: z.object({
    top: z.number().min(0).max(100).default(20),
    right: z.number().min(0).max(100).default(20),
    bottom: z.number().min(0).max(100).default(20),
    left: z.number().min(0).max(100).default(20),
  }).default({ top: 20, right: 20, bottom: 20, left: 20 }),
  
  // === LINE STYLING (for line/area charts) ===
  line: z.object({
    width: z.number().min(0.5).max(10).default(2),
    tension: z.number().min(0).max(1).default(0.4), // Curve smoothness
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
    cap: z.enum(["butt", "round", "square"]).default("round"),
    join: z.enum(["miter", "round", "bevel"]).default("round"),
    gradient: z.object({
      enabled: z.boolean().default(false),
      startOpacity: z.number().min(0).max(1).default(0.8),
      endOpacity: z.number().min(0).max(1).default(0.1),
    }).default({ enabled: false, startOpacity: 0.8, endOpacity: 0.1 }),
  }).default({
    width: 2,
    tension: 0.4,
    style: "solid",
    cap: "round",
    join: "round",
    gradient: { enabled: false, startOpacity: 0.8, endOpacity: 0.1 },
  }),
  
  // === POINT STYLING ===
  points: z.object({
    show: z.boolean().default(true),
    radius: z.number().min(0).max(20).default(4),
    hoverRadius: z.number().min(0).max(30).default(6),
    borderWidth: z.number().min(0).max(10).default(2),
    borderColor: z.string().default("#FFFFFF"),
    style: z.enum(["circle", "cross", "rect", "triangle", "star"]).default("circle"),
  }).default({
    show: true,
    radius: 4,
    hoverRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    style: "circle",
  }),
  
  // === BAR STYLING (for bar charts) ===
  bars: z.object({
    borderRadius: z.number().min(0).max(50).default(4),
    borderWidth: z.number().min(0).max(10).default(0),
    borderColor: z.string().optional(),
    barThickness: z.number().min(1).max(100).optional(),
    maxBarThickness: z.number().min(1).max(200).optional(),
    barPercentage: z.number().min(0.1).max(1).default(0.8),
    categoryPercentage: z.number().min(0.1).max(1).default(0.9),
  }).default({
    borderRadius: 4,
    borderWidth: 0,
    barPercentage: 0.8,
    categoryPercentage: 0.9,
  }),
  
  // === GRID STYLING ===
  grid: z.object({
    show: z.boolean().default(true),
    color: z.string().default("rgba(0, 0, 0, 0.1)"),
    lineWidth: z.number().min(0).max(5).default(1),
    drawBorder: z.boolean().default(true),
    drawOnChartArea: z.boolean().default(true),
    drawTicks: z.boolean().default(true),
    tickLength: z.number().min(0).max(20).default(8),
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
    dashPattern: z.array(z.number()).default([5, 5]),
  }).default({
    show: true,
    color: "rgba(0, 0, 0, 0.1)",
    lineWidth: 1,
    drawBorder: true,
    drawOnChartArea: true,
    drawTicks: true,
    tickLength: 8,
    style: "solid",
    dashPattern: [5, 5],
  }),
  
  // === AXIS STYLING ===
  axes: z.object({
    x: z.object({
      show: z.boolean().default(true),
      color: z.string().default("#666666"),
      fontSize: z.number().min(8).max(24).default(12),
      fontFamily: z.string().default("Inter, system-ui, sans-serif"),
      fontWeight: z.enum(["300", "400", "500", "600", "700"]).default("400"),
      rotation: z.number().min(-90).max(90).default(0),
      labelOffset: z.number().min(0).max(50).default(10),
    }).default({
      show: true,
      color: "#666666",
      fontSize: 12,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "400",
      rotation: 0,
      labelOffset: 10,
    }),
    y: z.object({
      show: z.boolean().default(true),
      color: z.string().default("#666666"),
      fontSize: z.number().min(8).max(24).default(12),
      fontFamily: z.string().default("Inter, system-ui, sans-serif"),
      fontWeight: z.enum(["300", "400", "500", "600", "700"]).default("400"),
      labelOffset: z.number().min(0).max(50).default(10),
    }).default({
      show: true,
      color: "#666666",
      fontSize: 12,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "400",
      labelOffset: 10,
    }),
  }).default({
    x: {
      show: true,
      color: "#666666",
      fontSize: 12,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "400",
      rotation: 0,
      labelOffset: 10,
    },
    y: {
      show: true,
      color: "#666666",
      fontSize: 12,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "400",
      labelOffset: 10,
    },
  }),
  
  // === LEGEND STYLING ===
  legend: z.object({
    show: z.boolean().default(true),
    position: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
    align: z.enum(["start", "center", "end"]).default("center"),
    fontSize: z.number().min(8).max(24).default(12),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600", "700"]).default("400"),
    color: z.string().default("#333333"),
    padding: z.number().min(0).max(50).default(10),
    boxWidth: z.number().min(10).max(50).default(40),
    boxHeight: z.number().min(10).max(50).default(12),
  }).default({
    show: true,
    position: "bottom",
    align: "center",
    fontSize: 12,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "400",
    color: "#333333",
    padding: 10,
    boxWidth: 40,
    boxHeight: 12,
  }),
  
  // === TOOLTIP STYLING ===
  tooltip: z.object({
    enabled: z.boolean().default(true),
    backgroundColor: z.string().default("rgba(0, 0, 0, 0.8)"),
    titleColor: z.string().default("#FFFFFF"),
    bodyColor: z.string().default("#FFFFFF"),
    borderColor: z.string().default("rgba(255, 255, 255, 0.3)"),
    borderWidth: z.number().min(0).max(5).default(1),
    borderRadius: z.number().min(0).max(20).default(6),
    padding: z.number().min(0).max(30).default(12),
    fontSize: z.number().min(8).max(24).default(12),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
  }).default({
    enabled: true,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    titleColor: "#FFFFFF",
    bodyColor: "#FFFFFF",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    fontSize: 12,
    fontFamily: "Inter, system-ui, sans-serif",
  }),
  
  // === ANIMATION ===
  animation: z.object({
    enabled: z.boolean().default(true),
    duration: z.number().min(0).max(5000).default(750),
    easing: z.enum(["linear", "easeInQuad", "easeOutQuad", "easeInOutQuad", "easeInCubic", "easeOutCubic", "easeInOutCubic"]).default("easeInOutQuad"),
  }).default({
    enabled: true,
    duration: 750,
    easing: "easeInOutQuad",
  }),
  
  // Deprecated - kept for backward compatibility
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).optional(),
  textColor: z.string().optional(),
  gridColor: z.string().optional(),
  borderColor: z.string().optional(),
  showLegend: z.boolean().optional(),
  showGrid: z.boolean().optional(),
  legendPosition: z.enum(["top", "bottom", "left", "right"]).optional(),
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
