import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ConflictMetadata, DraftOperation, WidgetEntity, WidgetDraftEntity } from "../domain/entities";
import { getWidgetDefinition } from "../registry/widget-registry";
import { hasWidgetId } from "../utils/pendingHelpers";

export interface PendingChangesState {
  widgets: Record<number, WidgetEntity>;
  drafts: Record<number, WidgetDraftEntity>;
  pendingOperations: DraftOperation[];
  dirtyWidgetIds: Set<number>;
  conflicts: ConflictMetadata[];
  activeConflict: ConflictMetadata | null;
  createLocal: (widget: WidgetEntity) => void;
  updateLocal: (widgetId: number, patch: Partial<WidgetEntity>) => void;
  deleteLocal: (widgetId: number) => void;
  addOperation: (operation: DraftOperation) => void;
  upsertWidget: (widget: WidgetEntity) => void;
  setWidgets: (widgets: WidgetEntity[]) => void;
  upsertDraft: (draft: WidgetDraftEntity) => void;
  removeDraft: (draftId: number) => void;
  setDrafts: (drafts: WidgetDraftEntity[]) => void;
  clearPending: () => void;
  getPending: () => DraftOperation[];
  setConflicts: (conflicts: ConflictMetadata[]) => void;
  applyConflictResolution: (
    conflict: ConflictMetadata,
    strategy: "keepLocal" | "acceptRemote" | "manual"
  ) => void;
  completeManualMerge: (
    conflict: ConflictMetadata,
    widget: WidgetEntity,
    updatedOperations: DraftOperation[]
  ) => void;
  finalizeConflict: (widgetId: number, widget?: WidgetEntity) => void;
  clearConflicts: () => void;
  closeActiveConflict: () => void;
}

export const useWidgetsStore = create<PendingChangesState>()(
  persist(
    (set, get) => ({
      widgets: {},
      drafts: {},
      pendingOperations: [],
      dirtyWidgetIds: new Set<number>(),
      conflicts: [],
      activeConflict: null,
      createLocal: (widget) => {
        const definition = getWidgetDefinition(widget.kind);
        definition.schema.parse(widget.config);
        set((state) => ({
          widgets: { ...state.widgets, [widget.id]: widget },
          pendingOperations: [
            ...state.pendingOperations,
            { kind: "create", id: `create-${widget.id}`, widget },
          ],
          dirtyWidgetIds: new Set(state.dirtyWidgetIds).add(widget.id),
        }));
      },
      updateLocal: (widgetId, patch) => {
        const existing = get().widgets[widgetId];
        if (!existing) return;
        const updated = { ...existing, ...patch } as WidgetEntity;
        const definition = getWidgetDefinition(updated.kind);
        definition.schema.parse(updated.config);
        set((state) => ({
          widgets: { ...state.widgets, [widgetId]: updated },
          pendingOperations: [
            ...state.pendingOperations,
            {
              kind: "update",
              id: `update-${widgetId}-${Date.now()}`,
              widgetId,
              patch,
              expectedVersion: updated.version,
            },
          ],
          dirtyWidgetIds: new Set(state.dirtyWidgetIds).add(widgetId),
        }));
      },
      deleteLocal: (widgetId) => {
        const existing = get().widgets[widgetId];
        if (!existing) return;
        set((state) => ({
          widgets: { ...state.widgets, [widgetId]: { ...existing, isVisible: false } },
          pendingOperations: [
            ...state.pendingOperations,
            {
              kind: "delete",
              id: `delete-${widgetId}-${Date.now()}`,
              widgetId,
              expectedVersion: existing.version,
            },
          ],
          dirtyWidgetIds: new Set(state.dirtyWidgetIds).add(widgetId),
        }));
      },
      addOperation: (operation) => {
        set((state) => ({
          pendingOperations: [...state.pendingOperations, operation],
          dirtyWidgetIds: hasWidgetId(operation)
            ? new Set(state.dirtyWidgetIds).add(operation.widgetId)
            : new Set(state.dirtyWidgetIds),
        }));
      },
      upsertWidget: (widget) =>
        set((state) => ({
          widgets: { ...state.widgets, [widget.id]: widget },
        })),
      setWidgets: (widgets) =>
        set(() => ({
          widgets: widgets.reduce<Record<number, WidgetEntity>>((acc, widget) => {
            acc[widget.id] = widget;
            return acc;
          }, {}),
        })),
      upsertDraft: (draft) =>
        set((state) => ({
          drafts: { ...state.drafts, [draft.id]: draft },
        })),
      setDrafts: (drafts) =>
        set(() => ({
          drafts: drafts.reduce<Record<number, WidgetDraftEntity>>((acc, draft) => {
            acc[draft.id] = draft;
            return acc;
          }, {}),
        })),
      removeDraft: (draftId) =>
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[draftId];
          return { drafts };
        }),
      clearPending: () => {
        set({
          pendingOperations: [],
          dirtyWidgetIds: new Set<number>(),
          conflicts: [],
          activeConflict: null,
        });
      },
      getPending: () => get().pendingOperations,
      setConflicts: (conflicts) => set({ conflicts, activeConflict: null }),
      applyConflictResolution: (conflict, strategy) =>
        set((state) => {
          if (strategy === "manual") {
            return { ...state, activeConflict: conflict };
          }
          return state;
        }),
      completeManualMerge: (conflict, widget, updatedOperations) =>
        set((state) => ({
          widgets: { ...state.widgets, [widget.id]: widget },
          pendingOperations: updatedOperations,
          conflicts: state.conflicts.filter((item) => item.widgetId !== conflict.widgetId),
          dirtyWidgetIds: new Set(state.dirtyWidgetIds).add(widget.id),
          activeConflict: null,
        })),
      finalizeConflict: (widgetId, widget) =>
        set((state) => {
          const dirtyWidgetIds = new Set(state.dirtyWidgetIds);
          dirtyWidgetIds.delete(widgetId);
          return {
            widgets: widget ? { ...state.widgets, [widgetId]: widget } : state.widgets,
            pendingOperations: state.pendingOperations.filter(
              (operation) => !(hasWidgetId(operation) && operation.widgetId === widgetId)
            ),
            conflicts: state.conflicts.filter((item) => item.widgetId !== widgetId),
            activeConflict:
              state.activeConflict && state.activeConflict.widgetId === widgetId
                ? null
                : state.activeConflict,
            dirtyWidgetIds,
          };
        }),
      clearConflicts: () => set({ conflicts: [], activeConflict: null }),
      closeActiveConflict: () => set({ activeConflict: null }),
    }),
    {
      name: "widgets-pending-store",
      partialize: (state) => ({
        widgets: state.widgets,
        drafts: state.drafts,
        pendingOperations: state.pendingOperations,
      }),
      version: 2,
    }
  )
);

