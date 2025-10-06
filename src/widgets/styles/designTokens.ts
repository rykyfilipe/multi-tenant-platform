/**
 * Unified Design System Tokens
 * Centralized design tokens for consistent UI across the dashboard
 */

export const designTokens = {
  // Spacing System (8px base)
  spacing: {
    widget: {
      gap: 'var(--space-6, 1.5rem)',        // 24px - space between widgets
      padding: 'var(--space-4, 1rem)',      // 16px - internal widget padding
      headerPadding: 'var(--space-3, 0.75rem)', // 12px - header padding
    },
    editor: {
      padding: 'var(--space-6, 1.5rem)',    // 24px - editor panel padding
      sectionGap: 'var(--space-4, 1rem)',   // 16px - gap between sections
      fieldGap: 'var(--space-3, 0.75rem)',  // 12px - gap between form fields
    },
    touch: {
      minTarget: '44px',                    // WCAG minimum touch target
      comfortable: '48px',                  // Comfortable touch target
    }
  },

  // Shadow System
  shadows: {
    subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgba(var(--primary-rgb), 0.3)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Typography Scale (responsive)
  typography: {
    heading: {
      h1: { mobile: 'text-2xl', tablet: 'text-3xl', desktop: 'text-4xl' },
      h2: { mobile: 'text-xl', tablet: 'text-2xl', desktop: 'text-3xl' },
      h3: { mobile: 'text-lg', tablet: 'text-xl', desktop: 'text-2xl' },
      h4: { mobile: 'text-base', tablet: 'text-lg', desktop: 'text-xl' },
    },
    body: {
      xs: { mobile: 'text-xs', desktop: 'text-xs' },
      sm: { mobile: 'text-xs', desktop: 'text-sm' },
      base: { mobile: 'text-sm', desktop: 'text-base' },
      lg: { mobile: 'text-base', desktop: 'text-lg' },
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    }
  },

  // Border Radius
  radius: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },

  // Transitions
  transitions: {
    fast: 'transition-all duration-150 ease-out',
    base: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out',
    slower: 'transition-all duration-500 ease-out',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
  },

  // Semantic colors (use theme variables)
  semanticColors: {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    successBg: 'bg-green-50 dark:bg-green-950/20',
    warningBg: 'bg-amber-50 dark:bg-amber-950/20',
    errorBg: 'bg-red-50 dark:bg-red-950/20',
    infoBg: 'bg-blue-50 dark:bg-blue-950/20',
  },

  // Interaction states
  interactions: {
    hover: 'hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-md',
    active: 'active:scale-95',
    focus: 'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },

  // Breakpoints (for programmatic use)
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
  }
} as const;

// Helper function to get responsive class
export const responsive = (
  mobile: string, 
  tablet?: string, 
  desktop?: string
) => {
  let classes = mobile;
  if (tablet) classes += ` md:${tablet}`;
  if (desktop) classes += ` lg:${desktop}`;
  return classes;
};

// Helper for consistent widget styling
export const widgetClasses = {
  card: `${designTokens.radius.lg} ${designTokens.transitions.base} bg-card border border-border/30`,
  cardHover: `hover:border-border/50 hover:shadow-lg`,
  header: `flex items-center justify-between px-4 py-3 border-b border-border/30`,
  content: `p-4`,
  footer: `px-4 py-3 border-t border-border/30`,
  dragHandle: `flex items-center gap-2 p-2 ${designTokens.radius.md} ${designTokens.transitions.base} hover:bg-primary/10 cursor-grab active:cursor-grabbing`,
};

// Helper for editor panel styling
export const editorClasses = {
  panel: `fixed inset-y-0 right-0 z-50 flex flex-col border-l border-border bg-background shadow-xl`,
  header: `flex items-center justify-between border-b border-border px-4 py-3`,
  content: `flex-1 overflow-y-auto p-4`,
  footer: `flex items-center justify-between border-t border-border px-4 py-3`,
  field: `space-y-2`,
  label: `text-sm font-medium text-foreground`,
  input: `w-full rounded-md border border-border bg-background px-3 py-2 text-sm ${designTokens.interactions.focus}`,
};

