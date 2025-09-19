/**
 * Minimalist Design System for Widgets
 * Clean, modern, black & white design with minimal accents
 */

export const MINIMALIST_DESIGN = {
  // Color Palette
  colors: {
    primary: '#000000',
    secondary: '#6b7280',
    accent: '#3b82f6', // Single accent color
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },
  },

  // Typography Scale
  typography: {
    sizes: {
      xs: 'text-xs',      // 12px
      sm: 'text-sm',      // 14px
      base: 'text-sm sm:text-base',  // 14px mobile, 16px desktop
      lg: 'text-base sm:text-lg',    // 16px mobile, 18px desktop
      xl: 'text-lg sm:text-xl',      // 18px mobile, 20px desktop
      '2xl': 'text-xl sm:text-2xl',  // 20px mobile, 24px desktop
      '3xl': 'text-2xl sm:text-3xl', // 24px mobile, 30px desktop
      '4xl': 'text-3xl sm:text-4xl', // 30px mobile, 36px desktop
      '5xl': 'text-4xl sm:text-5xl', // 36px mobile, 48px desktop
    },
    weights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },

  // Spacing Scale
  spacing: {
    xs: 'space-y-1',      // 4px
    sm: 'space-y-2',      // 8px
    md: 'space-y-3',      // 12px
    lg: 'space-y-4',      // 16px
    xl: 'space-y-6',      // 24px
    '2xl': 'space-y-8',   // 32px
  },

  // Component Styles
  components: {
    card: {
      base: 'bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col',
      header: 'px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 border-b border-gray-100 flex-shrink-0',
      content: 'px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 flex-1 flex flex-col min-h-0',
    },
    button: {
      primary: 'bg-black text-white hover:bg-gray-800 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors',
      ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-1 py-1 sm:px-2 rounded-md text-xs sm:text-sm transition-colors',
      icon: 'p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8',
    },
    input: {
      base: 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    },
    badge: {
      base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      primary: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    },
  },

  // Layout Patterns
  layout: {
    grid: 'grid gap-4',
    flex: 'flex items-center',
    flexCol: 'flex flex-col',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start',
    end: 'flex items-end',
  },

  // Icon Sizes
  icons: {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
  },
};

// Utility functions for consistent styling
export const getMinimalistStyles = {
  layout: {
    ...MINIMALIST_DESIGN.layout,
  },
  typography: {
    ...MINIMALIST_DESIGN.typography,
  },
  components: {
    ...MINIMALIST_DESIGN.components,
  },
  spacing: {
    ...MINIMALIST_DESIGN.spacing,
  },
  icons: {
    ...MINIMALIST_DESIGN.icons,
  },
  colors: {
    ...MINIMALIST_DESIGN.colors,
  },
  input: {
    ...MINIMALIST_DESIGN.components.input,
  },
  badge: {
    ...MINIMALIST_DESIGN.components.badge,
  },
  button: {
    ...MINIMALIST_DESIGN.components.button,
  },
  card: {
    ...MINIMALIST_DESIGN.components.card,
  },
  header: {
    base: MINIMALIST_DESIGN.components.card.header,
  },
  content: {
    base: MINIMALIST_DESIGN.components.card.content,
  },
  title: {
    base: MINIMALIST_DESIGN.typography.sizes.xl,
  },
  value: {
    base: MINIMALIST_DESIGN.typography.sizes['2xl'],
  },
  subtitle: {
    base: MINIMALIST_DESIGN.typography.sizes.sm,
  },
  text: {
    base: MINIMALIST_DESIGN.typography.sizes.base,
  },
  muted: {
    base: MINIMALIST_DESIGN.typography.sizes.sm,
  },
  // Utility functions
  cardStyle: (className?: string) => 
    `${MINIMALIST_DESIGN.components.card.base} ${className || ''}`,
  
  headerStyle: (className?: string) => 
    `${MINIMALIST_DESIGN.components.card.header} ${className || ''}`,
  
  contentStyle: (className?: string) => 
    `${MINIMALIST_DESIGN.components.card.content} ${className || ''}`,
  
  titleStyle: (size: 'sm' | 'md' | 'lg' = 'md', className?: string) => {
    const sizeMap = {
      sm: MINIMALIST_DESIGN.typography.sizes.lg,
      md: MINIMALIST_DESIGN.typography.sizes.xl,
      lg: MINIMALIST_DESIGN.typography.sizes['2xl'],
    };
    return `${sizeMap[size]} ${MINIMALIST_DESIGN.typography.weights.semibold} text-gray-900 truncate ${className || ''}`;
  },
  
  valueStyle: (size: 'sm' | 'md' | 'lg' | 'xl' = 'lg', className?: string) => {
    const sizeMap = {
      sm: MINIMALIST_DESIGN.typography.sizes.xl,
      md: MINIMALIST_DESIGN.typography.sizes['2xl'],
      lg: MINIMALIST_DESIGN.typography.sizes['3xl'],
      xl: MINIMALIST_DESIGN.typography.sizes['4xl'],
    };
    return `${sizeMap[size]} ${MINIMALIST_DESIGN.typography.weights.bold} text-gray-900 leading-tight ${className || ''}`;
  },
  
  subtitleStyle: (className?: string) => 
    `${MINIMALIST_DESIGN.typography.sizes.sm} ${MINIMALIST_DESIGN.typography.weights.medium} text-gray-600 ${className || ''}`,
  
  textStyle: (className?: string) => 
    `${MINIMALIST_DESIGN.typography.sizes.base} text-gray-700 ${className || ''}`,
  
  mutedStyle: (className?: string) => 
    `${MINIMALIST_DESIGN.typography.sizes.sm} text-gray-500 ${className || ''}`,
};
