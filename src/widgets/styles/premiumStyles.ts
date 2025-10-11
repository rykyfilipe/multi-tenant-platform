/**
 * Premium Widget Styling System
 * Provides elegant, luxury themes and styles for all widgets
 */

export type PremiumTheme = 
  | 'transparent' 
  | 'glass' 
  | 'minimal' 
  | 'luxury' 
  | 'dark-elegant' 
  | 'light-premium'
  | 'gradient-soft'
  | 'neo-brutalism';

export type Elevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type BorderStyle = 'none' | 'solid' | 'dashed' | 'gradient';
export type AnimationStyle = 'none' | 'subtle' | 'smooth' | 'bounce';

export interface PremiumWidgetStyle {
  // Container styles
  background: string;
  backdropBlur?: string;
  border?: string;
  borderRadius: string;
  shadow: string;
  padding: string;
  
  // Content styles
  textColor: string;
  accentColor: string;
  secondaryColor?: string;
  
  // Effects
  opacity?: number;
  gradient?: string;
  animation?: AnimationStyle;
}

export const premiumThemes: Record<PremiumTheme, PremiumWidgetStyle> = {
  transparent: {
    background: 'transparent',
    border: 'none',
    borderRadius: '0',
    shadow: 'none',
    padding: '0',
    textColor: 'hsl(var(--foreground))',
    accentColor: 'hsl(var(--primary))',
    opacity: 1,
  },
  
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropBlur: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    padding: '1.5rem',
    textColor: 'hsl(var(--foreground))',
    accentColor: 'hsl(var(--primary))',
    opacity: 0.95,
  },
  
  minimal: {
    background: 'transparent',
    border: '1px solid hsl(var(--border) / 0.3)',
    borderRadius: '0.5rem',
    shadow: 'none',
    padding: '1rem',
    textColor: 'hsl(var(--foreground))',
    accentColor: 'hsl(var(--primary))',
    animation: 'subtle',
  },
  
  luxury: {
    background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '1.25rem',
    shadow: '0 20px 60px rgba(212, 175, 55, 0.15), 0 0 40px rgba(212, 175, 55, 0.05)',
    padding: '2rem',
    textColor: '#F5F5F5',
    accentColor: '#D4AF37',
    secondaryColor: '#C9B037',
    gradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%)',
    animation: 'smooth',
  },
  
  'dark-elegant': {
    background: 'hsl(var(--background) / 0.95)',
    backdropBlur: 'blur(10px)',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    shadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    padding: '1.5rem',
    textColor: 'hsl(var(--foreground))',
    accentColor: 'hsl(var(--primary))',
    animation: 'subtle',
  },
  
  'light-premium': {
    background: 'rgba(255, 255, 255, 0.98)',
    backdropBlur: 'blur(8px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '1rem',
    shadow: '0 8px 30px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)',
    padding: '1.75rem',
    textColor: '#1a1a1a',
    accentColor: '#2563eb',
    animation: 'smooth',
  },
  
  'gradient-soft': {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
    backdropBlur: 'blur(12px)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '1.5rem',
    shadow: '0 12px 40px rgba(99, 102, 241, 0.1)',
    padding: '1.5rem',
    textColor: 'hsl(var(--foreground))',
    accentColor: 'rgb(99, 102, 241)',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
    animation: 'smooth',
  },
  
  'neo-brutalism': {
    background: 'hsl(var(--background))',
    border: '3px solid hsl(var(--foreground))',
    borderRadius: '0',
    shadow: '8px 8px 0 hsl(var(--foreground) / 0.1)',
    padding: '1.5rem',
    textColor: 'hsl(var(--foreground))',
    accentColor: 'hsl(var(--primary))',
    animation: 'none',
  },
};

export interface ChartPremiumStyle {
  theme: PremiumTheme;
  showBackground: boolean;
  transparentBackground: boolean;
  gridOpacity: number;
  axisStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  showLegend: boolean;
  legendPosition: 'top' | 'right' | 'bottom' | 'left';
  colorScheme: 'default' | 'pastel' | 'vibrant' | 'monochrome' | 'luxury';
  animationDuration: number;
}

export interface KPIPremiumStyle {
  theme: PremiumTheme;
  layout: 'compact' | 'spacious' | 'card';
  iconStyle: 'outline' | 'filled' | 'gradient';
  numberSize: 'sm' | 'md' | 'lg' | 'xl';
  showTrend: boolean;
  showSparkline: boolean;
  accentPosition: 'top' | 'left' | 'bottom' | 'none';
}

export interface TablePremiumStyle {
  theme: PremiumTheme;
  headerStyle: 'bold' | 'subtle' | 'accent' | 'none';
  rowHover: boolean;
  stripedRows: boolean;
  borderStyle: 'full' | 'horizontal' | 'vertical' | 'none';
  cellPadding: 'compact' | 'normal' | 'relaxed';
  fontSize: 'sm' | 'md' | 'lg';
}

export interface WeatherPremiumStyle {
  theme: PremiumTheme;
  layout: 'minimal' | 'detailed' | 'card';
  showBackground: boolean;
  iconStyle: 'line' | 'filled' | 'gradient';
  showForecast: boolean;
  forecastDays: number;
  temperatureUnit: 'celsius' | 'fahrenheit';
}

export interface ClockPremiumStyle {
  theme: PremiumTheme;
  type: 'analog' | 'digital' | 'both';
  showSeconds: boolean;
  showDate: boolean;
  dateFormat: 'short' | 'long' | 'full';
  clockStyle: 'modern' | 'classic' | 'minimal';
  accentColor: string;
}

export interface TasksPremiumStyle {
  theme: PremiumTheme;
  layout: 'list' | 'grid' | 'kanban';
  cardStyle: 'flat' | 'elevated' | 'bordered';
  showPriority: boolean;
  priorityStyle: 'badge' | 'border' | 'icon';
  completedOpacity: number;
  spacing: 'compact' | 'normal' | 'relaxed';
}

// Color schemes for charts
export const chartColorSchemes = {
  default: [
    'rgb(59, 130, 246)',   // blue
    'rgb(168, 85, 247)',   // purple
    'rgb(236, 72, 153)',   // pink
    'rgb(251, 146, 60)',   // orange
    'rgb(34, 197, 94)',    // green
  ],
  pastel: [
    'rgb(186, 230, 253)',  // light blue
    'rgb(221, 214, 254)',  // light purple
    'rgb(251, 207, 232)',  // light pink
    'rgb(254, 215, 170)',  // light orange
    'rgb(187, 247, 208)',  // light green
  ],
  vibrant: [
    'rgb(37, 99, 235)',    // strong blue
    'rgb(147, 51, 234)',   // strong purple
    'rgb(219, 39, 119)',   // strong pink
    'rgb(234, 88, 12)',    // strong orange
    'rgb(22, 163, 74)',    // strong green
  ],
  monochrome: [
    'rgb(15, 23, 42)',     // slate-900
    'rgb(51, 65, 85)',     // slate-700
    'rgb(100, 116, 139)',  // slate-500
    'rgb(148, 163, 184)',  // slate-400
    'rgb(203, 213, 225)',  // slate-300
  ],
  luxury: [
    'rgb(212, 175, 55)',   // gold
    'rgb(192, 192, 192)',  // silver
    'rgb(205, 127, 50)',   // bronze
    'rgb(229, 228, 226)',  // platinum
    'rgb(138, 119, 98)',   // rose gold
  ],
};

// Helper function to get theme styles with custom overrides
export function getPremiumStyle(
  theme: PremiumTheme,
  overrides?: Partial<PremiumWidgetStyle>
): PremiumWidgetStyle {
  return {
    ...premiumThemes[theme],
    ...overrides,
  };
}

// Helper to generate CSS string from style object
export function generateStyleCSS(style: PremiumWidgetStyle): string {
  const css = [];
  
  if (style.background) {
    css.push(`background: ${style.background}`);
  }
  
  if (style.backdropBlur) {
    css.push(`backdrop-filter: ${style.backdropBlur}`);
    css.push(`-webkit-backdrop-filter: ${style.backdropBlur}`);
  }
  
  if (style.border && style.border !== 'none') {
    css.push(`border: ${style.border}`);
  }
  
  if (style.borderRadius) {
    css.push(`border-radius: ${style.borderRadius}`);
  }
  
  if (style.shadow && style.shadow !== 'none') {
    css.push(`box-shadow: ${style.shadow}`);
  }
  
  if (style.padding) {
    css.push(`padding: ${style.padding}`);
  }
  
  if (style.opacity !== undefined && style.opacity !== 1) {
    css.push(`opacity: ${style.opacity}`);
  }
  
  return css.join('; ');
}

// Helper to apply animation classes
export function getAnimationClass(animation?: AnimationStyle): string {
  switch (animation) {
    case 'subtle':
      return 'transition-all duration-300 ease-in-out';
    case 'smooth':
      return 'transition-all duration-500 ease-out';
    case 'bounce':
      return 'transition-all duration-300 ease-bounce';
    default:
      return '';
  }
}

