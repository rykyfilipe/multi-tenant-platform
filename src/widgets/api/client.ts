import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WidgetEntity, WidgetDraftEntity, WidgetConfig } from "@/widgets/domain/entities";
import type {
  SavePendingRequest,
  SavePendingResponse,
  CreateDraftParams,
  UpdateDraftParams,
} from "@/widgets/domain/dto";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";

export type WidgetsListResponse = {
  items: WidgetEntity[];
  nextCursor: number | null;
  total: number;
};

export type DraftListResponse = {
  drafts: WidgetDraftEntity[];
};

const baseKey = (tenantId: number, dashboardId: number) => ["widgets", tenantId, dashboardId];
const draftsKey = (tenantId: number, dashboardId: number) => ["widget-drafts", tenantId, dashboardId];

export const useWidgets = (tenantId: number, dashboardId: number, includeConfig = false) => {
  const setWidgets = useWidgetsStore((state) => state.setWidgets);
  return useQuery({
    queryKey: [...baseKey(tenantId, dashboardId), includeConfig],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (includeConfig) searchParams.set("includeConfig", "true");

      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets?${searchParams.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch widgets");
      const data = (await res.json()) as WidgetsListResponse;
      setWidgets(data.items as WidgetEntity[]);
      return data;
    },
  });
};

export const useDrafts = (tenantId: number, dashboardId: number) => {
  return useQuery({
    queryKey: draftsKey(tenantId, dashboardId),
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/0`,
        {
          headers: {
            "x-user-id": "0",
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch drafts");
      return (await res.json()) as { drafts: WidgetDraftEntity[] };
    },
  });
};

export const useCreateDraft = (tenantId: number, dashboardId: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<CreateDraftParams, "tenantId" | "dashboardId"> & { actorId: number }
    ) => {
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/0`,
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
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: draftsKey(tenantId, dashboardId) });
    },
  });
};

export const useUpdateDraft = (tenantId: number, dashboardId: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<UpdateDraftParams, "tenantId" | "dashboardId"> & { actorId: number }
    ) => {
      const { draftId, patch, actorId } = payload;
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/0/${draftId}`,
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
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: draftsKey(tenantId, dashboardId) });
    },
  });
};

export const useApplyDraft = (tenantId: number, dashboardId: number) => {
  const client = useQueryClient();
  const setConflicts = useWidgetsStore((state) => state.setConflicts);
  const upsertWidget = useWidgetsStore((state) => state.upsertWidget);
  const clearPending = useWidgetsStore((state) => state.clearPending);

  return useMutation({
    mutationFn: async ({ draftId, actorId }: { draftId: number; actorId: number }) => {
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
      if (!res.ok) throw new Error("Failed to apply draft");
      return (await res.json()) as SavePendingResponse<WidgetConfig>;
    },
    onSuccess: (response) => {
      if (response.conflicts.length) {
        setConflicts(response.conflicts);
      } else {
        clearPending();
        response.results.forEach((result) => {
          if (result.widget) {
            upsertWidget(result.widget);
          }
        });
        setConflicts([]);
        client.invalidateQueries({ queryKey: draftsKey(tenantId, dashboardId) });
        client.invalidateQueries({ queryKey: baseKey(tenantId, dashboardId) });
      }
    },
  });
};

export const useResolveDraftConflict = (
  tenantId: number,
  dashboardId: number
) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: {
        draftId: number;
        actorId: number;
        merge: Partial<WidgetEntity>;
      }
    ) => {
      const { draftId, actorId, merge } = payload;
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/0/${draftId}/2`,
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
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: draftsKey(tenantId, dashboardId) });
    },
  });
};

export const useDeleteDraft = (tenantId: number, dashboardId: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ draftId, actorId }: { draftId: number; actorId: number }) => {
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/0/${draftId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": actorId.toString(),
          },
        }
      );
      if (!res.ok) throw new Error("Failed to delete draft");
      return await res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: draftsKey(tenantId, dashboardId) });
    },
  });
};

export const useSavePending = (tenantId: number, dashboardId: number) => {
  const client = useQueryClient();
  const setConflicts = useWidgetsStore((state) => state.setConflicts);

  return useMutation({
    mutationFn: async (payload: Omit<SavePendingRequest, "tenantId" | "dashboardId">) => {
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/1`,
        {
          method: "POST",
          body: JSON.stringify(payload satisfies Omit<SavePendingRequest, "tenantId" | "dashboardId">),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) throw new Error("Failed to save pending widgets");
      return (await res.json()) as SavePendingResponse;
    },
    onSuccess: (response) => {
      if (response.conflicts.length) {
        setConflicts(response.conflicts);
      } else {
        setConflicts([]);
        client.invalidateQueries({ queryKey: baseKey(tenantId, dashboardId) });
        client.invalidateQueries({ queryKey: draftsKey(tenantId, dashboardId) });
      }
    },
  });
};
