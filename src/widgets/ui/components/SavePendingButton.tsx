"use client";

import React from "react";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { useWidgetsApi } from "@/widgets/api/simple-client";

interface SavePendingButtonProps {
  tenantId: number;
  dashboardId: number;
  actorId: number;
}

export const SavePendingButton: React.FC<SavePendingButtonProps> = ({ tenantId, dashboardId, actorId }) => {
  const operations = useWidgetsStore((state) => state.getPending());
  const api = useWidgetsApi(tenantId, dashboardId);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSave = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      console.log('[savePending] Starting save with operations:', operations);
      
      const response = await api.savePending({ actorId, operations });
      
      if (response.conflicts.length) {
        setErrorMessage("Conflicts detected. Review and merge changes.");
      } else {
        console.log('[savePending] Save successful, reloading widgets...');
        
        // Reload all widgets from server to get correct state
        await api.loadWidgets(true);
        
        console.log('[savePending] Widgets reloaded successfully');
      }
    } catch (error) {
      console.error('[savePending] Error:', error);
      setErrorMessage("Failed to save pending changes.");
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = !operations.length || isLoading;

  return (
    <div className="flex items-center gap-3">
      <button
        className="inline-flex items-center gap-2 rounded bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-sm transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted-foreground/30 disabled:text-muted-foreground"
        onClick={handleSave}
        disabled={disabled}
      >
        {isLoading && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" aria-hidden />
        )}
        {isLoading ? "Saving..." : "Save Pending"}
      </button>
      {errorMessage && <span className="text-xs text-destructive">{errorMessage}</span>}
    </div>
  );
};
