import { useEffect, useRef, useCallback } from 'react';
import { useWidgetsStore } from '@/widgets/store/useWidgetsStore';
import { useWidgetsApi } from '@/widgets/api/simple-client';
import { useToast } from '@/hooks/use-toast';

interface UseTasksAutoSaveOptions {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  widgetId: number;
  debounceMs?: number;
  enabled?: boolean;
}

export function useTasksAutoSave({
  tenantId,
  dashboardId,
  actorId,
  widgetId,
  debounceMs = 1000, // 1 second debounce for tasks
  enabled = true,
}: UseTasksAutoSaveOptions) {
  const pendingOperations = useWidgetsStore((state) => state.getPending());
  const api = useWidgetsApi(tenantId, dashboardId);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastOperationsRef = useRef<typeof pendingOperations>([]);
  const { toast } = useToast();

  const savePending = useCallback(async () => {
    if (!enabled || pendingOperations.length === 0) {
      return;
    }

    // Filter only operations related to this specific widget
    const widgetOperations = pendingOperations.filter(op => {
      if (op.kind === 'update' && op.widgetId === widgetId) {
        return true;
      }
      if (op.kind === 'create' && op.widget && (op.widget as any).id === widgetId) {
        return true;
      }
      return false;
    });

    if (widgetOperations.length === 0) {
      return;
    }

    try {
      console.log('[TasksAutoSave] Auto-saving tasks widget operations:', widgetOperations.length);
      await api.savePending({ actorId, operations: widgetOperations });
      console.log('[TasksAutoSave] Auto-save successful');
      
      // Show success toast
      toast({
        title: "Tasks saved",
        description: "Your task changes have been saved.",
        variant: "default",
      });
    } catch (error) {
      console.error('[TasksAutoSave] Auto-save failed:', error);
      
      // Show error toast
      toast({
        title: "Save failed",
        description: "Could not save task changes. Please try again.",
        variant: "destructive",
      });
    }
  }, [api, actorId, pendingOperations, enabled, widgetId, toast]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Check if operations have changed
    const operationsChanged = 
      pendingOperations.length !== lastOperationsRef.current.length ||
      JSON.stringify(pendingOperations) !== JSON.stringify(lastOperationsRef.current);

    // Only auto-save if we have pending operations for this widget
    if (operationsChanged && pendingOperations.length > 0) {
      // Check if any operation is for this widget
      const hasWidgetOperations = pendingOperations.some(op => {
        if (op.kind === 'update' && op.widgetId === widgetId) {
          return true;
        }
        if (op.kind === 'create' && op.widget && (op.widget as any).id === widgetId) {
          return true;
        }
        return false;
      });

      if (hasWidgetOperations) {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout for auto-save
        timeoutRef.current = setTimeout(() => {
          // Double-check that we still have pending operations before saving
          const currentPending = useWidgetsStore.getState().getPending();
          const currentWidgetOperations = currentPending.filter(op => {
            if (op.kind === 'update' && op.widgetId === widgetId) {
              return true;
            }
            if (op.kind === 'create' && op.widget && (op.widget as any).id === widgetId) {
              return true;
            }
            return false;
          });
          
          if (currentWidgetOperations.length > 0) {
            savePending();
          }
        }, debounceMs);

        // Update last operations reference
        lastOperationsRef.current = pendingOperations;
      } else if (operationsChanged && pendingOperations.length === 0) {
        // If operations were cleared, update the reference but don't auto-save
        lastOperationsRef.current = pendingOperations;
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pendingOperations, savePending, debounceMs, enabled, widgetId]);

  return {
    savePending,
  };
}
