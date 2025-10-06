"use client";

import React, { PropsWithChildren, useRef, useState } from "react";
import { GripVertical, Edit2, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { designTokens, widgetClasses } from "@/widgets/styles/designTokens";

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
  const [showActions, setShowActions] = useState(false);
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
      onMouseEnter={() => isEditMode && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        "flex h-full flex-col overflow-hidden group",
        designTokens.transitions.base,
        isEditMode 
          ? cn(
              widgetClasses.card,
              widgetClasses.cardHover,
              "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
              isSelected && "ring-2 ring-primary/50 ring-offset-2 bg-primary/5"
            )
          : "rounded-xl bg-transparent border-0"
      )}
    >
      {/* Enhanced header for edit mode with better affordance */}
      {isEditMode && (
        <div 
          className={cn(
            "widget-header flex items-center justify-between border-b border-border/30",
            "px-3 py-2 min-h-[44px]", // WCAG touch target
            "bg-background/20 backdrop-blur-sm"
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Enhanced drag handle with better visibility */}
            <div 
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-md",
                "cursor-grab active:cursor-grabbing",
                "hover:bg-primary/10 transition-colors duration-150",
                "min-w-[44px] justify-center" // WCAG touch target
              )}
              aria-label="Drag to reorder widget"
              role="button"
              tabIndex={0}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="sr-only">Drag handle</span>
            </div>

            {/* Widget type indicator */}
            {widgetType && (
              <span className="text-xs font-medium text-muted-foreground truncate">
                {widgetType}
              </span>
            )}

            {/* Modified indicator */}
            {isDirty && (
              <span 
                className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-600 dark:text-amber-400 whitespace-nowrap"
                aria-label="Widget has unsaved changes"
              >
                Modified
              </span>
            )}
          </div>

          {/* Action buttons - visible on hover/focus */}
          <div 
            className={cn(
              "flex items-center gap-1",
              "transition-opacity duration-200",
              showActions || isSelected ? "opacity-100" : "opacity-0 md:opacity-0",
              "sm:opacity-100" // Always visible on mobile
            )}
          >
            {onEdit && (
              <button
                onClick={onEdit}
                className={cn(
                  "p-2 rounded-md hover:bg-primary/10 transition-colors",
                  "min-w-[44px] min-h-[44px] flex items-center justify-center", // WCAG
                  "focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
                aria-label="Edit widget"
                title="Edit widget"
              >
                <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                className={cn(
                  "p-2 rounded-md hover:bg-primary/10 transition-colors",
                  "min-w-[44px] min-h-[44px] flex items-center justify-center",
                  "focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
                aria-label="Duplicate widget"
                title="Duplicate widget"
              >
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className={cn(
                  "p-2 rounded-md hover:bg-destructive/10 transition-colors",
                  "min-w-[44px] min-h-[44px] flex items-center justify-center",
                  "focus-visible:ring-2 focus-visible:ring-destructive/50"
                )}
                aria-label="Delete widget"
                title="Delete widget"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Content - Full space, premium and clean */}
      <div className={cn(
        "widget-content flex-1 overflow-hidden",
        isEditMode ? "p-3" : "p-0"
      )}>
        {children}
      </div>
    </div>
  );
};
