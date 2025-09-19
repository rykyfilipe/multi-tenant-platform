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

  // Adaugă o modificare pending cu logică inteligentă
  const addPendingChange = useCallback((
    type: 'create' | 'update' | 'delete',
    widgetId: number | string,
    data?: Partial<Widget> | null,
    originalData?: Partial<Widget>
  ) => {
    const changeKey = getChangeKey(widgetId, type);
    
    setPendingChanges(prev => {
      const newMap = new Map(prev);

      // 1. PENTRU WIDGET-URI NOI (CREATE) - Modificările se fac direct pe widget-ul din pendingChanges
      if (type === 'create') {
        const deleteKey = getChangeKey(widgetId, 'delete');
        if (newMap.has(deleteKey)) {
          // Dacă există o operațiune de delete, elimină complet din pending
          newMap.delete(deleteKey);
        }

        // Adaugă sau actualizează widget-ul nou
        const pendingChange: PendingChange = {
          type: 'create',
          widgetId,
          data: data || {},
          originalData: originalData || {},
          timestamp: Date.now(),
        };
        newMap.set(changeKey, pendingChange);
        return newMap;
      }

      // 2. PENTRU WIDGET-URI EXISTENTE (UPDATE) - Verifică dacă există deja o operațiune de create
      if (type === 'update') {
        const createKey = getChangeKey(widgetId, 'create');
        const existingCreate = newMap.get(createKey);
        
        if (existingCreate) {
          // Dacă există deja o operațiune de create, modifică direct widget-ul din pendingChanges
          const updatedData = { ...existingCreate.data, ...data };
          const updatedChange: PendingChange = {
            ...existingCreate,
            data: updatedData,
            timestamp: Date.now(),
          };
          newMap.set(createKey, updatedChange);
          return newMap;
        }

        // Pentru widget-uri existente, verifică dacă valoarea este diferită de original
        if (data && originalData) {
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

          // Dacă valoarea este aceeași cu originalul, elimină din pending
          if (areEqual) {
            newMap.delete(changeKey);
            return newMap;
          }
        }

        // Adaugă sau actualizează modificarea
        const existingUpdate = newMap.get(changeKey);
        if (existingUpdate) {
          // Merge cu modificarea existentă - păstrează doar ultima modificare
          const mergedData = { ...existingUpdate.data, ...data };
          const updatedChange: PendingChange = {
            ...existingUpdate,
            data: mergedData,
            timestamp: Date.now(),
          };
          newMap.set(changeKey, updatedChange);
        } else {
          // Adaugă noua modificare
          const pendingChange: PendingChange = {
            type: 'update',
            widgetId,
            data,
            originalData,
            timestamp: Date.now(),
          };
          newMap.set(changeKey, pendingChange);
        }
        return newMap;
      }

      // 3. PENTRU ȘTERGERE (DELETE) - Logică inteligentă
      if (type === 'delete') {
        const createKey = getChangeKey(widgetId, 'create');
        const updateKey = getChangeKey(widgetId, 'update');
        
        if (newMap.has(createKey)) {
          // Dacă există o operațiune de create, elimină complet din pending (nu mai trebuie să-l creezi)
          newMap.delete(createKey);
          return newMap;
        }
        
        if (newMap.has(updateKey)) {
          // Dacă există modificări, elimină-le și păstrează doar ștergerea
          newMap.delete(updateKey);
        }

        // Adaugă operațiunea de ștergere
        const pendingChange: PendingChange = {
          type: 'delete',
          widgetId,
          data: null,
          originalData: originalData || {},
          timestamp: Date.now(),
        };
        newMap.set(changeKey, pendingChange);
        return newMap;
      }

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

  // Obține widget-ul final cu toate modificările aplicate (pentru afișare)
  const getFinalWidget = useCallback((originalWidget: Widget): Widget | null => {
    const createKey = getChangeKey(originalWidget.id, 'create');
    const updateKey = getChangeKey(originalWidget.id, 'update');
    const deleteKey = getChangeKey(originalWidget.id, 'delete');
    
    // Dacă există o operațiune de ștergere, widget-ul nu trebuie afișat
    if (pendingChanges.has(deleteKey)) {
      return null;
    }
    
    // Dacă există o operațiune de create, returnează widget-ul nou
    if (pendingChanges.has(createKey)) {
      const createChange = pendingChanges.get(createKey);
      return {
        ...originalWidget,
        ...createChange?.data,
        id: originalWidget.id, // Păstrează ID-ul original pentru afișare
      } as Widget;
    }
    
    // Dacă există modificări, aplică-le pe widget-ul original
    if (pendingChanges.has(updateKey)) {
      const updateChange = pendingChanges.get(updateKey);
      return {
        ...originalWidget,
        ...updateChange?.data,
      } as Widget;
    }
    
    // Dacă nu există modificări, returnează widget-ul original
    return originalWidget;
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

  // Funcție pentru a seta saveFunctionRef cu dashboardId corect
  const setSaveFunction = useCallback((dashboardId: number) => {
    saveFunctionRef.current = () => savePendingChanges(dashboardId);
  }, [savePendingChanges]);

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
    setSaveFunction,

    // Helpers
    hasPendingChange,
    getPendingChange,
    getFinalWidget,
  };
}
