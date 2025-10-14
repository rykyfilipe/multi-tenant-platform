import { create } from "zustand";
import { ConflictMetadata, DraftOperation, WidgetEntity, WidgetDraftEntity } from "../domain/entities";
import { getWidgetDefinition } from "../registry/widget-registry";
import { hasWidgetId } from "../utils/pendingHelpers";

// Global change tracking for undo/redo
export interface WidgetChange {
  widgetId: number;
  property: keyof WidgetEntity;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export interface PendingChangesState {
  // Core state
  widgets: Record<number, WidgetEntity>;
  originalWidgets: Record<number, WidgetEntity>; // Original widgets from DB (for comparison)
  drafts: Record<number, WidgetDraftEntity>;
  pendingOperations: DraftOperation[];
  dirtyWidgetIds: Set<number>;
  lastModifiedWidgetId: number | null; // Track last modified widget for undo/redo

  // GLOBAL History management - single stack for ALL widgets
  changeHistory: WidgetChange[];
  redoHistory: WidgetChange[];

  // Conflict management
  conflicts: ConflictMetadata[];
  activeConflict: ConflictMetadata | null;
  
  // Widget operations
  createLocal: (widget: WidgetEntity) => void;
  updateLocal: (widgetId: number, patch: Partial<WidgetEntity>) => void;
  deleteLocal: (widgetId: number) => void;
  
  // History operations - now global, not per widget
  discardChanges: (widgetId: number) => void;
  undoLastChange: () => boolean; // No widgetId needed - global stack
  redoLastChange: () => boolean; // No widgetId needed - global stack
  
  // Utility operations
  addOperation: (operation: DraftOperation) => void;
  upsertWidget: (widget: WidgetEntity) => void;
  setWidgets: (widgets: WidgetEntity[]) => void;
  clearPending: () => void;
  clearPendingOperations: () => void;
  discardAllChanges: () => void;
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

const MAX_HISTORY_SIZE = 50; // Global history limit for all changes

export const useWidgetsStore = create<PendingChangesState>()((set, get) => ({
      // Core state
      widgets: {},
      originalWidgets: {}, // Store original widgets from DB
      drafts: {},
      pendingOperations: [],
      dirtyWidgetIds: new Set<number>(),
      lastModifiedWidgetId: null,

      // GLOBAL History management - single stack for ALL changes
      changeHistory: [],
      redoHistory: [],

      // Conflict management
      conflicts: [],
      activeConflict: null,

      // Widget operations
      createLocal: (widget) => {
        console.log('[createLocal] Creating widget:', widget.id);
        
        // Validate widget ID
        if (!widget.id || typeof widget.id !== 'number' || isNaN(widget.id)) {
          console.error('[createLocal] Invalid widget ID:', widget.id);
          return;
        }
        
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

        const definition = getWidgetDefinition(widget.type);
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
              originalWidgets: { ...state.originalWidgets },
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
            originalWidgets: { ...state.originalWidgets },
            pendingOperations: [
              ...state.pendingOperations,
              { kind: "create", id: `create-${widget.id}`, widget: widgetWithRefresh },
            ],
            dirtyWidgetIds: new Set(state.dirtyWidgetIds).add(widget.id),
            lastModifiedWidgetId: widget.id,
            // No changes added to history for create - widget didn't exist before
          };
        });
      },

      updateLocal: (widgetId, patch) => {
        const existing = get().widgets[widgetId];
        if (!existing) return;

        const updated = { 
          ...existing, 
          ...patch,
          // Only increment version if not explicitly provided in patch
          version: patch.version ?? ((existing.version || 1) + 1),
          updatedAt: new Date()
        } as WidgetEntity;

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

        const definition = getWidgetDefinition(updated.type);
        try {
          definition.schema.parse(updated.config);
        } catch (error) {
          console.warn(`Widget ${widgetId} config validation failed:`, error);
          // Use default config if validation fails
          updated.config = definition.defaultConfig;
        }
        
        console.log('🔄 [Store] updateLocal - Widget updated:', {
          widgetId,
          oldVersion: existing.version,
          newVersion: updated.version,
          patch
        });
        
        set((state) => {
          // Record EACH property change in global history
          const changes: WidgetChange[] = [];
          Object.entries(patch).forEach(([key, newValue]) => {
            const property = key as keyof WidgetEntity;
            const oldValue = existing[property];
            
            // Only record if value actually changed
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              changes.push({
                widgetId,
                property,
                oldValue,
                newValue,
                timestamp: Date.now()
              });
            }
          });
          
          const newState = {
            widgets: { ...state.widgets, [widgetId]: updated },
            originalWidgets: { ...state.originalWidgets },
            pendingOperations: [...state.pendingOperations],
            dirtyWidgetIds: new Set(state.dirtyWidgetIds),
            lastModifiedWidgetId: widgetId,
            // Add changes to GLOBAL history stack
            changeHistory: [...changes, ...state.changeHistory].slice(0, MAX_HISTORY_SIZE),
            redoHistory: [], // Clear redo history on new change
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
              updatedTitle: updated.title,
              originalPosition: originalWidget.position,
              updatedPosition: updated.position
            });
            
            const isReverted = JSON.stringify(updated.config) === JSON.stringify(originalWidget.config) &&
                              updated.title === originalWidget.title &&
                              updated.description === originalWidget.description &&
                              JSON.stringify(updated.position) === JSON.stringify(originalWidget.position);
            
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
            originalWidgets: { ...state.originalWidgets },
            pendingOperations: [...state.pendingOperations],
            dirtyWidgetIds: new Set(state.dirtyWidgetIds),
            lastModifiedWidgetId: state.lastModifiedWidgetId === widgetId ? null : state.lastModifiedWidgetId,
            changeHistory: state.changeHistory, // Keep global history
            redoHistory: state.redoHistory, // Keep global redo history
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

          console.log('[deleteLocal] Widget', widgetId, 'deleted successfully');
          
          return newState;
        });
      },

      // History operations
      discardChanges: (widgetId) => {
        console.log('[discardChanges] Discarding changes for widget:', widgetId);
        set((state) => {
          const newState = {
            widgets: { ...state.widgets },
            originalWidgets: { ...state.originalWidgets },
            pendingOperations: [...state.pendingOperations],
            dirtyWidgetIds: new Set(state.dirtyWidgetIds),
            // Remove changes for this widget from global history
            changeHistory: state.changeHistory.filter(change => change.widgetId !== widgetId),
            redoHistory: [], // Clear redo
          };

          if (isLocalWidget(widgetId)) {
            // For local widgets, remove completely (they were never in DB)
            console.log('[discardChanges] Removing local widget:', widgetId);
            delete newState.widgets[widgetId];
            newState.pendingOperations = state.pendingOperations.filter(op => 
              !(op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId)
            );
            newState.dirtyWidgetIds.delete(widgetId);
          } else {
            // For DB widgets, RESTORE to original version from DB
            if (state.originalWidgets[widgetId]) {
              console.log('[discardChanges] Restoring DB widget to original:', widgetId);
              newState.widgets[widgetId] = state.originalWidgets[widgetId];
            } else {
              console.warn('[discardChanges] No original widget found, removing from state:', widgetId);
              delete newState.widgets[widgetId];
            }
            
            // Remove all pending operations for this widget
            newState.pendingOperations = state.pendingOperations.filter(op => {
              if (op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId) return false;
              if (op.kind === "delete" && hasWidgetId(op) && op.widgetId === widgetId) return false;
              if (op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId) return false;
              return true;
            });
            newState.dirtyWidgetIds.delete(widgetId);
          }

          console.log('[discardChanges] Changes discarded, widget restored to original');
          return newState;
        });
      },

      undoLastChange: () => {
        console.log('⏪ [UNDO] Undoing last change from global stack');
        const state = get();
        
        if (state.changeHistory.length === 0) {
          console.log('⏪ [UNDO] No changes in history');
          return false;
        }

        // Take the LAST change from stack (most recent)
        const lastChange = state.changeHistory[0];
        console.log('⏪ [UNDO] Reverting change:', lastChange);
        
        set((currentState) => {
          const widget = currentState.widgets[lastChange.widgetId];
          if (!widget) {
            console.warn('⏪ [UNDO] Widget not found:', lastChange.widgetId);
            return currentState;
          }

          // Apply old value to widget
          const updatedWidget = {
            ...widget,
            [lastChange.property]: lastChange.oldValue,
            version: (widget.version || 1) + 1,
            updatedAt: new Date()
          };

          console.log('⏪ [UNDO] Restored property:', {
            widgetId: lastChange.widgetId,
            property: lastChange.property,
            from: lastChange.newValue,
            to: lastChange.oldValue
          });

          const newState = {
            widgets: { ...currentState.widgets, [lastChange.widgetId]: updatedWidget },
            originalWidgets: { ...currentState.originalWidgets },
            pendingOperations: [...currentState.pendingOperations],
            dirtyWidgetIds: new Set(currentState.dirtyWidgetIds),
            lastModifiedWidgetId: lastChange.widgetId,
            // Remove change from history
            changeHistory: currentState.changeHistory.slice(1),
            // Add to redo history (reverse: newValue becomes old, oldValue becomes new)
            redoHistory: [lastChange, ...currentState.redoHistory].slice(0, MAX_HISTORY_SIZE),
          };

          // Update pending operations
          const widgetId = lastChange.widgetId;
          if (isLocalWidget(widgetId)) {
            const createOpIndex = currentState.pendingOperations.findIndex(op => 
              op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId
            );
            if (createOpIndex >= 0) {
              newState.pendingOperations[createOpIndex] = {
                ...newState.pendingOperations[createOpIndex],
                widget: updatedWidget
              } as any;
            }
          } else {
            // Check if back to original
            const originalWidget = currentState.originalWidgets[widgetId];
            const isBackToOriginal = originalWidget &&
              JSON.stringify(updatedWidget.config) === JSON.stringify(originalWidget.config) &&
              updatedWidget.title === originalWidget.title &&
              updatedWidget.description === originalWidget.description &&
              JSON.stringify(updatedWidget.position) === JSON.stringify(originalWidget.position);
            
            if (isBackToOriginal) {
              newState.pendingOperations = currentState.pendingOperations.filter(op => 
                !(op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId)
              );
              newState.dirtyWidgetIds.delete(widgetId);
            } else {
              const updateOpIndex = currentState.pendingOperations.findIndex(op => 
                op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId
              );
              
              const patch = { [lastChange.property]: lastChange.oldValue };
              const newOperation = {
                kind: "update" as const,
                id: `update-${widgetId}-${generateOperationId()}`,
                widgetId,
                patch,
                expectedVersion: updatedWidget.version,
              };
              
              if (updateOpIndex >= 0) {
                newState.pendingOperations[updateOpIndex] = newOperation;
              } else {
                newState.pendingOperations.push(newOperation);
                newState.dirtyWidgetIds.add(widgetId);
              }
            }
          }

          return newState;
        });

        return true;
      },

      redoLastChange: () => {
        console.log('⏩ [REDO] Redoing last undone change from global stack');
        const state = get();
        
        if (state.redoHistory.length === 0) {
          console.log('⏩ [REDO] No changes in redo history');
          return false;
        }

        // Take the LAST undone change from redo stack
        const lastUndone = state.redoHistory[0];
        console.log('⏩ [REDO] Reapplying change:', lastUndone);
        
        set((currentState) => {
          const widget = currentState.widgets[lastUndone.widgetId];
          if (!widget) {
            console.warn('⏩ [REDO] Widget not found:', lastUndone.widgetId);
            return currentState;
          }

          // Apply new value to widget (redo the change)
          const updatedWidget = {
            ...widget,
            [lastUndone.property]: lastUndone.newValue,
            version: (widget.version || 1) + 1,
            updatedAt: new Date()
          };

          console.log('⏩ [REDO] Reapplied property:', {
            widgetId: lastUndone.widgetId,
            property: lastUndone.property,
            from: lastUndone.oldValue,
            to: lastUndone.newValue
          });

          const newState = {
            widgets: { ...currentState.widgets, [lastUndone.widgetId]: updatedWidget },
            originalWidgets: { ...currentState.originalWidgets },
            pendingOperations: [...currentState.pendingOperations],
            dirtyWidgetIds: new Set(currentState.dirtyWidgetIds),
            lastModifiedWidgetId: lastUndone.widgetId,
            // Add change back to history
            changeHistory: [lastUndone, ...currentState.changeHistory].slice(0, MAX_HISTORY_SIZE),
            // Remove from redo history
            redoHistory: currentState.redoHistory.slice(1),
          };

          // Update pending operations
          const widgetId = lastUndone.widgetId;
          if (isLocalWidget(widgetId)) {
            const createOpIndex = currentState.pendingOperations.findIndex(op => 
              op.kind === "create" && op.widget && (op.widget as WidgetEntity).id === widgetId
            );
            if (createOpIndex >= 0) {
              newState.pendingOperations[createOpIndex] = {
                ...newState.pendingOperations[createOpIndex],
                widget: updatedWidget
              } as any;
            }
          } else {
            // Check if back to original
            const originalWidget = currentState.originalWidgets[widgetId];
            const isBackToOriginal = originalWidget &&
              JSON.stringify(updatedWidget.config) === JSON.stringify(originalWidget.config) &&
              updatedWidget.title === originalWidget.title &&
              updatedWidget.description === originalWidget.description &&
              JSON.stringify(updatedWidget.position) === JSON.stringify(originalWidget.position);
            
            if (isBackToOriginal) {
              newState.pendingOperations = currentState.pendingOperations.filter(op => 
                !(op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId)
              );
              newState.dirtyWidgetIds.delete(widgetId);
            } else {
              const updateOpIndex = currentState.pendingOperations.findIndex(op => 
                op.kind === "update" && hasWidgetId(op) && op.widgetId === widgetId
              );
              
              const patch = { [lastUndone.property]: lastUndone.newValue };
              const newOperation = {
                kind: "update" as const,
                id: `update-${widgetId}-${generateOperationId()}`,
                widgetId,
                patch,
                expectedVersion: updatedWidget.version,
              };
              
              if (updateOpIndex >= 0) {
                newState.pendingOperations[updateOpIndex] = newOperation;
              } else {
                newState.pendingOperations.push(newOperation);
                newState.dirtyWidgetIds.add(widgetId);
              }
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
        console.log('[setWidgets] Input widget IDs:', widgets.map(w => w.id));
        set(() => {
          const widgetsMap = widgets
            .filter(widget => 
              widget && // Ensure widget exists
              widget.id && // Ensure widget has valid ID
              typeof widget.id === 'number' && // Ensure ID is a number
              !isNaN(widget.id) // Ensure ID is not NaN
            )
            .reduce<Record<number, WidgetEntity>>((acc, widget) => {
              console.log('[setWidgets] Processing widget ID:', widget.id, 'isLocal:', isLocalWidget(widget.id));
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
          
          console.log('[setWidgets] Final widget IDs in map:', Object.keys(widgetsMap));
          
          // Store both current and original widgets
          // Original widgets are used for comparison to detect changes
          return {
            widgets: widgetsMap,
            originalWidgets: { ...widgetsMap }, // Deep copy for comparison
          };
        });
      },

      clearPending: () => {
        console.log('🧹 [clearPending] Clearing all pending operations and restoring original widgets');
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

          console.log('🧹 [clearPending] Cleared pending operations:', {
            restoredWidgets: Object.keys(restoredWidgets).length,
            removedLocalWidgets: Object.values(state.widgets).filter(w => isLocalWidget(w.id)).length
          });

          return {
            widgets: restoredWidgets,
            lastModifiedWidgetId: null,
            pendingOperations: [],
            dirtyWidgetIds: new Set<number>(),
            // CLEAR GLOBAL HISTORY on save
            changeHistory: [],
            redoHistory: [],
            conflicts: [],
            activeConflict: null,
          };
        });
      },

      clearPendingOperations: () => {
        console.log('🧹 [clearPendingOperations] Clearing only pending operations, keeping widgets and history');
        set((state) => {
          return {
            ...state,
            pendingOperations: [],
            dirtyWidgetIds: new Set<number>(),
            lastModifiedWidgetId: null,
            conflicts: [],
            activeConflict: null,
            // Note: Keep changeHistory and redoHistory - only clearing operations
          };
        });
      },

      discardAllChanges: () => {
        console.log('🗑️ [discardAllChanges] Discarding all changes and restoring to original state');
        set((state) => {
          const restoredWidgets: Record<number, WidgetEntity> = {};
          
          // Restore all widgets to their original state
          Object.entries(state.widgets).forEach(([idStr, widget]) => {
            const widgetId = Number(idStr);
            
            if (state.originalWidgets[widgetId]) {
              // Restore DB widgets to original state
              console.log('[discardAllChanges] Restoring widget to original:', widgetId);
              restoredWidgets[widgetId] = state.originalWidgets[widgetId];
            } else {
              // Keep local widgets as they are (they don't have original state)
              console.log('[discardAllChanges] Keeping local widget:', widgetId);
              restoredWidgets[widgetId] = widget;
            }
          });
          
          console.log('🗑️ [discardAllChanges] Discarded changes:', {
            restoredWidgets: Object.keys(restoredWidgets).length,
            keptLocalWidgets: Object.values(restoredWidgets).filter(w => isLocalWidget(w.id)).length
          });

          return {
            widgets: restoredWidgets,
            lastModifiedWidgetId: null,
            pendingOperations: [],
            dirtyWidgetIds: new Set<number>(),
            // CLEAR GLOBAL HISTORY when discarding
            changeHistory: [],
            redoHistory: [],
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
          const validWidgetIds = new Set<number>();
          
          // Keep only widgets with compatible IDs (local: 1M-2M, DB: < 1M)
          Object.entries(state.widgets).forEach(([id, widget]) => {
            const widgetId = parseInt(id);
            if (widgetId < 1000000 || (widgetId >= 1000000 && widgetId < 2000000)) {
              cleanedWidgets[widgetId] = widget;
              validWidgetIds.add(widgetId);
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
          
          // Clean GLOBAL history - remove changes for invalid widgets
          const cleanedChangeHistory = state.changeHistory.filter(change => 
            validWidgetIds.has(change.widgetId)
          );
          const cleanedRedoHistory = state.redoHistory.filter(change => 
            validWidgetIds.has(change.widgetId)
          );
          
          return {
            widgets: cleanedWidgets,
            pendingOperations: cleanedOperations,
            dirtyWidgetIds: cleanedDirtyIds,
            changeHistory: cleanedChangeHistory,
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
    })
);