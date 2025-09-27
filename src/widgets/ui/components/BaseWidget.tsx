"use client";

import React, { PropsWithChildren } from "react";

interface BaseWidgetProps {
  title?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onOpenDraft?: () => void;
  onApplyDraft?: () => void;
  onDeleteDraft?: () => void;
  isDirty?: boolean;
  isEditMode?: boolean;
  isDraft?: boolean;
}

export const BaseWidget: React.FC<PropsWithChildren<BaseWidgetProps>> = ({
  title,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenDraft,
  onApplyDraft,
  onDeleteDraft,
  isDirty,
  isEditMode = false,
  isDraft = false,
  children,
}) => {
  return (
    <div className={`
      flex h-full flex-col rounded-xl shadow-sm transition-all duration-300
      ${isEditMode 
        ? 'bg-card border border-border/60 hover:shadow-md' 
        : 'bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:scale-[1.02]'
      }
    `}>
      {/* Header - Only show in edit mode or when there's a title */}
      {(isEditMode || title) && (
        <div 
          className={`
            widget-header flex items-center justify-between px-3 py-2 text-xs
            ${isEditMode 
              ? 'border-b border-border/60 cursor-move' 
              : 'border-b border-white/10 bg-gradient-to-r from-background/5 to-background/10'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isEditMode ? 'text-foreground/80' : 'text-foreground/90'}`}>
              {title ?? "Untitled widget"}
            </span>
            {isDraft && (
              <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                <span className="text-blue-700 font-medium">Draft</span>
              </div>
            )}
            {isDirty && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Unsaved
              </span>
            )}
          </div>
          
          {/* Draft action buttons */}
          {isDraft && onApplyDraft && onDeleteDraft && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyDraft();
                }}
                className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600 transition-colors"
                title="Apply draft"
              >
                Apply
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDraft();
                }}
                className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                title="Delete draft"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className={`
        flex-1 overflow-hidden text-sm
        ${isEditMode 
          ? 'p-3 text-muted-foreground' 
          : 'p-4 text-foreground/90'
        }
      `}>
        {children}
      </div>
    </div>
  );
};
