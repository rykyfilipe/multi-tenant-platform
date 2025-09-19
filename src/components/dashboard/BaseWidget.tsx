import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Edit3, Trash2, Settings, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetStyleConfig, WidgetPreset, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { WidgetErrorBoundary } from './composition/WidgetErrorBoundary';
import { WidgetLoading } from './composition/WidgetLoading';
import { getMinimalistStyles } from './design/MinimalistDesignSystem';

// Common widget style presets
export const WIDGET_PRESETS = {
  // Modern minimal
  modern: {
    borderRadius: 'lg' as const,
    shadow: 'md' as const,
    padding: 'lg' as const,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    titleSize: 'lg' as const,
    titleWeight: 'semibold' as const,
    hoverEffect: 'lift' as const,
    transition: 'normal' as const,
  },
  
  // Glass morphism
  glass: {
    borderRadius: 'xl' as const,
    shadow: 'lg' as const,
    padding: 'lg' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropBlur: 'md' as const,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    titleSize: 'lg' as const,
    titleWeight: 'semibold' as const,
    hoverEffect: 'glow' as const,
    transition: 'normal' as const,
  },
  
  // Dark theme
  dark: {
    borderRadius: 'lg' as const,
    shadow: 'xl' as const,
    padding: 'lg' as const,
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    titleColor: '#ffffff',
    contentColor: '#d1d5db',
    titleSize: 'lg' as const,
    titleWeight: 'semibold' as const,
    hoverEffect: 'glow' as const,
    transition: 'normal' as const,
  },
  
  // Gradient
  gradient: {
    borderRadius: 'xl' as const,
    shadow: 'lg' as const,
    padding: 'lg' as const,
    backgroundGradient: '135deg, #667eea 0%, #764ba2 100%',
    titleColor: '#ffffff',
    contentColor: '#ffffff',
    titleSize: 'lg' as const,
    titleWeight: 'bold' as const,
    hoverEffect: 'scale' as const,
    transition: 'normal' as const,
  },
  
  // Card style
  card: {
    borderRadius: 'md' as const,
    shadow: 'sm' as const,
    padding: 'md' as const,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    titleSize: 'base' as const,
    titleWeight: 'medium' as const,
    hoverEffect: 'lift' as const,
    transition: 'fast' as const,
  },
  
  // Compact
  compact: {
    borderRadius: 'sm' as const,
    shadow: 'sm' as const,
    padding: 'sm' as const,
    backgroundColor: '#ffffff',
    titleSize: 'sm' as const,
    titleWeight: 'medium' as const,
    hoverEffect: 'none' as const,
    transition: 'fast' as const,
  },
  
  // Luxury
  luxury: {
    borderRadius: '2xl' as const,
    shadow: '2xl' as const,
    padding: 'xl' as const,
    backgroundColor: '#ffffff',
    borderColor: '#d4af37',
    borderWidth: 2,
    titleColor: '#1a1a1a',
    titleSize: 'xl' as const,
    titleWeight: 'bold' as const,
    titleTransform: 'uppercase' as const,
    hoverEffect: 'shimmer' as const,
    transition: 'slow' as const,
  },
} as const;

export interface BaseWidgetProps {
  widget: BaseWidgetType;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStyleEdit?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  showRefresh?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: WidgetStyleConfig;
  preset?: WidgetPreset;
}

// Helper function to apply preset styles
export const applyWidgetPreset = (preset: WidgetPreset, customStyle?: WidgetStyleConfig): WidgetStyleConfig => {
  const presetStyle = WIDGET_PRESETS[preset];
  return {
    ...presetStyle,
    ...customStyle,
  };
};

export default function BaseWidget({
  widget,
  isEditMode = false,
  onEdit,
  onDelete,
  onStyleEdit,
  isLoading = false,
  error = null,
  onRefresh,
  showRefresh = false,
  children,
  className = "",
  style,
  preset
}: BaseWidgetProps) {
  const config = widget.config || {};
  const title = widget.title || config.title || `Widget ${widget.id}`;
  
  // Apply preset if provided, otherwise use custom style or widget style
  const widgetStyle = preset 
    ? applyWidgetPreset(preset, style || widget.style)
    : style || widget.style || {};

  // Generate dynamic styles
  const getDynamicStyles = () => {
    const styles: React.CSSProperties = {};
    
    // Background styling
    if (widgetStyle.backgroundColor) {
      styles.backgroundColor = widgetStyle.backgroundColor;
    }
    
    if (widgetStyle.backgroundGradient) {
      styles.background = `linear-gradient(${widgetStyle.backgroundGradient})`;
    }
    
    if (widgetStyle.backgroundImage) {
      styles.backgroundImage = `url(${widgetStyle.backgroundImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }
    
    if (widgetStyle.backgroundOpacity !== undefined) {
      styles.opacity = widgetStyle.backgroundOpacity;
    }
    
    // Border styling
    if (widgetStyle.borderColor) {
      styles.borderColor = widgetStyle.borderColor;
    }
    
    if (widgetStyle.borderWidth) {
      styles.borderWidth = `${widgetStyle.borderWidth}px`;
    }
    
    if (widgetStyle.borderStyle) {
      styles.borderStyle = widgetStyle.borderStyle;
    }
    
    // Shadow styling
    if (widgetStyle.shadowColor) {
      const blur = widgetStyle.shadowBlur || 4;
      const spread = widgetStyle.shadowSpread || 0;
      styles.boxShadow = `0 4px ${blur}px ${spread}px ${widgetStyle.shadowColor}`;
    }
    
    // Layout and positioning
    if (widgetStyle.minHeight) {
      styles.minHeight = widgetStyle.minHeight;
    }
    
    if (widgetStyle.maxHeight) {
      styles.maxHeight = widgetStyle.maxHeight;
    }
    
    if (widgetStyle.minWidth) {
      styles.minWidth = widgetStyle.minWidth;
    }
    
    if (widgetStyle.maxWidth) {
      styles.maxWidth = widgetStyle.maxWidth;
    }
    
    if (widgetStyle.position) {
      styles.position = widgetStyle.position;
    }
    
    // Visual effects
    if (widgetStyle.backdropBlur && widgetStyle.backdropBlur !== 'none') {
      styles.backdropFilter = `blur(${widgetStyle.backdropBlur})`;
    }
    
    if (widgetStyle.backdropSaturate !== undefined) {
      styles.backdropFilter = `${styles.backdropFilter || ''} saturate(${widgetStyle.backdropSaturate})`;
    }
    
    if (widgetStyle.filter && widgetStyle.filter !== 'none') {
      styles.filter = widgetStyle.filter;
    }
    
    if (widgetStyle.opacity !== undefined) {
      styles.opacity = widgetStyle.opacity;
    }
    
    if (widgetStyle.transform) {
      styles.transform = widgetStyle.transform;
    }
    
    // Grid and flexbox
    if (widgetStyle.display) {
      styles.display = widgetStyle.display;
    }
    
    if (widgetStyle.flexDirection) {
      styles.flexDirection = widgetStyle.flexDirection;
    }
    
    if (widgetStyle.flexWrap) {
      styles.flexWrap = widgetStyle.flexWrap;
    }
    
    if (widgetStyle.justifyContent) {
      styles.justifyContent = widgetStyle.justifyContent;
    }
    
    if (widgetStyle.alignItems) {
      styles.alignItems = widgetStyle.alignItems;
    }
    
    if (widgetStyle.gridTemplateColumns) {
      styles.gridTemplateColumns = widgetStyle.gridTemplateColumns;
    }
    
    if (widgetStyle.gridTemplateRows) {
      styles.gridTemplateRows = widgetStyle.gridTemplateRows;
    }
    
    if (widgetStyle.gridGap) {
      styles.gap = widgetStyle.gridGap;
    }
    
    if (widgetStyle.customCSS) {
      // Parse custom CSS and apply
      const customStyles = widgetStyle.customCSS.split(';').reduce((acc, rule) => {
        const [property, value] = rule.split(':').map(s => s.trim());
        if (property && value) {
          acc[property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      Object.assign(styles, customStyles);
    }
    
    return styles;
  };

  // Generate CSS classes based on style config
  const getStyleClasses = () => {
    const classes = [];
    
    // Border radius
    if (widgetStyle.borderRadius) {
      classes.push(`rounded-${widgetStyle.borderRadius}`);
    }
    
    // Border position
    if (widgetStyle.borderPosition) {
      switch (widgetStyle.borderPosition) {
        case 'top':
          classes.push('border-t');
          break;
        case 'bottom':
          classes.push('border-b');
          break;
        case 'left':
          classes.push('border-l');
          break;
        case 'right':
          classes.push('border-r');
          break;
        case 'horizontal':
          classes.push('border-x');
          break;
        case 'vertical':
          classes.push('border-y');
          break;
        case 'all':
        default:
          classes.push('border');
          break;
      }
    }
    
    // Shadow
    if (widgetStyle.shadow && widgetStyle.shadow !== 'none') {
      classes.push(`shadow-${widgetStyle.shadow}`);
    }
    
    // Padding
    if (widgetStyle.padding && widgetStyle.padding !== 'none') {
      classes.push(`p-${widgetStyle.padding}`);
    }
    
    // Margin
    if (widgetStyle.margin && widgetStyle.margin !== 'none') {
      classes.push(`m-${widgetStyle.margin}`);
    }
    
    // Gap
    if (widgetStyle.gap && widgetStyle.gap !== 'none') {
      classes.push(`gap-${widgetStyle.gap}`);
    }
    
    // Height
    if (widgetStyle.height) {
      switch (widgetStyle.height) {
        case 'fit':
          classes.push('h-fit');
          break;
        case 'full':
          classes.push('h-full');
          break;
        case 'min':
          classes.push('min-h-[200px]');
          break;
        case 'max':
          classes.push('max-h-full');
          break;
        case 'screen':
          classes.push('h-screen');
          break;
        case 'auto':
        default:
          classes.push('h-auto');
          break;
      }
    }
    
    // Width
    if (widgetStyle.width) {
      switch (widgetStyle.width) {
        case 'fit':
          classes.push('w-fit');
          break;
        case 'full':
          classes.push('w-full');
          break;
        case 'min':
          classes.push('min-w-0');
          break;
        case 'max':
          classes.push('max-w-full');
          break;
        case 'screen':
          classes.push('w-screen');
          break;
        case 'auto':
        default:
          classes.push('w-auto');
          break;
      }
    }
    
    // Overflow
    if (widgetStyle.overflow) {
      classes.push(`overflow-${widgetStyle.overflow}`);
    }
    
    // Display
    if (widgetStyle.display) {
      classes.push(`flex-${widgetStyle.display}`);
    }
    
    // Flexbox properties
    if (widgetStyle.flexDirection) {
      classes.push(`flex-${widgetStyle.flexDirection}`);
    }
    
    if (widgetStyle.flexWrap) {
      classes.push(`flex-${widgetStyle.flexWrap}`);
    }
    
    if (widgetStyle.justifyContent) {
      classes.push(`justify-${widgetStyle.justifyContent}`);
    }
    
    if (widgetStyle.alignItems) {
      classes.push(`items-${widgetStyle.alignItems}`);
    }
    
    // Transition
    if (widgetStyle.transition && widgetStyle.transition !== 'none') {
      switch (widgetStyle.transition) {
        case 'fast':
          classes.push('transition-all duration-150');
          break;
        case 'normal':
          classes.push('transition-all duration-200');
          break;
        case 'slow':
          classes.push('transition-all duration-300');
          break;
        case 'custom':
          classes.push('transition-all');
          break;
      }
    }
    
    // Hover effects
    if (widgetStyle.hoverEffect && widgetStyle.hoverEffect !== 'none') {
      switch (widgetStyle.hoverEffect) {
        case 'lift':
          classes.push('hover:shadow-lg hover:-translate-y-1 transition-all duration-200');
          break;
        case 'glow':
          classes.push('hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-200');
          break;
        case 'scale':
          classes.push('hover:scale-105 transition-transform duration-200');
          break;
        case 'rotate':
          classes.push('hover:rotate-1 transition-transform duration-200');
          break;
        case 'tilt':
          classes.push('hover:rotate-2 hover:scale-105 transition-all duration-200');
          break;
        case 'shimmer':
          classes.push('hover:bg-gradient-to-r hover:from-transparent hover:via-white/20 hover:to-transparent transition-all duration-500');
          break;
        case 'gradient':
          classes.push('hover:bg-gradient-to-br hover:from-blue-500 hover:to-purple-600 transition-all duration-300');
          break;
      }
    }
    
    // Animation
    if (widgetStyle.animation && widgetStyle.animation !== 'none') {
      switch (widgetStyle.animation) {
        case 'fade':
          classes.push('animate-fade-in');
          break;
        case 'slide':
          classes.push('animate-slide-in');
          break;
        case 'bounce':
          classes.push('animate-bounce');
          break;
        case 'pulse':
          classes.push('animate-pulse');
          break;
        case 'spin':
          classes.push('animate-spin');
          break;
        case 'ping':
          classes.push('animate-ping');
          break;
        case 'wiggle':
          classes.push('animate-wiggle');
          break;
      }
    }
    
    // Backdrop blur
    if (widgetStyle.backdropBlur && widgetStyle.backdropBlur !== 'none') {
      classes.push(`backdrop-blur-${widgetStyle.backdropBlur}`);
    }
    
    // Custom classes
    if (widgetStyle.customClasses) {
      classes.push(...widgetStyle.customClasses);
    }
    
    return classes.join(' ');
  };

  // Generate responsive classes
  const getResponsiveClasses = () => {
    const classes = [];
    
    if (widgetStyle.responsive) {
      const { mobile, tablet, desktop, large } = widgetStyle.responsive;
      
      // Mobile styles (default)
      if (mobile) {
        if (mobile.padding) classes.push(`p-${mobile.padding}`);
        if (mobile.margin) classes.push(`m-${mobile.margin}`);
        if (mobile.titleSize) classes.push(`text-${mobile.titleSize}`);
        if (mobile.height) {
          switch (mobile.height) {
            case 'fit': classes.push('h-fit'); break;
            case 'full': classes.push('h-full'); break;
            case 'min': classes.push('min-h-[150px]'); break;
            case 'max': classes.push('max-h-full'); break;
          }
        }
      }
      
      // Tablet styles
      if (tablet) {
        if (tablet.padding) classes.push(`md:p-${tablet.padding}`);
        if (tablet.margin) classes.push(`md:m-${tablet.margin}`);
        if (tablet.titleSize) classes.push(`md:text-${tablet.titleSize}`);
        if (tablet.height) {
          switch (tablet.height) {
            case 'fit': classes.push('md:h-fit'); break;
            case 'full': classes.push('md:h-full'); break;
            case 'min': classes.push('md:min-h-[200px]'); break;
            case 'max': classes.push('md:max-h-full'); break;
          }
        }
      }
      
      // Desktop styles
      if (desktop) {
        if (desktop.padding) classes.push(`lg:p-${desktop.padding}`);
        if (desktop.margin) classes.push(`lg:m-${desktop.margin}`);
        if (desktop.titleSize) classes.push(`lg:text-${desktop.titleSize}`);
        if (desktop.height) {
          switch (desktop.height) {
            case 'fit': classes.push('lg:h-fit'); break;
            case 'full': classes.push('lg:h-full'); break;
            case 'min': classes.push('lg:min-h-[250px]'); break;
            case 'max': classes.push('lg:max-h-full'); break;
          }
        }
      }
      
      // Large screen styles
      if (large) {
        if (large.padding) classes.push(`xl:p-${large.padding}`);
        if (large.margin) classes.push(`xl:m-${large.margin}`);
        if (large.titleSize) classes.push(`xl:text-${large.titleSize}`);
        if (large.height) {
          switch (large.height) {
            case 'fit': classes.push('xl:h-fit'); break;
            case 'full': classes.push('xl:h-full'); break;
            case 'min': classes.push('xl:min-h-[300px]'); break;
            case 'max': classes.push('xl:max-h-full'); break;
          }
        }
      }
    }
    
    return classes.join(' ');
  };

  const titleClasses = cn(
    'font-medium',
    widgetStyle.titleSize ? `text-${widgetStyle.titleSize}` : 'text-sm',
    widgetStyle.titleWeight ? `font-${widgetStyle.titleWeight}` : 'font-medium',
    widgetStyle.titleAlign ? `text-${widgetStyle.titleAlign}` : 'text-left',
    widgetStyle.titleTransform ? `text-${widgetStyle.titleTransform}` : '',
    widgetStyle.titleDecoration ? `text-${widgetStyle.titleDecoration}` : '',
    widgetStyle.titleColor ? '' : 'text-foreground',
    // Responsive title classes
    getResponsiveClasses()
  );

  return (
    <WidgetErrorBoundary widget={widget}>
      <div 
        className={cn(
          'h-full w-full bg-white border border-gray-200 rounded-lg overflow-hidden relative',
          className
        )}
        style={{
          ...getDynamicStyles(),
          ...(widgetStyle.titleColor && { '--title-color': widgetStyle.titleColor } as React.CSSProperties)
        }}
      >
        {/* Simple header - just title */}
        {title && (
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 
              className={cn(
                'text-sm font-medium text-gray-900 truncate',
                getMinimalistStyles.titleStyle('sm')
              )}
              style={{ color: widgetStyle.titleColor }}
            >
              {title}
            </h3>
          </div>
        )}

        {/* Clean content area */}
        <div className="h-full w-full overflow-hidden flex flex-col">
          {isLoading ? (
            <WidgetLoading type="skeleton" size="md" />
          ) : error ? (
            <div className="flex items-center justify-center h-full min-h-[100px] sm:min-h-[120px] md:min-h-[150px]">
              <div className="text-center text-muted-foreground p-2 sm:p-4">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 mx-auto mb-2 text-red-500" />
                <p className="text-xs sm:text-sm font-medium break-words">{error}</p>
              </div>
            </div>
          ) : (
            <div className="h-full w-full overflow-auto flex-1 min-h-0">
              {children}
            </div>
          )}
        </div>

        {/* Edit mode buttons - floating */}
        {isEditMode && (
          <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
            {showRefresh && onRefresh && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRefresh();
                }}
                disabled={isLoading}
                className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-red-50 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </WidgetErrorBoundary>
  );
}
