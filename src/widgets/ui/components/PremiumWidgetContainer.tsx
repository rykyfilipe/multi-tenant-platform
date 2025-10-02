"use client";

import React, { PropsWithChildren } from "react";
import { getPremiumTheme, premiumSpacing, premiumBorderRadius } from "@/widgets/styles/premiumThemes";
import { cn } from "@/lib/utils";

interface PremiumWidgetContainerProps {
  style?: any;
  className?: string;
}

/**
 * Premium widget container with full style customization
 * Applies luxury design with all premium options
 */
export const PremiumWidgetContainer: React.FC<PropsWithChildren<PremiumWidgetContainerProps>> = ({
  style: styleConfig = {},
  className,
  children
}) => {
  // Get theme
  const theme = getPremiumTheme(styleConfig.theme || 'platinum');
  
  // Build CSS
  const containerStyle: React.CSSProperties = {};
  
  // ===== BACKGROUND =====
  if (styleConfig.backgroundGradient) {
    containerStyle.background = styleConfig.backgroundGradient;
  } else if (styleConfig.backgroundColor) {
    containerStyle.backgroundColor = styleConfig.backgroundColor;
  } else {
    containerStyle.backgroundColor = theme.colors.background;
  }
  
  // ===== COLORS =====
  containerStyle.color = styleConfig.textColor || theme.colors.foreground;
  
  // ===== BORDERS =====
  if (styleConfig.borderWidth !== undefined && styleConfig.borderWidth > 0) {
    const borderStyle = styleConfig.borderStyle || 'solid';
    const borderColor = styleConfig.borderColor || theme.colors.border;
    containerStyle.border = `${styleConfig.borderWidth}px ${borderStyle} ${borderColor}`;
  }
  
  // ===== TYPOGRAPHY =====
  if (styleConfig.fontFamily) {
    containerStyle.fontFamily = styleConfig.fontFamily;
  } else {
    containerStyle.fontFamily = theme.typography.fontFamily;
  }
  
  // ===== SHADOWS =====
  const shadowMap = {
    none: 'none',
    subtle: theme.shadows.subtle,
    medium: theme.shadows.medium,
    bold: theme.shadows.bold,
    glow: theme.shadows.glow,
  };
  containerStyle.boxShadow = shadowMap[styleConfig.shadow as keyof typeof shadowMap] || shadowMap.medium;
  
  // ===== BACKDROP EFFECTS =====
  const backdropBlurMap = {
    none: 'blur(0px)',
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(16px)',
  };
  
  if (styleConfig.backdropBlur && styleConfig.backdropBlur !== 'none') {
    containerStyle.backdropFilter = backdropBlurMap[styleConfig.backdropBlur as keyof typeof backdropBlurMap];
  }
  
  // ===== GLASS EFFECT =====
  if (styleConfig.glassEffect) {
    containerStyle.background = theme.gradients.glass;
    containerStyle.backdropFilter = 'blur(12px) saturate(180%)';
    containerStyle.border = `1px solid ${theme.colors.border}`;
  }
  
  // ===== OPACITY =====
  if (styleConfig.opacity !== undefined) {
    containerStyle.opacity = styleConfig.opacity;
  }
  
  // Build Tailwind classes for spacing and radius
  const paddingMap = {
    none: 'p-0',
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-12',
  };
  
  const borderRadiusMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };
  
  const paddingClass = paddingMap[styleConfig.padding as keyof typeof paddingMap] || 'p-4';
  const radiusClass = borderRadiusMap[styleConfig.borderRadius as keyof typeof borderRadiusMap] || 'rounded-xl';
  
  // Premium effects classes
  const effectClasses = cn(
    // Base
    'transition-all duration-300 ease-in-out',
    paddingClass,
    radiusClass,
    
    // Shine effect
    styleConfig.shine && 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
    
    // Glow effect
    styleConfig.glow && 'ring-1 ring-black/5 hover:ring-black/10',
    
    // Pulse effect (for KPIs)
    styleConfig.pulse && 'animate-pulse',
    
    // Hover lift
    styleConfig.hoverEffect === 'lift' && 'hover:-translate-y-0.5 hover:shadow-lg',
    styleConfig.hoverEffect === 'scale' && 'hover:scale-[1.01]',
    styleConfig.hoverEffect === 'glow' && 'hover:shadow-2xl',
    
    // Glass morphism
    styleConfig.glassEffect && 'backdrop-blur-xl bg-opacity-90',
    
    className
  );
  
  return (
    <div 
      className={effectClasses}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

/**
 * Premium heading component
 */
export const PremiumHeading: React.FC<PropsWithChildren<{
  style?: any;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}>> = ({ style: styleConfig = {}, level = 2, className, children }) => {
  const theme = getPremiumTheme(styleConfig.theme || 'platinum');
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const headingStyle: React.CSSProperties = {
    color: styleConfig.headingColor || styleConfig.textColor || theme.colors.foreground,
    fontFamily: styleConfig.fontFamily || theme.typography.fontFamily,
  };
  
  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  };
  
  const weightMap = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  
  const size = styleConfig.headingFontSize || styleConfig.fontSize || 'lg';
  const weight = styleConfig.headingFontWeight || styleConfig.fontWeight || 'semibold';
  
  return (
    <Tag 
      className={cn(
        sizeMap[size as keyof typeof sizeMap],
        weightMap[weight as keyof typeof weightMap],
        'tracking-tight',
        className
      )}
      style={headingStyle}
    >
      {children}
    </Tag>
  );
};

/**
 * Premium text component
 */
export const PremiumText: React.FC<PropsWithChildren<{
  style?: any;
  variant?: 'body' | 'muted' | 'accent';
  className?: string;
}>> = ({ style: styleConfig = {}, variant = 'body', className, children }) => {
  const theme = getPremiumTheme(styleConfig.theme || 'platinum');
  
  const textStyle: React.CSSProperties = {
    fontFamily: styleConfig.fontFamily || theme.typography.fontFamily,
  };
  
  let color = styleConfig.textColor || theme.colors.foreground;
  if (variant === 'muted') {
    color = styleConfig.mutedColor || theme.colors.mutedForeground;
  } else if (variant === 'accent') {
    color = styleConfig.accentColor || theme.colors.accent;
  }
  
  textStyle.color = color;
  
  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };
  
  const weightMap = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  
  const letterSpacingMap = {
    tighter: 'tracking-tighter',
    tight: 'tracking-tight',
    normal: 'tracking-normal',
    wide: 'tracking-wide',
    wider: 'tracking-wider',
    widest: 'tracking-widest',
  };
  
  return (
    <span 
      className={cn(
        sizeMap[styleConfig.fontSize as keyof typeof sizeMap] || 'text-sm',
        weightMap[styleConfig.fontWeight as keyof typeof weightMap] || 'font-normal',
        letterSpacingMap[styleConfig.letterSpacing as keyof typeof letterSpacingMap] || 'tracking-normal',
        className
      )}
      style={textStyle}
    >
      {children}
    </span>
  );
};

