"use client";

import React from "react";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { useSavePending } from "@/widgets/api/client";

interface SavePendingButtonProps {
  tenantId: number;
  dashboardId: number;
  actorId: number;
}

export const SavePendingButton: React.FC<SavePendingButtonProps> = ({ tenantId, dashboardId, actorId }) => {
  const operations = useWidgetsStore((state) => state.getPending());
  const clearPending = useWidgetsStore((state) => state.clearPending);
  const mutation = useSavePending(tenantId, dashboardId);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSave = async () => {
    setErrorMessage(null);
    try {
      const response = await mutation.mutateAsync({ actorId, operations });
      if (response.conflicts.length) {
        setErrorMessage("Conflicts detected. Review and merge changes.");
      } else {
        clearPending();
      }
    } catch {
      setErrorMessage("Failed to save pending changes.");
    }
  };

  const disabled = !operations.length || mutation.isPending;

  return (
    <div className="flex items-center gap-3">
      <button
        className="inline-flex items-center gap-2 rounded bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-sm transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted-foreground/30 disabled:text-muted-foreground"
        onClick={handleSave}
        disabled={disabled}
      >
        {mutation.isPending && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" aria-hidden />
        )}
        {mutation.isPending ? "Saving..." : "Save Pending"}
      </button>
      {errorMessage && <span className="text-xs text-destructive">{errorMessage}</span>}
    </div>
  );
};
