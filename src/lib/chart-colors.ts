/** @format */

// Premium Black & White Color Scheme for Luxury Charts
export const PREMIUM_CHART_COLORS = {
  // Primary Colors - Sophisticated Black & White
  primary: {
    black: "#000000",
    white: "#ffffff",
    charcoal: "#1a1a1a",
    darkGray: "#2d2d2d",
    mediumGray: "#404040",
    lightGray: "#6b6b6b",
    silver: "#9ca3af",
    platinum: "#e5e7eb",
    pearl: "#f9fafb",
  },

  // Accent Colors - Subtle Luxury Tones
  accent: {
    gold: "#d4af37",
    roseGold: "#e8b4b8",
    champagne: "#f7e7ce",
    platinum: "#e5e4e2",
    pearl: "#f8f6f0",
    charcoal: "#36454f",
    graphite: "#4a4a4a",
  },

  // Data Series Colors - Monochromatic with Elegant Variations
  data: {
    primary: "#000000",      // Pure black for primary data
    secondary: "#404040",    // Dark gray for secondary
    tertiary: "#6b6b6b",     // Medium gray for tertiary
    quaternary: "#9ca3af",   // Light gray for quaternary
    accent: "#d4af37",       // Gold accent for highlights
    success: "#22c55e",      // Subtle green for positive
    warning: "#f59e0b",      // Amber for warnings
    error: "#ef4444",        // Red for errors
  },

  // Gradient Colors for Areas and Fills
  gradients: {
    blackToTransparent: "linear-gradient(180deg, #000000 0%, rgba(0,0,0,0) 100%)",
    whiteToTransparent: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0) 100%)",
    charcoalToTransparent: "linear-gradient(180deg, #2d2d2d 0%, rgba(45,45,45,0) 100%)",
    goldToTransparent: "linear-gradient(180deg, #d4af37 0%, rgba(212,175,55,0) 100%)",
  },

  // Chart Specific Colors
  chart: {
    grid: "#e5e7eb",           // Light grid lines
    axis: "#6b6b6b",           // Axis labels
    tooltip: {
      background: "#1a1a1a",   // Dark tooltip background
      border: "#404040",       // Tooltip border
      text: "#ffffff",         // Tooltip text
    },
    legend: {
      text: "#404040",         // Legend text
      background: "transparent", // Legend background
    },
  },

  // Status Colors - Refined and Elegant
  status: {
    success: "#22c55e",        // Success green
    warning: "#f59e0b",        // Warning amber
    error: "#ef4444",          // Error red
    info: "#3b82f6",           // Info blue
    neutral: "#6b6b6b",        // Neutral gray
  },

  // Interactive States
  interactive: {
    hover: "#f3f4f6",          // Hover background
    active: "#e5e7eb",          // Active background
    focus: "#d1d5db",           // Focus border
    disabled: "#9ca3af",        // Disabled state
  },
};

// Chart Color Palettes for Different Data Types
export const CHART_PALETTES = {
  // Monochromatic - Perfect for luxury feel
  monochrome: [
    "#000000",  // Pure black
    "#2d2d2d",  // Charcoal
    "#404040",  // Dark gray
    "#6b6b6b",  // Medium gray
    "#9ca3af",  // Light gray
    "#d1d5db",  // Silver
  ],

  // Elegant Accent - Black with gold accents
  elegant: [
    "#000000",  // Primary black
    "#d4af37",  // Gold accent
    "#2d2d2d",  // Charcoal
    "#e8b4b8",  // Rose gold
    "#404040",  // Dark gray
    "#f7e7ce",  // Champagne
  ],

  // Sophisticated - Various grays with subtle accents
  sophisticated: [
    "#000000",  // Pure black
    "#36454f",  // Charcoal blue
    "#2d2d2d",  // Charcoal
    "#4a4a4a",  // Graphite
    "#6b6b6b",  // Medium gray
    "#9ca3af",  // Light gray
  ],

  // Minimalist - Clean and simple
  minimalist: [
    "#000000",  // Black
    "#404040",  // Dark gray
    "#6b6b6b",  // Medium gray
    "#9ca3af",  // Light gray
    "#d1d5db",  // Silver
    "#f3f4f6",  // Very light gray
  ],
};

// Utility Functions
export const getChartColor = (index: number, palette: keyof typeof CHART_PALETTES = 'elegant'): string => {
  const colors = CHART_PALETTES[palette];
  return colors[index % colors.length];
};

export const getGradientColor = (baseColor: string, opacity: number = 0.3): string => {
  // Convert hex to rgba with opacity
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getStatusColor = (percentage: number): string => {
  if (percentage >= 90) return PREMIUM_CHART_COLORS.status.error;
  if (percentage >= 75) return PREMIUM_CHART_COLORS.status.warning;
  if (percentage >= 50) return PREMIUM_CHART_COLORS.data.secondary;
  return PREMIUM_CHART_COLORS.status.success;
};

// Chart Styling Configuration
export const CHART_STYLES = {
  // Card styling
  card: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },

  // Grid styling
  grid: {
    strokeDasharray: "2 4",
    stroke: PREMIUM_CHART_COLORS.chart.grid,
    strokeWidth: 1,
  },

  // Axis styling
  axis: {
    stroke: PREMIUM_CHART_COLORS.chart.axis,
    fontSize: 12,
    fontWeight: 500,
  },

  // Tooltip styling
  tooltip: {
    backgroundColor: PREMIUM_CHART_COLORS.chart.tooltip.background,
    border: `1px solid ${PREMIUM_CHART_COLORS.chart.tooltip.border}`,
    borderRadius: "8px",
    color: PREMIUM_CHART_COLORS.chart.tooltip.text,
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 12px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },

  // Legend styling
  legend: {
    color: PREMIUM_CHART_COLORS.chart.legend.text,
    fontSize: 12,
    fontWeight: 500,
  },

  // Animation settings
  animation: {
    duration: 0.6,
    easing: [0.4, 0, 0.2, 1], // Framer Motion cubic-bezier format
  },
};
