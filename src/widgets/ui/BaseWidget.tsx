"use client";

import React, { PropsWithChildren } from "react";

interface BaseWidgetProps {
  title?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const BaseWidget: React.FC<PropsWithChildren<BaseWidgetProps>> = ({
  title,
  onEdit,
  onDelete,
  onDuplicate,
  children,
}) => {
  return (
    <div className="base-widget rounded-lg border border-muted-foreground/10 bg-background shadow-sm">
      <div className="flex items-center justify-between border-b border-muted-foreground/10 px-3 py-2">
        <span className="text-sm font-medium text-foreground/80">{title}</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {onEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit();
              }} 
              className="hover:text-foreground"
            >
              Edit
            </button>
          )}
          {onDuplicate && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDuplicate();
              }} 
              className="hover:text-foreground"
            >
              Duplicate
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete();
              }} 
              className="text-destructive"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <div className="p-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
};
