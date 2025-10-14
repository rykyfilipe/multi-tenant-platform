import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

export const textSettingsSchema = z.object({
  // Text content
  content: z.string().default("Click to edit..."),
  
  // Formatting
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  underline: z.boolean().default(false),
  
  // Alignment
  alignment: z.enum(["left", "center", "right", "justify"]).default("left"),
  
  // Font size
  fontSize: z.union([
    z.enum(["small", "normal", "large", "xlarge"]),
    z.number().min(8).max(120)
  ]).default("normal"),
  
  // Custom font size (when fontSize is number)
  customFontSize: z.number().min(8).max(120).optional(),
});

export const textStyleSchema = z.object({
  // Text color
  textColor: z.string().default("#000000"),
  
  // Background
  backgroundColor: z.string().default("transparent"),
  backgroundOpacity: z.number().min(0).max(1).default(1),
  
  // Container
  padding: z.object({
    top: z.number().min(0).max(100).default(16),
    right: z.number().min(0).max(100).default(16),
    bottom: z.number().min(0).max(100).default(16),
    left: z.number().min(0).max(100).default(16),
  }).default({ top: 16, right: 16, bottom: 16, left: 16 }),
  
  borderRadius: z.number().min(0).max(50).default(8),
  
  // Border
  border: z.object({
    enabled: z.boolean().default(false),
    width: z.number().min(0).max(10).default(1),
    color: z.string().default("rgba(0, 0, 0, 0.1)"),
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  }).default({
    enabled: false,
    width: 1,
    color: "rgba(0, 0, 0, 0.1)",
    style: "solid"
  }),
  
  // Shadow
  shadow: z.object({
    enabled: z.boolean().default(false),
    size: z.enum(["sm", "md", "lg", "xl"]).default("md"),
  }).default({
    enabled: false,
    size: "md"
  }),
  
  // Font family
  fontFamily: z.string().default("Inter, system-ui, sans-serif"),
  
  // Line height
  lineHeight: z.number().min(0.8).max(3).default(1.5),
  
  // Letter spacing
  letterSpacing: z.number().min(-2).max(10).default(0),
});

export const textDataSchema = z.object({
  // No external data - text is stored in settings.content
});

export const textWidgetConfigSchemaV1 = baseWidgetConfigSchema.extend({
  settings: textSettingsSchema,
  style: textStyleSchema,
  data: textDataSchema,
});

export type TextWidgetConfigV1 = z.infer<typeof textWidgetConfigSchemaV1>;

