"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { widgetRegistry } from "@/widgets/registry/widget-registry";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { z } from "zod";

interface WidgetEditorSheetProps {
  widgetId: number;
  tenantId: number;
  onSave: (config: unknown, title: string | null) => void;
  onClose: () => void;
}

export const WidgetEditorSheet: React.FC<WidgetEditorSheetProps> = ({ widgetId, tenantId, onSave, onClose }) => {
  const widgets = useWidgetsStore((state) => state.widgets);
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  const widget = widgets[widgetId];
  
  const [draftConfig, setDraftConfig] = useState(widget?.config || {});
  const [draftTitle, setDraftTitle] = useState(widget?.title ?? "");

  useEffect(() => {
    if (widget) {
      setDraftConfig(widget.config || {});
      setDraftTitle(widget.title ?? "");
    }
  }, [widget?.id, widget?.config, widget?.title]);

  if (!widget) {
    return null;
  }

  const definition = widgetRegistry[widget.kind];

  // Live updates - apply changes immediately to widget
  const handleConfigChange = (newConfig: any) => {
    setDraftConfig(newConfig);
    updateLocal(widgetId, { config: newConfig });
  };

  const handleTitleChange = (newTitle: string) => {
    setDraftTitle(newTitle);
    updateLocal(widgetId, { title: newTitle || null });
  };

  type EditorValue = z.infer<typeof definition.schema>;
  const EditorComponent = useMemo(
    () => definition.editor as React.ComponentType<{ value: EditorValue; onChange: (value: EditorValue) => void; tenantId: number }>,
    [definition.editor]
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
      <header className="flex items-center justify-between border-b border-border/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Edit widget</h2>
        <button className="text-xs text-muted-foreground hover:text-foreground" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm text-foreground/80">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</label>
          <input
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
            value={draftTitle}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="Widget title"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuration</label>
          <div className="mt-2 rounded border border-border/60 bg-card p-3">
            <EditorComponent 
              value={draftConfig as EditorValue} 
              onChange={handleConfigChange as (value: EditorValue) => void}
              tenantId={tenantId}
            />
          </div>
        </div>
      </div>
      <footer className="flex justify-between items-center border-t border-border/80 px-4 py-3 text-xs">
        <div className="text-muted-foreground">
          Changes applied live
        </div>
        <button className="rounded bg-foreground px-3 py-1 font-semibold text-background hover:bg-foreground/90" onClick={onClose}>
          Close
        </button>
      </footer>
    </div>
  );
};

