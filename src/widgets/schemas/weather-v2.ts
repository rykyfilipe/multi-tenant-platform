import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const weatherSettingsSchema = z.object({
  location: z.string().default(""),
  units: z.enum(["metric", "imperial"]).default("metric"),
  showForecast: z.boolean().default(true),
  forecastDays: z.number().min(1).max(7).default(5),
  showHumidity: z.boolean().default(true),
  showWindSpeed: z.boolean().default(true),
  showPressure: z.boolean().default(false),
  showUVIndex: z.boolean().default(false),
  showFeelsLike: z.boolean().default(true),
});

export const weatherStyleSchema = z.object({
  // === THEME ===
  themeName: z.string().optional(),
  
  // === CONTAINER STYLING ===
  backgroundColor: z.string().default("#FFFFFF"),
  backgroundGradient: z.object({
    enabled: z.boolean().default(false),
    from: z.string().default("#FFFFFF"),
    to: z.string().default("#E0F2FE"),
    direction: z.enum(["to-r", "to-br", "to-b", "to-bl"]).default("to-b"),
  }).optional().default({
    enabled: false,
    from: "#FFFFFF",
    to: "#E0F2FE",
    direction: "to-b",
  }),
  borderRadius: z.union([
    z.number().min(0).max(50),
    z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]) // Backward compatibility
  ]).default(16).optional().transform((val) => typeof val === 'string' ? 16 : val ?? 16),
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
  textColor: z.string().default("#000000"),
  shadow: z.union([
    z.object({
      enabled: z.boolean().default(true),
      size: z.enum(["sm", "md", "lg", "xl"]).default("md"),
    }),
    z.enum(["none", "sm", "md", "lg", "medium", "subtle", "bold"]) // Backward compatibility
  ]).optional().default({
    enabled: true,
    size: "md",
  }).transform((val) => {
    if (typeof val === 'string') {
      const shadowMap: Record<string, any> = {
        none: { enabled: false, size: "sm" },
        sm: { enabled: true, size: "sm" },
        md: { enabled: true, size: "md" },
        medium: { enabled: true, size: "md" },
        lg: { enabled: true, size: "lg" },
        subtle: { enabled: true, size: "sm" },
        bold: { enabled: true, size: "xl" },
      };
      return shadowMap[val] || { enabled: true, size: "md" };
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
  layout: z.enum(["compact", "detailed", "forecast-focused"]).default("detailed").optional(),
  
  // === TEMPERATURE DISPLAY ===
  temperature: z.object({
    fontSize: z.number().min(24).max(100).default(56),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600", "700", "800"]).default("700"),
    color: z.string().default("#111827"),
    gradient: z.object({
      enabled: z.boolean().default(false),
      from: z.string().default("#F59E0B"),
      to: z.string().default("#EF4444"),
    }).default({
      enabled: false,
      from: "#F59E0B",
      to: "#EF4444",
    }),
    showUnit: z.boolean().default(true),
    unitSize: z.number().min(12).max(48).default(24),
  }).default({
    fontSize: 56,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "700",
    color: "#111827",
    gradient: {
      enabled: false,
      from: "#F59E0B",
      to: "#EF4444",
    },
    showUnit: true,
    unitSize: 24,
  }),
  
  // === LOCATION & CONDITION ===
  location: z.object({
    fontSize: z.number().min(12).max(32).default(18),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["400", "500", "600", "700"]).default("600"),
    color: z.string().default("#374151"),
  }).default({
    fontSize: 18,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "600",
    color: "#374151",
  }),
  
  condition: z.object({
    fontSize: z.number().min(10).max(24).default(14),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600"]).default("500"),
    color: z.string().default("#6B7280"),
    textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).default("capitalize"),
  }).default({
    fontSize: 14,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "capitalize",
  }),
  
  // === WEATHER ICON ===
  icon: z.object({
    size: z.number().min(32).max(200).default(80),
    color: z.string().default("#3B82F6"),
    style: z.enum(["filled", "outlined", "gradient"]).default("filled"),
    gradient: z.object({
      from: z.string().default("#60A5FA"),
      to: z.string().default("#3B82F6"),
    }).default({
      from: "#60A5FA",
      to: "#3B82F6",
    }),
    animation: z.boolean().default(true),
  }).default({
    size: 80,
    color: "#3B82F6",
    style: "filled",
    gradient: {
      from: "#60A5FA",
      to: "#3B82F6",
    },
    animation: true,
  }),
  
  // === DETAILS (Humidity, Wind, etc.) ===
  details: z.object({
    fontSize: z.number().min(10).max(20).default(13),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600"]).default("400"),
    color: z.string().default("#6B7280"),
    iconSize: z.number().min(12).max(32).default(16),
    iconColor: z.string().default("#9CA3AF"),
    spacing: z.number().min(4).max(24).default(12),
    labelColor: z.string().default("#9CA3AF"),
  }).default({
    fontSize: 13,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "400",
    color: "#6B7280",
    iconSize: 16,
    iconColor: "#9CA3AF",
    spacing: 12,
    labelColor: "#9CA3AF",
  }),
  
  // === FORECAST CARDS ===
  forecast: z.object({
    cardBackground: z.string().default("#F9FAFB"),
    cardBorderRadius: z.number().min(0).max(30).default(8),
    cardPadding: z.number().min(4).max(30).default(12),
    fontSize: z.number().min(10).max(18).default(12),
    fontWeight: z.enum(["400", "500", "600"]).default("500"),
    dayColor: z.string().default("#374151"),
    tempColor: z.string().default("#111827"),
    iconSize: z.number().min(20).max(80).default(32),
    spacing: z.number().min(4).max(24).default(8),
  }).default({
    cardBackground: "#F9FAFB",
    cardBorderRadius: 8,
    cardPadding: 12,
    fontSize: 12,
    fontWeight: "500",
    dayColor: "#374151",
    tempColor: "#111827",
    iconSize: 32,
    spacing: 8,
  }),
  
  // === ANIMATION ===
  animation: z.object({
    enabled: z.boolean().default(true),
    duration: z.number().min(0).max(2000).default(500),
  }).default({
    enabled: true,
    duration: 500,
  }),
  
  // Deprecated - backward compatibility
  theme: z.enum(["premium-light", "premium-dark", "minimal", "luxury", "platinum", "obsidian", "pearl"]).optional(),
  accentColor: z.string().optional(),
});

export const weatherRefreshSchema = z.object({
  enabled: z.boolean().default(true),
  interval: z.number().default(300000), // 5 minutes
});

export const weatherWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: weatherSettingsSchema,
  style: weatherStyleSchema.passthrough(), // Allow extra properties for backward compatibility
  refresh: weatherRefreshSchema,
});

export type WeatherWidgetConfig = z.infer<typeof weatherWidgetConfigSchema>;

