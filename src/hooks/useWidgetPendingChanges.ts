'use client';

import { useState, useRef, useEffect } from 'react';
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
  onDiscard?: () => void; // Callback pentru discard - poate actualiza local state
  autoSaveDelay?: number; // Auto-save after X ms of inactivity (0 = immediate, -1 = disabled)
  showAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useWidgetPendingChanges(options: UseWidgetPendingChangesOptions = {}) {
  const { tenant, showAlert } = useApp();
  const { onSuccess, onError, onDiscard, autoSaveDelay = 2000, showAlert: customShowAlert } = options;

  // State pentru modificările pending
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Refs pentru auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveFunctionRef = useRef<(() => Promise<void>) | null>(null);

  // Use custom showAlert if provided, otherwise use context showAlert
  const alert = customShowAlert || showAlert;

  // Generează cheia unică pentru o modificare
  const getChangeKey = (widgetId: number | string, type: 'create' | 'update' | 'delete') => {
    return `${type}_${widgetId}`;
  };

  // Clean widget data by converting empty strings to undefined for optional fields
  const cleanWidgetData = (data: any): any => {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const cleaned = { ...data };
    
    // Clean config object if it exists
    if (cleaned.config && typeof cleaned.config === 'object') {
      cleaned.config = { ...cleaned.config };
      
      // Clean dataSource if it exists
      if (cleaned.config.dataSource && typeof cleaned.config.dataSource === 'object') {
        cleaned.config.dataSource = { ...cleaned.config.dataSource };
        
        // Convert empty strings to undefined for optional fields
        if (cleaned.config.dataSource.tableId === '') {
          cleaned.config.dataSource.tableId = undefined;
        }
        if (cleaned.config.dataSource.aggregation === '') {
          cleaned.config.dataSource.aggregation = undefined;
        }
        if (cleaned.config.dataSource.column === '') {
          cleaned.config.dataSource.column = undefined;
        }
        if (cleaned.config.dataSource.columns && Array.isArray(cleaned.config.dataSource.columns)) {
          cleaned.config.dataSource.columns = cleaned.config.dataSource.columns.filter((col: any) => col !== '');
        }
      }
    }
    
    return cleaned;
  };

  // Adaugă o modificare pending cu logică inteligentă
  const addPendingChange = (
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
        const cleanedData = cleanWidgetData(data);
        const pendingChange: PendingChange = {
          type: 'create',
          widgetId,
          data: cleanedData || {},
          originalData: originalData || {},
          timestamp: Date.now(),
        };
        
        console.log('[Hook] Adding create pending change:', pendingChange);
        console.log('[Hook] Data received:', data);
        console.log('[Hook] Data after || {}:', data || {});
        newMap.set(changeKey, pendingChange);
        return newMap;
      }

      // 2. PENTRU WIDGET-URI EXISTENTE (UPDATE) - Verifică dacă există deja o operațiune de create
      if (type === 'update') {
        const createKey = getChangeKey(widgetId, 'create');
        const existingCreate = newMap.get(createKey);
        
        if (existingCreate) {
          // Dacă există deja o operațiune de create, modifică direct widget-ul din pendingChanges
          const cleanedData = cleanWidgetData(data);
          const updatedData = { ...existingCreate.data, ...cleanedData };
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
        const cleanedData = cleanWidgetData(data);
        const existingUpdate = newMap.get(changeKey);
        if (existingUpdate) {
          // Merge cu modificarea existentă - păstrează doar ultima modificare
          const mergedData = { ...existingUpdate.data, ...cleanedData };
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
            data: cleanedData,
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
  };

  // Elimină o modificare pending
  const removePendingChange = (widgetId: number | string, type: 'create' | 'update' | 'delete') => {
    const changeKey = getChangeKey(widgetId, type);
    
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(changeKey);
      return newMap;
    });
  };

  // Curăță toate modificările pending
  const clearPendingChanges = () => {
    setPendingChanges(new Map());
  };

  // Verifică dacă un widget are modificări pending
  const hasPendingChange = (widgetId: number | string, type?: 'create' | 'update' | 'delete') => {
    if (type) {
      const changeKey = getChangeKey(widgetId, type);
      return pendingChanges.has(changeKey);
    }
    
    // Verifică dacă există orice modificare pentru acest widget
    return Array.from(pendingChanges.keys()).some(key => key.includes(widgetId.toString()));
  };

  // Obține modificarea pending pentru un widget
  const getPendingChange = (widgetId: number | string, type: 'create' | 'update' | 'delete') => {
    const changeKey = getChangeKey(widgetId, type);
    return pendingChanges.get(changeKey);
  };

  // Obține widget-ul final cu toate modificările aplicate (pentru afișare)
  const getFinalWidget = (originalWidget: Widget): Widget | null => {
    const createKey = getChangeKey(originalWidget.id, 'create');
    const updateKey = getChangeKey(originalWidget.id, 'update');
    const deleteKey = getChangeKey(originalWidget.id, 'delete');
    
    console.log('[Hook] getFinalWidget called:', {
      widgetId: originalWidget.id,
      createKey,
      updateKey,
      deleteKey,
      hasCreate: pendingChanges.has(createKey),
      hasUpdate: pendingChanges.has(updateKey),
      hasDelete: pendingChanges.has(deleteKey),
      pendingChangesSize: pendingChanges.size
    });
    
    // Dacă există o operațiune de ștergere, widget-ul nu trebuie afișat
    if (pendingChanges.has(deleteKey)) {
      console.log('[Hook] Widget marked for deletion:', originalWidget.id);
      return null;
    }
    
    // Dacă există o operațiune de create, returnează widget-ul nou
    if (pendingChanges.has(createKey)) {
      const createChange = pendingChanges.get(createKey);
      console.log('[Hook] Widget is new (create):', originalWidget.id, createChange?.data);
      return {
        ...originalWidget,
        ...createChange?.data,
        id: originalWidget.id, // Păstrează ID-ul original pentru afișare
      } as Widget;
    }
    
    // Dacă există modificări, aplică-le pe widget-ul original
    if (pendingChanges.has(updateKey)) {
      const updateChange = pendingChanges.get(updateKey);
      console.log('[Hook] Widget has updates:', originalWidget.id, updateChange?.data);
      return {
        ...originalWidget,
        ...updateChange?.data,
      } as Widget;
    }
    
    // Dacă nu există modificări, returnează widget-ul original
    console.log('[Hook] Widget unchanged:', originalWidget.id, 'position:', originalWidget.position);
    
    // Verifică dacă position este null sau undefined și setează valori default
    if (!originalWidget.position) {
      console.log('[Hook] Widget position is null/undefined, setting default position');
      return {
        ...originalWidget,
        position: { x: 0, y: 0, width: 4, height: 4 }
      } as Widget;
    }
    
    return originalWidget;
  };

  // Salvează toate modificările pending
  const savePendingChanges = async (dashboardId: number) => {
    if (pendingChanges.size === 0 || !tenant?.id) {
      return null;
    }

    console.log('🚀 [HOOK_DEBUG] Starting savePendingChanges', {
      dashboardId,
      pendingChangesCount: pendingChanges.size,
      tenantId: tenant?.id,
      pendingChangesList: Array.from(pendingChanges.entries()).map(([key, change]) => ({
        key,
        type: change.type,
        widgetId: change.widgetId,
        hasData: !!change.data
      }))
    });

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
          console.log('🔍 Create operation data:', operation.data);
          console.log('🔍 Original change data:', change.data);
        } else {
          operation.data = change.data;
        }
        
        return operation;
      });

      console.log('📤 [HOOK_DEBUG] Sending batch request to API', {
        url: `/api/dashboards/${dashboardId}/widgets/batch`,
        operationsCount: operations.length,
        operations: operations.map(op => ({
          type: op.type,
          widgetId: op.widgetId,
          hasData: !!op.data
        }))
      });

      // Trimite batch request
      const response = await fetch(`/api/dashboards/${dashboardId}/widgets/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations }),
      });

      console.log('📥 [HOOK_DEBUG] API response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [HOOK_DEBUG] API error response', { errorData });
        throw new Error(
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      console.log('✅ [HOOK_DEBUG] API response parsed', {
        success: result.success,
        resultsCount: result.results?.length || 0,
        errorsCount: result.errors?.length || 0,
        fullResult: result
      });
      
      if (!result.success) {
        // Gestionează eșecurile parțiale
        const failedOperations = result.errors?.map((err: any) => 
          `Operation ${err.index + 1} (${err.type}): ${err.error}`
        ).join(', ') || 'Unknown error';
        
        throw new Error(`Partial success: ${failedOperations}`);
      }

      // Curăță modificările pending după succes
      console.log('🧹 [HOOK_DEBUG] Clearing pending changes', {
        beforeClearCount: pendingChanges.size
      });
      setPendingChanges(new Map());
      
      // Notifică succesul
      const totalChanges = operations.length;
      console.log('🎉 [HOOK_DEBUG] Save process completed successfully', {
        totalChanges,
        resultData: result.results || []
      });
      alert(`Successfully saved ${totalChanges} widget change${totalChanges !== 1 ? 's' : ''}`, 'success');
      onSuccess?.(result.results || []);
      
      const returnValue = result.results || [];
      console.log('🔄 [HOOK_DEBUG] Returning from savePendingChanges:', returnValue);
      return returnValue;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      console.error('💥 [HOOK_DEBUG] Save process failed', {
        error,
        errorMessage,
        pendingChangesCount: pendingChanges.size
      });
      alert(errorMessage, 'error');
      onError?.(errorMessage);
      throw error;
    } finally {
      console.log('🔚 [HOOK_DEBUG] Save process finished, setting isSaving to false');
      setIsSaving(false);
    }
  };

  // Anulează toate modificările pending
  const discardPendingChanges = () => {
    setPendingChanges(new Map());
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Apelează callback-ul pentru a actualiza local state-ul
    onDiscard?.();

    alert('Changes discarded', 'info');
  };

  // Salvează manual (forțat)
  const saveNow = async (dashboardId: number) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await savePendingChanges(dashboardId);
  };

  // Funcție pentru a seta saveFunctionRef cu dashboardId corect
  const setSaveFunction = (dashboardId: number) => {
    saveFunctionRef.current = () => savePendingChanges(dashboardId);
  };

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
