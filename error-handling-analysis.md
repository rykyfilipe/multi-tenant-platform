# ANALIZA ERROR HANDLING ȘI ROLLBACK MECHANISMS

## 🔍 **ANALIZA ERROR HANDLING ACTUAL**

### 1. **Error Handling în Batch Cell Editor**

#### Implementare Actuală:
```typescript
// useBatchCellEditor - savePendingChanges
try {
    // Batch API call
    const response = await fetch(`/api/.../batch`, { method: "POST" });
    if (!response.ok) {
        // Fallback la request-uri individuale
        for (const change of rowChanges) {
            await fetch(`/api/.../cell/${change.cellId}`, { method: "PATCH" });
        }
    }
    setPendingChanges(new Map()); // ✅ Curăță pending changes
    onSuccess?.(allUpdatedCells);
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
    showAlert(errorMessage, "error");
    onError?.(errorMessage); // ❌ Doar notificare, nu rollback
} finally {
    setIsSaving(false);
}
```

#### Probleme Identificate:
- ❌ **Nu face rollback**: onError() doar notifică, nu face rollback la optimistic updates
- ❌ **Partial failures**: Dacă unele celule eșuează, nu face rollback la toate
- ❌ **No retry logic**: Nu încearcă să repete operațiunile eșuate

### 2. **Error Handling în UnifiedTableEditor**

#### Operațiuni de Adăugare Coloane:
```typescript
// handleAddColumn
try {
    // OPTIMISTIC UPDATE: Add column immediately to UI
    const tempColumn = { id: Date.now(), ...columnData, isOptimistic: true };
    setColumns([...columns, tempColumn]);
    
    // Background API call
    const response = await fetch(`/api/.../columns`, { method: "POST" });
    if (response.ok) {
        // Replace optimistic column with real one
        setColumns(prev => prev.map(col => 
            col.id === tempColumn.id ? realColumn : col
        ));
    } else {
        throw new Error("Failed to add column");
    }
} catch (error) {
    // ✅ Revert optimistic update
    setColumns(prev => prev.filter(col => col.id !== tempColumn.id));
    showAlert(error.message, "error");
}
```

#### Probleme Identificate:
- ✅ **Bun**: Are optimistic update și rollback corect
- ❌ **Refresh inutil**: refreshAfterChange() după succes

#### Operațiuni de Ștergere Rânduri:
```typescript
// handleDeleteRow
try {
    // OPTIMISTIC UPDATE: Remove row immediately from UI
    const rowToDelete = paginatedRows?.find(row => row.id.toString() === rowId);
    setRows(currentRows => currentRows.filter(row => row.id.toString() !== rowId));
    
    // Background API call
    const response = await fetch(`/api/.../rows/${rowId}`, { method: "DELETE" });
    if (response.ok) {
        await refreshAfterChange(); // ❌ Refresh inutil
    } else {
        throw new Error("Failed to delete row");
    }
} catch (error) {
    // ✅ Revert optimistic update
    if (rowToDelete) {
        setRows(currentRows => [rowToDelete, ...currentRows]);
    }
    showAlert(error.message, "error");
}
```

#### Probleme Identificate:
- ✅ **Bun**: Are optimistic update și rollback corect
- ❌ **Refresh inutil**: refreshAfterChange() după succes șterge optimistic update

### 3. **Error Handling în Adăugare Rânduri**

#### Implementare Actuală:
```typescript
// handleInlineRowSave
try {
    setIsAddingRow(true);
    const response = await fetch(`/api/.../rows/batch`, { method: "POST" });
    if (response.ok) {
        const result = await response.json();
        setRows(currentRows => [...savedRows, ...currentRows]); // ❌ Nu e optimistic
        showAlert("Row added successfully!", "success");
    } else {
        throw new Error("Failed to add row");
    }
} catch (error) {
    showAlert(error.message, "error"); // ❌ Nu face rollback
} finally {
    setIsAddingRow(false);
}
```

#### Probleme Identificate:
- ❌ **Nu are optimistic update**: Rândul se adaugă doar după succes API
- ❌ **Nu are rollback**: Dacă API eșuează, nu se face nimic
- ❌ **Loading state**: Se afișează loading doar pe buton, nu pe UI

## 🚨 **PROBLEME CRITICE DE ERROR HANDLING**

### 1. **Rollback Incomplet**
```typescript
// PROBLEMĂ: Rollback doar parțial
onError: (error: string) => {
    console.error("❌ Batch save error, reverting optimistic updates:", error);
    refetchRows(); // ❌ Refresh complet, nu rollback precis
}
```

### 2. **Lipsă Retry Logic**
```typescript
// PROBLEMĂ: Nu încearcă să repete operațiunile eșuate
catch (error) {
    showAlert(error.message, "error");
    // ❌ Nu încearcă să repete
}
```

### 3. **Network Error Handling Insuficient**
```typescript
// PROBLEMĂ: Nu gestionează toate tipurile de erori
catch (error) {
    showAlert(error.message, "error");
    // ❌ Nu verifică dacă e network error, timeout, etc.
}
```

### 4. **State Inconsistency**
```typescript
// PROBLEMĂ: State poate rămâne inconsistent
setRows(optimisticRows); // UI update
// ... API call eșuează ...
// ❌ UI rămâne cu optimistic data
```

## 🔧 **SOLUȚII RECOMANDATE**

### 1. **Implementare Rollback Complet**
```typescript
// SOLUȚIE: Rollback precis pentru fiecare operațiune
const rollbackOptimisticUpdates = useCallback((failedOperations: string[]) => {
    setRows(currentRows => currentRows.map(row => {
        const optimisticCells = row.cells.filter(cell => 
            failedOperations.includes(`${row.id}-${cell.columnId}`)
        );
        if (optimisticCells.length > 0) {
            return {
                ...row,
                cells: row.cells.map(cell => {
                    const failedOp = failedOperations.find(op => 
                        op === `${row.id}-${cell.columnId}`
                    );
                    if (failedOp) {
                        return { ...cell, value: cell.originalValue };
                    }
                    return cell;
                })
            };
        }
        return row;
    }));
}, []);
```

### 2. **Implementare Retry Logic**
```typescript
// SOLUȚIE: Retry cu exponential backoff
const retryWithBackoff = async (operation: () => Promise<any>, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};
```

### 3. **Îmbunătățire Network Error Handling**
```typescript
// SOLUȚIE: Gestionare specifică pentru tipuri de erori
const handleError = (error: any) => {
    if (error.name === 'AbortError') {
        showAlert("Operation was cancelled", "info");
    } else if (error.code === 'NETWORK_ERROR') {
        showAlert("Network error. Please check your connection.", "error");
    } else if (error.status === 429) {
        showAlert("Too many requests. Please try again later.", "warning");
    } else {
        showAlert(error.message || "An unexpected error occurred", "error");
    }
};
```

### 4. **Implementare Optimistic Updates Corecte**
```typescript
// SOLUȚIE: Optimistic updates pentru toate operațiunile
const handleAddRow = async (rowData: Record<string, any>) => {
    // 1. Optimistic update imediat
    const tempRowId = `temp_${Date.now()}`;
    const optimisticRow = {
        id: tempRowId,
        cells: Object.entries(rowData).map(([columnId, value]) => ({
            id: `temp_cell_${Date.now()}`,
            columnId: parseInt(columnId),
            value: value,
            isOptimistic: true
        })),
        isOptimistic: true
    };
    
    setRows(currentRows => [optimisticRow, ...currentRows]);
    
    try {
        // 2. API call în background
        const response = await fetch(`/api/.../rows/batch`, {
            method: "POST",
            body: JSON.stringify({ rows: [{ cells: ... }] })
        });
        
        if (response.ok) {
            const result = await response.json();
            // 3. Replace optimistic cu real
            setRows(currentRows => currentRows.map(row => 
                row.id === tempRowId ? result.rows[0] : row
            ));
        } else {
            throw new Error("Failed to add row");
        }
    } catch (error) {
        // 4. Rollback optimistic update
        setRows(currentRows => currentRows.filter(row => row.id !== tempRowId));
        showAlert(error.message, "error");
    }
};
```

### 5. **Implementare State Consistency**
```typescript
// SOLUȚIE: State consistency cu versioning
interface OptimisticUpdate {
    id: string;
    operation: 'create' | 'update' | 'delete';
    originalData?: any;
    optimisticData: any;
    timestamp: number;
    status: 'pending' | 'success' | 'failed';
}

const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([]);

const applyOptimisticUpdate = (update: OptimisticUpdate) => {
    setOptimisticUpdates(prev => [...prev, update]);
    // Apply to UI
};

const rollbackOptimisticUpdate = (updateId: string) => {
    setOptimisticUpdates(prev => prev.filter(u => u.id !== updateId));
    // Rollback in UI
};
```

## 📋 **PLAN DE IMPLEMENTARE**

### Faza 1: Fix Rollback Mechanisms
1. Implementează rollback precis pentru batch operations
2. Adaugă rollback pentru operațiuni de adăugare rânduri
3. Elimină refresh-uri inutile

### Faza 2: Implementare Retry Logic
1. Adaugă retry cu exponential backoff
2. Implementează request queuing
3. Adaugă timeout handling

### Faza 3: Îmbunătățire Error Handling
1. Implementează error classification
2. Adaugă user-friendly error messages
3. Implementează offline support

### Faza 4: Optimizare Performance
1. Implementează optimistic updates pentru toate operațiunile
2. Adaugă state consistency mechanisms
3. Optimizează re-render-urile
