/**
 * Chart Color Utilities
 * Professional color palettes and automatic color generation for charts
 */

// Premium color palettes
export const CHART_COLOR_PALETTES = {
  // Professional business colors
  business: [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280', // Gray
  ],
  
  // Elegant monochrome
  monochrome: [
    '#1F2937', // Dark gray
    '#374151', // Gray
    '#4B5563', // Medium gray
    '#6B7280', // Light gray
    '#9CA3AF', // Lighter gray
    '#D1D5DB', // Very light gray
    '#E5E7EB', // Almost white
    '#F3F4F6', // Off white
  ],
  
  // Vibrant modern
  vibrant: [
    '#FF6B6B', // Coral
    '#4ECDC4', // Teal
    '#45B7D1', // Sky blue
    '#96CEB4', // Mint
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Seafoam
    '#F7DC6F', // Gold
  ],
  
  // Luxury colors
  luxury: [
    '#2C3E50', // Dark blue-gray
    '#E74C3C', // Red
    '#F39C12', // Orange
    '#27AE60', // Green
    '#8E44AD', // Purple
    '#3498DB', // Blue
    '#1ABC9C', // Turquoise
    '#E67E22', // Dark orange
  ],
  
  // Pastel professional
  pastel: [
    '#E3F2FD', // Light blue
    '#E8F5E8', // Light green
    '#FFF3E0', // Light orange
    '#FCE4EC', // Light pink
    '#F3E5F5', // Light purple
    '#E0F2F1', // Light teal
    '#FFF8E1', // Light yellow
    '#EFEBE9', // Light brown
  ],
  
  // High contrast
  highContrast: [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
  ]
} as const;

export type ColorPalette = keyof typeof CHART_COLOR_PALETTES;

// Generate colors for a specific number of data points
export function generateChartColors(
  count: number, 
  palette: ColorPalette = 'business'
): string[] {
  const colors = CHART_COLOR_PALETTES[palette];
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    if (i < colors.length) {
      result.push(colors[i]);
    } else {
      // Generate additional colors by cycling through the palette
      const baseColor = colors[i % colors.length];
      const variation = Math.floor(i / colors.length);
      result.push(generateColorVariation(baseColor, variation));
    }
  }
  
  return result;
}

// Generate color variations for extended palettes
function generateColorVariation(baseColor: string, variation: number): string {
  // Convert hex to RGB
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Apply variation (darken or lighten)
  const factor = 0.8 + (variation * 0.2);
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Get a single color by index
export function getChartColor(index: number, palette: ColorPalette = 'business'): string {
  const colors = CHART_COLOR_PALETTES[palette];
  return colors[index % colors.length];
}

// Generate gradient colors
export function generateGradientColors(
  startColor: string, 
  endColor: string, 
  steps: number
): string[] {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  
  if (!start || !end) return [startColor, endColor];
  
  const result: string[] = [];
  
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    
    result.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
  }
  
  return result;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Get color palette names for UI
export function getColorPaletteNames(): Array<{ key: ColorPalette; name: string; description: string }> {
  return [
    { key: 'business', name: 'Business', description: 'Professional blue and green tones' },
    { key: 'monochrome', name: 'Monochrome', description: 'Elegant grayscale palette' },
    { key: 'vibrant', name: 'Vibrant', description: 'Bright and modern colors' },
    { key: 'luxury', name: 'Luxury', description: 'Sophisticated dark tones' },
    { key: 'pastel', name: 'Pastel', description: 'Soft and gentle colors' },
    { key: 'highContrast', name: 'High Contrast', description: 'Maximum visibility colors' }
  ];
}

// Generate random colors (for testing)
export function generateRandomColors(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`);
  }
  return colors;
}