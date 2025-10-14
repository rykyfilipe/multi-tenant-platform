import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const clockSettingsSchema = z.object({
  timezone: z.string().default("local"),
  format: z.enum(["12h", "24h"]).default("24h"),
  showDate: z.boolean().default(true),
  showSeconds: z.boolean().default(true),
  showTimezone: z.boolean().default(false),
  clockType: z.enum(["digital", "analog"]).default("digital"),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).default("DD/MM/YYYY"),
});

export const clockStyleSchema = z.object({
  // === THEME ===
  themeName: z.string().optional(),
  
  // === CONTAINER STYLING ===
  backgroundColor: z.string().default("#FFFFFF"),
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
      color: z.string().default("rgba(0, 0, 0, 0.1)"),
    }),
    z.enum(["none", "sm", "md", "lg", "medium", "subtle", "bold"]) // Backward compatibility
  ]).optional().default({
    enabled: true,
    size: "md",
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
      return shadowMap[val] || { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" };
    }
    return val;
  }),
  padding: z.union([
    z.object({
      x: z.number().min(0).max(100).default(32),
      y: z.number().min(0).max(100).default(24),
    }),
    z.enum(["tight", "comfortable", "spacious", "sm", "md", "lg"]) // Backward compatibility
  ]).optional().default({ x: 32, y: 24 }).transform((val) => {
    if (typeof val === 'string') {
      const paddingMap: Record<string, any> = {
        tight: { x: 16, y: 12 },
        sm: { x: 16, y: 12 },
        comfortable: { x: 32, y: 24 },
        md: { x: 32, y: 24 },
        spacious: { x: 48, y: 36 },
        lg: { x: 48, y: 36 },
      };
      return paddingMap[val] || { x: 32, y: 24 };
    }
    return val;
  }),
  alignment: z.enum(["left", "center", "right"]).default("center").optional(),
  
  // === TIME DISPLAY STYLING ===
  time: z.object({
    fontSize: z.number().min(24).max(120).default(64),
    fontFamily: z.string().default("Courier New, monospace"),
    fontWeight: z.enum(["300", "400", "500", "600", "700", "800"]).default("700"),
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
    letterSpacing: z.number().min(-5).max(10).default(2),
    showSeparatorBlink: z.boolean().default(true),
  }).default({
    fontSize: 64,
    fontFamily: "Courier New, monospace",
    fontWeight: "700",
    color: "#111827",
    gradient: {
      enabled: false,
      from: "#3B82F6",
      to: "#8B5CF6",
    },
    letterSpacing: 2,
    showSeparatorBlink: true,
  }),
  
  // === DATE DISPLAY STYLING ===
  date: z.object({
    fontSize: z.number().min(10).max(32).default(16),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600", "700"]).default("500"),
    color: z.string().default("#6B7280"),
    textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).default("uppercase"),
    letterSpacing: z.number().min(-2).max(5).default(1),
    marginTop: z.number().min(0).max(50).default(8),
  }).default({
    fontSize: 16,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  }),
  
  // === SECONDS STYLING (if shown) ===
  seconds: z.object({
    fontSize: z.number().min(12).max(48).default(24),
    color: z.string().default("#9CA3AF"),
    opacity: z.number().min(0).max(1).default(0.7),
  }).default({
    fontSize: 24,
    color: "#9CA3AF",
    opacity: 0.7,
  }),
  
  // === ANALOG CLOCK STYLING ===
  analog: z.object({
    faceColor: z.string().default("#FFFFFF"),
    borderColor: z.string().default("#E5E7EB"),
    borderWidth: z.number().min(0).max(20).default(8),
    numbersColor: z.string().default("#374151"),
    numbersSize: z.number().min(8).max(32).default(14),
    showNumbers: z.boolean().default(true),
    
    // Hands
    hourHand: z.object({
      color: z.string().default("#111827"),
      width: z.number().min(1).max(20).default(6),
      length: z.number().min(20).max(100).default(50),
    }).default({
      color: "#111827",
      width: 6,
      length: 50,
    }),
    minuteHand: z.object({
      color: z.string().default("#374151"),
      width: z.number().min(1).max(15).default(4),
      length: z.number().min(30).max(100).default(70),
    }).default({
      color: "#374151",
      width: 4,
      length: 70,
    }),
    secondHand: z.object({
      color: z.string().default("#EF4444"),
      width: z.number().min(1).max(10).default(2),
      length: z.number().min(30).max(100).default(75),
    }).default({
      color: "#EF4444",
      width: 2,
      length: 75,
    }),
    
    centerDot: z.object({
      color: z.string().default("#111827"),
      size: z.number().min(4).max(30).default(12),
    }).default({
      color: "#111827",
      size: 12,
    }),
  }).default({
    faceColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 8,
    numbersColor: "#374151",
    numbersSize: 14,
    showNumbers: true,
    hourHand: { color: "#111827", width: 6, length: 50 },
    minuteHand: { color: "#374151", width: 4, length: 70 },
    secondHand: { color: "#EF4444", width: 2, length: 75 },
    centerDot: { color: "#111827", size: 12 },
  }),
  
  // === TIMEZONE LABEL STYLING ===
  timezone: z.object({
    fontSize: z.number().min(8).max(20).default(12),
    fontFamily: z.string().default("Inter, system-ui, sans-serif"),
    fontWeight: z.enum(["300", "400", "500", "600"]).default("400"),
    color: z.string().default("#9CA3AF"),
    marginTop: z.number().min(0).max(30).default(8),
  }).default({
    fontSize: 12,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "400",
    color: "#9CA3AF",
    marginTop: 8,
  }),
  
  // === ANIMATION ===
  animation: z.object({
    enabled: z.boolean().default(true),
    duration: z.number().min(0).max(2000).default(400),
    easing: z.enum(["linear", "ease", "easeIn", "easeOut", "easeInOut"]).default("easeInOut"),
  }).default({
    enabled: true,
    duration: 400,
    easing: "easeInOut",
  }),
  
  // Deprecated - backward compatibility
  theme: z.enum(["premium-light", "premium-dark", "minimal", "luxury", "platinum", "obsidian", "pearl"]).optional(),
  fontSize: z.enum(["sm", "md", "lg", "xl", "2xl"]).optional(),
  fontFamily: z.enum(["sans", "serif", "mono"]).optional(),
});

export const clockRefreshSchema = z.object({
  enabled: z.boolean().default(true),
  interval: z.number().default(1000),
});

export const clockWidgetConfigSchema = baseWidgetConfigSchema.extend({
  settings: clockSettingsSchema,
  style: clockStyleSchema.passthrough(), // Allow extra properties for backward compatibility
  refresh: clockRefreshSchema,
});

export type ClockWidgetConfig = z.infer<typeof clockWidgetConfigSchema>;

