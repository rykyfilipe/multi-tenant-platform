# 🧪 MANUAL TESTING GUIDE - Column Reordering

**Purpose**: Verify column reordering works correctly with state sync  
**Date**: October 7, 2025

---

## 🎯 WHAT TO TEST

### ✅ Feature: Drag-and-Drop Column Reordering

**Where**: Table Editor → Schema Mode  
**URL**: `/home/database/table/[tableId]/edit`

---

## 📋 TEST STEPS

### **Test 1: Basic Reordering** ⭐

1. **Setup:**
   - Navigate to any table edit page
   - Click "Schema" mode toggle
   - Verify you have at least 3 columns

2. **Execute Drag:**
   - Hover over first column
   - Grab handle appears (≡ icon)
   - Click and drag to third position
   - Release mouse

3. **Verify:**
   - ✅ Column moves to new position instantly
   - ✅ Other columns shift accordingly
   - ✅ Success notification appears
   - ✅ Console shows: `🔄 Reordering columns: { fromIndex: 0, toIndex: 2 }`

4. **Check State:**
   - Open React DevTools
   - Find `TableEditorRedesigned` component
   - Verify `columns` state has new order
   - Verify `order` field: 1, 2, 3, ... (sequential)

5. **Verify Persistence:**
   - Refresh page (F5)
   - ✅ New column order persists
   - ✅ Columns appear in dragged order

---

### **Test 2: Multiple Reorders**

1. Drag column from position 0 to 2
2. Wait for success notification
3. Drag another column from position 1 to 3
4. **Verify:**
   - ✅ Both operations succeed
   - ✅ Final order is correct
   - ✅ No state conflicts

---

### **Test 3: Context Synchronization**

1. **Before Drag:**
   - Open React DevTools
   - Note current `columns` array

2. **Drag Column:**
   - Move first column to last position

3. **Verify:**
   - ✅ `SchemaMode.localColumns` updates
   - ✅ `TableEditorRedesigned.columns` updates
   - ✅ Parent `useTable.columns` updates
   - ✅ All states synchronized

4. **Switch to Data Mode:**
   - Click "Data" toggle
   - ✅ Column order in DataMode matches Schema Mode
   - ✅ Grid headers show new order

---

### **Test 4: Error Handling**

1. **Simulate Network Error:**
   - Open DevTools → Network tab
   - Set throttling to "Offline"
   
2. **Drag Column:**
   - Move column to new position
   
3. **Verify:**
   - ✅ Error notification: "Failed to save column order. Changes reverted."
   - ✅ Column returns to original position
   - ✅ State rollback successful

---

### **Test 5: API Calls Verification**

1. **Open Network Tab** (DevTools)

2. **Drag Column:**
   - Move from position 1 to position 3

3. **Check Network:**
   - Look for `PATCH .../columns/batch-update`
   - OR
   - Multiple `PATCH .../columns/{id}` (if batch not available)

4. **Verify Request:**
   ```json
   // Batch request body:
   {
     "updates": [
       { "id": 1, "order": 1 },
       { "id": 2, "order": 2 },
       { "id": 3, "order": 3 }
     ]
   }
   
   // OR Individual requests:
   { "order": 1 }
   { "order": 2 }
   { "order": 3 }
   ```

5. **Verify Response:**
   - Status: 200 OK
   - OR
   - Status: 404 (batch endpoint) → fallback to individual

---

### **Test 6: Console Logs Verification**

**Expected Console Output:**
```javascript
🔄 Reordering columns: { fromIndex: 0, toIndex: 2 }
// ... API call logs
✅ Column order saved successfully!
```

**Check for:**
- ✅ No errors in console
- ✅ No React warnings
- ✅ State update logs (if debugging enabled)

---

## 🎨 VISUAL VERIFICATION

### During Drag:
- ✅ Column becomes semi-transparent (opacity: 0.5)
- ✅ Shadow appears (z-50 shadow-2xl)
- ✅ Ring effect (ring-4 ring-primary/30)
- ✅ Cursor changes to grabbing
- ✅ Other columns shift to make space

### After Drop:
- ✅ Column returns to full opacity
- ✅ Shadow disappears
- ✅ New position maintained
- ✅ Success toast appears

---

## 🔍 DEBUGGING CHECKLIST

### If Drag Doesn't Work:

**Check 1: Permission**
```typescript
// In console:
// Should show drag handle only if canEdit is true
```

**Check 2: DndContext**
```typescript
// React DevTools → Components
// Find DndContext → verify sensors are active
```

**Check 3: SortableContext**
```typescript
// Verify items array matches column IDs
items: ["1", "2", "3", ...]
```

**Check 4: useSortable Hook**
```typescript
// Each ColumnListItem should have useSortable
// Check attributes and listeners are applied to drag handle
```

### If State Doesn't Update:

**Check 1: Parent Callback**
```typescript
// Verify onReorderColumns is passed to SchemaMode
<SchemaMode onReorderColumns={handleReorderColumns} />
```

**Check 2: setColumns Called**
```typescript
// In handleReorderColumns, verify:
setColumns(columnsWithNewOrder);  // Should be called
```

**Check 3: Props Update**
```typescript
// useEffect in SchemaMode should sync:
useEffect(() => {
  setLocalColumns(columns);
}, [columns]);
```

---

## 📊 SUCCESS CRITERIA

### ✅ All Must Pass:

1. Drag moves column visually
2. Local state (`localColumns`) updates
3. Global state (`columns`) updates
4. Context updates (verified by Data Mode showing new order)
5. API call succeeds
6. Refresh page shows new order
7. No console errors
8. Success notification shown
9. Rollback works on error
10. Permission check prevents unauthorized reorder

---

## 🚀 QUICK START TESTING

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to
http://localhost:3000/home/database/table/3/edit

# 3. Click "Schema" mode

# 4. Drag any column

# 5. Check console for:
✅ "🔄 Reordering columns"
✅ "Columns reordered!"
✅ "Column order saved successfully!"

# 6. Refresh page - order should persist
```

---

**Ready to Test!** 🎉  
Follow the steps above to verify everything works correctly.

