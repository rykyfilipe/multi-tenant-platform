import type { WidgetEntity, WidgetDraftEntity, WidgetConfig } from "@/widgets/domain/entities";
import type {
  SavePendingRequest,
  SavePendingResponse,
  CreateDraftParams,
  UpdateDraftParams,
  DraftListResponse,
} from "@/widgets/domain/dto";
import { WidgetKind } from "@/generated/prisma";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";

export type WidgetsListResponse = {
  items: WidgetEntity[];
  nextCursor: number | null;
  total: number;
};

export type DraftListResponse = {
  drafts: WidgetDraftEntity[];
};

// Simple fetch-based API client without React Query
export class WidgetsApiClient {
  constructor(
    private tenantId: number,
    private dashboardId: number
  ) {}

  async fetchWidgets(includeConfig = false): Promise<WidgetsListResponse> {
    const searchParams = new URLSearchParams();
    if (includeConfig) searchParams.set("includeConfig", "true");

    const url = `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets?${searchParams.toString()}`;
    console.log('[fetchWidgets] Fetching from URL:', url);
    
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[fetchWidgets] Fetch failed:', res.status, res.statusText);
      throw new Error("Failed to fetch widgets");
    }
    
    const data = (await res.json()) as WidgetsListResponse;
    console.log('[fetchWidgets] API Response:', data);
    
    return data;
  }

  async fetchDrafts(): Promise<DraftListResponse> {
    const res = await fetch(
      `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets/0`,
      {
        headers: {
          "x-user-id": "0",
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch drafts");
    return (await res.json()) as DraftListResponse;
  }

  async createDraft(
    payload: Omit<CreateDraftParams, "tenantId" | "dashboardId"> & { actorId: number }
  ): Promise<WidgetDraftEntity> {
    const res = await fetch(
      `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets/0`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": payload.actorId.toString(),
        },
        body: JSON.stringify({ ...payload }),
      }
    );
    if (!res.ok) throw new Error("Failed to create draft");
    return (await res.json()) as WidgetDraftEntity;
  }

  async updateDraft(
    payload: Omit<UpdateDraftParams, "tenantId" | "dashboardId"> & { actorId: number }
  ): Promise<WidgetDraftEntity> {
    const { draftId, patch, actorId } = payload;
    const res = await fetch(
      `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets/0/${draftId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": actorId.toString(),
        },
        body: JSON.stringify({ patch }),
      }
    );
    if (!res.ok) throw new Error("Failed to update draft");
    return (await res.json()) as WidgetDraftEntity;
  }

  async applyDraft(draftId: number, actorId: number): Promise<SavePendingResponse<WidgetConfig>> {
    const res = await fetch(
      `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets/0/${draftId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": actorId.toString(),
        },
      }
    );
    if (!res.ok) throw new Error("Failed to apply draft");
    return (await res.json()) as SavePendingResponse<WidgetConfig>;
  }

  async resolveDraftConflict(
    draftId: number,
    actorId: number,
    merge: Partial<WidgetEntity>
  ): Promise<WidgetDraftEntity> {
    const res = await fetch(
      `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets/0/${draftId}/2`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": actorId.toString(),
        },
        body: JSON.stringify({ merge }),
      }
    );
    if (!res.ok) throw new Error("Failed to resolve draft conflict");
    return (await res.json()) as WidgetDraftEntity;
  }

  async deleteDraft(draftId: number, actorId: number): Promise<void> {
    const res = await fetch(
      `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets/0/${draftId}`,
      {
        method: "DELETE",
        headers: {
          "x-user-id": actorId.toString(),
        },
      }
    );
    if (!res.ok) throw new Error("Failed to delete draft");
  }

  async createWidget(
    payload: {
      kind: WidgetKind;
      title?: string;
      description?: string;
      position?: { x: number; y: number; w: number; h: number };
      config?: any;
      actorId: number;
    }
  ): Promise<SavePendingResponse<WidgetConfig>> {
    const res = await fetch(
      `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": payload.actorId.toString(),
        },
        body: JSON.stringify({
          kind: payload.kind,
          title: payload.title,
          description: payload.description,
          position: payload.position,
          config: payload.config,
        }),
      }
    );
    if (!res.ok) throw new Error("Failed to create widget");
    return (await res.json()) as SavePendingResponse<WidgetConfig>;
  }

  async savePending(payload: Omit<SavePendingRequest, "tenantId" | "dashboardId">): Promise<SavePendingResponse> {
    console.log('[savePending] Sending batch request with operations:', payload.operations.length);
    
    const res = await fetch(
      `/api/v1/tenants/${this.tenantId}/dashboards/${this.dashboardId}/widgets/1`,
      {
        method: "POST",
        body: JSON.stringify(payload satisfies Omit<SavePendingRequest, "tenantId" | "dashboardId">),
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[savePending] Request failed:', res.status, res.statusText, errorText);
      throw new Error(`Failed to save pending widgets: ${res.statusText}`);
    }
    
    const result = await res.json() as SavePendingResponse;
    console.log('[savePending] Batch save successful:', result);
    return result;
  }
}

// Hook-based wrapper for React components
export const useWidgetsApi = (tenantId: number, dashboardId: number) => {
  const apiClient = new WidgetsApiClient(tenantId, dashboardId);
  const setWidgets = useWidgetsStore((state) => state.setWidgets);
  const setConflicts = useWidgetsStore((state) => state.setConflicts);
  const setDrafts = useWidgetsStore((state) => state.setDrafts);
  const removeDraft = useWidgetsStore((state) => state.removeDraft);
  const upsertWidget = useWidgetsStore((state) => state.upsertWidget);
  const clearPending = useWidgetsStore((state) => state.clearPending);

  const loadWidgets = async (includeConfig = false) => {
    try {
      console.log('[loadWidgets] Fetching widgets from API...');
      const data = await apiClient.fetchWidgets(includeConfig);
      console.log('[loadWidgets] Received widgets:', data.items);
      
      // Ensure widgets have proper structure to prevent hydration issues
      const normalizedWidgets = data.items.map(widget => ({
        ...widget,
        config: widget.config || {},
        position: widget.position || { x: 0, y: 0, w: 4, h: 4 },
        createdAt: new Date(widget.createdAt),
        updatedAt: new Date(widget.updatedAt),
      }));
      
      setWidgets(normalizedWidgets as WidgetEntity[]);
      // Clear pending operations when loading widgets for a new dashboard context
      clearPending();
      console.log('[loadWidgets] Widgets set in store, pending cleared');
      return data;
    } catch (error) {
      console.error("Failed to load widgets:", error);
      throw error;
    }
  };


  const createWidget = async (payload: {
    kind: WidgetKind;
    title?: string;
    description?: string;
    position?: { x: number; y: number; w: number; h: number };
    config?: any;
    actorId: number;
  }) => {
    try {
      const response = await apiClient.createWidget(payload);
      
      if (response.conflicts.length) {
        setConflicts(response.conflicts);
      } else {
        // Note: Don't reload widgets - let the caller handle state updates
      }
      
      return response;
    } catch (error) {
      console.error("Failed to create widget:", error);
      throw error;
    }
  };

  const savePending = async (payload: Omit<SavePendingRequest, "tenantId" | "dashboardId">) => {
    try {
      console.log('[savePending] Starting batch save with operations:', payload.operations.length);
      const response = await apiClient.savePending(payload);
      console.log('[savePending] Batch save response:', response);

      if (response.conflicts.length) {
        console.log('[savePending] Conflicts detected:', response.conflicts.length);
        setConflicts(response.conflicts);
      } else {
        console.log('[savePending] No conflicts, clearing conflicts state');
        setConflicts([]);
        // Clear pending operations after successful save
        clearPending();
      }

      return response;
    } catch (error) {
      console.error("Failed to save pending:", error);
      throw error;
    }
  };

  const loadDrafts = async () => {
    try {
      const data = await apiClient.fetchDrafts();
      setDrafts(data.drafts as WidgetDraftEntity[]);
      return data;
    } catch (error) {
      console.error("Failed to load drafts:", error);
      throw error;
    }
  };

  const createDraft = async (payload: Omit<CreateDraftParams, "tenantId" | "dashboardId"> & { actorId: number }) => {
    try {
      const draft = await apiClient.createDraft(payload);
      // Update the drafts in store - get current drafts from store
      const currentDrafts = useWidgetsStore.getState().drafts;
      setDrafts([...Object.values(currentDrafts), draft]);
      return draft;
    } catch (error) {
      console.error("Failed to create draft:", error);
      throw error;
    }
  };

  const applyDraft = async (draftId: number, actorId: number) => {
    try {
      const response = await apiClient.applyDraft(draftId, actorId);

      if (response.conflicts.length) {
        setConflicts(response.conflicts);
      } else {
        // Remove the applied draft from store
        removeDraft(draftId);
        setConflicts([]);
        // Note: Don't reload widgets - let the caller handle state updates
      }

      return response;
    } catch (error) {
      console.error("Failed to apply draft:", error);
      throw error;
    }
  };

  const deleteDraft = async (draftId: number, actorId: number) => {
    try {
      await apiClient.deleteDraft(draftId, actorId);
      // Remove the draft from store
      removeDraft(draftId);
    } catch (error) {
      console.error("Failed to delete draft:", error);
      throw error;
    }
  };

  const resolveDraftConflict = async (draftId: number, actorId: number, merge: Partial<WidgetEntity>) => {
    try {
      const draft = await apiClient.resolveDraftConflict(draftId, actorId, merge);
      // Update the draft in store
      const currentDrafts = useWidgetsStore.getState().drafts;
      setDrafts([...Object.values(currentDrafts).filter(d => d.id !== draftId), draft]);
      return draft;
    } catch (error) {
      console.error("Failed to resolve draft conflict:", error);
      throw error;
    }
  };

  return {
    loadWidgets,
    createWidget,
    savePending,
    loadDrafts,
    createDraft,
    applyDraft,
    deleteDraft,
    resolveDraftConflict,
  };
};
