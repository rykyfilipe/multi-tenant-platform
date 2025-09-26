"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConflictMetadata, WidgetConfig, WidgetEntity } from "@/widgets/domain/entities";

interface ManualMergeDialogProps {
  conflict: ConflictMetadata | null;
  localWidget: WidgetEntity | undefined;
  onCancel: () => void;
  onSubmit: (mergedConfig: WidgetConfig) => void;
}

const pretty = (value: WidgetConfig | undefined) => JSON.stringify(value ?? {}, null, 2);

export const ManualMergeDialog: React.FC<ManualMergeDialogProps> = ({
  conflict,
  localWidget,
  onCancel,
  onSubmit,
}) => {
  const [mergedConfigInput, setMergedConfigInput] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  const localConfig = useMemo<WidgetConfig | undefined>(
    () => localWidget?.config ?? conflict?.remoteWidget.config,
    [conflict, localWidget]
  );

  useEffect(() => {
    if (conflict) {
      setMergedConfigInput(pretty(localConfig));
      setError(null);
    }
  }, [conflict, localConfig]);

  if (!conflict) return null;

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(mergedConfigInput) as WidgetConfig;
      setError(null);
      onSubmit(parsed);
    } catch {
      setError("Invalid JSON. Please correct the merged configuration.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Manual Merge</h2>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Review local versus remote configuration and edit the final merged payload. The save
          action will re-run the pending operations with the merged config.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded border border-muted-foreground/20 bg-muted/40 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Local Pending
            </h3>
            <pre className="h-60 overflow-auto rounded bg-background p-2 text-xs text-foreground/80">
              {pretty(localConfig)}
            </pre>
          </div>
          <div className="rounded border border-muted-foreground/20 bg-muted/40 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Remote Server
            </h3>
            <pre className="h-60 overflow-auto rounded bg-background p-2 text-xs text-foreground/80">
              {pretty(conflict.remoteWidget.config)}
            </pre>
          </div>
          <div className="rounded border border-accent/40 bg-accent/10 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
              Merged Config (editable JSON)
            </h3>
            <textarea
              className="h-60 w-full rounded border border-accent/60 bg-background p-2 text-xs text-foreground"
              value={mergedConfigInput}
              onChange={(event) => setMergedConfigInput(event.target.value)}
            />
          </div>
        </div>
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        <div className="mt-4 flex justify-end gap-3 text-xs">
          <button
            className="rounded border border-muted-foreground/40 px-3 py-1 text-muted-foreground hover:bg-muted/30"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded bg-foreground px-3 py-1 font-semibold text-background hover:bg-foreground/90"
            onClick={handleSubmit}
          >
            Save Merge
          </button>
        </div>
      </div>
    </div>
  );
};
