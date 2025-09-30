"use client";

import React, { useState, useEffect } from "react";
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

  const timeString = time.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour12: !format24h,
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined
  });

  const dateString = showDate ? time.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <div className={`font-mono font-bold text-foreground ${
            style.fontSize === 'xs' ? 'text-xs' :
            style.fontSize === 'sm' ? 'text-sm' :
            style.fontSize === 'lg' ? 'text-2xl' :
            style.fontSize === 'xl' ? 'text-3xl' :
            style.fontSize === '2xl' ? 'text-4xl' : 'text-3xl'
          }`}>
            {timeString}
          </div>
          {showDate && (
            <div className="text-sm text-muted-foreground mt-2">
              {dateString}
            </div>
          )}
          {showTimezone && (
            <div className="text-xs text-muted-foreground/70 mt-1">
              {timezone}
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
};
