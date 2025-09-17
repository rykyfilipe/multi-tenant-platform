import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Edit3, Trash2, Settings, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WidgetStyleConfig {
  // Background styling
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  
  // Border styling
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  
  // Shadow styling
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shadowColor?: string;
  
  // Padding and spacing
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Typography
  titleColor?: string;
  titleSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  titleAlign?: 'left' | 'center' | 'right';
  
  // Animation and effects
  animation?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
  hoverEffect?: 'none' | 'lift' | 'glow' | 'scale' | 'rotate';
  
  // Layout
  height?: 'auto' | 'fit' | 'full' | 'min' | 'max';
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  
  // Custom CSS
  customCSS?: string;
}

export interface BaseWidgetProps {
  widget: {
    id: number | string;
    title?: string | null;
    type: string;
    config?: any;
    style?: WidgetStyleConfig;
  };
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
}

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
  style
}: BaseWidgetProps) {
  const config = widget.config || {};
  const title = widget.title || config.title || `Widget ${widget.id}`;
  const widgetStyle = style || widget.style || {};

  // Generate dynamic styles
  const getDynamicStyles = () => {
    const styles: React.CSSProperties = {};
    
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
    }
    
    if (widgetStyle.borderColor) {
      styles.borderColor = widgetStyle.borderColor;
    }
    
    if (widgetStyle.borderWidth) {
      styles.borderWidth = `${widgetStyle.borderWidth}px`;
    }
    
    if (widgetStyle.shadowColor) {
      styles.boxShadow = `0 4px 6px -1px ${widgetStyle.shadowColor}`;
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
      }
    }
    
    // Overflow
    if (widgetStyle.overflow) {
      classes.push(`overflow-${widgetStyle.overflow}`);
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
      }
    }
    
    return classes.join(' ');
  };

  const titleClasses = cn(
    'font-medium',
    widgetStyle.titleSize ? `text-${widgetStyle.titleSize}` : 'text-sm',
    widgetStyle.titleWeight ? `font-${widgetStyle.titleWeight}` : 'font-medium',
    widgetStyle.titleAlign ? `text-${widgetStyle.titleAlign}` : 'text-left',
    widgetStyle.titleColor ? '' : 'text-foreground'
  );

  return (
    <Card 
      className={cn(
        'h-full transition-all duration-200 group',
        getStyleClasses(),
        className
      )}
      style={{
        ...getDynamicStyles(),
        ...(widgetStyle.titleColor && { '--title-color': widgetStyle.titleColor } as React.CSSProperties)
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle 
            className={titleClasses}
            style={{ color: widgetStyle.titleColor }}
          >
            {title}
          </CardTitle>
          <div className="flex items-center space-x-1 widget-header-buttons opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {showRefresh && onRefresh && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRefresh();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={isLoading}
                className="z-10 relative h-8 w-8 p-0 hover:bg-muted/50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {isEditMode && onStyleEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onStyleEdit();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="z-10 relative h-8 w-8 p-0 hover:bg-muted/50"
              >
                <Palette className="h-4 w-4" />
              </Button>
            )}
            {isEditMode && onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Edit button clicked for widget:', widget.id);
                  onEdit();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="z-10 relative h-8 w-8 p-0 hover:bg-muted/50"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {isEditMode && onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Delete button clicked for widget:', widget.id);
                  onDelete();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="z-10 relative h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 h-full">
        <div className={cn(
          'h-full',
          widgetStyle.height === 'min' ? 'min-h-[200px]' : '',
          widgetStyle.overflow ? `overflow-${widgetStyle.overflow}` : ''
        )}>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
