# TABLE EDITOR ARCHITECTURE ANALYSIS

## ARHITECTURA COMPLETĂ A SISTEMULUI TABLE EDITOR

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                TABLE EDITOR SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   UnifiedTable  │    │   useTableRows  │    │   useBatchCell  │            │
│  │    Editor       │◄──►│      Hook       │◄──►│     Editor      │            │
│  │                 │    │                 │    │      Hook       │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                        │                        │                 │
│           ▼                        ▼                        ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   RowGrid       │    │   Pagination    │    │  PendingChanges │            │
│  │   Component     │    │   Management    │    │   Management    │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────┐                                                          │
│  │  EditableCell   │                                                          │
│  │   Component     │                                                          │
│  └─────────────────┘                                                          │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │ MultipleRef     │    │ AbsoluteDropdown│    │ Input/Switch    │            │
│  │ Select          │    │   Component     │    │ Components      │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              BACKEND API LAYER                                 │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │ /tables/[id]    │    │ /batch          │    │ /rows/[id]      │            │
│  │ /columns        │    │ /rows/batch     │    │ /cell/[id]      │            │
│  │ /rows           │    │                 │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## FLUXUL DE DATE

### 1. CITIREA DATELOR
```
User → UnifiedTableEditor → useTableRows → API → Database → Response → setRows → UI Update
```

### 2. EDITAREA CELULELOR
```
User Double-Click → EditableCell → Local State Update → onSave() → useBatchCellEditor → Pending Changes
```

### 3. SALVAREA BATCH
```
User Click Save → savePendingChanges → API Batch → Database → Success/Error → UI Update/Rollback
```

## COMPONENTE PRINCIPALE

### 1. UnifiedTableEditor (Container Principal)
- **Rol**: Container principal care orchestrează toate operațiunile
- **State Management**: Gestionează rows, columns, pagination, filters
- **Optimistic Updates**: Prin onCellsUpdated callback
- **Error Handling**: Prin onError callback cu rollback

### 2. useTableRows Hook
- **Rol**: Gestionează citirea și filtrarea datelor
- **Features**: Pagination, filtering, sorting, search
- **State**: rows, loading, error, pagination info

### 3. useBatchCellEditor Hook
- **Rol**: Gestionează modificările batch și optimistic updates
- **Features**: Pending changes, batch save, rollback
- **State**: pendingChanges Map, isEditingCell, isSaving

### 4. useRowsTableEditor Hook
- **Rol**: Wrapper pentru useBatchCellEditor cu API compatibil
- **Features**: Bridge între componente și batch editor
- **State**: Delegat către useBatchCellEditor

### 5. EditableCell Component
- **Rol**: Component individual pentru editarea celulelor
- **Features**: Different input types, validation, local state
- **State**: Local value state, editing mode

### 6. RowGrid Component
- **Rol**: Renderizarea rândurilor și celulelor
- **Features**: Selection, deletion, inline editing
- **State**: selectedRows

## PROBLEME IDENTIFICATE

### 1. PROBLEME DE SINCRONIZARE
- **Race Conditions**: Multiple API calls simultane
- **State Conflicts**: Optimistic updates vs server state
- **Pending Changes**: Nu sunt sincronizate întotdeauna corect

### 2. PROBLEME DE ERROR HANDLING
- **Incomplete Rollback**: Unele erori nu fac rollback complet
- **Partial Failures**: Batch operations cu failuri parțiale
- **Network Errors**: Nu sunt gestionate toate scenariile

### 3. PROBLEME DE PERFORMANCE
- **Unnecessary Re-renders**: Multiple useEffect-uri care se declanșează
- **Large Data Sets**: Nu sunt optimizate pentru tabele mari
- **Memory Leaks**: Event listeners nu sunt curățați corect

### 4. PROBLEME DE UX
- **Loading States**: Nu sunt clare pentru utilizator
- **Error Messages**: Nu sunt descriptive
- **Confirmation Dialogs**: Lipsesc pentru operațiuni critice
