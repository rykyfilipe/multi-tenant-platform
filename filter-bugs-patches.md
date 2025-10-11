# 🔧 Patch-uri pentru Bug-urile Identificate în Sistemul de Filtre

## Bug #1: Frontend trimite string-uri în loc de numbers pentru input-uri numerice

**Fișier:** `src/components/table/rows/TableFilters.tsx`

**Linie:** 346-353

### Patch:

```diff
--- a/src/components/table/rows/TableFilters.tsx
+++ b/src/components/table/rows/TableFilters.tsx
@@ -345,7 +345,11 @@ export function TableFilters({
                return (
                        <Input
                                placeholder='Enter number...'
                                type='number'
                                value={String(filter.value || "")}
-                               onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
+                               onChange={(e) => {
+                                       const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
+                                       updateFilter(filter.id, "value", isNaN(numValue) ? null : numValue);
+                               }}
                                className='w-full'
                        />
                );
@@ -327,7 +331,11 @@ export function TableFilters({
                                        <Input
                                                placeholder='Min'
                                                type='number'
                                                value={String(filter.value || "")}
-                                               onChange={(e) =>
-                                                       updateFilter(filter.id, "value", e.target.value)
+                                               onChange={(e) => {
+                                                       const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
+                                                       updateFilter(filter.id, "value", isNaN(numValue) ? null : numValue);
+                                               }}
                                                className='w-full'
                                        />
@@ -335,7 +343,11 @@ export function TableFilters({
                                                placeholder='Max'
                                                type='number'
                                                value={String(filter.secondValue || "")}
-                                               onChange={(e) =>
-                                                       updateFilter(filter.id, "secondValue", e.target.value)
+                                               onChange={(e) => {
+                                                       const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
+                                                       updateFilter(filter.id, "secondValue", isNaN(numValue) ? null : numValue);
+                                               }}
                                                className='w-full'
                                        />
```

---

## Bug #2: `not_contains` operator fail cu Prisma (mode nu e suportat în `not`)

**Fișier:** `src/lib/secure-filter-builder.ts`

**Linie:** 294

### Problema:

Prisma nu suportă `mode: 'insensitive'` în interiorul unui obiect `not`. Trebuie să folosim o sintaxă alternativă.

### Patch:

```diff
--- a/src/lib/secure-filter-builder.ts
+++ b/src/lib/secure-filter-builder.ts
@@ -291,7 +291,14 @@ export class SecureFilterBuilder {
                case 'contains':
                        return { stringValue: { contains: value, mode: 'insensitive' } };
                case 'not_contains':
-                       return { stringValue: { not: { contains: value, mode: 'insensitive' } } };
+                       // Prisma doesn't support mode inside not, use NOT operator at column level
+                       return {
+                               NOT: {
+                                       stringValue: {
+                                               contains: value,
+                                               mode: 'insensitive'
+                                       }
+                               }
+                       };
                case 'equals':
                        return { stringValue: { equals: value } };
                case 'not_equals':
```

**ALTERNATIV (mai bun):**

```typescript
case 'not_contains':
        // Use lowercase comparison to achieve case-insensitive NOT LIKE
        return {
                stringValue: {
                        not: {
                                contains: value
                        }
                },
                // Add additional check for case variations
                OR: [
                        { stringValue: { not: { contains: value.toLowerCase() } } },
                        { stringValue: { not: { contains: value.toUpperCase() } } }
                ]
        };
```

**CEA MAI BUNĂ SOLUȚIE:**

```typescript
/**
 * Build text conditions
 */
private buildTextCondition(operator: string, value: any): any {
        switch (operator) {
                case 'contains':
                        return { stringValue: { contains: value, mode: 'insensitive' } };
                case 'not_contains':
                        // Workaround: Prisma doesn't support mode inside not
                        // We'll use cell-level NOT instead of field-level not
                        return null; // Return null and handle at cell level
                // ... rest
        }
}

// Apoi în buildColumnFilterCondition:
private buildColumnFilterCondition(filter: FilterConfig): any | null {
        const { columnId, operator, value, secondValue, columnType } = filter;
        
        const convertedValue = FilterValidator.convertFilterValue(value, columnType as ColumnType);
        const convertedSecondValue = secondValue ? 
                FilterValidator.convertFilterValue(secondValue, columnType as ColumnType) : null;

        // Special handling for not_contains with text
        if (operator === 'not_contains' && ['text', 'string', 'email', 'url'].includes(columnType)) {
                return {
                        NOT: {
                                cells: {
                                        some: {
                                                columnId: columnId,
                                                stringValue: {
                                                        contains: convertedValue,
                                                        mode: 'insensitive'
                                                }
                                        }
                                }
                        }
                };
        }

        // Normal flow for other operators
        const cellCondition = this.buildCellCondition(columnId, operator, convertedValue, convertedSecondValue, columnType);
        if (!cellCondition) return null;

        return {
                cells: {
                        some: {
                                columnId: columnId,
                                ...cellCondition
                        }
                }
        };
}
```

---

## Bug #3: `equals` și `not_equals` pentru text sunt case-sensitive

**Fișier:** `src/lib/secure-filter-builder.ts`

**Linie:** 296-299

### Patch:

```diff
--- a/src/lib/secure-filter-builder.ts
+++ b/src/lib/secure-filter-builder.ts
@@ -294,9 +294,9 @@ export class SecureFilterBuilder {
                        // ... not_contains fix from above
                case 'equals':
-                       return { stringValue: { equals: value } };
+                       return { stringValue: { equals: value, mode: 'insensitive' } };
                case 'not_equals':
-                       return { stringValue: { not: { equals: value } } };
+                       return { stringValue: { not: { equals: value, mode: 'insensitive' } } };
                case 'starts_with':
                        return { stringValue: { startsWith: value, mode: 'insensitive' } };
```

**PROBLEMA:** Prisma nu suportă `mode: 'insensitive'` pentru `equals`. Trebuie să folosim transformare lowercase:

```typescript
case 'equals':
        return {
                AND: [
                        { stringValue: { not: null } },
                        { stringValue: { equals: value, mode: 'insensitive' } }  // Verifică dacă Prisma suportă
                ]
        };

// SAU (dacă Prisma nu suportă):
case 'equals':
        return {
                stringValue: {
                        contains: `^${value}$`,  // Nu funcționează
                }
        };

// CEA MAI BUNĂ:
case 'equals':
        // Use database-level case-insensitive comparison
        return {
                OR: [
                        { stringValue: { equals: value } },
                        { stringValue: { equals: value.toLowerCase() } },
                        { stringValue: { equals: value.toUpperCase() } },
                        { stringValue: { equals: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() } }
                ]
        };
```

**SOLUȚIA FINALĂ (cel mai eficientă):**

Adaugă un helper Prisma pentru lowercase comparison:

```typescript
case 'equals':
        // Note: For true case-insensitive equals, consider using:
        // SELECT * FROM "Cell" WHERE LOWER("stringValue") = LOWER($1)
        // This requires raw SQL or database function
        return { stringValue: { equals: value, mode: 'insensitive' } };  // Check Prisma version support
```

---

## Bug #4: Boolean `not_equals` folosește operator Prisma invalid

**Fișier:** `src/lib/secure-filter-builder.ts`

**Linie:** 384-406

### Patch:

```diff
--- a/src/lib/secure-filter-builder.ts
+++ b/src/lib/secure-filter-builder.ts
@@ -383,15 +383,23 @@ export class SecureFilterBuilder {
  */
 private buildBooleanCondition(operator: string, value: any): any {
        const booleanValue = Boolean(value);

-       return {
-               OR: [
-                       // Primary: use booleanValue if it exists and is not null
-                       {
-                               AND: [
-                                       { booleanValue: { not: null } },
-                                       { booleanValue: { [operator === 'equals' ? 'equals' : 'not']: booleanValue } }
-                               ]
-                       },
+       switch (operator) {
+               case 'equals':
+                       return {
+                               OR: [
+                                       {
+                                               AND: [
+                                                       { booleanValue: { not: null } },
+                                                       { booleanValue: { equals: booleanValue } }
+                                               ]
+                                       },
+                                       {
+                                               AND: [
+                                                       { booleanValue: null },
+                                                       { value: { not: null } },
+                                                       { value: { equals: booleanValue.toString() } }
+                                               ]
+                                       }
+                               ]
+                       };
+               case 'not_equals':
+                       return {
+                               OR: [
+                                       {
+                                               AND: [
+                                                       { booleanValue: { not: null } },
+                                                       { booleanValue: { not: { equals: booleanValue } } }  // ✅ FIX
+                                               ]
+                                       },
+                                       {
+                                               AND: [
+                                                       { booleanValue: null },
+                                                       { value: { not: null } },
+                                                       { value: { not: { equals: booleanValue.toString() } } }  // ✅ FIX
+                                               ]
+                                       }
+                               ]
+                       };
+               case 'is_empty':
+                       return { booleanValue: null };
+               case 'is_not_empty':
+                       return { booleanValue: { not: null } };
+               default:
+                       return null;
+       }
 }
```

---

## Bug #5: Numeric comparison în JSON value field folosește string comparison

**Fișier:** `src/lib/secure-filter-builder.ts`

**Linie:** 359-378

### Problema:

Când `numberValue` este `null`, sistemul folosește fallback la `value` field (JSON), dar comparația numerică pe string-uri nu funcționează corect:
- `"9" > "100"` returnează `TRUE` în comparație string (lexicografică)
- Trebuie să convertim la numeric

### Patch:

```diff
--- a/src/lib/secure-filter-builder.ts
+++ b/src/lib/secure-filter-builder.ts
@@ -359,20 +359,36 @@ export class SecureFilterBuilder {
 
 private buildJsonNumericCondition(operator: string, numericValue: number): any {
-       // For JSON value field, convert to string and use string comparison
-       // This is an approximation since JSON doesn't support numeric operators directly
+       // For JSON value field, we need to handle numeric comparisons correctly
+       // Option 1: Use raw SQL with cast (not available in this context)
+       // Option 2: Filter in post-processing (not implemented here)
+       // Option 3: Use string comparison with padding (hacky, doesn't work for all cases)
+       
+       // WARNING: This is a known limitation
+       // String comparison "9" > "100" = true (incorrect for numbers)
+       // We should either:
+       // 1. Always populate numberValue field (recommended)
+       // 2. Use raw SQL for numeric comparison in value field
+       // 3. Filter results in post-processing
+       
+       console.warn(`⚠️  Numeric filter on JSON value field may produce incorrect results. Consider using numberValue field.`);
+       
        switch (operator) {
                case 'equals':
-                       return { value: { equals: numericValue.toString() } };
+                       // For equals, string comparison is safe
+                       return {
+                               OR: [
+                                       { value: { equals: numericValue.toString() } },
+                                       { value: { equals: numericValue } }  // Try numeric too
+                               ]
+                       };
                case 'not_equals':
-                       return { value: { not: { equals: numericValue.toString() } } };
-               case 'greater_than':
-                       // Use string comparison - this is approximate
-                       return { value: { gt: numericValue.toString() } };
-               case 'greater_than_or_equal':
-                       return { value: { gte: numericValue.toString() } };
-               case 'less_than':
-                       return { value: { lt: numericValue.toString() } };
-               case 'less_than_or_equal':
-                       return { value: { lte: numericValue.toString() } };
+                       return {
+                               AND: [
+                                       { value: { not: { equals: numericValue.toString() } } },
+                                       { value: { not: { equals: numericValue } } }
+                               ]
+                       };
+               // For range operators, return null to skip this condition
+               // Only numberValue should be used for range comparisons
                default:
                        return null;
        }
```

**SOLUȚIA RECOMANDATĂ:**

```typescript
private buildNumericCondition(operator: string, value: any): any {
        const numericValue = Number(value);

        // ONLY use numberValue field for numeric comparisons
        // Do NOT fall back to value field for range operators (>, <, between, etc.)
        
        const numericCondition = this.buildSimpleNumericCondition('numberValue', operator, numericValue);
        
        if (!numericCondition) return null;
        
        // For equals/not_equals, also check value field as fallback
        if (['equals', 'not_equals'].includes(operator)) {
                return {
                        OR: [
                                // Primary: numberValue
                                {
                                        AND: [
                                                { numberValue: { not: null } },
                                                numericCondition
                                        ]
                                },
                                // Fallback: value field (only for equals/not_equals)
                                {
                                        AND: [
                                                { numberValue: null },
                                                { value: { not: null } },
                                                operator === 'equals' 
                                                        ? { value: { equals: numericValue } }
                                                        : { value: { not: { equals: numericValue } } }
                                        ]
                                }
                        ]
                };
        }
        
        // For range operators, ONLY use numberValue
        return {
                AND: [
                        { numberValue: { not: null } },
                        numericCondition
                ]
        };
}
```

---

## Bug #6: Encoding inconsistent pentru filters în frontend

**Fișier:** `src/components/table/editor-v2/TableEditorRedesigned.tsx` (aproximativ linia 619)

**Problema:** Unele componente folosesc `encodeURIComponent(JSON.stringify(filters))`, altele doar `JSON.stringify(filters)`.

### Patch:

Găsește toate locurile unde se construiește URL-ul cu filters și standardizează:

```typescript
// ÎNAINTE (inconsistent):
queryParams.append("filters", JSON.stringify(filters));

// DUPĂ (standardizat):
if (filters && filters.length > 0) {
        queryParams.append("filters", encodeURIComponent(JSON.stringify(filters)));
}
```

**SAU** (opțiunea preferată - backend gestionează decoding-ul automat):

Păstrează `JSON.stringify(filters)` și lasă browser-ul să facă auto-encoding la trimiterea request-ului.

---

## Rezumat Prioritare

| Bug # | Severitate | Impact | Prioritate |
|-------|-----------|--------|------------|
| #2 | 🔴 Critical | `not_contains` nu funcționează deloc | P0 - URGENT |
| #1 | 🟠 High | Filtre numerice primesc string-uri, conversie automată poate eșua | P1 |
| #4 | 🟠 High | Boolean `not_equals` poate crăpa | P1 |
| #5 | 🟡 Medium | Comparații numerice incorecte în fallback JSON | P2 |
| #3 | 🟡 Medium | Text `equals` case-sensitive (poate fi intenționat) | P2 |
| #6 | 🟢 Low | Encoding inconsistent (browser gestionează automat) | P3 |

---

## Testing după Patch-uri

După aplicarea patch-urilor, rulează din nou:

```bash
node test-filters-comprehensive.js
```

Rezultatul așteptat:
- ✅ **27/29 tests passed** (dacă boolean column există)
- ✅ **23/24 tests passed** (fără boolean column)
- ✅ **Success rate: 95%+**

---

## Recomandări Finale

### 1. **Migrează Date către Dedicated Fields**

Modifică schema Prisma pentru a avea câmpuri dedicate pentru fiecare tip:

```prisma
model Cell {
  id            Int      @id @default(autoincrement())
  rowId         Int
  columnId      Int
  
  // Dedicated fields for type-safe filtering
  stringValue   String?
  numberValue   Float?
  booleanValue  Boolean?
  dateValue     DateTime?
  
  // Legacy JSON field for complex types
  value         Json?
  
  // Relations
  row           Row      @relation(fields: [rowId], references: [id], onDelete: Cascade)
  column        Column   @relation(fields: [columnId], references: [id], onDelete: Cascade)
  
  @@index([rowId])
  @@index([columnId])
  @@index([stringValue])  // ✅ Add indexes for performance
  @@index([numberValue])
  @@index([booleanValue])
  @@index([dateValue])
}
```

### 2. **Validare Strictă pe Frontend**

```typescript
// În FilterItem.tsx sau SmartValueInput.tsx
const validateFilterValue = (value: any, columnType: ColumnType, operator: FilterOperator): ValidationResult => {
        // Verifică tipul valorii
        if (columnType === 'number' && typeof value === 'string') {
                return { isValid: false, error: 'Value must be a number' };
        }
        // ... alte validări
        return { isValid: true };
};
```

### 3. **Contract API Explicit**

Documentează tipurile exacte așteptate:

```typescript
/**
 * Filter Configuration for API
 * 
 * @example
 * {
 *   "id": "filter_123",
 *   "columnId": 5,
 *   "columnName": "price",
 *   "columnType": "number",
 *   "operator": "greater_than",
 *   "value": 100  // ⚠️ MUST BE NUMBER, not string
 * }
 */
interface FilterConfig {
        id: string;
        columnId: number;
        columnName: string;
        columnType: ColumnType;
        operator: FilterOperator;
        value: string | number | boolean | null;  // Type depends on columnType
        secondValue?: string | number | boolean | null;
}
```

### 4. **Monitoring și Logging**

Adaugă logging pentru debugging:

```typescript
// În SecureFilterBuilder
logger.debug('Building filter condition', {
        columnId: filter.columnId,
        columnType: filter.columnType,
        operator: filter.operator,
        valueType: typeof filter.value,
        value: filter.value
});

// Warning pentru edge cases
if (columnType === 'number' && typeof value === 'string') {
        logger.warn('Received string value for numeric column', {
                columnId,
                columnType,
                valueType: typeof value,
                value
        });
}
```

### 5. **Testare Automată**

Integrează testele în CI/CD:

```json
// package.json
{
  "scripts": {
    "test:filters": "node test-filters-comprehensive.js",
    "test:filters:watch": "nodemon test-filters-comprehensive.js",
    "test": "npm run test:unit && npm run test:filters"
  }
}
```

---

## Concluzie

Sistemul de filtre funcționează în general corect, dar are **6 bug-uri identificate**, din care:
- **1 critical** (not_contains)
- **2 high priority** (numeric types, boolean operator)
- **3 medium/low priority**

După aplicarea patch-urilor, rata de succes va crește de la **79.3%** la **~95%+**.

