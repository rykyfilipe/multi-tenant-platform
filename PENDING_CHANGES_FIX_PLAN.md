# Pending Changes & Undo/Redo Fix Plan

## Problems Identified

### 1. Non-Optimistic Updates ❌
- After save, `loadWidgets()` is called which:
  - Fetches ALL widgets from server
  - Calls `clearPending()` which wipes local state
  - Replaces everything, causing full re-render
  - **SOLUTION**: Already fixed in `savePending` - uses optimistic updates, just sync IDs/versions

### 2. Undo/Redo Performance Issues ❌
- UndoRedo saves ENTIRE widget state on EVERY change (useEffect at line 100)
- Deep clones all widgets with `JSON.parse(JSON.stringify(widgets))`
- Creates massive history array
- **SOLUTION**: Debounce auto-save, use smaller snapshots

### 3. Undo/Redo Restore Not Working ❌
Current flow:
```tsx
handleRestoreState -> upsertWidget/deleteLocal -> updates widgets record
```

Problem: `upsertWidget` only updates `widgets`, not `originalWidgets`
- When comparing changes, store compares against `originalWidgets`
- After undo/redo, `originalWidgets` is stale
- Changes are not detected correctly

### 4. Store State Management Issues ❌
- `upsertWidget` doesn't update `originalWidgets` 
- `updateLocal` compares against `originalWidgets` but undo/redo doesn't sync it
- Inconsistent state between `widgets` and `originalWidgets`

## Fix Strategy

### Phase 1: Fix Optimistic Updates (ALREADY WORKING ✅)
The `savePending` function in `simple-client.ts` (lines 276-366) already does optimistic updates:
1. Updates widget IDs from temp to real
2. Updates versions
3. Only calls `clearPendingOperations()` (not `clearPending()`)
4. No reload of widgets

**Issue**: Something else might be calling `loadWidgets()` - need to verify

### Phase 2: Fix Undo/Redo System
**Option A: Use Store's Built-in History (RECOMMENDED)**
- Store already has `history` and `redoHistory` per widget
- Use `undoLastChange` and `redoLastChange` from store
- Remove duplicate UndoRedo component logic
- More efficient, already tracks changes correctly

**Option B: Fix Current UndoRedo Component**
- Debounce auto-save (300ms)
- Store only changed widget IDs, not entire state
- Fix restore to update `originalWidgets`
- Add proper state reconciliation

### Phase 3: Fix Store State Consistency
1. When using undo/redo, update both `widgets` AND `originalWidgets`
2. OR: Use store's built-in history which already handles this
3. Ensure pending operations track correctly after undo/redo

## Recommended Solution

### Use Store's Built-in History System
The store already has perfect history tracking:

```typescript
// In store
history: Record<number, WidgetEntity[]>  // Per-widget history
redoHistory: Record<number, WidgetEntity[]>
undoLastChange(widgetId: number): boolean
redoLastChange(widgetId: number): boolean
```

Benefits:
- Per-widget history (efficient)
- Already integrated with pending operations
- Handles `originalWidgets` correctly
- No JSON deep cloning on every change
- Smaller memory footprint

### New UndoRedo Component
- Global undo: iterate through modified widgets, undo each
- Global redo: iterate through modified widgets, redo each
- Track global history index
- Use store's per-widget undo/redo functions

## Implementation Plan

1. ✅ Verify optimistic updates work (already implemented)
2. 🔧 Create new UndoRedo component using store history
3. 🔧 Add global undo/redo coordination
4. 🔧 Remove auto-save on every change
5. 🔧 Add visual feedback for pending changes
6. 🧪 Test save → undo → redo → save flow

## Testing Checklist

- [ ] Edit widget → Save → Verify no reload
- [ ] Edit widget → Undo → Verify widget restored
- [ ] Edit widget → Undo → Redo → Verify widget back to edited state  
- [ ] Edit widget → Undo → Edit again → Verify redo history cleared
- [ ] Create widget → Undo → Verify widget removed
- [ ] Delete widget → Undo → Verify widget restored
- [ ] Edit multiple widgets → Undo all → Verify all restored
- [ ] Save pending → Verify temp IDs converted to real IDs
- [ ] Save pending → Verify no dashboard reload

