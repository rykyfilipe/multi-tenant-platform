"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { X, Check, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { widgetRegistry } from "@/widgets/registry/widget-registry";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { designTokens, editorClasses } from "@/widgets/styles/designTokens";
import { Button } from "@/components/ui/button";

interface WidgetEditorSheetProps {
  widgetId: number;
  tenantId: number;
  onSave: (config: unknown, title: string | null) => void;
  onClose: () => void;
}

export const WidgetEditorSheet: React.FC<WidgetEditorSheetProps> = ({ 
  widgetId, 
  tenantId, 
  onSave, 
  onClose 
}) => {
  const widgets = useWidgetsStore((state) => state.widgets);
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  const widget = widgets[widgetId];
  
  const [draftConfig, setDraftConfig] = useState(widget?.config || {});
  const [draftTitle, setDraftTitle] = useState(widget?.title ?? "");
  const [hasChanges, setHasChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < designTokens.breakpoints.mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Live updates - apply changes immediately to widget - memoized to prevent infinite re-renders
  const handleConfigChange = useCallback((newConfig: any) => {
    setDraftConfig(newConfig);
    updateLocal(widgetId, { config: newConfig });
    setHasChanges(true);
  }, [widgetId, updateLocal]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setDraftTitle(newTitle);
    updateLocal(widgetId, { title: newTitle || null });
    setHasChanges(true);
  }, [widgetId, updateLocal]);

  const handleSaveAndClose = useCallback(() => {
    // Access current state via closure
    onSave(draftConfig, draftTitle);
    setHasChanges(false);
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSave, onClose]);

  useEffect(() => {
    if (widget) {
      setDraftConfig(widget.config || {});
      setDraftTitle(widget.title ?? "");
    }
  }, [widget?.id, widget?.config, widget?.title]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        onClose();
      }
      // Cmd+S / Ctrl+S to save and close
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveAndClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleSaveAndClose]);

  if (!widget) {
    return null;
  }

  const definition = widgetRegistry[widget.type];

  type EditorValue = z.infer<typeof definition.schema>;
  const EditorComponent = useMemo(
    () => definition.editor as React.ComponentType<{ 
      value: EditorValue; 
      onChange: (value: EditorValue) => void; 
      tenantId: number;
    }>,
    [definition.editor]
  );

  // Mobile: Full screen with header navigation
  // Desktop: Side panel
  return (
    <div 
      className={cn(
        editorClasses.panel,
        isMobile 
          ? "inset-0 w-full" 
          : "w-full max-w-xl md:max-w-2xl"
      )}
      role="dialog"
      aria-labelledby="widget-editor-title"
      aria-modal="true"
    >
      {/* Enhanced Header */}
      <header className={cn(
        editorClasses.header,
        "sticky top-0 z-10 bg-background/95 backdrop-blur-sm",
        "min-h-[60px]" // WCAG touch target
      )}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Close button - better positioned for mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              "min-w-[44px] min-h-[44px] p-2 -ml-2",
              "focus-visible:ring-2 focus-visible:ring-primary/50"
            )}
            aria-label="Close editor"
          >
            {isMobile ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
            <span className="sr-only">Close</span>
          </Button>

          <div className="flex-1 min-w-0">
            <h2 
              id="widget-editor-title" 
              className="text-base font-semibold text-foreground truncate"
            >
              Edit {widget.type} Widget
            </h2>
            {hasChanges && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Unsaved changes
              </p>
            )}
          </div>
        </div>

        {/* Save button - prominent on mobile */}
        <Button
          onClick={handleSaveAndClose}
          size="sm"
          className={cn(
            "min-w-[44px] min-h-[44px] gap-2",
            hasChanges && "bg-primary text-primary-foreground"
          )}
          aria-label="Save and close"
        >
          {hasChanges ? (
            <>
              <Save className="h-4 w-4" />
              {!isMobile && <span>Save</span>}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {!isMobile && <span>Done</span>}
            </>
          )}
        </Button>
      </header>

      {/* Editor Content */}
      <div className={cn(
        editorClasses.content,
        "scrollbar-thin",
        isMobile ? "px-4 py-6" : "px-6 py-6"
      )}>
        <div className="space-y-6 max-w-3xl">
          {/* Title field */}
          <div className={editorClasses.field}>
            <label 
              htmlFor="widget-title"
              className={editorClasses.label}
            >
              Widget Title
            </label>
            <input
              id="widget-title"
              type="text"
              className={cn(
                editorClasses.input,
                "min-h-[44px]" // WCAG
              )}
              value={draftTitle}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Enter widget title"
              aria-describedby="title-hint"
            />
            <p id="title-hint" className="text-xs text-muted-foreground mt-1">
              A descriptive name for this widget
            </p>
          </div>

          {/* Configuration */}
          <div className={editorClasses.field}>
            <label className={cn(editorClasses.label, "mb-3 block")}>
              Configuration
            </label>
            <div className={cn(
              "rounded-lg border border-border/60 bg-card p-4",
              isMobile && "p-3"
            )}>
              <EditorComponent 
                value={draftConfig as EditorValue} 
                onChange={handleConfigChange as (value: EditorValue) => void}
                tenantId={tenantId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer with keyboard hints */}
      <footer className={cn(
        editorClasses.footer,
        "sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t",
        "min-h-[60px]",
        isMobile && "flex-col items-stretch gap-2 py-3"
      )}>
        <div className={cn(
          "flex items-center justify-between gap-4 w-full",
          isMobile && "flex-col items-stretch"
        )}>
          {/* Status indicator */}
          <div className={cn(
            "flex items-center gap-2 text-xs",
            isMobile && "justify-center"
          )}>
            {hasChanges ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-muted-foreground">
                  Live preview active
                </span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-muted-foreground">
                  All changes saved
                </span>
              </>
            )}
          </div>

          {/* Keyboard shortcuts hint - desktop only */}
          {!isMobile && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                  Esc
                </kbd>
                to close
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                  ⌘S
                </kbd>
                to save
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

