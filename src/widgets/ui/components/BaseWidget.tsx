"use client";

import React, { PropsWithChildren } from "react";

interface BaseWidgetProps {
  title?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onOpenDraft?: () => void;
  isDirty?: boolean;
  isEditMode?: boolean;
}

export const BaseWidget: React.FC<PropsWithChildren<BaseWidgetProps>> = ({
  title,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenDraft,
  isDirty,
  isEditMode = false,
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
        <div className={`
          flex items-center justify-between px-3 py-2 text-xs
          ${isEditMode 
            ? 'border-b border-border/60' 
            : 'border-b border-white/10 bg-gradient-to-r from-background/5 to-background/10'
          }
        `}>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isEditMode ? 'text-foreground/80' : 'text-foreground/90'}`}>
              {title ?? "Untitled widget"}
            </span>
            {isDirty && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Unsaved
              </span>
            )}
          </div>
          
          {/* Action buttons - Only in edit mode */}
          {isEditMode && (
            <div className="flex items-center gap-2 text-muted-foreground relative z-50">
              {onOpenDraft && (
                <button 
                  className="hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent/50" 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onOpenDraft();
                  }}
                >
                  Drafts
                </button>
              )}
              {onDuplicate && (
                <button 
                  className="hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent/50" 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDuplicate();
                  }}
                >
                  Duplicate
                </button>
              )}
              {onEdit && (
                <button 
                  className="hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent/50" 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onEdit();
                  }}
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button 
                  className="text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded hover:bg-destructive/10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete();
                  }}
                >
                  Delete
                </button>
              )}
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
