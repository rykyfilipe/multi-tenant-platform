"use client";

import React, { useState, useEffect, useMemo } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";

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
  const style = config?.style || {};
  const refreshSettings = config?.refresh || { enabled: false, interval: 30000 };

  const timezone = settings.timezone && settings.timezone !== "local"
    ? settings.timezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const format24h = settings.format === "12h" ? false : true;
  const showDate = settings.showDate !== false;
  const showSeconds = settings.showSeconds !== false;
  const showTimezone = settings.showTimezone || false;
  const dateFormat = settings.dateFormat || "DD/MM/YYYY";
  const clockType = settings.clockType || "digital";

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

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div 
        className={`
          flex h-full flex-col items-center justify-center space-y-4
          ${getThemeClasses(style.theme || 'premium-light')}
          ${getBorderRadiusClass(style.borderRadius || 'md')}
          ${getShadowClass(style.shadow || 'sm')}
          ${getPaddingClass(style.padding || 'comfortable')}
          border
        `}
        style={{
          backgroundColor: style.backgroundColor || undefined,
          borderColor: style.borderColor || undefined,
        }}
      >
        <div className={`${getAlignmentClass(style.alignment || 'center')}`}>
          <div 
            className={`
              ${getFontFamilyClass(style.fontFamily || 'mono')} 
              font-bold
              ${style.fontSize === 'xs' ? 'text-xs' :
                style.fontSize === 'sm' ? 'text-sm' :
                style.fontSize === 'lg' ? 'text-2xl' :
                style.fontSize === 'xl' ? 'text-3xl' :
                style.fontSize === '2xl' ? 'text-4xl' : 'text-3xl'
              }
            `}
            style={{
              color: style.textColor || undefined,
            }}
          >
            {timeString}
          </div>
          {showDate && (
            <div 
              className="text-sm mt-2 opacity-70"
              style={{
                color: style.textColor || undefined,
              }}
            >
              {dateString}
            </div>
          )}
          {showTimezone && (
            <div 
              className="text-xs mt-1 opacity-50"
              style={{
                color: style.textColor || undefined,
              }}
            >
              {timezone}
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
};
