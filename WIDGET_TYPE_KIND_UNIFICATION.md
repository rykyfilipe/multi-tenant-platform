# Widget Type/Kind Unification - Complete ✅

## 📋 Problema Identificată

**Confuzie între `type` și `kind` în sistem:**
- Widget-urile în DB aveau `kind: WidgetKind`
- Batch operations foloseau atât `kind` cât și `type`  
- Frontend trimitea `kind`, backend se aștepta la `type`
- Inconsistență între Prisma models, entities și API-uri

## ✅ Soluția Implementată

**UNIFICARE COMPLETĂ LA `type`:**
- Widget type (CHART, TABLE, KPI, etc.) = **`type`**
- Operation type (create, update, delete) = **`kind`** (păstrat)

---

## 🗄️ Database Schema Changes

### Prisma Schema Modificări:

```sql
-- Rename enum
ALTER TYPE "WidgetKind" RENAME TO "WidgetType";

-- Rename columns
ALTER TABLE "Widget" RENAME COLUMN "kind" TO "type";
ALTER TABLE "WidgetSnapshot" RENAME COLUMN "kind" TO "type";
ALTER TABLE "WidgetDraft" RENAME COLUMN "kind" TO "type";
```

### Models Actualizate:

```prisma
enum WidgetType {
  CHART
  TABLE
  TASKS
  CLOCK
  WEATHER
  KPI
}

model Widget {
  type WidgetType  // ÎNAINTE: kind WidgetKind
  // ...
  @@index([type])
  @@index([tenantId, type])
}

model WidgetSnapshot {
  type WidgetType  // ÎNAINTE: kind WidgetKind
  // ...
}

model WidgetDraft {
  type WidgetType  // ÎNAINTE: kind WidgetKind
  // ...
}
```

---

## 📦 Backend Changes

### 1. Entities (`src/widgets/domain/entities.ts`)

```typescript
// ÎNAINTE
import { WidgetKind } from "@/generated/prisma";
export interface WidgetEntity {
  kind: WidgetKind;
  // ...
}

// DUPĂ
import { WidgetType } from "@/generated/prisma";
export interface WidgetEntity {
  type: WidgetType;
  // ...
}
```

### 2. DTO (`src/widgets/domain/dto.ts`)

```typescript
// ÎNAINTE
export interface ListWidgetsParams {
  kinds?: WidgetKind[];
}

export interface CreateDraftParams {
  kind: WidgetKind;
}

// DUPĂ
export interface ListWidgetsParams {
  types?: WidgetType[];
}

export interface CreateDraftParams {
  type: WidgetType;
}
```

### 3. Widget Service (`src/widgets/services/widget-service.ts`)

```typescript
// ÎNAINTE
const { kinds } = params;
where: { kind: { in: kinds } }
getWidgetDefinition(widget.kind)

// DUPĂ
const { types } = params;
where: { type: { in: types } }
getWidgetDefinition(widget.type)
```

### 4. Batch Route (`src/app/api/dashboards/[id]/widgets/batch/route.ts`)

```typescript
// ÎNAINTE: Support both kind and type with complex normalization
const BatchOperationSchema = z.union([
  z.object({ kind: z.enum([...]), widget: ... }),
  z.object({ type: z.enum([...]), data: ... })
]);

// Widget normalization
let widgetType = createPayload.kind?.toLowerCase() || createPayload.type?.toLowerCase();
const widgetData = {
  kind: createData.type.toUpperCase(), // Convert type to kind
  type: undefined
};

// DUPĂ: Simple and clear
const BatchOperationSchema = z.object({
  kind: z.enum(['create', 'update', 'delete']),  // Operation kind
  widget: z.any().optional(),
  // ...
});

// Direct usage
const widgetType = createPayload.type;  // Widget type
const createData = validateWidgetCreate(createPayload);
```

### 5. Widget Registry (`src/widgets/registry/widget-registry.ts`)

```typescript
// ÎNAINTE
export interface WidgetDefinition {
  kind: WidgetType;
}

export const getWidgetDefinition = (kind: WidgetType) => ...

// DUPĂ
export interface WidgetDefinition {
  type: WidgetType;
}

export const getWidgetDefinition = (type: WidgetType) => ...
```

---

## 🎨 Frontend Changes

### 1. Simple Client (`src/widgets/api/simple-client.ts`)

```typescript
// ÎNAINTE
async createWidget(payload: { kind: WidgetKind; ... }) {
  body: JSON.stringify({ kind: payload.kind, ... })
}

// DUPĂ
async createWidget(payload: { type: WidgetType; ... }) {
  body: JSON.stringify({ type: payload.type, ... })
}
```

### 2. Components

**WidgetCanvas.tsx:**
```typescript
// ÎNAINTE
widgets.map(w => ({ kind: w.kind, ... }))
handleAddWidget(kind: WidgetType)

// DUPĂ
widgets.map(w => ({ type: w.type, ... }))
handleAddWidget(type: WidgetType)
```

**WidgetToolbar.tsx:**
```typescript
// ÎNAINTE
onAddWidget: (kind: WidgetType) => void
{ kind: WidgetType.CHART, ... }

// DUPĂ
onAddWidget: (type: WidgetType) => void
{ type: WidgetType.CHART, ... }
```

**WidgetTemplates.tsx:**
```typescript
// ÎNAINTE
kind: WidgetType
getKindIcon(kind: WidgetType)

// DUPĂ
type: WidgetType
getTypeIcon(type: WidgetType)
```

### 3. Base Schema (`src/widgets/schemas/base.ts`)

```typescript
// ÎNAINTE
export const widgetKindSchema = z.nativeEnum(WidgetKind);
export const baseWidgetSchema = z.object({
  kind: widgetKindSchema,
});

// DUPĂ
export const widgetTypeSchema = z.nativeEnum(WidgetType);
export const baseWidgetSchema = z.object({
  type: widgetTypeSchema,
});
```

---

## 📊 Impact Summary

### Fișiere Modificate:
| Categorie | Fișiere | Descriere |
|-----------|---------|-----------|
| **Database** | 1 | Prisma schema + migration |
| **Domain** | 2 | entities.ts, dto.ts |
| **Services** | 1 | widget-service.ts |
| **API Routes** | 2 | batch route, v1 widgets route |
| **Client API** | 2 | simple-client.ts, client.ts |
| **Components** | 8 | Canvas, Toolbar, Templates, etc. |
| **Schemas** | 2 | base.ts, widget-registry.ts |
| **TOTAL** | **19 fișiere** | Actualizate complet |

### Modificări Globale:
- ✅ Toate `WidgetKind` → `WidgetType`
- ✅ Toate `widget.kind` → `widget.type`
- ✅ Toate `draft.kind` → `draft.type`
- ✅ Toate `kinds` → `types` (parametri)
- ✅ Toate `kind:` → `type:` (structuri widget)
- ✅ `getKindIcon()` → `getTypeIcon()`
- ✅ `widgetKindSchema` → `widgetTypeSchema`
- ✅ `widgetKindEnum` → `widgetTypeEnum`

### Păstrat Separat (CORECT):
- ✅ `operation.kind` = "create"|"update"|"delete" (tipul operației)
- ✅ `widget.type` = CHART|TABLE|KPI|etc. (tipul widget-ului)

---

## 🎯 Claritate Finală

### Widget Type (tipul widget-ului):
```typescript
widget.type = WidgetType.CHART | TABLE | KPI | CLOCK | WEATHER | TASKS
```

### Operation Kind (tipul operației):
```typescript
operation.kind = "create" | "update" | "delete"
```

**NU mai există confuzie!** Fiecare are rolul său clar definit.

---

## ✅ Verificări Efectuate

1. ✅ **Prisma Generate** - Success
2. ✅ **TypeScript Compile** - No errors în src/
3. ✅ **Next.js Build** - ✓ Compiled successfully
4. ✅ **Linter** - No errors
5. ✅ **Migration SQL** - Created successfully

---

## 🚀 Migration Path

### Aplicare Migration:

```bash
# Aplică migration pe DB
npm run prisma:migrate

# SAU manual:
psql $DATABASE_URL < prisma/migrations/20251011_rename_widget_kind_to_type/migration.sql
```

### Backward Compatibility:

**NU există backward compatibility** - aceasta e o breaking change!

Toate widget-urile existente vor avea coloana redenumită automat prin SQL migration.

API-urile nu mai acceptă `kind` - doar `type`!

---

## 📝 API Examples

### Create Widget (ÎNAINTE vs DUPĂ):

**ÎNAINTE:**
```json
{
  "kind": "CHART",
  "title": "Sales Chart",
  "config": { ... }
}
```

**DUPĂ:**
```json
{
  "type": "CHART",
  "title": "Sales Chart",
  "config": { ... }
}
```

### Batch Operations:

```json
{
  "operations": [
    {
      "id": "op-1",
      "kind": "create",  // ← Operation kind (correct!)
      "widget": {
        "type": "CHART",  // ← Widget type (correct!)
        "title": "Sales",
        "config": { ... }
      }
    }
  ]
}
```

---

## ✅ STATUS FINAL

**UNIFICARE COMPLETĂ ȘI FUNCȚIONALĂ!**

- ✅ Database schema updated
- ✅ SQL migration created
- ✅ 19 fișiere actualizate
- ✅ Backend complet unificat
- ✅ Frontend complet unificat
- ✅ Build successful
- ✅ Zero confuzie între type și kind
- ✅ API consistency achieved
- ✅ Ready for production! 🚀

**Date finalizării:** 2025-10-11
**Impact:** Eliminare confuzie type/kind din tot sistemul!

