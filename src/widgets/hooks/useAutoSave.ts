import { useEffect, useRef, useCallback } from 'react';
import { useWidgetsStore } from '@/widgets/store/useWidgetsStore';
import { useWidgetsApi } from '@/widgets/api/simple-client';

interface UseAutoSaveOptions {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave({
  tenantId,
  dashboardId,
  actorId,
  debounceMs = 2000, // 2 seconds debounce
  enabled = true,
}: UseAutoSaveOptions) {
  const pendingOperations = useWidgetsStore((state) => state.getPending());
  const api = useWidgetsApi(tenantId, dashboardId);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastOperationsRef = useRef<typeof pendingOperations>([]);

  const savePending = useCallback(async () => {
    if (!enabled || pendingOperations.length === 0) {
      return;
    }

    try {
      console.log('[autoSave] Auto-saving pending operations:', pendingOperations.length);
      await api.savePending({ actorId, operations: pendingOperations });
      console.log('[autoSave] Auto-save successful');
    } catch (error) {
      console.error('[autoSave] Auto-save failed:', error);
    }
  }, [api, actorId, pendingOperations, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Check if operations have changed
    const operationsChanged = 
      pendingOperations.length !== lastOperationsRef.current.length ||
      JSON.stringify(pendingOperations) !== JSON.stringify(lastOperationsRef.current);

    if (operationsChanged && pendingOperations.length > 0) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(() => {
        savePending();
      }, debounceMs);

      // Update last operations reference
      lastOperationsRef.current = pendingOperations;
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pendingOperations, savePending, debounceMs, enabled]);

  return {
    savePending,
  };
}
