"use client";

import React, { PropsWithChildren } from "react";

interface BaseWidgetProps {
  title?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isDirty?: boolean;
  isEditMode?: boolean;
}

export const BaseWidget: React.FC<PropsWithChildren<BaseWidgetProps>> = ({
  title,
  onEdit,
  onDelete,
  onDuplicate,
  isDirty,
  isEditMode = false,
  children,
}) => {
  return (
    <div className={`
      flex h-full flex-col overflow-hidden transition-all duration-300
      ${isEditMode 
        ? 'rounded-lg bg-card/50 backdrop-blur-sm border border-border/40 hover:border-border/60 hover:shadow-md' 
        : 'rounded-xl bg-transparent border-0'
      }
    `}>
      {/* Clean header for edit mode only - minimal drag handle */}
      {isEditMode && (
        <div 
          className="widget-header flex items-center justify-between px-3 py-1.5 text-xs border-b border-border/30 cursor-grab active:cursor-grabbing bg-background/20"
        >
          <div className="flex items-center gap-2">
            {/* Drag handle indicator */}
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-foreground/20 rounded-full" />
              <div className="w-0.5 h-3 bg-foreground/20 rounded-full" />
            </div>
            {isDirty && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-600 dark:text-amber-400">
                Modified
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Content - Full space, premium and clean */}
      <div className={`
        widget-content flex-1 overflow-hidden
        ${isEditMode 
          ? 'p-3 cursor-grab active:cursor-grabbing' 
          : 'p-0'
        }
      `}>
        {children}
      </div>
    </div>
  );
};
