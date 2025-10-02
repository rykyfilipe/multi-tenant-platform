import { z } from "zod";

/**
 * PREMIUM STYLE SCHEMA
 * Complete customization options for ultra-premium widget design
 */

export const premiumStyleSchema = z.object({
  // ===== THEME & COLORS =====
  theme: z.enum(["platinum", "onyx", "pearl", "obsidian", "custom"]).default("platinum"),
  
  // Background
  backgroundColor: z.string().optional(),
  backgroundGradient: z.string().optional(),
  backgroundOpacity: z.number().min(0).max(1).default(1),
  
  // Foreground/Text
  textColor: z.string().optional(),
  headingColor: z.string().optional(),
  mutedColor: z.string().optional(),
  
  // Accents
  accentColor: z.string().optional(),
  borderColor: z.string().optional(),
  
  // ===== TYPOGRAPHY =====
  fontFamily: z.string().optional(),
  fontSize: z.enum(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"]).default("base"),
  fontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("normal"),
  lineHeight: z.enum(["tight", "snug", "normal", "relaxed", "loose"]).default("normal"),
  letterSpacing: z.enum(["tighter", "tight", "normal", "wide", "wider", "widest"]).default("normal"),
  textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).default("none"),
  
  // Heading specific
  headingFontSize: z.enum(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"]).default("lg"),
  headingFontWeight: z.enum(["light", "normal", "medium", "semibold", "bold"]).default("semibold"),
  
  // ===== SPACING & LAYOUT =====
  padding: z.enum(["none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]).default("md"),
  margin: z.enum(["none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]).default("none"),
  gap: z.enum(["none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]).default("md"),
  
  // ===== BORDERS =====
  borderWidth: z.number().min(0).max(8).default(1),
  borderStyle: z.enum(["none", "solid", "dashed", "dotted", "double"]).default("solid"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"]).default("lg"),
  
  // Border sides (for asymmetric borders)
  borderTop: z.boolean().default(true),
  borderRight: z.boolean().default(true),
  borderBottom: z.boolean().default(true),
  borderLeft: z.boolean().default(true),
  
  // ===== SHADOWS & EFFECTS =====
  shadow: z.enum(["none", "subtle", "medium", "bold", "glow", "custom"]).default("medium"),
  customShadow: z.string().optional(),
  
  // Backdrop effects
  backdropBlur: z.enum(["none", "sm", "md", "lg", "xl"]).default("none"),
  backdropSaturate: z.number().min(0).max(200).default(100),
  
  // ===== ANIMATIONS & TRANSITIONS =====
  hoverEffect: z.enum(["none", "lift", "glow", "scale", "border"]).default("lift"),
  transitionDuration: z.number().min(0).max(1000).default(200),
  
  // ===== GLASS MORPHISM =====
  glassEffect: z.boolean().default(false),
  glassOpacity: z.number().min(0).max(1).default(0.9),
  glassBlur: z.number().min(0).max(40).default(12),
  
  // ===== GRADIENTS =====
  useGradient: z.boolean().default(false),
  gradientDirection: z.enum(["to-r", "to-l", "to-t", "to-b", "to-br", "to-bl", "to-tr", "to-tl"]).default("to-br"),
  gradientFrom: z.string().optional(),
  gradientVia: z.string().optional(),
  gradientTo: z.string().optional(),
  
  // ===== ADVANCED STYLING =====
  opacity: z.number().min(0).max(1).default(1),
  zIndex: z.number().min(0).max(100).default(1),
  
  // Container specific
  containerMaxWidth: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("full"),
  containerAlignment: z.enum(["left", "center", "right", "stretch"]).default("stretch"),
  
  // ===== SPECIAL EFFECTS =====
  shine: z.boolean().default(false), // Subtle shine effect
  innerGlow: z.boolean().default(false), // Inner glow
  outerGlow: z.boolean().default(false), // Outer glow
  
  // Noise texture (for premium feel)
  noiseTexture: z.boolean().default(false),
  noiseOpacity: z.number().min(0).max(1).default(0.02),
});

export type PremiumStyle = z.infer<typeof premiumStyleSchema>;

/**
 * Helper to generate CSS from premium style config
 */
export function generatePremiumCSS(style: Partial<PremiumStyle>): React.CSSProperties {
  const css: React.CSSProperties = {};
  
  // Background
  if (style.backgroundColor) css.backgroundColor = style.backgroundColor;
  if (style.backgroundOpacity !== undefined) css.opacity = style.backgroundOpacity;
  
  // Text
  if (style.textColor) css.color = style.textColor;
  if (style.fontFamily) css.fontFamily = style.fontFamily;
  
  // Borders
  if (style.borderWidth !== undefined) css.borderWidth = `${style.borderWidth}px`;
  if (style.borderColor) css.borderColor = style.borderColor;
  
  // Shadows
  if (style.customShadow) css.boxShadow = style.customShadow;
  
  return css;
}

