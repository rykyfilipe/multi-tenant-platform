# Per-Breakpoint Responsive Layouts System

## 📋 Overview

Implemented a complete **per-breakpoint layouts system** that allows users to configure widget positions and sizes independently for each responsive breakpoint (xxl, xl, lg, md, sm, xs).

## ✨ Features

### 1. **Independent Layout Per Breakpoint**
- Each breakpoint (xxl, xl, lg, md, sm, xs) can have its own widget layout
- When user edits on a specific breakpoint, only that layout is modified
- Seamless restoration of the correct layout when switching viewport sizes

### 2. **Automatic Breakpoint Detection**
- System automatically detects current breakpoint based on container width
- Visual indicator shows which breakpoint is currently being edited
- Color-coded badges for easy identification:
  - `XXL` - Purple (≥1600px, 24 cols)
  - `XL` - Blue (≥1200px, 24 cols)
  - `LG` - Green (≥996px, 24 cols)
  - `MD` - Yellow (≥768px, 24 cols)
  - `SM` - Orange (≥480px, 24 cols)
  - `XS` - Red (<480px, 24 cols)

### 3. **Backwards Compatibility**
- Automatic migration of legacy single-layout widgets
- Zero breaking changes to existing functionality
- Fallback to default position if breakpoint-specific layout doesn't exist

### 4. **Smart Migration**
- On first load, widgets with old format are automatically upgraded
- Creates identical layouts for all breakpoints from the original position
- Migration is local (pending) until user saves
- Toast notification informs user of migration

## 🏗️ Architecture

### Data Structure

#### Legacy Format (Still Supported)
```typescript
{
  x: 0,
  y: 0,
  w: 8,
  h: 6
}
```

#### New Format (Per-Breakpoint)
```typescript
{
  // Default/fallback position
  x: 0,
  y: 0,
  w: 8,
  h: 6,
  
  // Per-breakpoint layouts (optional)
  layouts: {
    xxl: { x: 0, y: 0, w: 12, h: 8 },
    xl: { x: 0, y: 0, w: 10, h: 7 },
    lg: { x: 0, y: 0, w: 8, h: 6 },
    md: { x: 0, y: 0, w: 6, h: 5 },
    sm: { x: 0, y: 0, w: 4, h: 4 },
    xs: { x: 0, y: 0, w: 2, h: 4 }
  }
}
```

### TypeScript Interfaces

```typescript
export interface BreakpointPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ResponsiveLayouts {
  xxl?: BreakpointPosition;
  xl?: BreakpointPosition;
  lg?: BreakpointPosition;
  md?: BreakpointPosition;
  sm?: BreakpointPosition;
  xs?: BreakpointPosition;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  layouts?: ResponsiveLayouts;
}

export type Breakpoint = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
```

## 🔧 Implementation Details

### Files Modified

1. **`src/widgets/domain/entities.ts`**
   - Extended `WidgetPosition` interface with `layouts` field
   - Added `BreakpointPosition`, `ResponsiveLayouts`, and `Breakpoint` types
   - Maintained backwards compatibility

2. **`src/widgets/utils/layoutHelpers.ts`** (NEW)
   - `getPositionForBreakpoint()` - Get position for specific breakpoint with fallback
   - `setPositionForBreakpoint()` - Update position for specific breakpoint
   - `migratePositionToResponsive()` - Migrate legacy positions to new format
   - `detectBreakpoint()` - Detect breakpoint from container width
   - `hasResponsiveLayouts()` - Check if widget has responsive layouts

3. **`src/widgets/ui/WidgetCanvasNew.tsx`**
   - Updated `createLayoutForBreakpoint()` - Creates layout for specific breakpoint
   - Modified `layouts` useMemo - Generates per-breakpoint layouts
   - Enhanced `onLayoutChange` - Saves only active breakpoint changes
   - Updated `onResize` & `onResizeStop` - Per-breakpoint resize handling
   - Added migration effect - Auto-migrates legacy widgets on load
   - Added breakpoint indicator UI - Visual feedback in toolbar

### Key Functions

#### `getPositionForBreakpoint(position, breakpoint)`
```typescript
// Returns position for specific breakpoint, with fallback to default
const pos = getPositionForBreakpoint(widget.position, 'md');
// Returns layouts.md if exists, otherwise { x, y, w, h }
```

#### `setPositionForBreakpoint(position, breakpoint, newPosition)`
```typescript
// Updates position for specific breakpoint
const updated = setPositionForBreakpoint(
  widget.position,
  'lg',
  { x: 0, y: 0, w: 8, h: 6 }
);
// Creates/updates layouts.lg and syncs default x,y,w,h
```

#### `migratePositionToResponsive(position)`
```typescript
// Migrates legacy position to responsive format
const migrated = migratePositionToResponsive(oldPosition);
// Creates layouts object with same position for all breakpoints
```

## 🎨 User Experience

### Editing Flow

1. **User opens dashboard** → System detects current breakpoint (e.g., `lg`)
2. **Visual indicator shows** → Green `LG` badge in toolbar
3. **User drags/resizes widget** → Only `lg` layout is updated
4. **User resizes browser** → System switches to new breakpoint (e.g., `md`)
5. **Indicator updates** → Yellow `MD` badge shown
6. **Previous layout preserved** → `lg` layout unchanged, now editing `md`
7. **User saves** → All breakpoint layouts saved to database

### Migration Experience

1. **User with old widgets opens dashboard**
2. **System detects legacy format** → Auto-migration triggered
3. **Toast notification shown** → "3 widget(s) upgraded to responsive layouts"
4. **Migration is pending** → User must save to persist
5. **User can discard** → Reverts to original layout

## ⚡ Performance

- **No extra API calls** - JSON structure stored in existing `position` field
- **Efficient memoization** - Layouts generated once per widget list change
- **Smart caching** - Widget references cached to prevent re-renders
- **Lazy migration** - Only migrates widgets when needed

## 🔄 Backwards Compatibility

### Guaranteed Compatibility

✅ Widgets without `layouts` field work perfectly (uses x,y,w,h)  
✅ API endpoints unchanged - JSON field handles any structure  
✅ Database schema unchanged - Position is already JSON  
✅ Old dashboards load correctly - Auto-migration on first edit  
✅ Mixed layouts supported - Some widgets new format, some old  

### Fallback Behavior

```typescript
// If layouts.md doesn't exist
getPositionForBreakpoint(position, 'md')
// Returns { x, y, w, h } from default position
```

## 🧪 Testing Checklist

- [x] Load dashboard with legacy widgets → Auto-migration works
- [x] Edit layout on desktop (xxl) → Only xxl layout modified
- [x] Resize to tablet (md) → md layout restored correctly
- [x] Edit on md, switch to lg → Both layouts preserved
- [x] Save changes → All breakpoints persisted to DB
- [x] Reload page → Correct layouts restored for each breakpoint
- [x] Create new widget → Gets default position for all breakpoints
- [x] Duplicate widget → Preserves per-breakpoint layouts
- [x] Undo/Redo → Works with per-breakpoint changes
- [x] Discard changes → Reverts all breakpoint modifications

## 📊 Benefits

### For Users
- **Pixel-perfect layouts** across all devices
- **No more distorted widgets** when resizing browser
- **Full control** over each breakpoint independently
- **Visual feedback** shows which breakpoint is being edited

### For Developers
- **Clean architecture** with helper functions
- **Type-safe** with full TypeScript support
- **Zero breaking changes** - existing code works unchanged
- **Easy to extend** - add new breakpoints if needed

## 🚀 Future Enhancements

Potential improvements for future iterations:

1. **Copy Layout Between Breakpoints**
   - Button to copy current layout to another breakpoint
   - "Apply to all" option for uniform layouts

2. **Breakpoint Preview**
   - Switch breakpoints without resizing browser
   - Side-by-side preview of multiple breakpoints

3. **Smart Scaling**
   - Auto-scale widgets proportionally when copying between breakpoints
   - Maintain aspect ratios across different grid sizes

4. **Layout Templates**
   - Save layout configurations as templates
   - Quick-apply template to specific breakpoint

5. **Bulk Operations**
   - Edit multiple widgets at once
   - Apply transformations to all widgets on a breakpoint

## 📝 Migration Guide

### For Existing Dashboards

No action required! The system handles migration automatically:

1. Open dashboard with old widgets
2. System detects legacy format
3. Auto-migration creates responsive layouts
4. Toast notification appears
5. Save to persist changes

### Manual Migration (if needed)

```typescript
import { migratePositionToResponsive } from '@/widgets/utils/layoutHelpers';

// Migrate a single widget
const newPosition = migratePositionToResponsive(widget.position);
updateWidget({ ...widget, position: newPosition });
```

## 🎯 Success Metrics

- ✅ All 24 columns preserved across breakpoints
- ✅ No distortion when resizing browser
- ✅ Smooth transition between breakpoints
- ✅ No performance degradation
- ✅ 100% backwards compatible
- ✅ Zero breaking changes

## 🏁 Conclusion

The per-breakpoint responsive layouts system provides users with complete control over widget positioning across all device sizes while maintaining perfect backwards compatibility with existing dashboards. The implementation is clean, performant, and extensible for future enhancements.

