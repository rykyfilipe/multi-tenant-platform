"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { cn } from "@/lib/utils";

interface ClockWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

export const ClockWidgetRenderer: React.FC<ClockWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false 
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const config = widget.config as any;
  const settings = config?.settings || {};
  const styleConfig = config?.style || {};

  const timezone = settings.timezone && settings.timezone !== "local"
    ? settings.timezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const format24h = settings.format === "12h" ? false : true;
  const showDate = settings.showDate !== false;
  const showSeconds = settings.showSeconds !== false;
  const showTimezone = settings.showTimezone || false;
  const clockType = settings.clockType || "digital";

  // Extract ADVANCED styling from schema
  const backgroundColor = styleConfig.backgroundColor || "#FFFFFF";
  const bgGradient = styleConfig.backgroundGradient || { enabled: false, from: "#FFFFFF", to: "#F3F4F6", direction: "to-br" };
  const borderRadius = styleConfig.borderRadius ?? 16;
  const border = styleConfig.border || { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" };
  const shadow = styleConfig.shadow || { enabled: true, size: "md" };
  const padding = styleConfig.padding || { x: 32, y: 24 };
  const alignment = styleConfig.alignment || "center";
  
  // Time styling
  const timeStyle = styleConfig.time || {};
  const timeFontSize = timeStyle.fontSize ?? 64;
  const timeFontFamily = timeStyle.fontFamily || "Courier New, monospace";
  const timeFontWeight = timeStyle.fontWeight || "700";
  const timeColor = timeStyle.color || "#111827";
  const timeGradient = timeStyle.gradient || { enabled: false, from: "#3B82F6", to: "#8B5CF6" };
  const timeLetterSpacing = timeStyle.letterSpacing ?? 2;
  const showSeparatorBlink = timeStyle.showSeparatorBlink ?? true;
  
  // Date styling
  const dateStyle = styleConfig.date || {};
  const dateFontSize = dateStyle.fontSize ?? 16;
  const dateFontFamily = dateStyle.fontFamily || "Inter, system-ui, sans-serif";
  const dateFontWeight = dateStyle.fontWeight || "500";
  const dateColor = dateStyle.color || "#6B7280";
  const dateTextTransform = dateStyle.textTransform || "uppercase";
  const dateLetterSpacing = dateStyle.letterSpacing ?? 1;
  const dateMarginTop = dateStyle.marginTop ?? 8;
  
  // Seconds styling
  const secondsStyle = styleConfig.seconds || {};
  const secondsFontSize = secondsStyle.fontSize ?? 24;
  const secondsColor = secondsStyle.color || "#9CA3AF";
  const secondsOpacity = secondsStyle.opacity ?? 0.7;
  
  // Animation
  const animationConfig = styleConfig.animation || { enabled: true, duration: 400, easing: "easeInOut" };
  
  const getShadowClass = (size: string) => {
    const shadowMap: Record<string, string> = {
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-xl"
    };
    return shadowMap[size] || "shadow-md";
  };

  const timeString = useMemo(() => {
    return time.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour12: !format24h,
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined
    });
  }, [time, timezone, format24h, showSeconds]);

  const dateString = useMemo(() => {
    return showDate ? time.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';
  }, [time, timezone, showDate, dateFormat]);

  // Apply theme-based styling
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'premium-light':
        return 'bg-white border-gray-200 text-gray-900';
      case 'premium-dark':
        return 'bg-gray-900 border-gray-700 text-white';
      case 'minimal':
        return 'bg-transparent border-gray-300 text-gray-800';
      case 'luxury':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 text-gray-900';
      case 'platinum':
        return 'bg-gradient-to-br from-gray-50 to-white border-gray-200 text-gray-800';
      case 'obsidian':
        return 'bg-gradient-to-br from-gray-800 to-black border-gray-600 text-white';
      case 'pearl':
        return 'bg-gradient-to-br from-gray-100 to-white border-gray-300 text-gray-700';
      default:
        return 'bg-white border-gray-200 text-gray-900';
    }
  };

  const getFontFamilyClass = (fontFamily: string) => {
    switch (fontFamily) {
      case 'sans':
        return 'font-sans';
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-mono';
    }
  };

  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return 'text-left';
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-center';
    }
  };

  const getBorderRadiusClass = (borderRadius: string) => {
    switch (borderRadius) {
      case 'none':
        return 'rounded-none';
      case 'sm':
        return 'rounded-sm';
      case 'md':
        return 'rounded-md';
      case 'lg':
        return 'rounded-lg';
      case 'xl':
        return 'rounded-xl';
      case '2xl':
        return 'rounded-2xl';
      case 'full':
        return 'rounded-full';
      default:
        return 'rounded-md';
    }
  };

  const getShadowClass = (shadow: string) => {
    switch (shadow) {
      case 'none':
        return 'shadow-none';
      case 'sm':
        return 'shadow-sm';
      case 'md':
        return 'shadow-md';
      case 'lg':
        return 'shadow-lg';
      case 'medium':
        return 'shadow-md';
      case 'subtle':
        return 'shadow-sm';
      case 'bold':
        return 'shadow-lg';
      default:
        return 'shadow-sm';
    }
  };

  const getPaddingClass = (padding: string) => {
    switch (padding) {
      case 'tight':
        return 'p-2';
      case 'comfortable':
        return 'p-4';
      case 'spacious':
        return 'p-6';
      case 'sm':
        return 'p-2';
      case 'md':
        return 'p-4';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    background: bgGradient.enabled 
      ? `linear-gradient(${bgGradient.direction}, ${bgGradient.from}, ${bgGradient.to})`
      : backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: border.enabled ? `${border.width}px ${border.style} ${border.color}` : 'none',
    padding: `${padding.y}px ${padding.x}px`,
  };

  // Time display style
  const timeTextStyle: React.CSSProperties = {
    fontSize: `${timeFontSize}px`,
    fontFamily: timeFontFamily,
    fontWeight: timeFontWeight,
    color: timeGradient.enabled ? 'transparent' : timeColor,
    background: timeGradient.enabled 
      ? `linear-gradient(to right, ${timeGradient.from}, ${timeGradient.to})`
      : undefined,
    backgroundClip: timeGradient.enabled ? 'text' : undefined,
    WebkitBackgroundClip: timeGradient.enabled ? 'text' : undefined,
    letterSpacing: `${timeLetterSpacing}px`,
  };

  // Date display style
  const dateTextStyle: React.CSSProperties = {
    fontSize: `${dateFontSize}px`,
    fontFamily: dateFontFamily,
    fontWeight: dateFontWeight,
    color: dateColor,
    textTransform: dateTextTransform as any,
    letterSpacing: `${dateLetterSpacing}px`,
    marginTop: `${dateMarginTop}px`,
  };

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <motion.div
        initial={animationConfig.enabled ? { opacity: 0, scale: 0.95 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: animationConfig.duration / 1000,
          ease: animationConfig.easing
        }}
        className="h-full"
      >
        <div 
          className={cn(
            "flex h-full flex-col items-center justify-center",
            shadow.enabled && getShadowClass(shadow.size),
            alignment === "left" && "items-start",
            alignment === "center" && "items-center",
            alignment === "right" && "items-end"
          )}
          style={containerStyle}
        >
          <div className="space-y-1">
            <div style={timeTextStyle}>
              {timeString}
            </div>
            {showDate && (
              <div style={dateTextStyle}>
                {dateString}
              </div>
            )}
            {showTimezone && (
              <div 
                className="text-xs"
                style={{
                  color: dateColor,
                  opacity: 0.6,
                  fontFamily: dateFontFamily,
                  marginTop: `${dateMarginTop / 2}px`,
                }}
              >
                {timezone}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </BaseWidget>
  );
};
