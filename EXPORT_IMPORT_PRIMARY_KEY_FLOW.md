<!-- @format -->

# Export/Import Flow with Primary Key Values

## Overview

This document explains how the export/import functionality works with primary
key values for reference columns.

## Export Flow

### 1. Data Preparation

```typescript
// Funcția createReferenceData creează datele de referință
const createReferenceData = (tables: Table[] | null) => {
	// Filtrează doar tabelele cu cheie primară
	const tablesWithPrimaryKey = tables.filter(
		(table) => table.columns && table.columns.some((col) => col.primary),
	);

	// Pentru fiecare rând, creează displayValue cu # în fața cheii primare
	if (addedColumns === 0 && column.primary) {
		displayParts.push(`#${formattedValue}`);
	}
};
```

### 2. Export Processing

```typescript
// Pentru coloanele de referință, exportă direct valoarea cheii primare
if (col.type === "reference" && col.referenceTableId && value) {
	const referencedRow = referencedTableData.find(
		(refRow) => refRow.id === Number(value),
	);

	if (referencedRow) {
		const displayValue = referencedRow.displayValue;
		if (displayValue.startsWith("#")) {
			// Extrage valoarea cheii primare (fără #)
			const primaryKeyValue = displayValue.substring(1).split(" • ")[0];
			value = primaryKeyValue;
		}
	}
}
```

### 3. CSV Output

```csv
Name;Category;ProductID
Product A;Electronics;12345
Product B;Books;67890
```

## Import Flow

### 1. CSV Parsing

```typescript
// Parsează valorile din CSV
const values = line.split(delimiter).map((v) => safeParse(v));

// Pentru coloanele de referință, păstrează valoarea originală (cheia primară)
if (col.type === "reference") {
	return {
		columnId: col.id,
		value, // Cheia primară din CSV
	};
}
```

### 2. Server-Side Processing

```typescript
// API-ul procesează celulele și găsește rândul după cheia primară
const processCells = async (cells: any[], rowId: number) => {
	for (const cell of cells) {
		if (column.type === "reference" && column.referenceTableId && cell.value) {
			// Găsește tabelul de referință
			const referenceTable = await prisma.table.findUnique({
				where: { id: column.referenceTableId },
				include: { columns: true, rows: { include: { cells: true } } },
			});

			// Găsește cheia primară a tabelului de referință
			const refPrimaryKeyColumn = referenceTable.columns.find(
				(col) => col.primary,
			);

			// Găsește rândul cu cheia primară egală cu cell.value
			const referenceRow = referenceTable.rows.find((refRow) => {
				const refPrimaryKeyCell = refRow.cells.find(
					(refCell) => refCell.columnId === refPrimaryKeyColumn.id,
				);
				return refPrimaryKeyCell && refPrimaryKeyCell.value === cell.value;
			});

			if (referenceRow) {
				// Salvează ID-ul rândului de referință
				processedCells.push({
					rowId: rowId,
					columnId: cell.columnId,
					value: referenceRow.id, // ID-ul rândului, nu cheia primară
				});
			}
		}
	}
};
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
1  | Laptop     | 1 (ID-ul rândului)
2  | Novel      | 2 (ID-ul rândului)
```

### Export

```csv
Name;Category
Laptop;ELEC001
Novel;BOOK001
```

### Import

1. **Parse CSV**: Citește "ELEC001" și "BOOK001"
2. **Find Rows**: Găsește rândurile cu cheile primare respective
3. **Save IDs**: Salvează ID-urile rândurilor (1, 2) în loc de cheile primare

## Benefits

### 1. User-Friendly Export

- Exportă valori semnificative (chei primare) în loc de ID-uri
- CSV-ul este ușor de citit și înțeles
- Compatibil cu alte sisteme

### 2. Robust Import

- Verifică existența rândurilor după cheia primară
- Menține integritatea referențială
- Gestionează erorile grațios

### 3. Data Integrity

- Asigură că referințele sunt valide
- Previne referințe orfane
- Menține consistența datelor

## Error Handling

### Export Errors

- **Tabelul de referință nu există**: Exportă ID-ul original
- **Rândul de referință nu există**: Exportă ID-ul original
- **Cheia primară nu există**: Exportă displayValue complet

### Import Errors

- **Cheia primară nu există**: Păstrează valoarea originală
- **Tabelul de referință nu există**: Păstrează valoarea originală
- **Validare eșuată**: Omit rândul din import

## API Endpoints

### Export

- **GET** `/api/public/tables/{tableId}` - Exportă datele cu chei primare

### Import

- **POST**
  `/api/tenants/{tenantId}/databases/{databaseId}/tables/{tableId}/rows`
- Suportă atât single row cât și bulk import
- Procesează automat referințele cu chei primare

## Frontend Components

### ImportExportControls

- Gestionează exportul cu chei primare
- Procesează importul și trimite datele la server
- Afișează feedback utilizator

### createReferenceData

- Creează datele de referință pentru export
- Filtrează tabelele cu chei primare
- Formatează displayValue cu # pentru chei primare

## Testing

### Test Cases

1. **Export cu referințe valide**: Verifică că se exportă cheile primare
2. **Import cu chei valide**: Verifică că se găsesc rândurile corecte
3. **Import cu chei invalide**: Verifică că se păstrează valorile originale
4. **Bulk import**: Verifică că funcționează pentru multiple rânduri

### Example Test Data

```csv
Name;Category;Price
Laptop;ELEC001;999.99
Book;BOOK001;19.99
Phone;ELEC001;599.99
```

Această implementare asigură un flux robust și user-friendly pentru
export/import cu suport complet pentru chei primare în referințe.
