import { useState, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface OptimisticUpdateOptions<T> {
  /**
   * Function to save data to the server
   */
  onSave: (data: T) => Promise<void>;
  
  /**
   * Whether to show toast notifications
   */
  showToast?: boolean;
  
  /**
   * Custom success message
   */
  successMessage?: string;
  
  /**
   * Custom error message
   */
  errorMessage?: string;
  
  /**
   * Debounce time in milliseconds (optional)
   */
  debounceMs?: number;
}

/**
 * Hook for optimistic updates with automatic rollback on error
 * 
 * @example
 * const { data, updateOptimistic, isSaving } = useOptimisticUpdate({
 *   initialData: notes,
 *   onSave: async (notes) => {
 *     await fetch('/api/notes', { method: 'PATCH', body: JSON.stringify(notes) });
 *   }
 * });
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T>
) {
  const { toast } = useToast();
  const [data, setData] = useState<T>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const previousDataRef = useRef<T>(initialData);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveQueueRef = useRef<Promise<void> | null>(null);

  const {
    onSave,
    showToast = false,
    successMessage = 'Changes saved',
    errorMessage = 'Failed to save changes',
    debounceMs = 0,
  } = options;

  /**
   * Update data optimistically with automatic server sync
   */
  const updateOptimistic = useCallback(
    async (newData: T | ((prev: T) => T)) => {
      // Store previous state for rollback
      previousDataRef.current = data;

      // Update UI immediately (optimistic)
      const updatedData = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(data)
        : newData;
      
      setData(updatedData);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the save operation if specified
      const executeSave = async () => {
        // Wait for any pending save to complete
        if (saveQueueRef.current) {
          try {
            await saveQueueRef.current;
          } catch (error) {
            // Ignore errors from previous saves
          }
        }

        setIsSaving(true);

        const savePromise = onSave(updatedData)
          .then(() => {
            // Success - keep the optimistic update
            if (showToast) {
              toast({
                title: successMessage,
                variant: 'default',
              });
            }
          })
          .catch((error) => {
            // Rollback on error
            console.error('[OptimisticUpdate] Save failed, rolling back:', error);
            setData(previousDataRef.current);
            
            if (showToast) {
              toast({
                title: errorMessage,
                description: error.message || 'Please try again.',
                variant: 'destructive',
              });
            }
          })
          .finally(() => {
            setIsSaving(false);
            saveQueueRef.current = null;
          });

        saveQueueRef.current = savePromise;
        return savePromise;
      };

      if (debounceMs > 0) {
        // Debounce the save
        return new Promise<void>((resolve, reject) => {
          debounceTimerRef.current = setTimeout(async () => {
            try {
              await executeSave();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, debounceMs);
        });
      } else {
        // Execute immediately
        return executeSave();
      }
    },
    [data, onSave, showToast, successMessage, errorMessage, debounceMs, toast]
  );

  /**
   * Force sync with initial data (useful when props change)
   */
  const syncData = useCallback((newData: T) => {
    setData(newData);
    previousDataRef.current = newData;
  }, []);

  return {
    data,
    setData: updateOptimistic,
    isSaving,
    syncData,
  };
}

