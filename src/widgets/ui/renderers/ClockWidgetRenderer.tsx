"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { cn } from "@/lib/utils";
import { useResponsive } from "../components/ResponsiveProvider";

interface ClockWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

const ClockWidgetRendererComponent: React.FC<ClockWidgetRendererProps> = ({ 
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
  const { viewport, isMobile, isTablet, isDesktop } = useResponsive();

  const timezone = settings.timezone && settings.timezone !== "local"
    ? settings.timezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const format24h = settings.format === "12h" ? false : true;
  const showDate = settings.showDate !== false;
  const showSeconds = settings.showSeconds !== false;
  const showTimezone = settings.showTimezone || false;
  const clockType = settings.clockType || "digital";
  const dateFormat = settings.dateFormat || "DD/MM/YYYY";

  // Extract ADVANCED styling from schema
  const backgroundColor = styleConfig.backgroundColor || "#FFFFFF";
  const bgGradient = styleConfig.backgroundGradient || { enabled: false, from: "#FFFFFF", to: "#F3F4F6", direction: "to-br" };
  const borderRadius = styleConfig.borderRadius ?? 16;
  const border = styleConfig.border || { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" };
  const shadow = styleConfig.shadow || { enabled: true, size: "md" };
  const padding = styleConfig.padding || { x: 32, y: 24 };
  const alignment = styleConfig.alignment || "center";
  
  // Time styling - RESPONSIVE
  const timeStyle = styleConfig.time || {};
  const baseTimeFontSize = timeStyle.fontSize ?? 64;
  // Responsive: much smaller on mobile, medium on tablet, full on desktop
  const timeFontSize = isMobile 
    ? Math.max(baseTimeFontSize * 0.5, 32) 
    : isTablet 
    ? Math.max(baseTimeFontSize * 0.75, 48) 
    : baseTimeFontSize;
  const timeFontFamily = timeStyle.fontFamily || "Courier New, monospace";
  const timeFontWeight = timeStyle.fontWeight || "700";
  const timeColor = timeStyle.color || "#111827";
  const timeGradient = timeStyle.gradient || { enabled: false, from: "#3B82F6", to: "#8B5CF6" };
  const timeLetterSpacing = timeStyle.letterSpacing ?? 2;
  const showSeparatorBlink = timeStyle.showSeparatorBlink ?? true;
  
  // Date styling - RESPONSIVE
  const dateStyle = styleConfig.date || {};
  const baseDateFontSize = dateStyle.fontSize ?? 16;
  const dateFontSize = isMobile ? Math.max(baseDateFontSize - 2, 12) : baseDateFontSize;
  const dateFontFamily = dateStyle.fontFamily || "Inter, system-ui, sans-serif";
  const dateFontWeight = dateStyle.fontWeight || "500";
  const dateColor = dateStyle.color || "#6B7280";
  const dateTextTransform = dateStyle.textTransform || "uppercase";
  const dateLetterSpacing = dateStyle.letterSpacing ?? 1;
  const dateMarginTop = dateStyle.marginTop ?? (isMobile ? 6 : 8);
  
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
  }, [widget.id, time, timezone, format24h, showSeconds]);

  const dateString = useMemo(() => {
    return showDate ? time.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';
  }, [widget.id, time, timezone, showDate, dateFormat]);

  // Container styles - RESPONSIVE
  const basePadding = padding || { x: 32, y: 24 };
  const responsivePadding = isMobile
    ? { x: Math.max(basePadding.x * 0.6, 16), y: Math.max(basePadding.y * 0.6, 12) }
    : basePadding;
  
  const containerStyle: React.CSSProperties = {
    background: bgGradient?.enabled 
      ? `linear-gradient(${bgGradient.direction}, ${bgGradient.from}, ${bgGradient.to})` 
      : backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: border?.enabled ? `${border.width}px ${border.style} ${border.color}` : 'none',
    padding: `${responsivePadding.y}px ${responsivePadding.x}px`,
  };

  // Time display style
  const timeTextStyle: React.CSSProperties = {
    fontSize: `${timeFontSize}px`,
    fontFamily: timeFontFamily,
    fontWeight: timeFontWeight,
    color: timeGradient?.enabled ? 'transparent' : timeColor,
    background: timeGradient?.enabled 
      ? `linear-gradient(to right, ${timeGradient.from}, ${timeGradient.to})`
      : undefined,
    backgroundClip: timeGradient?.enabled ? 'text' : undefined,
    WebkitBackgroundClip: timeGradient?.enabled ? 'text' : undefined,
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
            shadow?.enabled && getShadowClass(shadow?.size || "md"),
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

// OPTIMISTIC RENDERING: Clock has no external data, only style changes
export const ClockWidgetRenderer = React.memo(
  ClockWidgetRendererComponent,
  (prevProps, nextProps) => {
    if (prevProps.widget.id !== nextProps.widget.id) {
      console.log('🔄 [ClockWidget] Re-render: widget ID changed');
      return false;
    }
    
    if (prevProps.isEditMode !== nextProps.isEditMode) {
      console.log('🔄 [ClockWidget] Re-render: edit mode changed');
      return false;
    }
    
    // Config changed? Re-render (style or settings)
    if (JSON.stringify(prevProps.widget.config) !== JSON.stringify(nextProps.widget.config)) {
      console.log('✨ [ClockWidget] Config changed - optimistic re-render');
      return false;
    }
    
    console.log('⚡ [ClockWidget] Props equal - SKIP re-render');
    return true;
  }
);
