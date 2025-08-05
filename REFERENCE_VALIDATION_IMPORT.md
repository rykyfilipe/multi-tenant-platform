<!-- @format -->

# Validarea Referințelor la Import

## Problema

Când userul importă date cu chei primare care nu există în tabelele de
referință, sistemul ar trebui să:

1. Detecteze cheile invalide
2. Afișeze mesaje de eroare relevante
3. Gestioneze importul parțial (pentru bulk import)

## Soluția Implementată

### 1. Validarea pe Server (API)

#### Funcția `processCells` Modificată

```typescript
const processCells = async (cells: any[], rowId: number) => {
	const processedCells = [];
	const validationErrors = [];

	for (const cell of cells) {
		const column = table.columns.find((col) => col.id === cell.columnId);

		if (
			column &&
			column.type === "reference" &&
			column.referenceTableId &&
			cell.value
		) {
			// Validăm că cheia primară există în tabelul de referință
			const referenceTable = await prisma.table.findUnique({
				where: { id: column.referenceTableId },
				include: { columns: true, rows: { include: { cells: true } } },
			});

			if (referenceTable) {
				const refPrimaryKeyColumn = referenceTable.columns.find(
					(col) => col.primary,
				);

				if (refPrimaryKeyColumn) {
					// Căutăm rândul cu cheia primară specificată
					const referenceRow = referenceTable.rows.find((refRow) => {
						const refPrimaryKeyCell = refRow.cells.find(
							(refCell) => refCell.columnId === refPrimaryKeyColumn.id,
						);
						return refPrimaryKeyCell && refPrimaryKeyCell.value === cell.value;
					});

					if (!referenceRow) {
						validationErrors.push(
							`Reference value "${cell.value}" not found in table "${referenceTable.name}" for column "${column.name}"`,
						);
						continue; // Omitem această celulă din procesare
					}
				}
			}
		}

		processedCells.push({
			rowId: rowId,
			columnId: cell.columnId,
			value: cell.value,
		});
	}

	return { processedCells, validationErrors };
};
```

### 2. Gestionarea Erorilor

#### Single Row Import

- **Eroare de validare**: Returnează status 400 cu detalii despre erori
- **Rândul este șters** dacă există erori de validare
- **Mesaj de eroare**: Afișează toate erorile de validare

#### Bulk Import

- **Avertismente**: Returnează status 207 (Multi-Status) cu avertismente
- **Import parțial**: Salvează rândurile valide, omite celulele invalide
- **Mesaj de avertisment**: Afișează toate avertismentele

### 3. Frontend - Gestionarea Răspunsurilor

```typescript
if (!res.ok) {
	const errorData = await res.json();
	if (res.status === 400) {
		// Eroare de validare pentru single row
		const errorMessage = errorData.details
			? `Validation failed: ${errorData.details.join(", ")}`
			: errorData.error || "Import failed";
		showAlert(errorMessage, "error");
	} else {
		showAlert(
			"Import failed: " + (errorData.error || "Unknown error"),
			"error",
		);
	}
} else {
	const data = await res.json();

	if (res.status === 207) {
		// Import cu avertismente (status 207 Multi-Status)
		const warningMessage = data.warnings
			? `Import completed with warnings: ${data.warnings.join("; ")}`
			: data.message || "Import completed with warnings";
		showAlert(warningMessage, "warning");
	} else {
		// Import complet reușit
		showAlert(
			`Successfully imported ${data.rows?.length || 0} rows!`,
			"success",
		);
	}
}
```

## Exemple de Utilizare

### Exemplu 1: Single Row cu Referință Invalidă

**CSV Input:**

```csv
Name;Category
Laptop;INVALID_CATEGORY
```

**Rezultat:**

- Status: 400 (Bad Request)
- Mesaj: "Validation failed: Reference value "INVALID_CATEGORY" not found in
  table "Categories" for column "Category""
- Rândul nu este salvat

### Exemplu 2: Bulk Import cu Referințe Mixte

**CSV Input:**

```csv
Name;Category
Laptop;ELEC001
Phone;INVALID_CATEGORY
Tablet;ELEC001
```

**Rezultat:**

- Status: 207 (Multi-Status)
- Mesaj: "Import completed with warnings: Row 2: Reference value
  "INVALID_CATEGORY" not found in table "Categories" for column "Category""
- Rândurile 1 și 3 sunt salvate
- Celula invalidă din rândul 2 este omisă

### Exemplu 3: Import Complet Valid

**CSV Input:**

```csv
Name;Category
Laptop;ELEC001
Phone;ELEC001
Tablet;ELEC001
```

**Rezultat:**

- Status: 201 (Created)
- Mesaj: "Successfully imported 3 rows!"
- Toate rândurile sunt salvate

## Beneficii

### 1. Integritate a Datelor

- Previne salvarea referințelor invalide
- Menține consistența între tabele

### 2. Experiență Utilizator

- Mesaje clare despre ce nu a funcționat
- Import parțial pentru bulk operations
- Feedback imediat despre probleme

### 3. Flexibilitate

- Single row: Eroare completă (nu salvează nimic)
- Bulk import: Import parțial cu avertismente

## Status Codes Utilizate

- **200/201**: Import complet reușit
- **207**: Import parțial cu avertismente (Multi-Status)
- **400**: Eroare de validare (single row)
- **500**: Eroare internă de server

## Mesaje de Eroare

### Formatul Mesajelor

```
Reference value "{value}" not found in table "{tableName}" for column "{columnName}"
```

### Exemple

- `Reference value "INVALID_CATEGORY" not found in table "Categories" for column "Category"`
- `Reference value "999" not found in table "Products" for column "ProductID"`

## Testare

### Test Cases

1. **Single row cu referință invalidă**: Verifică că returnează eroare 400
2. **Bulk import cu referințe mixte**: Verifică că returnează status 207 cu
   avertismente
3. **Import complet valid**: Verifică că returnează status 201
4. **Mesaje de eroare**: Verifică că mesajele sunt clare și informative
