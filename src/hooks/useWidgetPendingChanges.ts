'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

interface Widget {
  id: number | string;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: any;
  isVisible: boolean;
  order: number;
}

interface PendingChange {
  type: 'create' | 'update' | 'delete';
  widgetId?: number | string;
  data?: Partial<Widget> | null;
  originalData?: Partial<Widget>; // For tracking original values to detect cancellations
}

interface UseWidgetPendingChangesOptions {
  onSuccess?: (results: any[]) => void;
  onError?: (error: string) => void;
}

export function useWidgetPendingChanges(options: UseWidgetPendingChangesOptions = {}) {
  const { tenant } = useApp();
  const { onSuccess, onError } = options;

  // State pentru modificările pending
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Generează cheia unică pentru o modificare
  const getChangeKey = useCallback((widgetId: number | string, type: 'create' | 'update' | 'delete') => {
    return `${type}_${widgetId}`;
  }, []);

  // Adaugă o modificare pending
  const addPendingChange = useCallback((
    type: 'create' | 'update' | 'delete',
    widgetId: number | string,
    data?: Partial<Widget> | null,
    originalData?: Partial<Widget>
  ) => {
    const changeKey = getChangeKey(widgetId, type);
    
    setPendingChanges(prev => {
      const newMap = new Map(prev);

      // Pentru operațiuni de update, verifică dacă valoarea este aceeași cu originalul
      if (type === 'update' && data && originalData) {
        const areEqual = (() => {
          // Comparare mai robustă a valorilor
          if (data == null && originalData == null) {
            return true;
          }
          if (data == null || originalData == null) {
            return false;
          }
          
          // Pentru obiecte, comparăm JSON-ul
          if (typeof data === 'object' && typeof originalData === 'object') {
            return JSON.stringify(data) === JSON.stringify(originalData);
          }
          
          // Comparație strictă pentru restul
          return data === originalData;
        })();

        // Dacă valoarea este aceeași cu originalul, eliminăm din pending
        if (areEqual) {
          newMap.delete(changeKey);
          return newMap;
        }
      }

      // Pentru operațiuni de delete, verifică dacă există deja o operațiune de create
      if (type === 'delete') {
        const createKey = getChangeKey(widgetId, 'create');
        if (newMap.has(createKey)) {
          // Dacă există o operațiune de create, elimină complet din pending
          newMap.delete(createKey);
          return newMap;
        }
      }

      // Pentru operațiuni de create, verifică dacă există deja o operațiune de delete
      if (type === 'create') {
        const deleteKey = getChangeKey(widgetId, 'delete');
        if (newMap.has(deleteKey)) {
          // Dacă există o operațiune de delete, elimină complet din pending
          newMap.delete(deleteKey);
        }
      }

      // Adaugă modificarea în pending changes
      const pendingChange: PendingChange = {
        type,
        widgetId,
        data,
        originalData,
      };
      newMap.set(changeKey, pendingChange);
      
      return newMap;
    });
  }, [getChangeKey]);

  // Elimină o modificare pending
  const removePendingChange = useCallback((widgetId: number | string, type: 'create' | 'update' | 'delete') => {
    const changeKey = getChangeKey(widgetId, type);
    
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(changeKey);
      return newMap;
    });
  }, [getChangeKey]);

  // Curăță toate modificările pending
  const clearPendingChanges = useCallback(() => {
    setPendingChanges(new Map());
  }, []);

  // Verifică dacă un widget are modificări pending
  const hasPendingChange = useCallback((widgetId: number | string, type?: 'create' | 'update' | 'delete') => {
    if (type) {
      const changeKey = getChangeKey(widgetId, type);
      return pendingChanges.has(changeKey);
    }
    
    // Verifică dacă există orice modificare pentru acest widget
    return Array.from(pendingChanges.keys()).some(key => key.includes(widgetId.toString()));
  }, [pendingChanges, getChangeKey]);

  // Obține modificarea pending pentru un widget
  const getPendingChange = useCallback((widgetId: number | string, type: 'create' | 'update' | 'delete') => {
    const changeKey = getChangeKey(widgetId, type);
    return pendingChanges.get(changeKey);
  }, [pendingChanges, getChangeKey]);

  // Salvează toate modificările pending
  const savePendingChanges = useCallback(async (dashboardId: number) => {
    if (pendingChanges.size === 0 || !tenant?.id) {
      return;
    }

    setIsSaving(true);

    try {
      // Pregătește operațiunile pentru batch request
      const operations = Array.from(pendingChanges.values()).map(change => {
        const operation: any = {
          type: change.type,
        };
        
        // Pentru operațiuni de create, nu include widgetId (va fi null)
        if (change.type === 'create') {
          operation.widgetId = null;
          if (change.data) {
            const { id, ...dataWithoutId } = change.data;
            operation.data = dataWithoutId;
          }
        } else {
          // Pentru update și delete, include widgetId
          operation.widgetId = change.widgetId;
          operation.data = change.data;
        }
        
        return operation;
      });

      // Trimite batch request
      const response = await fetch(`/api/dashboards/${dashboardId}/widgets/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      const result = await response.json();
      
      if (!result.success) {
        // Gestionează eșecurile parțiale
        const failedOperations = result.errors.map((err: any) => 
          `Operation ${err.index + 1} (${err.type}): ${err.error}`
        ).join(', ');
        
        throw new Error(`Partial success: ${failedOperations}`);
      }

      // Curăță modificările pending după succes
      setPendingChanges(new Map());
      
      // Notifică succesul
      onSuccess?.(result.results || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, tenant?.id, onSuccess, onError]);

  // Anulează toate modificările pending
  const discardPendingChanges = useCallback(() => {
    setPendingChanges(new Map());
  }, []);

  // Obține numărul de modificări pending
  const pendingChangesCount = pendingChanges.size;

  // Obține lista de modificări pending ca array
  const pendingChangesArray = Array.from(pendingChanges.values());

  return {
    // State
    pendingChanges: pendingChangesArray,
    pendingChangesMap: pendingChanges,
    isSaving,
    pendingChangesCount,

    // Actions
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    savePendingChanges,
    discardPendingChanges,

    // Helpers
    hasPendingChange,
    getPendingChange,
  };
}
