"use client";

import React, { PropsWithChildren } from "react";

interface BaseWidgetProps {
  title?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onOpenDraft?: () => void;
  isDirty?: boolean;
}

export const BaseWidget: React.FC<PropsWithChildren<BaseWidgetProps>> = ({
  title,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenDraft,
  isDirty,
  children,
}) => {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground/80">{title ?? "Untitled widget"}</span>
          {isDirty && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {onOpenDraft && (
            <button className="hover:text-foreground" onClick={onOpenDraft}>
              Drafts
            </button>
          )}
          {onDuplicate && (
            <button className="hover:text-foreground" onClick={onDuplicate}>
              Duplicate
            </button>
          )}
          {onEdit && (
            <button className="hover:text-foreground" onClick={onEdit}>
              Edit
            </button>
          )}
          {onDelete && (
            <button className="text-destructive" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
};
