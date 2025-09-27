"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { widgetRegistry } from "@/widgets/registry/widget-registry";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { z } from "zod";

interface WidgetEditorSheetProps {
  widgetId: number;
  onSave: (config: unknown, title: string | null) => void;
  onClose: () => void;
}

export const WidgetEditorSheet: React.FC<WidgetEditorSheetProps> = ({ widgetId, onSave, onClose }) => {
  const widgets = useWidgetsStore((state) => state.widgets);
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

  type EditorValue = z.infer<typeof definition.schema>;
  const EditorComponent = useMemo(
    () => definition.editor as React.ComponentType<{ value: EditorValue; onChange: (value: EditorValue) => void }>,
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
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Widget title"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuration</label>
          <div className="mt-2 rounded border border-border/60 bg-card p-3">
            <EditorComponent value={draftConfig as EditorValue} onChange={setDraftConfig as (value: EditorValue) => void} />
          </div>
        </div>
      </div>
      <footer className="flex justify-end gap-2 border-t border-border/80 px-4 py-3 text-xs">
        <button className="rounded border border-border px-3 py-1 text-muted-foreground hover:bg-muted/30" onClick={onClose}>
          Cancel
        </button>
        <button
          className="rounded bg-foreground px-3 py-1 font-semibold text-background hover:bg-foreground/90"
          onClick={() => onSave(draftConfig, draftTitle.trim() ? draftTitle : null)}
        >
          Save
        </button>
      </footer>
    </div>
  );
};
