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
  const timezone = config?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const format24h = config?.format24h !== false;

  const timeString = time.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour12: !format24h,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = time.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-foreground">
            {timeString}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {dateString}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">
            {timezone}
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};
