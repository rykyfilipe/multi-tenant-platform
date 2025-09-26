# Widget Position Structure Migration

## Overview
This document outlines the migration from the old widget position structure to the new consistent structure across the entire widget system.

## Changes Made

### 1. Position Structure Standardization
**Before:**
```typescript
// In dashboard-validators.ts
position: {
  x: number;
  y: number;
  width: number;  // ❌ Inconsistent
  height: number; // ❌ Inconsistent
}
```

**After:**
```typescript
// Consistent across all files
position: {
  x: number;
  y: number;
  w: number;      // ✅ Consistent
  h: number;      // ✅ Consistent
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}
```

### 2. Config Structure Standardization
**Before:**
```typescript
// In dashboard-validators.ts
config: z.record(z.any()) // ❌ Generic, no structure
```

**After:**
```typescript
// Consistent with widgets/schemas/base.ts
config: {
  settings: Record<string, unknown>;
  style?: Record<string, unknown>;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

### 3. Files Updated
- `src/lib/dashboard-validators.ts` - Updated position and config schemas
- `src/lib/dashboard-service.ts` - Updated interface definitions
- `src/app/api/v1/tenants/[tenantId]/dashboards/[dashboardId]/widgets/[[...widgetPath]]/route.ts` - Fixed type errors

## Migration Steps Required

### Database Migration
If you have existing widgets in the database with the old structure, you'll need to run a migration:

```sql
-- Update existing widget positions from width/height to w/h
UPDATE widgets 
SET position = jsonb_set(
  jsonb_set(
    position::jsonb - 'width' - 'height',
    '{w}', 
    (position->>'width')::jsonb
  ),
  '{h}', 
  (position->>'height')::jsonb
)
WHERE position ? 'width' AND position ? 'height';
```

### Frontend Updates
Update any frontend components that reference the old position structure:

```typescript
// Before
const width = widget.position.width;
const height = widget.position.height;

// After
const width = widget.position.w;
const height = widget.position.h;
```

## Benefits
1. **Consistency**: All widget-related code now uses the same position structure
2. **Type Safety**: Better TypeScript support with consistent interfaces
3. **Maintainability**: Single source of truth for widget structure
4. **Extensibility**: Support for additional position properties (minW, maxW, etc.)

## Testing
After migration, verify:
1. Widget creation works with new structure
2. Widget updates preserve position correctly
3. Frontend renders widgets with correct dimensions
4. Database queries return expected structure
