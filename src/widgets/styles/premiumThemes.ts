/**
 * PREMIUM LUXURY DESIGN SYSTEM
 * Ultra-premium black & white themes with elegant aesthetics
 */

export interface PremiumTheme {
  name: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
    border: string;
    muted: string;
    mutedForeground: string;
    hover: string;
    selected: string;
  };
  gradients: {
    subtle: string;
    bold: string;
    glass: string;
  };
  shadows: {
    subtle: string;
    medium: string;
    bold: string;
    glow: string;
  };
  typography: {
    fontFamily: string;
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
}

/**
 * PLATINUM - Ultra-bright luxury white theme
 */
export const platinumTheme: PremiumTheme = {
  name: "Platinum",
  colors: {
    background: "#FFFFFF",
    foreground: "#000000",
    accent: "#1a1a1a",
    border: "#E5E5E5",
    muted: "#F5F5F5",
    mutedForeground: "#737373",
    hover: "#FAFAFA",
    selected: "#F0F0F0",
  },
  gradients: {
    subtle: "linear-gradient(135deg, #FFFFFF 0%, #F8F8F8 100%)",
    bold: "linear-gradient(135deg, #FFFFFF 0%, #E8E8E8 100%)",
    glass: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,248,248,0.9) 100%)",
  },
  shadows: {
    subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    medium: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
    bold: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    glow: "0 0 20px rgba(0, 0, 0, 0.03), 0 0 40px rgba(0, 0, 0, 0.02)",
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

/**
 * ONYX - Ultra-dark luxury black theme
 */
export const onyxTheme: PremiumTheme = {
  name: "Onyx",
  colors: {
    background: "#0A0A0A",
    foreground: "#FFFFFF",
    accent: "#E5E5E5",
    border: "#262626",
    muted: "#171717",
    mutedForeground: "#A3A3A3",
    hover: "#1F1F1F",
    selected: "#262626",
  },
  gradients: {
    subtle: "linear-gradient(135deg, #0A0A0A 0%, #141414 100%)",
    bold: "linear-gradient(135deg, #0A0A0A 0%, #1F1F1F 100%)",
    glass: "linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(20,20,20,0.9) 100%)",
  },
  shadows: {
    subtle: "0 1px 2px 0 rgba(255, 255, 255, 0.05)",
    medium: "0 4px 6px -1px rgba(255, 255, 255, 0.08), 0 2px 4px -1px rgba(255, 255, 255, 0.04)",
    bold: "0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -2px rgba(255, 255, 255, 0.05)",
    glow: "0 0 20px rgba(255, 255, 255, 0.03), 0 0 40px rgba(255, 255, 255, 0.02)",
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

/**
 * PEARL - Soft luxury white with warm undertones
 */
export const pearlTheme: PremiumTheme = {
  name: "Pearl",
  colors: {
    background: "#FAFAF9",
    foreground: "#1C1917",
    accent: "#292524",
    border: "#E7E5E4",
    muted: "#F5F5F4",
    mutedForeground: "#78716C",
    hover: "#FFFFFF",
    selected: "#F5F5F4",
  },
  gradients: {
    subtle: "linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 100%)",
    bold: "linear-gradient(135deg, #FFFFFF 0%, #E7E5E4 100%)",
    glass: "linear-gradient(135deg, rgba(250,250,249,0.95) 0%, rgba(245,245,244,0.9) 100%)",
  },
  shadows: {
    subtle: "0 1px 2px 0 rgba(28, 25, 23, 0.05)",
    medium: "0 4px 6px -1px rgba(28, 25, 23, 0.08), 0 2px 4px -1px rgba(28, 25, 23, 0.04)",
    bold: "0 10px 15px -3px rgba(28, 25, 23, 0.1), 0 4px 6px -2px rgba(28, 25, 23, 0.05)",
    glow: "0 0 20px rgba(28, 25, 23, 0.03), 0 0 40px rgba(28, 25, 23, 0.02)",
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

/**
 * OBSIDIAN - Deep luxury black with cool undertones
 */
export const obsidianTheme: PremiumTheme = {
  name: "Obsidian",
  colors: {
    background: "#09090B",
    foreground: "#FAFAFA",
    accent: "#D4D4D8",
    border: "#27272A",
    muted: "#18181B",
    mutedForeground: "#A1A1AA",
    hover: "#1F1F23",
    selected: "#27272A",
  },
  gradients: {
    subtle: "linear-gradient(135deg, #09090B 0%, #18181B 100%)",
    bold: "linear-gradient(135deg, #09090B 0%, #27272A 100%)",
    glass: "linear-gradient(135deg, rgba(9,9,11,0.95) 0%, rgba(24,24,27,0.9) 100%)",
  },
  shadows: {
    subtle: "0 1px 2px 0 rgba(250, 250, 250, 0.05)",
    medium: "0 4px 6px -1px rgba(250, 250, 250, 0.08), 0 2px 4px -1px rgba(250, 250, 250, 0.04)",
    bold: "0 10px 15px -3px rgba(250, 250, 250, 0.1), 0 4px 6px -2px rgba(250, 250, 250, 0.05)",
    glow: "0 0 20px rgba(250, 250, 250, 0.03), 0 0 40px rgba(250, 250, 250, 0.02)",
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

/**
 * Get theme by name
 */
export function getPremiumTheme(themeName: string): PremiumTheme {
  switch (themeName) {
    case 'platinum': return platinumTheme;
    case 'onyx': return onyxTheme;
    case 'pearl': return pearlTheme;
    case 'obsidian': return obsidianTheme;
    default: return platinumTheme;
  }
}

/**
 * Premium color palette for data visualization
 */
export const premiumDataColors = {
  monochrome: [
    "#000000", // Pure black
    "#1a1a1a", // Almost black
    "#333333", // Dark gray
    "#4d4d4d", // Medium-dark gray
    "#666666", // Medium gray
    "#808080", // Middle gray
    "#999999", // Light-medium gray
    "#b3b3b3", // Light gray
    "#cccccc", // Very light gray
    "#e6e6e6", // Almost white
  ],
  elegant: [
    "#000000", // Pure black
    "#2D2D2D", // Charcoal
    "#4A4A4A", // Steel gray
    "#6B6B6B", // Slate
    "#8C8C8C", // Silver
    "#ADADAD", // Light silver
    "#CECECE", // Pearl
    "#E8E8E8", // Cloud
    "#F5F5F5", // Snow
    "#FFFFFF", // Pure white
  ],
  professional: [
    "#0F0F0F", // Rich black
    "#252525", // Graphite
    "#3D3D3D", // Onyx
    "#575757", // Gunmetal
    "#727272", // Pewter
    "#8E8E8E", // Nickel
    "#ABABAB", // Platinum
    "#C8C8C8", // Silver mist
    "#E5E5E5", // Porcelain
    "#FAFAFA", // Ivory
  ],
};

/**
 * Luxury spacing scale
 */
export const premiumSpacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

/**
 * Premium border radius scale
 */
export const premiumBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

/**
 * Typography scale
 */
export const premiumTypography = {
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

