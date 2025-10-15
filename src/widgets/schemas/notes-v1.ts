import { z } from "zod";
import { baseWidgetConfigSchema } from "./base";

// Checklist item schema
export const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  checked: z.boolean().default(false),
});

// Individual note schema
export const noteItemSchema = z.object({
  id: z.string(),
  title: z.string().default("New Note"),
  content: z.string().default(""),
  color: z.enum(["yellow", "blue", "green", "pink", "purple", "gray", "orange"]).default("yellow"),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  
  // Level 2 features
  tags: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
  isChecklist: z.boolean().default(false),
  checklistItems: z.array(checklistItemSchema).default([]),
  
  // Rich text formatting (stored as markdown)
  isMarkdown: z.boolean().default(false),
  
  // Level 3 features
  linkedWidgetIds: z.array(z.number()).default([]),
  reminder: z.object({
    enabled: z.boolean().default(false),
    date: z.string().or(z.date()).optional(),
    notified: z.boolean().default(false),
  }).optional(),
});

export type NoteItem = z.infer<typeof noteItemSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const notesSettingsSchema = z.object({
  // Display settings
  showDates: z.boolean().default(true),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "relative"]).default("relative"),
  
  // Layout
  layout: z.enum(["grid", "list", "masonry"]).default("grid"),
  columns: z.number().min(1).max(4).default(2),
  
  // Editing
  allowInlineEdit: z.boolean().default(true),
  allowDelete: z.boolean().default(true),
  
  // Limits
  maxNotes: z.number().min(1).max(100).default(20),
  
  // Default color for new notes
  defaultColor: z.enum(["yellow", "blue", "green", "pink", "purple", "gray", "orange"]).default("yellow"),
  
  // Level 2 features
  enableSearch: z.boolean().default(true),
  enableTags: z.boolean().default(true),
  enablePinning: z.boolean().default(true),
  enableChecklists: z.boolean().default(true),
  showPinnedFirst: z.boolean().default(true),
  
  // Level 3 features
  enableMarkdown: z.boolean().default(false),
  enableReminders: z.boolean().default(false),
  enableLinking: z.boolean().default(false),
});

export const notesStyleSchema = z.object({
  // ============================================================================
  // CONTAINER STYLING
  // ============================================================================
  
  // Background
  backgroundColor: z.string().default("transparent"),
  backgroundOpacity: z.number().min(0).max(1).default(1),
  backgroundGradient: z.object({
    enabled: z.boolean().default(false),
    from: z.string().default("#FFFFFF"),
    to: z.string().default("#F3F4F6"),
    direction: z.enum(["to-t", "to-tr", "to-r", "to-br", "to-b", "to-bl", "to-l", "to-tl"]).default("to-br"),
  }).default({
    enabled: false,
    from: "#FFFFFF",
    to: "#F3F4F6",
    direction: "to-br"
  }),
  
  // Border
  borderRadius: z.number().min(0).max(50).default(0),
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
    size: z.enum(["none", "sm", "md", "lg", "xl"]).default("sm"),
    color: z.string().default("rgba(0, 0, 0, 0.1)"),
  }).default({
    enabled: false,
    size: "sm",
    color: "rgba(0, 0, 0, 0.1)"
  }),
  
  // Padding
  padding: z.union([
    z.object({
      x: z.number().min(0).max(100).default(16),
      y: z.number().min(0).max(100).default(16),
    }),
    z.enum(["none", "sm", "md", "lg"]) // Backward compatibility
  ]).default({ x: 16, y: 16 }).transform((val) => {
    if (typeof val === 'string') {
      const paddingMap: Record<string, any> = {
        none: { x: 0, y: 0 },
        sm: { x: 8, y: 8 },
        md: { x: 16, y: 16 },
        lg: { x: 24, y: 24 },
      };
      return paddingMap[val] || { x: 16, y: 16 };
    }
    return val;
  }),
  
  // Text Color
  textColor: z.string().default("#000000"),
  
  // ============================================================================
  // NOTE CARDS STYLING
  // ============================================================================
  
  // Note cards
  cardBorderRadius: z.number().min(0).max(50).default(12),
  cardShadow: z.enum(["none", "sm", "md", "lg"]).default("md"),
  cardPadding: z.number().min(0).max(50).default(16),
  
  // Typography
  titleFontSize: z.number().min(12).max(32).default(16),
  contentFontSize: z.number().min(10).max(24).default(14),
  fontFamily: z.string().default("Inter, system-ui, sans-serif"),
  
  // Spacing
  gap: z.number().min(0).max(50).default(12),
});

export const notesDataSchema = z.object({
  notes: z.array(noteItemSchema).default([]),
});

export const notesWidgetConfigSchemaV1 = baseWidgetConfigSchema.extend({
  settings: notesSettingsSchema,
  style: notesStyleSchema,
  data: notesDataSchema,
});

export type NotesWidgetConfigV1 = z.infer<typeof notesWidgetConfigSchemaV1>;

// Color mapping for sticky note colors
export const noteColors = {
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-900 dark:text-yellow-100",
    hover: "hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-100",
    hover: "hover:bg-blue-50 dark:hover:bg-blue-900/30"
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-900 dark:text-green-100",
    hover: "hover:bg-green-50 dark:hover:bg-green-900/30"
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/20",
    border: "border-pink-200 dark:border-pink-800",
    text: "text-pink-900 dark:text-pink-100",
    hover: "hover:bg-pink-50 dark:hover:bg-pink-900/30"
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-900 dark:text-purple-100",
    hover: "hover:bg-purple-50 dark:hover:bg-purple-900/30"
  },
  gray: {
    bg: "bg-gray-100 dark:bg-gray-900/20",
    border: "border-gray-200 dark:border-gray-800",
    text: "text-gray-900 dark:text-gray-100",
    hover: "hover:bg-gray-50 dark:hover:bg-gray-900/30"
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-900 dark:text-orange-100",
    hover: "hover:bg-orange-50 dark:hover:bg-orange-900/30"
  }
} as const;

