"use client";

import React, { PropsWithChildren, useRef } from "react";
import { cn } from "@/lib/utils";
import { designTokens } from "@/widgets/styles/designTokens";

interface BaseWidgetProps {
  title?: string | null;
  widgetType?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isDirty?: boolean;
  isEditMode?: boolean;
  isSelected?: boolean;
  widgetId?: number;
}

export const BaseWidget: React.FC<PropsWithChildren<BaseWidgetProps>> = ({
  title,
  widgetType = "Widget",
  onEdit,
  onDelete,
  onDuplicate,
  isDirty,
  isEditMode = false,
  isSelected = false,
  widgetId,
  children,
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditMode) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onEdit?.();
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onDelete?.();
        break;
      case 'd':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          onDuplicate?.();
        }
        break;
    }
  };

  return (
    <div 
      ref={widgetRef}
      role={isEditMode ? "button" : undefined}
      tabIndex={isEditMode ? 0 : undefined}
      aria-label={`${widgetType} widget${title ? `: ${title}` : ''}${isDirty ? ' (modified)' : ''}`}
      aria-selected={isSelected}
      onKeyDown={handleKeyDown}
      className={cn(
        "widget-header flex h-full flex-col overflow-hidden group",
        "rounded-xl bg-transparent border-0",
        designTokens.transitions.base
      )}
    >
      {/* Content - Full space, no padding, looks identical in both modes */}
      <div className={cn(
        "widget-content flex-1 overflow-hidden p-0",
        isEditMode && "pointer-events-none select-none"
      )}>
        {children}
      </div>
    </div>
  );
};
