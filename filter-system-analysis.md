# 🔍 Analiza Completă a Sistemului de Filtre Products

## 📋 Executive Summary

Acest document prezintă analiza completă a sistemului de filtre custom pentru tabela Products, identificând bug-uri, mapând operatorii și propunând soluții.

---

## 🏗️ Arhitectura Sistemului

### Fluxul Complet: Frontend → Backend → Database

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  1. FilterItem.tsx                                               │
│     - Construiește fiecare filtru individual                    │
│     - Tipuri de input: text, number, boolean, date,reference    │
│  2. FilterPanel.tsx                                              │
│     - Gestionează lista de filtre                               │
│     - Validare locală: validateFilters()                        │
│  3. TableFilters.tsx                                             │
│     - applyFilters() - linia 141-165                            │
│     - Filtrează: validFilters = filters.filter(...)            │
│     - Trimite: onApplyFilters(validFilters, globalSearch)       │
│  4. TableEditorRedesigned.tsx                                    │
│     - Construiește URL-ul: ?filters=...&search=...              │
│     - Encoding: JSON.stringify(filters) [fără encodeURIComponent]│
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                        TRANSPORT LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  HTTP GET Request:                                               │
│  /api/tenants/{tid}/databases/{did}/tables/{tid}/rows?filters=..│
│                                                                   │
│  Query Param "filters": JSON string (URL encoded by browser)    │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  1. route.ts - GET handler (linia 565-956)                      │
│     a. Primește query param "filters" (linia 605)               │
│     b. QueryParamsSchema.parse() (linia 614)                    │
│        - decodeURIComponent(val) - linia 98                     │
│        - JSON.parse(decoded) - linia 104                        │
│        - z.array(FilterSchema).parse(parsed) - linia 106        │
│                                                                   │
│  2. FilterValidator.validateFilters() (linia 717)                │
│     Fișier: src/lib/filter-validator.ts                         │
│     - Validează tipurile coloanelor                             │
│     - Verifică compatibilitatea operatorilor                    │
│     - Convertește valorile (via ValueCoercion)                  │
│                                                                   │
│  3. SecureFilterBuilder.buildWhereClause() (linia 760-762)      │
│     Fișier: src/lib/secure-filter-builder.ts                    │
│     - buildColumnFilterCondition() pentru fiecare filtru        │
│     - buildTextCondition() pentru text/string/email/url         │
│     - buildNumericCondition() pentru number/integer/decimal     │
│     - buildBooleanCondition() pentru boolean                    │
│     - buildDateCondition() pentru date/datetime/time            │
│     - buildReferenceCondition() pentru reference                │
│     - buildCustomArrayCondition() pentru customArray            │
│                                                                   │
│  4. Prisma Query Execution (linia 853-876)                       │
│     - prisma.row.count({ where: whereClause })                  │
│     - prisma.row.findMany({ where, skip, take, orderBy })       │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Prisma generates SQL based on whereClause:                      │
│  - AND/OR combinations                                           │
│  - Nested cell filtering                                         │
│  - Type-specific comparisons                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐛 Bug-uri Identificate

### 1. **Frontend: Tipuri de Date Inconsistente**

**Locație:** `TableFilters.tsx` (liniile 276-529)

**Problema:**
- Input-urile de tip `number` returnează **string-uri** (linia 349: `value={String(filter.value || "")}`)
- Input-urile de tip `boolean` sunt convertite corespunzător (linia 360: `value === "true"`)
- Input-urile de tip `date` returnează **ISO strings** (linia 398: `date?.toISOString()`)

**Impact:**
```javascript
// Ce trimite frontend-ul:
{
  columnType: "number",
  operator: "greater_than",
  value: "100"  // ❌ STRING, nu NUMBER!
}
```

**Soluție:**
```typescript
// În TableFilters.tsx, linia ~346-353
// ÎNAINTE:
<Input
  type='number'
  value={String(filter.value || "")}
  onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
/>

// DUPĂ:
<Input
  type='number'
  value={String(filter.value || "")}
  onChange={(e) => updateFilter(filter.id, "value", parseFloat(e.target.value) || null)}
/>
```

---

### 2. **Frontend: Encoding Inconsistent**

**Locație:** `TableEditorRedesigned.tsx` (probabil linia ~619)

**Problema:**
În `BaseChartWidget.tsx` (linia 59) se face:
```typescript
params.set('filters', encodeURIComponent(JSON.stringify(filters)));
```

Dar în alte locuri se face doar:
```typescript
queryParams.append("filters", JSON.stringify(filters));
```

Browser-ul face auto-encoding, dar poate cauza probleme cu caractere speciale.

**Soluție:**
Standardizare: **întotdeauna** folosește `encodeURIComponent(JSON.stringify(...))` explicit.

---

### 3. **Backend: Operator Mapping Incomplet pentru Numeric Fields**

**Locație:** `secure-filter-builder.ts` (liniile 313-378)

**Problema:**
Pentru filtre numerice, backend-ul folosește o logică OR complexă:
```typescript
return {
  OR: [
    // Try numberValue field
    {
      AND: [
        { numberValue: { not: null } },
        this.buildSimpleNumericCondition('numberValue', operator, numericValue)
      ]
    },
    // Fallback to JSON value field
    {
      AND: [
        { numberValue: null },
        { value: { not: null } },
        this.buildJsonNumericCondition(operator, numericValue)
      ]
    }
  ]
};
```

Problema: **Compararea numerică în JSON (liniile 359-378) folosește comparare de string-uri**, care nu funcționează corect:
```sql
-- Compararea "9" > "100" este TRUE în string comparison!
value::text > '100'  -- ❌ GREȘIT
```

**Soluție:**
```typescript
private buildJsonNumericCondition(operator: string, numericValue: number): any {
  // ÎNAINTE: comparație string
  return { value: { gt: numericValue.toString() } };  // ❌
  
  // DUPĂ: cast la numeric
  return { value: { path: [], cast: 'numeric', gt: numericValue } };  // ✅
  
  // SAU: folosește raw SQL pentru comparație numerică
}
```

---

### 4. **Backend: Operators pentru Text - Case Sensitivity Issues**

**Locație:** `secure-filter-builder.ts` (liniile 289-310)

**Problema:**
- `contains`, `not_contains`, `starts_with`, `ends_with` folosesc `mode: 'insensitive'` ✅
- DAR `equals` și `not_equals` **NU** folosesc mode insensitive:
```typescript
case 'equals':
  return { stringValue: { equals: value } };  // ❌ Case sensitive
```

**Soluție:**
```typescript
case 'equals':
  return { stringValue: { equals: value, mode: 'insensitive' } };  // ✅
case 'not_equals':
  return { stringValue: { not: { equals: value, mode: 'insensitive' } } };  // ✅
```

---

### 5. **Backend: Boolean Comparison Logic Error**

**Locație:** `secure-filter-builder.ts` (liniile 384-406)

**Problema:**
```typescript
{ booleanValue: { [operator === 'equals' ? 'equals' : 'not']: booleanValue } }
```

Pentru `not_equals`, folosește operatorul `not` care nu există în Prisma. Ar trebui:
```typescript
{ booleanValue: { not: { equals: booleanValue } } }
```

**Soluție:**
```typescript
private buildBooleanCondition(operator: string, value: any): any {
  const booleanValue = Boolean(value);

  switch (operator) {
    case 'equals':
      return {
        OR: [
          { AND: [{ booleanValue: { not: null } }, { booleanValue: { equals: booleanValue } }] },
          { AND: [{ booleanValue: null }, { value: { not: null } }, { value: { equals: booleanValue.toString() } }] }
        ]
      };
    case 'not_equals':
      return {
        OR: [
          { AND: [{ booleanValue: { not: null } }, { booleanValue: { not: { equals: booleanValue } } }] },  // ✅ FIX
          { AND: [{ booleanValue: null }, { value: { not: null } }, { value: { not: { equals: booleanValue.toString() } } }] }
        ]
      };
    default:
      return null;
  }
}
```

---

### 6. **Validare: secondValue lipsă pentru range operators**

**Locație:** `route.ts` (liniile 69-84) și `filter-validator.ts` (liniile 68-72)

**Status:** ✅ **Deja implementat corect**

Validarea pentru `between` și `not_between` verifică că `secondValue` există.

---

## 📊 Mapping Complet Operatori: Frontend ↔ Backend ↔ SQL

### Text / String / Email / URL

| Operator UI    | Frontend Type | Backend Operator | Prisma Condition                                          | SQL Generated (PostgreSQL)                                  | Status |
|----------------|---------------|------------------|-----------------------------------------------------------|-------------------------------------------------------------|--------|
| `contains`     | string        | contains         | `{ stringValue: { contains: val, mode: 'insensitive' } }` | `"stringValue" ILIKE '%val%'`                               | ✅ OK  |
| `not_contains` | string        | not_contains     | `{ stringValue: { not: { contains, mode: 'insensitive' } } }` | `"stringValue" NOT ILIKE '%val%'`                           | ✅ OK  |
| `equals`       | string        | equals           | `{ stringValue: { equals: val } }`                        | `"stringValue" = 'val'` (case sensitive)                    | ⚠️ FIX |
| `not_equals`   | string        | not_equals       | `{ stringValue: { not: { equals: val } } }`               | `"stringValue" != 'val'` (case sensitive)                   | ⚠️ FIX |
| `starts_with`  | string        | starts_with      | `{ stringValue: { startsWith: val, mode: 'insensitive' } }` | `"stringValue" ILIKE 'val%'`                                | ✅ OK  |
| `ends_with`    | string        | ends_with        | `{ stringValue: { endsWith: val, mode: 'insensitive' } }` | `"stringValue" ILIKE '%val'`                                | ✅ OK  |
| `regex`        | string        | regex            | `{ stringValue: { contains: val, mode: 'insensitive' } }` | `"stringValue" ILIKE '%val%'` (approximation)               | ⚠️ LIMITED |
| `is_empty`     | -             | is_empty         | `{ OR: [{ stringValue: null }, ...] }`                    | `"stringValue" IS NULL OR ...`                              | ✅ OK  |
| `is_not_empty` | -             | is_not_empty     | `{ AND: [{ stringValue: { not: null } }, ...] }`          | `"stringValue" IS NOT NULL AND ...`                         | ✅ OK  |

### Number / Integer / Decimal

| Operator UI             | Frontend Type | Backend Operator         | Prisma Condition (numberValue)            | SQL Generated                            | Status        |
|-------------------------|---------------|--------------------------|-------------------------------------------|------------------------------------------|---------------|
| `equals`                | number        | equals                   | `{ numberValue: { equals: num } }`        | `"numberValue" = 100`                    | ⚠️ FIX TYPE   |
| `not_equals`            | number        | not_equals               | `{ numberValue: { not: { equals: num } } }` | `"numberValue" != 100`                   | ⚠️ FIX TYPE   |
| `greater_than`          | number        | greater_than             | `{ numberValue: { gt: num } }`            | `"numberValue" > 100`                    | ⚠️ FIX TYPE   |
| `greater_than_or_equal` | number        | greater_than_or_equal    | `{ numberValue: { gte: num } }`           | `"numberValue" >= 100`                   | ⚠️ FIX TYPE   |
| `less_than`             | number        | less_than                | `{ numberValue: { lt: num } }`            | `"numberValue" < 100`                    | ⚠️ FIX TYPE   |
| `less_than_or_equal`    | number        | less_than_or_equal       | `{ numberValue: { lte: num } }`           | `"numberValue" <= 100`                   | ⚠️ FIX TYPE   |
| `between`               | number        | between                  | `{ numberValue: { gte: v1, lte: v2 } }`   | `"numberValue" BETWEEN 10 AND 100`       | ⚠️ FIX TYPE   |
| `not_between`           | number        | not_between              | `{ OR: [{ lt: v1 }, { gt: v2 }] }`        | `("numberValue" < 10 OR "numberValue" > 100)` | ⚠️ FIX TYPE   |

**Nota:** FIX TYPE înseamnă că frontend-ul trimite string în loc de number.

### Boolean

| Operator UI    | Frontend Type | Backend Operator | Prisma Condition                          | SQL Generated                | Status      |
|----------------|---------------|------------------|-------------------------------------------|------------------------------|-------------|
| `equals`       | boolean       | equals           | `{ booleanValue: { equals: bool } }`      | `"booleanValue" = TRUE`      | ✅ OK       |
| `not_equals`   | boolean       | not_equals       | `{ booleanValue: { not: { equals } } }`   | `"booleanValue" != TRUE`     | ⚠️ FIX OPERATOR |

### Date / DateTime / Time

| Operator UI    | Frontend Type | Backend Operator | Prisma Condition                                    | SQL Generated                                | Status |
|----------------|---------------|------------------|-----------------------------------------------------|----------------------------------------------|--------|
| `equals`       | ISO string    | equals           | `{ dateValue: { gte: startOfDay, lte: endOfDay } }` | `"dateValue" >= '2025-01-01' AND <= '2025-01-02'` | ✅ OK  |
| `not_equals`   | ISO string    | not_equals       | `{ OR: [{ lt: start }, { gt: end }] }`              | `("dateValue" < '2025-01-01' OR > '2025-01-02')` | ✅ OK  |
| `before`       | ISO string    | before           | `{ dateValue: { lt: date } }`                       | `"dateValue" < '2025-01-01'`                 | ✅ OK  |
| `after`        | ISO string    | after            | `{ dateValue: { gt: date } }`                       | `"dateValue" > '2025-01-01'`                 | ✅ OK  |
| `between`      | ISO strings   | between          | `{ gte: start, lte: end }`                          | `"dateValue" BETWEEN '2025-01-01' AND '2025-12-31'` | ✅ OK  |
| `not_between`  | ISO strings   | not_between      | `{ OR: [{ lt: start }, { gt: end }] }`              | `("dateValue" < '2025-01-01' OR > '2025-12-31')` | ✅ OK  |
| `today`        | -             | today            | `{ gte: startOfDay, lt: endOfDay }`                 | `"dateValue" >= NOW() AND < NOW()+1day`      | ✅ OK  |
| `yesterday`    | -             | yesterday        | `{ gte: startYesterday, lt: endYesterday }`         | Similar                                      | ✅ OK  |
| `this_week`    | -             | this_week        | `{ gte: startOfWeek, lt: endOfWeek }`               | Similar                                      | ✅ OK  |
| `last_week`    | -             | last_week        | `{ gte: startLastWeek, lt: endLastWeek }`           | Similar                                      | ✅ OK  |
| `this_month`   | -             | this_month       | `{ gte: startOfMonth, lt: endOfMonth }`             | Similar                                      | ✅ OK  |
| `last_month`   | -             | last_month       | `{ gte: startLastMonth, lt: endLastMonth }`         | Similar                                      | ✅ OK  |
| `this_year`    | -             | this_year        | `{ gte: startOfYear, lt: endOfYear }`               | Similar                                      | ✅ OK  |
| `last_year`    | -             | last_year        | `{ gte: startLastYear, lt: endLastYear }`           | Similar                                      | ✅ OK  |

### Reference / CustomArray

| Operator UI    | Frontend Type | Backend Operator | Prisma Condition                          | SQL Generated                | Status |
|----------------|---------------|------------------|-------------------------------------------|------------------------------|--------|
| `equals`       | string/array  | equals           | `{ value: { equals: [val] } }`            | `"value" = '[val]'::jsonb`   | ✅ OK  |
| `not_equals`   | string/array  | not_equals       | `{ value: { not: { equals: [val] } } }`   | `"value" != '[val]'::jsonb`  | ✅ OK  |

---

## 🧪 Script-uri de Testare

Voi crea scripturi Node.js pentru testarea fiecărei combinații de tip coloană + operator.


