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
  timestamp: number; // For auto-save timing
}

interface UseWidgetPendingChangesOptions {
  onSuccess?: (results: any[]) => void;
  onError?: (error: string) => void;
  autoSaveDelay?: number; // Auto-save after X ms of inactivity (0 = immediate, -1 = disabled)
  showAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useWidgetPendingChanges(options: UseWidgetPendingChangesOptions = {}) {
  const { tenant, showAlert } = useApp();
  const { onSuccess, onError, autoSaveDelay = 2000, showAlert: customShowAlert } = options;

  // State pentru modificările pending
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Refs pentru auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveFunctionRef = useRef<(() => Promise<void>) | null>(null);

  // Use custom showAlert if provided, otherwise use context showAlert
  const alert = customShowAlert || showAlert;

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
        timestamp: Date.now(),
      };
      newMap.set(changeKey, pendingChange);
      
      return newMap;
    });

    // Programează auto-save doar dacă autoSaveDelay > 0
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (autoSaveDelay > 0) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (saveFunctionRef.current) {
          saveFunctionRef.current();
        }
      }, autoSaveDelay);
    } else if (autoSaveDelay === 0) {
      // Pentru autoSaveDelay = 0, face save imediat
      if (saveFunctionRef.current) {
        // Folosește setTimeout pentru a evita probleme de sincronizare
        setTimeout(() => {
          if (saveFunctionRef.current) {
            saveFunctionRef.current();
          }
        }, 100);
      }
    }
    // Pentru autoSaveDelay < 0, nu face nimic (dezactivează auto-save)
  }, [getChangeKey, autoSaveDelay]);

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
          widgetId: change.widgetId,
        };
        
        // Pentru operațiuni de create, exclude id-ul pentru a lăsa Prisma să-l genereze automat
        if (change.type === 'create' && change.data) {
          const { id, ...dataWithoutId } = change.data;
          operation.data = dataWithoutId;
        } else {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      
      if (!result.success) {
        // Gestionează eșecurile parțiale
        const failedOperations = result.errors?.map((err: any) => 
          `Operation ${err.index + 1} (${err.type}): ${err.error}`
        ).join(', ') || 'Unknown error';
        
        throw new Error(`Partial success: ${failedOperations}`);
      }

      // Curăță modificările pending după succes
      setPendingChanges(new Map());
      
      // Notifică succesul
      const totalChanges = operations.length;
      alert(`Successfully saved ${totalChanges} widget change${totalChanges !== 1 ? 's' : ''}`, 'success');
      onSuccess?.(result.results || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      alert(errorMessage, 'error');
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, tenant?.id, onSuccess, onError, alert]);

  // Anulează toate modificările pending
  const discardPendingChanges = useCallback(() => {
    setPendingChanges(new Map());
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    alert('Changes discarded', 'info');
  }, [alert]);

  // Salvează manual (forțat)
  const saveNow = useCallback(async (dashboardId: number) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await savePendingChanges(dashboardId);
  }, [savePendingChanges]);

  // Actualizează ref-ul cu funcția de save
  saveFunctionRef.current = () => savePendingChanges(0); // Will be overridden with actual dashboardId

  // Auto-save la beforeunload (când utilizatorul părăsește pagina)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.size > 0) {
        // Afișează dialog de confirmare
        e.preventDefault();
        e.returnValue = "You have unsaved widget changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingChanges.size]);

  // Cleanup la unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Obține numărul de modificări pending
  const pendingChangesCount = pendingChanges.size;

  // Obține lista de modificări pending ca array
  const pendingChangesArray = Array.from(pendingChanges.values());

  // Obține modificările grupate pe tip
  const changesByType = {
    create: pendingChangesArray.filter(change => change.type === 'create'),
    update: pendingChangesArray.filter(change => change.type === 'update'),
    delete: pendingChangesArray.filter(change => change.type === 'delete'),
  };

  return {
    // State
    pendingChanges: pendingChangesArray,
    pendingChangesMap: pendingChanges,
    isSaving,
    pendingChangesCount,
    changesByType,

    // Actions
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    savePendingChanges,
    discardPendingChanges,
    saveNow,

    // Helpers
    hasPendingChange,
    getPendingChange,
  };
}
