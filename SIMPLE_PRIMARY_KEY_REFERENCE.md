<!-- @format -->

# Simplified Primary Key Reference System

## Overview

This document explains the simplified approach where reference columns store the
actual primary key values directly in the database, eliminating the need for
complex ID-to-primary-key conversions.

## Key Concept

Instead of storing row IDs and converting them to primary key values during
export/import, we now store the primary key values directly in the database for
reference columns.

## Database Storage

### Before (Complex Approach)

```
Reference Column Value: 1 (Row ID)
Export Process: Find row with ID 1 → Get primary key value → Export primary key
Import Process: Find row with primary key → Get row ID → Save row ID
```

### After (Simple Approach)

```
Reference Column Value: "ELEC001" (Primary Key Value)
Export Process: Export value directly
Import Process: Save value directly
```

## Implementation

### 1. Row Creation API

```typescript
// Simplified cell processing - no complex conversions needed
const processCells = async (cells: any[], rowId: number) => {
	for (const cell of cells) {
		// For all columns, save the original value
		// For reference columns, the value is already the primary key
		processedCells.push({
			rowId: rowId,
			columnId: cell.columnId,
			value: cell.value, // Direct value, no conversion needed
		});
	}
};
```

### 2. Public API Export

```typescript
// Direct value export - no complex lookups needed
for (const cell of row.cells) {
	const column = table.columns.find((col) => col.id === cell.columnId);
	const columnName = columnMap.get(cell.columnId);

	if (columnName && column) {
		// For reference columns, the value is already the primary key
		// For normal columns, keep the original value
		rowData[columnName] = cell.value;
	}
}
```

### 3. Frontend Export

```typescript
// Direct export - no complex processing needed
const rowData = columns.map((col) => {
	const cell = row.cells?.find((c) => c.columnId === col.id);
	let value = cell?.value ?? "";

	// For reference columns, the value is already the primary key
	// No additional processing needed
	return JSON.stringify(value);
});
```

### 4. Frontend Import

```typescript
// Direct import - no complex validation needed
if (col.type === "reference") {
	return {
		columnId: col.id,
		value, // Primary key value from CSV
	};
}
```

## Example Flow

### Scenario: Products and Categories

**Tabela Categories:**

```
ID | Name      | Primary Key
1  | Electronics| "ELEC001"
2  | Books      | "BOOK001"
```

**Tabela Products (cu referință la Categories):**

```
ID | Name       | Category (Reference)
1  | Laptop     | "ELEC001" (Primary Key Value)
2  | Novel      | "BOOK001" (Primary Key Value)
```

### Export

```csv
Name;Category
Laptop;ELEC001
Novel;BOOK001
```

### Import

1. **Parse CSV**: Citește "ELEC001" și "BOOK001"
2. **Save Directly**: Salvează valorile direct în baza de date
3. **No Conversion**: Nu mai este nevoie de conversii

## Benefits

### 1. Performance

- **No Database Lookups**: Elimină căutările complexe în baza de date
- **Faster Processing**: Procesare mult mai rapidă pentru export/import
- **Reduced Complexity**: Cod mult mai simplu și mai ușor de întreținut

### 2. Simplicity

- **Direct Storage**: Valorile sunt salvate direct, fără conversii
- **No Conversion Logic**: Elimină logica complexă de conversie
- **Easier Debugging**: Mai ușor de debugat și testat

### 3. User Experience

- **Immediate Feedback**: Export/import instant
- **No Errors**: Elimină erorile de conversie
- **Consistent Data**: Datele sunt consistente între export și import

### 4. Maintainability

- **Less Code**: Cod mult mai puțin și mai simplu
- **Fewer Edge Cases**: Elimină cazurile edge de conversie
- **Easier Testing**: Testare mult mai simplă

## Migration Considerations

### Existing Data

- **Backward Compatibility**: Sistemul rămâne compatibil cu datele existente
- **Gradual Migration**: Poate fi migrat gradual dacă este necesar
- **No Data Loss**: Nu există risc de pierdere de date

### New Features

- **Simplified Logic**: Toate noile funcționalități folosesc logica simplificată
- **Better Performance**: Performanță îmbunătățită pentru toate operațiunile
- **Easier Development**: Dezvoltarea de noi funcționalități este mai simplă

## API Changes

### Simplified Endpoints

- **POST**
  `/api/tenants/{tenantId}/databases/{databaseId}/tables/{tableId}/rows`
  - Procesare simplificată, fără conversii
- **GET** `/api/public/tables/{tableId}`
  - Export direct, fără căutări complexe

### Frontend Components

- **ImportExportControls**: Logică simplificată
- **createReferenceData**: Nu mai este necesară filtrarea complexă

## Error Handling

### Simplified Error Cases

- **Invalid Primary Key**: Valoarea rămâne neschimbată
- **Missing Reference**: Valoarea rămâne neschimbată
- **No Complex Validation**: Validări mult mai simple

## Testing

### Simplified Test Cases

1. **Direct Export**: Verifică că valorile sunt exportate direct
2. **Direct Import**: Verifică că valorile sunt salvate direct
3. **No Conversion Errors**: Nu mai există erori de conversie
4. **Performance**: Testează performanța îmbunătățită

### Example Test Data

```csv
Name;Category;Price
Laptop;ELEC001;999.99
Book;BOOK001;19.99
Phone;ELEC001;599.99
```

## Conclusion

Această abordare simplificată transformă sistemul într-unul mult mai eficient,
mai simplu și mai ușor de întreținut. Elimină complexitatea inutilă și oferă o
experiență utilizator mult mai bună cu performanță îmbunătățită.
