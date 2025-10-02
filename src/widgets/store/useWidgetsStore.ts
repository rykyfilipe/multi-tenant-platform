import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ConflictMetadata, DraftOperation, WidgetEntity, WidgetDraftEntity } from "../domain/entities";
import { getWidgetDefinition } from "../registry/widget-registry";
import { hasWidgetId } from "../utils/pendingHelpers";

export interface PendingChangesState {
  // Core state
  widgets: Record<number, WidgetEntity>;
  originalWidgets: Record<number, WidgetEntity>; // Original widgets from DB (for comparison)
  drafts: Record<number, WidgetDraftEntity>;
  pendingOperations: DraftOperation[];
  dirtyWidgetIds: Set<number>;

  // History management
  history: Record<number, WidgetEntity[]>;
  redoHistory: Record<number, WidgetEntity[]>;

  // Conflict management
  conflicts: ConflictMetadata[];
  activeConflict: ConflictMetadata | null;
  
  // Widget operations
  createLocal: (widget: WidgetEntity) => void;
  updateLocal: (widgetId: number, patch: Partial<WidgetEntity>) => void;
  deleteLocal: (widgetId: number) => void;
  
  // History operations
  discardChanges: (widgetId: number) => void;
  undoLastChange: (widgetId: number) => boolean;
  redoLastChange: (widgetId: number) => boolean;
  
  // Utility operations
  addOperation: (operation: DraftOperation) => void;
  upsertWidget: (widget: WidgetEntity) => void;
  setWidgets: (widgets: WidgetEntity[]) => void;
  clearPending: () => void;
  getPending: () => DraftOperation[];
  cleanupOldIds: () => void;
  
  // Conflict operations
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

  // Draft operations
  setDrafts: (drafts: WidgetDraftEntity[]) => void;
  removeDraft: (draftId: number) => void;
  clearConflicts: () => void;
  closeActiveConflict: () => void;
}

// Helper functions
const isLocalWidget = (widgetId: number): boolean => {
  return widgetId >= 1000000 && widgetId < 2000000;
};

const generateOperationId = (): string => {
  return `op-${Math.floor(Math.random() * 1000000) + 1000000}`;
};

const MAX_HISTORY_SIZE = 20;

export const useWidgetsStore = create<PendingChangesState>()(
  persist(
    (set, get) => ({
      // Core state
      widgets: {},
      originalWidgets: {}, // Store original widgets from DB
      drafts: {},
      pendingOperations: [],
      dirtyWidgetIds: new Set<number>(),

      // History management
      history: {},
      redoHistory: {},

      // Conflict management
      conflicts: [],
      activeConflict: null,

      // Widget operations
      createLocal: (widget) => {
        console.log('[createLocal] Creating widget:', widget.id);
        
        // Ensure config has refresh field for backward compatibility
        const widgetWithRefresh = {
          ...widget,
          config: {
            settings: (widget.config as any)?.settings || {},
            style: (widget.config as any)?.style || {},
            data: (widget.config as any)?.data || {},
            metadata: (widget.config as any)?.metadata || {},
            refresh: (widget.config as any)?.refresh || {
              enabled: false,
              interval: 30000,
            }
          }
        };

        const definition = getWidgetDefinition(widget.kind);
        try {
          definition.schema.parse(widgetWithRefresh.config);
        } catch (error) {
          console.warn(`Widget ${widget.id} config validation failed:`, error);
          // Use default config if validation fails
          widgetWithRefresh.config = definition.defaultConfig;
        }
        
        set((state) => {
          // Check if widget already exists
          if (state.widgets[widget.id]) {
            console.warn('[createLocal] Widget already exists:', widget.id, '- updating instead');
            return {
              widgets: { ...state.widgets, [widget.id]: widgetWithRefresh },
            };
          }

          // Check if create operation already exists
          const existingCreateOp = state.pendingOperations.find(op => 
            op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widget.id
          );

          if (existingCreateOp) {
            console.warn('[createLocal] Create operation already exists for widget:', widget.id);
            return state;
          }

          console.log('[createLocal] Adding new widget and create operation:', widget.id);
          
          return {
            widgets: { ...state.widgets, [widget.id]: widgetWithRefresh },
            pendingOperations: [
              ...state.pendingOperations,
              { kind: "create", id: `create-${widget.id}`, widget: widgetWithRefresh },
            ],
            dirtyWidgetIds: new Set(state.dirtyWidgetIds).add(widget.id),
            history: { ...state.history, [widget.id]: [] },
            redoHistory: { ...state.redoHistory, [widget.id]: [] },
          };
        });
      },

      updateLocal: (widgetId, patch) => {
        const existing = get().widgets[widgetId];
        if (!existing) return;

        const updated = { ...existing, ...patch } as WidgetEntity;

        // Ensure config has all required fields for backward compatibility
        if (updated.config) {
          updated.config = {
            settings: (updated.config as any)?.settings || {},
            style: (updated.config as any)?.style || {},
            data: (updated.config as any)?.data || {},
            metadata: (updated.config as any)?.metadata || {},
            refresh: (updated.config as any)?.refresh || {
              enabled: false,
              interval: 30000,
            }
          };
        }

        // Also ensure existing widget has correct config structure for history
        if (existing.config) {
          existing.config = {
            settings: (existing.config as any)?.settings || {},
            style: (existing.config as any)?.style || {},
            data: (existing.config as any)?.data || {},
            metadata: (existing.config as any)?.metadata || {},
            refresh: (existing.config as any)?.refresh || {
              enabled: false,
              interval: 30000,
            }
          };
        }

        const definition = getWidgetDefinition(updated.kind);
        try {
          definition.schema.parse(updated.config);
        } catch (error) {
          console.warn(`Widget ${widgetId} config validation failed:`, error);
          // Use default config if validation fails
          updated.config = definition.defaultConfig;
        }
        
        set((state) => {
          // Save current version to history before updating
          const currentHistory = state.history[widgetId] || [];
          const newHistory = [existing, ...currentHistory].slice(0, MAX_HISTORY_SIZE);
          
          const newState = {
          widgets: { ...state.widgets, [widgetId]: updated },
            pendingOperations: [...state.pendingOperations],
            dirtyWidgetIds: new Set(state.dirtyWidgetIds),
            history: { ...state.history, [widgetId]: newHistory },
            redoHistory: { ...state.redoHistory, [widgetId]: [] }, // Clear redo history on new change
          };

          if (isLocalWidget(widgetId)) {
            // For local widgets, update the existing create operation
            const createOpIndex = state.pendingOperations.findIndex(op => 
              op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId
            );
            
            if (createOpIndex >= 0) {
              newState.pendingOperations[createOpIndex] = {
                ...newState.pendingOperations[createOpIndex],
                widget: updated
              } as any;
            }
          } else {
            // For DB widgets, manage update operations
            // Compare with ORIGINAL widget from DB, not current state
            const originalWidget = state.originalWidgets[widgetId] || existing;
            
            console.log('[updateLocal] DB Widget comparison:', {
              widgetId,
              hasOriginal: !!state.originalWidgets[widgetId],
              originalConfig: originalWidget.config,
              updatedConfig: updated.config,
              originalTitle: originalWidget.title,
              updatedTitle: updated.title
            });
            
            const isReverted = JSON.stringify(updated.config) === JSON.stringify(originalWidget.config) &&
                              updated.title === originalWidget.title &&
                              updated.description === originalWidget.description;
            
            if (isReverted) {
              // Remove update operation if reverted to original
              console.log('[updateLocal] Widget reverted to original, removing pending operation');
              newState.pendingOperations = state.pendingOperations.filter(op => 
                !(op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId)
              );
              newState.dirtyWidgetIds.delete(widgetId);
            } else {
              // Add or update pending operation
              console.log('[updateLocal] Widget modified, adding/updating pending operation');
              const existingOpIndex = state.pendingOperations.findIndex(op => 
                op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId
              );
              
              const newOperation = {
                kind: "update" as const,
                id: `update-${widgetId}-${generateOperationId()}`,
              widgetId,
              patch,
              expectedVersion: updated.version,
              };
              
              if (existingOpIndex >= 0) {
                console.log('[updateLocal] Updating existing operation at index:', existingOpIndex);
                newState.pendingOperations[existingOpIndex] = newOperation;
              } else {
                console.log('[updateLocal] Adding new update operation');
                newState.pendingOperations.push(newOperation);
                newState.dirtyWidgetIds.add(widgetId);
              }
            }
          }

          return newState;
        });
      },

      deleteLocal: (widgetId) => {
        console.log('[deleteLocal] Deleting widget', widgetId);
        
        set((state) => {
          const newState = {
            widgets: { ...state.widgets },
            pendingOperations: [...state.pendingOperations],
            dirtyWidgetIds: new Set(state.dirtyWidgetIds),
            history: { ...state.history },
            redoHistory: { ...state.redoHistory },
          };

          // Remove widget from widgets
          delete newState.widgets[widgetId];

          if (isLocalWidget(widgetId)) {
            // For local widgets, remove the create operation completely
            console.log('[deleteLocal] Removing create operation for local widget', widgetId);
            newState.pendingOperations = state.pendingOperations.filter(op => 
              !(op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId)
            );
            newState.dirtyWidgetIds.delete(widgetId);
          } else {
            // For DB widgets, add delete operation ONLY if one doesn't exist
            const existingDeleteOpIndex = state.pendingOperations.findIndex(op => 
              op.kind === "delete" && hasWidgetId(op) && op.widgetId === widgetId
            );
            
            if (existingDeleteOpIndex >= 0) {
              console.log('[deleteLocal] Delete operation already exists for widget', widgetId);
              // Don't add duplicate - just keep the existing one
            } else {
              console.log('[deleteLocal] Added delete operation for DB widget', widgetId);
              // Add new delete operation
              newState.pendingOperations.push({
                kind: "delete",
                id: `delete-${widgetId}-${generateOperationId()}`,
                widgetId,
                expectedVersion: state.widgets[widgetId]?.version || 1,
              } as any);
              newState.dirtyWidgetIds.add(widgetId);
            }
          }

          // Clean up history
          delete newState.history[widgetId];
          delete newState.redoHistory[widgetId];

          console.log('[deleteLocal] Widget', widgetId, 'deleted successfully');
          
          return newState;
        });
      },

      // History operations
      discardChanges: (widgetId) => {
        set((state) => {
          const newState = {
            widgets: { ...state.widgets },
            pendingOperations: [...state.pendingOperations],
            dirtyWidgetIds: new Set(state.dirtyWidgetIds),
            history: { ...state.history },
            redoHistory: { ...state.redoHistory },
          };

          if (isLocalWidget(widgetId)) {
            // For local widgets, remove completely
            delete newState.widgets[widgetId];
            newState.pendingOperations = state.pendingOperations.filter(op => 
              !(op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId)
            );
            newState.dirtyWidgetIds.delete(widgetId);
          } else {
            // For DB widgets, restore original version (remove from widgets if it was deleted)
            // Note: Original widgets are loaded from DB, so we just remove from local state
            delete newState.widgets[widgetId];
            
            // Remove all operations for this widget
            newState.pendingOperations = state.pendingOperations.filter(op => {
              if (op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId) return false;
              if (op.kind === "delete" && hasWidgetId(op) && op.widgetId === widgetId) return false;
              if (op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId) return false;
              return true;
            });
            newState.dirtyWidgetIds.delete(widgetId);
          }

          // Clean up history
          delete newState.history[widgetId];
          delete newState.redoHistory[widgetId];

          return newState;
        });
      },

      undoLastChange: (widgetId) => {
        const state = get();
        const history = state.history[widgetId];
        
        if (!history || history.length === 0) return false;

        const lastVersion = history[0];
        
        set((currentState) => {
          const newState = {
            widgets: { ...currentState.widgets, [widgetId]: lastVersion },
            pendingOperations: [...currentState.pendingOperations],
            dirtyWidgetIds: new Set(currentState.dirtyWidgetIds),
            history: { ...currentState.history },
            redoHistory: { ...currentState.redoHistory },
          };

          // Move current version to redo history
          const currentWidget = currentState.widgets[widgetId];
          if (currentWidget) {
            const currentRedoHistory = currentState.redoHistory[widgetId] || [];
            newState.redoHistory[widgetId] = [currentWidget, ...currentRedoHistory].slice(0, MAX_HISTORY_SIZE);
          }

          // Remove last version from history
          newState.history[widgetId] = history.slice(1);

          // Update pending operations
          if (isLocalWidget(widgetId)) {
            // For local widgets, update the create operation
            const createOpIndex = currentState.pendingOperations.findIndex(op => 
              op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId
            );
            
            if (createOpIndex >= 0) {
              newState.pendingOperations[createOpIndex] = {
                ...newState.pendingOperations[createOpIndex],
                widget: lastVersion
              } as any;
            }
          } else {
            // For DB widgets, check if we're back to original
            const originalWidget = currentState.widgets[widgetId];
            const isBackToOriginal = JSON.stringify(lastVersion.config) === JSON.stringify(originalWidget?.config) &&
                                   lastVersion.title === originalWidget?.title &&
                                   lastVersion.description === originalWidget?.description;
            
            if (isBackToOriginal) {
              // Remove update operation
              newState.pendingOperations = currentState.pendingOperations.filter(op => 
                !(op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId)
              );
              newState.dirtyWidgetIds.delete(widgetId);
            } else {
              // Update the update operation
              const updateOpIndex = currentState.pendingOperations.findIndex(op => 
                op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId
              );
              
              if (updateOpIndex >= 0) {
                newState.pendingOperations[updateOpIndex] = {
                  kind: "update",
                  id: `update-${widgetId}-${generateOperationId()}`,
                  widgetId,
                  patch: { config: lastVersion.config, title: lastVersion.title, description: lastVersion.description },
                  expectedVersion: lastVersion.version,
                };
              }
            }
          }

          return newState;
        });

        return true;
      },

      redoLastChange: (widgetId) => {
        const state = get();
        const redoHistory = state.redoHistory[widgetId];
        
        if (!redoHistory || redoHistory.length === 0) return false;

        const nextVersion = redoHistory[0];
        
        set((currentState) => {
          const newState = {
            widgets: { ...currentState.widgets, [widgetId]: nextVersion },
            pendingOperations: [...currentState.pendingOperations],
            dirtyWidgetIds: new Set(currentState.dirtyWidgetIds),
            history: { ...currentState.history },
            redoHistory: { ...currentState.redoHistory },
          };

          // Move current version back to history
          const currentWidget = currentState.widgets[widgetId];
          if (currentWidget) {
            const currentHistory = currentState.history[widgetId] || [];
            newState.history[widgetId] = [currentWidget, ...currentHistory].slice(0, MAX_HISTORY_SIZE);
          }

          // Remove next version from redo history
          newState.redoHistory[widgetId] = redoHistory.slice(1);

          // Update pending operations
          if (isLocalWidget(widgetId)) {
            // For local widgets, update the create operation
            const createOpIndex = currentState.pendingOperations.findIndex(op => 
              op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId
            );
            
            if (createOpIndex >= 0) {
              newState.pendingOperations[createOpIndex] = {
                ...newState.pendingOperations[createOpIndex],
                widget: nextVersion
              } as any;
            }
          } else {
            // For DB widgets, add or update the update operation
            const updateOpIndex = currentState.pendingOperations.findIndex(op => 
              op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId
            );
            
            const newOperation = {
              kind: "update" as const,
              id: `update-${widgetId}-${generateOperationId()}`,
              widgetId,
              patch: { config: nextVersion.config, title: nextVersion.title, description: nextVersion.description },
              expectedVersion: nextVersion.version,
            };
            
            if (updateOpIndex >= 0) {
              newState.pendingOperations[updateOpIndex] = newOperation;
            } else {
              newState.pendingOperations.push(newOperation);
              newState.dirtyWidgetIds.add(widgetId);
            }
          }

          return newState;
        });

        return true;
      },

      // Utility operations
      addOperation: (operation) => {
        set((state) => ({
          pendingOperations: [...state.pendingOperations, operation],
        }));
      },

      upsertWidget: (widget) => {
        // Ensure config has all required fields for backward compatibility
        const widgetWithCorrectConfig = {
          ...widget,
          config: widget.config ? {
            settings: (widget.config as any)?.settings || {},
            style: (widget.config as any)?.style || {},
            data: (widget.config as any)?.data || {},
            metadata: (widget.config as any)?.metadata || {},
            refresh: (widget.config as any)?.refresh || {
              enabled: false,
              interval: 30000,
            }
          } : {
            settings: {},
            style: {},
            data: {},
            metadata: {},
            refresh: {
              enabled: false,
              interval: 30000,
            }
          },
          // Ensure position values are valid numbers
          position: {
            x: Number.isFinite(widget.position.x) ? widget.position.x : 0,
            y: Number.isFinite(widget.position.y) ? widget.position.y : 0,
            w: Number.isFinite(widget.position.w) ? widget.position.w : 4,
            h: Number.isFinite(widget.position.h) ? widget.position.h : 4,
          }
        };

        set((state) => ({
          widgets: { ...state.widgets, [widget.id]: widgetWithCorrectConfig },
        }));
      },

      setWidgets: (widgets) => {
        console.log('[setWidgets] Setting widgets:', widgets.length, 'widgets');
        set(() => {
          const widgetsMap = widgets.reduce<Record<number, WidgetEntity>>((acc, widget) => {
            // Ensure config has all required fields for backward compatibility
            const widgetWithCorrectConfig = {
              ...widget,
              config: widget.config ? {
                settings: (widget.config as any)?.settings || {},
                style: (widget.config as any)?.style || {},
                data: (widget.config as any)?.data || {},
                metadata: (widget.config as any)?.metadata || {},
                refresh: (widget.config as any)?.refresh || {
                  enabled: false,
                  interval: 30000,
                }
              } : {
                settings: {},
                style: {},
                data: {},
                metadata: {},
                refresh: {
                  enabled: false,
                  interval: 30000,
                }
              },
              // Ensure position values are valid numbers
              position: {
                x: Number.isFinite(widget.position.x) ? widget.position.x : 0,
                y: Number.isFinite(widget.position.y) ? widget.position.y : 0,
                w: Number.isFinite(widget.position.w) ? widget.position.w : 4,
                h: Number.isFinite(widget.position.h) ? widget.position.h : 4,
              }
            };
            acc[widget.id] = widgetWithCorrectConfig;
            return acc;
          }, {});
          
          // Store both current and original widgets
          // Original widgets are used for comparison to detect changes
          return {
            widgets: widgetsMap,
            originalWidgets: { ...widgetsMap }, // Deep copy for comparison
          };
        });
      },

      clearPending: () => {
        console.log('[clearPending] Clearing all pending operations and restoring original widgets');
        set((state) => {
          // Restore widgets to original state (from DB)
          const restoredWidgets: Record<number, WidgetEntity> = {};
          
          // Keep only widgets that exist in originalWidgets (from DB) or are local
          Object.entries(state.widgets).forEach(([idStr, widget]) => {
            const widgetId = Number(idStr);
            if (isLocalWidget(widgetId)) {
              // Remove local widgets completely (they were never saved)
              console.log('[clearPending] Removing local widget:', widgetId);
            } else if (state.originalWidgets[widgetId]) {
              // Restore DB widgets to original
              console.log('[clearPending] Restoring DB widget to original:', widgetId);
              restoredWidgets[widgetId] = state.originalWidgets[widgetId];
            }
          });
          
          // Clean up history for non-existent widgets
          const cleanedHistory: Record<number, WidgetEntity[]> = {};
          Object.entries(state.history).forEach(([widgetId, history]) => {
            if (restoredWidgets[Number(widgetId)]) {
              cleanedHistory[Number(widgetId)] = history;
            }
          });

          // Clean up redo history for non-existent widgets
          const cleanedRedoHistory: Record<number, WidgetEntity[]> = {};
          Object.entries(state.redoHistory).forEach(([widgetId, redoHistory]) => {
            if (restoredWidgets[Number(widgetId)]) {
              cleanedRedoHistory[Number(widgetId)] = redoHistory;
            }
          });

          console.log('[clearPending] Cleared pending operations:', {
            restoredWidgets: Object.keys(restoredWidgets).length,
            removedLocalWidgets: Object.values(state.widgets).filter(w => isLocalWidget(w.id)).length
          });

          return {
            widgets: restoredWidgets,
            pendingOperations: [],
            dirtyWidgetIds: new Set<number>(),
            history: cleanedHistory,
            redoHistory: cleanedRedoHistory,
            conflicts: [],
            activeConflict: null,
          };
        });
      },

      getPending: () => get().pendingOperations,

      cleanupOldIds: () => {
        set((state) => {
          // Remove widgets with old Date.now() IDs (too large for INT4)
          const cleanedWidgets: Record<number, WidgetEntity> = {};
          const cleanedOperations: DraftOperation[] = [];
          const cleanedDirtyIds = new Set<number>();
          const cleanedHistory: Record<number, WidgetEntity[]> = {};
          const cleanedRedoHistory: Record<number, WidgetEntity[]> = {};
          
          // Keep only widgets with compatible IDs (local: 1M-2M, DB: < 1M)
          Object.entries(state.widgets).forEach(([id, widget]) => {
            const widgetId = parseInt(id);
            if (widgetId < 1000000 || (widgetId >= 1000000 && widgetId < 2000000)) {
              cleanedWidgets[widgetId] = widget;
              cleanedHistory[widgetId] = state.history[widgetId] || [];
              cleanedRedoHistory[widgetId] = state.redoHistory[widgetId] || [];
            }
          });
          
          // Keep only operations for valid widgets
          state.pendingOperations.forEach(op => {
            let shouldKeep = false;
            
            if (op.kind === "create" && op.widget) {
              const widgetId = (op.widget as WidgetEntity).id;
              if (widgetId < 1000000 || (widgetId >= 1000000 && widgetId < 2000000)) {
                shouldKeep = true;
              }
            } else if (op.kind === "update" && hasWidgetId(op)) {
              const widgetId = op.widgetId;
              if (widgetId < 1000000 || (widgetId >= 1000000 && widgetId < 2000000)) {
                shouldKeep = true;
              }
            } else if (op.kind === "delete") {
              const widgetId = hasWidgetId(op) ? op.widgetId : 0;
              if (widgetId < 1000000 || (widgetId >= 1000000 && widgetId < 2000000)) {
                shouldKeep = true;
              }
            }
            
            if (shouldKeep) {
              cleanedOperations.push(op);
            }
          });
          
          // Keep only dirty IDs for valid widgets
          state.dirtyWidgetIds.forEach(id => {
            if (id < 1000000 || (id >= 1000000 && id < 2000000)) {
              cleanedDirtyIds.add(id);
            }
          });
          
          return {
            widgets: cleanedWidgets,
            pendingOperations: cleanedOperations,
            dirtyWidgetIds: cleanedDirtyIds,
            history: cleanedHistory,
            redoHistory: cleanedRedoHistory,
          };
        });
      },

      // Conflict operations
      setConflicts: (conflicts) => set({ conflicts, activeConflict: null }),
      
      applyConflictResolution: (conflict, strategy) =>
        set((state) => {
          if (strategy === "manual") {
            return {
              ...state,
              activeConflict: conflict,
            };
          }

          const { widgetId } = conflict;
          const newState = { ...state };

          if (strategy === "keepLocal") {
            newState.conflicts = state.conflicts.filter((c) => c.widgetId !== widgetId);
            newState.activeConflict = null;
          } else if (strategy === "acceptRemote") {
            const remoteWidget = conflict.remoteWidget;
            if (remoteWidget) {
              newState.widgets = { ...state.widgets, [widgetId]: remoteWidget };
            }
            newState.conflicts = state.conflicts.filter((c) => c.widgetId !== widgetId);
            newState.activeConflict = null;
          }

          return newState;
        }),
      
      completeManualMerge: (conflict, widget, updatedOperations) =>
        set((state) => ({
          ...state,
          widgets: { ...state.widgets, [conflict.widgetId]: widget },
          pendingOperations: updatedOperations,
          conflicts: state.conflicts.filter((c) => c.widgetId !== conflict.widgetId),
          activeConflict: null,
        })),
      
      finalizeConflict: (widgetId, widget) =>
        set((state) => {
          const newState = { ...state };
          if (widget) {
            newState.widgets = { ...state.widgets, [widgetId]: widget };
          }
          newState.conflicts = state.conflicts.filter((c) => c.widgetId !== widgetId);
          newState.activeConflict = null;
          return newState;
        }),
      
      clearConflicts: () => set({ conflicts: [], activeConflict: null }),
      closeActiveConflict: () => set({ activeConflict: null }),

      // Draft operations
      setDrafts: (drafts) =>
        set((state) => ({
          drafts: drafts.reduce((acc, draft) => {
            acc[draft.id] = draft;
            return acc;
          }, {} as Record<number, WidgetDraftEntity>),
        })),
      removeDraft: (draftId) =>
        set((state) => {
          const { [draftId]: removed, ...remainingDrafts } = state.drafts;
          return { drafts: remainingDrafts };
        }),
    }),
    {
      name: "widgets-pending-store",
      partialize: (state) => ({
        widgets: state.widgets,
        originalWidgets: state.originalWidgets,
        drafts: state.drafts,
        pendingOperations: state.pendingOperations,
        history: state.history,
        redoHistory: state.redoHistory,
      }),
      version: 5, // Force reset due to CUSTOM widget removal and schema changes
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          console.log('🔄 Migrating widget store from version', version, 'to version 4');

          // Remove any CUSTOM widgets from persisted state
          if (persistedState.widgets) {
            const filteredWidgets: Record<number, any> = {};
            Object.entries(persistedState.widgets).forEach(([id, widget]: [string, any]) => {
              if (widget.kind !== 'CUSTOM') {
                filteredWidgets[Number(id)] = widget;
              } else {
                console.log('🗑️ Removing CUSTOM widget from persisted state:', id);
              }
            });
            persistedState.widgets = filteredWidgets;
          }

          // Also clean pending operations that reference CUSTOM widgets
          if (persistedState.pendingOperations) {
            persistedState.pendingOperations = persistedState.pendingOperations.filter((op: any) => {
              if (op.widget && op.widget.kind === 'CUSTOM') {
                console.log('🗑️ Removing CUSTOM widget operation from persisted state:', op.id);
                return false;
              }
              return true;
            });
          }

          console.log('✅ Widget store migration completed');
        }
        return persistedState;
      },
    }
  )
);