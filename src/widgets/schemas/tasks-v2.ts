import { z } from "zod";

/**
 * TASKS WIDGET V2 - ADVANCED STYLING SCHEMA
 * Complete styling system for Tasks widget with 150+ properties
 */

export const tasksStyleSchema = z.object({
  // ============================================================================
  // CONTAINER STYLING
  // ============================================================================
  backgroundColor: z.string().default("#FFFFFF"),
  backgroundOpacity: z.number().min(0).max(1).default(1),
  backgroundGradient: z.object({
    enabled: z.boolean().default(false),
    from: z.string().default("#FFFFFF"),
    to: z.string().default("#F3F4F6"),
    direction: z.enum(["to-t", "to-tr", "to-r", "to-br", "to-b", "to-bl", "to-l", "to-tl"]).default("to-br"),
  }).optional(),
  
  borderRadius: z.union([
    z.number().min(0).max(50),
    z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]) // Backward compatibility
  ]).default(12).transform((val) => typeof val === 'string' ? 12 : val),
  
  border: z.object({
    enabled: z.boolean().default(true),
    width: z.number().min(0).max(10).default(1),
    color: z.string().default("rgba(0, 0, 0, 0.1)"),
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  }).optional(),
  
  shadow: z.union([
    z.object({
      enabled: z.boolean().default(true),
      size: z.enum(["none", "sm", "md", "lg", "xl", "2xl"]).default("md"),
      color: z.string().default("rgba(0, 0, 0, 0.1)"),
    }),
    z.enum(["none", "subtle", "medium", "strong"]) // Backward compatibility
  ]).default({ enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" }).transform((val) => {
    if (typeof val === 'string') {
      const shadowMap: Record<string, any> = {
        none: { enabled: false, size: "none", color: "rgba(0, 0, 0, 0.1)" },
        subtle: { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.05)" },
        medium: { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
        strong: { enabled: true, size: "lg", color: "rgba(0, 0, 0, 0.15)" },
      };
      return shadowMap[val] || { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" };
    }
    return val;
  }),
  
  padding: z.union([
    z.object({
      x: z.number().min(0).max(100).default(24),
      y: z.number().min(0).max(100).default(20),
    }),
    z.enum(["tight", "comfortable", "spacious", "sm", "md", "lg"]) // Backward compatibility
  ]).default({ x: 24, y: 20 }).transform((val) => {
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

  // ============================================================================
  // TASK CARD STYLING
  // ============================================================================
  taskCard: z.object({
    backgroundColor: z.string().default("#FFFFFF"),
    backgroundHover: z.string().default("#F9FAFB"),
    borderRadius: z.number().min(0).max(30).default(8),
    border: z.object({
      enabled: z.boolean().default(true),
      width: z.number().min(0).max(5).default(1),
      color: z.string().default("rgba(0, 0, 0, 0.1)"),
      style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
    }).default({ enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" }),
    
    shadow: z.object({
      enabled: z.boolean().default(false),
      size: z.enum(["none", "sm", "md", "lg"]).default("sm"),
    }).default({ enabled: false, size: "sm" }),
    
    padding: z.object({
      x: z.number().min(0).max(50).default(16),
      y: z.number().min(0).max(50).default(12),
    }).default({ x: 16, y: 12 }),
    
    spacing: z.number().min(0).max(30).default(12),
    
    // Completed task styling
    completedStyle: z.object({
      opacity: z.number().min(0).max(1).default(0.6),
      backgroundColor: z.string().default("#F9FAFB"),
      strikethrough: z.boolean().default(true),
      blur: z.boolean().default(false),
    }).default({ opacity: 0.6, backgroundColor: "#F9FAFB", strikethrough: true, blur: false }),
    
    // Hover effects
    hover: z.object({
      enabled: z.boolean().default(true),
      scale: z.number().min(1).max(1.1).default(1.02),
      shadow: z.boolean().default(true),
      transition: z.number().min(0).max(1000).default(200),
    }).default({ enabled: true, scale: 1.02, shadow: true, transition: 200 }),
  }).optional(),

  // ============================================================================
  // PRIORITY & STATUS STYLING
  // ============================================================================
  priority: z.object({
    showBadge: z.boolean().default(true),
    badgeStyle: z.enum(["filled", "outline", "subtle"]).default("subtle"),
    badgeRadius: z.number().min(0).max(20).default(6),
    badgeSize: z.enum(["sm", "md", "lg"]).default("sm"),
    
    colors: z.object({
      low: z.object({
        background: z.string().default("#E0F2FE"),
        text: z.string().default("#0369A1"),
        border: z.string().default("#0EA5E9"),
      }).default({ background: "#E0F2FE", text: "#0369A1", border: "#0EA5E9" }),
      
      medium: z.object({
        background: z.string().default("#FEF3C7"),
        text: z.string().default("#92400E"),
        border: z.string().default("#F59E0B"),
      }).default({ background: "#FEF3C7", text: "#92400E", border: "#F59E0B" }),
      
      high: z.object({
        background: z.string().default("#FED7AA"),
        text: z.string().default("#9A3412"),
        border: z.string().default("#F97316"),
      }).default({ background: "#FED7AA", text: "#9A3412", border: "#F97316" }),
      
      urgent: z.object({
        background: z.string().default("#FEE2E2"),
        text: z.string().default("#991B1B"),
        border: z.string().default("#EF4444"),
      }).default({ background: "#FEE2E2", text: "#991B1B", border: "#EF4444" }),
    }).default({
      low: { background: "#E0F2FE", text: "#0369A1", border: "#0EA5E9" },
      medium: { background: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
      high: { background: "#FED7AA", text: "#9A3412", border: "#F97316" },
      urgent: { background: "#FEE2E2", text: "#991B1B", border: "#EF4444" },
    }),
    
    leftBorder: z.object({
      enabled: z.boolean().default(true),
      width: z.number().min(0).max(10).default(3),
    }).default({ enabled: true, width: 3 }),
  }).optional(),
  
  checkbox: z.object({
    size: z.number().min(12).max(32).default(18),
    borderRadius: z.number().min(0).max(20).default(4),
    borderWidth: z.number().min(1).max(4).default(2),
    borderColor: z.string().default("#D1D5DB"),
    checkedColor: z.string().default("#10B981"),
    checkedBackground: z.string().default("#10B981"),
  }).optional(),

  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================
  typography: z.object({
    title: z.object({
      fontSize: z.number().min(10).max(32).default(16),
      fontFamily: z.string().default("Inter, system-ui, sans-serif"),
      fontWeight: z.enum(["300", "400", "500", "600", "700", "800"]).default("500"),
      color: z.string().default("#111827"),
      lineHeight: z.number().min(1).max(3).default(1.5),
      letterSpacing: z.number().min(-2).max(2).default(0),
    }).default({
      fontSize: 16,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "500",
      color: "#111827",
      lineHeight: 1.5,
      letterSpacing: 0,
    }),
    
    description: z.object({
      fontSize: z.number().min(10).max(24).default(13),
      fontFamily: z.string().default("Inter, system-ui, sans-serif"),
      fontWeight: z.enum(["300", "400", "500", "600"]).default("400"),
      color: z.string().default("#6B7280"),
      lineHeight: z.number().min(1).max(3).default(1.4),
      maxLines: z.number().min(1).max(10).default(2),
    }).default({
      fontSize: 13,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "400",
      color: "#6B7280",
      lineHeight: 1.4,
      maxLines: 2,
    }),
    
    dueDate: z.object({
      fontSize: z.number().min(10).max(20).default(12),
      fontFamily: z.string().default("Inter, system-ui, sans-serif"),
      fontWeight: z.enum(["300", "400", "500", "600"]).default("400"),
      color: z.string().default("#9CA3AF"),
      overdueColor: z.string().default("#EF4444"),
      todayColor: z.string().default("#F59E0B"),
    }).default({
      fontSize: 12,
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "400",
      color: "#9CA3AF",
      overdueColor: "#EF4444",
      todayColor: "#F59E0B",
    }),
  }).optional(),

  // ============================================================================
  // PROGRESS BAR
  // ============================================================================
  progressBar: z.object({
    enabled: z.boolean().default(true),
    height: z.number().min(2).max(20).default(6),
    backgroundColor: z.string().default("#E5E7EB"),
    fillColor: z.string().default("#10B981"),
    borderRadius: z.number().min(0).max(20).default(4),
    showPercentage: z.boolean().default(true),
    percentageFontSize: z.number().min(8).max(18).default(11),
    percentageColor: z.string().default("#6B7280"),
    gradient: z.object({
      enabled: z.boolean().default(false),
      from: z.string().default("#10B981"),
      to: z.string().default("#059669"),
    }).default({ enabled: false, from: "#10B981", to: "#059669" }),
  }).optional(),

  // ============================================================================
  // HEADER STYLING
  // ============================================================================
  header: z.object({
    backgroundColor: z.string().default("transparent"),
    borderBottom: z.object({
      enabled: z.boolean().default(true),
      width: z.number().min(0).max(5).default(1),
      color: z.string().default("rgba(0, 0, 0, 0.1)"),
    }).default({ enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)" }),
    padding: z.object({
      x: z.number().min(0).max(50).default(0),
      y: z.number().min(0).max(50).default(16),
    }).default({ x: 0, y: 16 }),
    
    title: z.object({
      fontSize: z.number().min(14).max(32).default(18),
      fontWeight: z.enum(["400", "500", "600", "700", "800"]).default("600"),
      color: z.string().default("#111827"),
    }).default({ fontSize: 18, fontWeight: "600", color: "#111827" }),
    
    stats: z.object({
      show: z.boolean().default(true),
      fontSize: z.number().min(10).max(20).default(13),
      color: z.string().default("#6B7280"),
    }).default({ show: true, fontSize: 13, color: "#6B7280" }),
  }).optional(),

  // ============================================================================
  // EFFECTS & ANIMATIONS
  // ============================================================================
  animation: z.object({
    enabled: z.boolean().default(true),
    duration: z.number().min(0).max(2000).default(300),
    easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut"]).default("easeOut"),
    stagger: z.boolean().default(true),
    staggerDelay: z.number().min(0).max(200).default(50),
  }).optional(),
  
  interaction: z.object({
    dragHandle: z.object({
      show: z.boolean().default(true),
      color: z.string().default("#D1D5DB"),
      hoverColor: z.string().default("#9CA3AF"),
    }).default({ show: true, color: "#D1D5DB", hoverColor: "#9CA3AF" }),
    
    deleteButton: z.object({
      show: z.boolean().default(true),
      color: z.string().default("#EF4444"),
      hoverColor: z.string().default("#DC2626"),
      size: z.number().min(12).max(28).default(18),
    }).default({ show: true, color: "#EF4444", hoverColor: "#DC2626", size: 18 }),
  }).optional(),

  // ============================================================================
  // LAYOUT & SPACING
  // ============================================================================
  layout: z.object({
    maxWidth: z.number().min(300).max(2000).default(800),
    taskSpacing: z.number().min(0).max(40).default(12),
    sectionSpacing: z.number().min(0).max(60).default(24),
    compact: z.boolean().default(false),
  }).optional(),
  
}).passthrough(); // Allow additional properties for forward compatibility

export type TasksStyle = z.infer<typeof tasksStyleSchema>;

// Default style configuration
export const defaultTasksStyle: TasksStyle = {
  backgroundColor: "#FFFFFF",
  backgroundOpacity: 1,
  borderRadius: 12,
  border: {
    enabled: true,
    width: 1,
    color: "rgba(0, 0, 0, 0.1)",
    style: "solid",
  },
  shadow: {
    enabled: true,
    size: "md",
    color: "rgba(0, 0, 0, 0.1)",
  },
  padding: {
    x: 24,
    y: 20,
  },
};
