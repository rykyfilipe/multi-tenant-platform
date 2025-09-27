"use client";

import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";

export const useDraftOperations = (tenantId: number, dashboardId: number) => {
  const removeDraft = useWidgetsStore((state) => state.removeDraft);
  const setConflicts = useWidgetsStore((state) => state.setConflicts);
  const upsertWidget = useWidgetsStore((state) => state.upsertWidget);
  const clearPending = useWidgetsStore((state) => state.clearPending);

  const applyDraft = async (draftId: number, actorId: number) => {
    try {
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/0/${draftId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": actorId.toString(),
          },
        }
      );
      
      if (!res.ok) {
        throw new Error("Failed to apply draft");
      }
      
      const response = await res.json();
      
      if (response.conflicts.length) {
        setConflicts(response.conflicts);
      } else {
        clearPending();
        upsertWidget(response.widget);
        removeDraft(draftId);
      }
      
      return response;
    } catch (error) {
      console.error("Failed to apply draft:", error);
      throw error;
    }
  };

  const deleteDraft = async (draftId: number, actorId: number) => {
    try {
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/0/${draftId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": actorId.toString(),
          },
        }
      );
      
      if (!res.ok) {
        throw new Error("Failed to delete draft");
      }
      
      removeDraft(draftId);
      return true;
    } catch (error) {
      console.error("Failed to delete draft:", error);
      throw error;
    }
  };

  return {
    applyDraft,
    deleteDraft,
  };
};
