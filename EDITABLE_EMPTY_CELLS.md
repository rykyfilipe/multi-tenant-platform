<!-- @format -->

# Editarea Celulelor Goale

## Problema

Când o celulă nu există pentru o coloană (valoare `null` sau `""`), userul nu
putea să o editeze pentru a adăuga o valoare. Celulele goale erau afișate ca
"Empty" fără posibilitatea de editare.

## Soluția Implementată

### 1. Celule Virtuale

#### Conceptul

Pentru coloanele care nu au celule create încă, sistemul creează "celule
virtuale" care permit editarea:

```typescript
// If no cell exists for this column, create a virtual cell for editing
if (!cell) {
    const virtualCell: Cell = {
        id: 0, // Virtual ID
        rowId: row.id,
        columnId: col.id,
        value: null,
    };

    return (
        <td key={`${row.id}-${col.id}-empty`}>
            <EditableCell
                columns={columns}
                cell={virtualCell}
                tables={tables}
                isEditing={...}
                onStartEdit={() => {
                    onEditCell(
                        String(row.id),
                        String(col.id),
                        "virtual", // Special ID for virtual cells
                    );
                }}
                onSave={(val) => {
                    onSaveCell(
                        String(col.id),
                        String(row.id),
                        "virtual",
                        val,
                    );
                }}
                onCancel={onCancelEdit}
            />
        </td>
    );
}
```

### 2. Stilizarea Celulelor Goale

#### Afișarea Vizuală

```typescript
if (value == null || value === "") {
	display = "Click to add value";
}
```

#### Stilizarea CSS

```typescript
const getDisplayStyle = () => {
	if (display === "Click to add value") {
		return "text-gray-400 italic bg-gray-50 border border-dashed border-gray-300 rounded px-2 py-1 cursor-pointer hover:bg-gray-100";
	} else if (display.startsWith("⚠️")) {
		return "text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1";
	}
	return "cursor-pointer hover:bg-gray-50 rounded px-1";
};
```

### 3. Gestionarea Celulelor Virtuale în Hook

#### Logica de Salvare

```typescript
// Pentru celulele virtuale (care nu există încă), creăm o celulă nouă
if (cellId === "virtual") {
	const response = await fetch(
		`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/${rowId}/cell`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				columnId: parseInt(columnId),
				value,
			}),
		},
	);

	const newCell = await response.json();

	// Actualizăm rândurile cu noua celulă
	const updatedRows = rows.map((row) => {
		if (row.id.toString() !== rowId) return row;
		return {
			...row,
			cells: [...(row.cells || []), newCell],
		};
	});

	setRows(updatedRows);
	setEditingCell(null);
	showAlert("Data cell created successfully", "success");
	return;
}
```

## Exemple de Utilizare

### Exemplu 1: Celulă Goală

**Situație:**

- O coloană nu are celulă creată încă
- User vrea să adauge o valoare

**Afișare:**

- **Vizual**: `Click to add value` (cu fundal gri și border dashed)
- **Hover**: Fundalul devine mai închis la culoare
- **Cursor**: Pointer pentru a indica că este clickabil

**Editare:**

- User face click pe celulă
- Se deschide editorul corespunzător tipului de coloană
- User introduce valoarea
- Se salvează ca celulă nouă în baza de date

### Exemplu 2: Celulă cu Valoare Null

**Situație:**

- Celula există dar are valoarea `null`
- User vrea să adauge o valoare

**Afișare:**

- **Vizual**: `Click to add value` (cu stilizare specială)
- **Editare**: Se comportă la fel ca celulele goale

### Exemplu 3: Celulă cu Valoare Goală

**Situație:**

- Celula există dar are valoarea `""`
- User vrea să adauge o valoare

**Afișare:**

- **Vizual**: `Click to add value` (cu stilizare specială)
- **Editare**: Se comportă la fel ca celulele goale

## Fluxul de Editare

### 1. Detectarea Celulei Goale

- Sistemul verifică dacă există o celulă pentru coloană
- Dacă nu există, creează o celulă virtuală

### 2. Editarea

- User face click pe celulă
- Se deschide editorul corespunzător tipului de coloană
- User introduce valoarea

### 3. Salvare

- Pentru celulele virtuale: Se creează o celulă nouă în baza de date
- Pentru celulele existente: Se actualizează valoarea

### 4. Actualizare UI

- Celula se actualizează cu noua valoare
- Stilizarea se schimbă de la "Click to add value" la valoarea reală

## Beneficii

### 1. Experiență Utilizator Îmbunătățită

- Celulele goale sunt clar identificabile ca editabile
- Feedback vizual clar pentru acțiuni
- Stilizare consistentă cu restul aplicației

### 2. Flexibilitate

- User poate adăuga valori în orice celulă goală
- Sistemul gestionează automat crearea celulelor noi
- Compatibil cu toate tipurile de coloane

### 3. Performanță

- Celulele virtuale nu ocupă spațiu în baza de date până sunt populate
- Actualizarea UI este eficientă
- Nu se fac cereri inutile la server

## Stilizarea CSS

### Celule Goale

```css
.text-gray-400          /* Text gri deschis */
.italic                 /* Text italic */
.bg-gray-50            /* Fundal gri foarte deschis */
.border                /* Border */
.border-dashed         /* Border dashed */
.border-gray-300       /* Border gri */
.rounded               /* Colțuri rotunjite */
.px-2                  /* Padding orizontal */
.py-1                  /* Padding vertical */
.cursor-pointer        /* Cursor pointer */
.hover:bg-gray-100     /* Hover effect */
```

### Celule Normale

```css
.cursor-pointer/* Cursor pointer */
.hover: bg-gray-50 /* Hover effect */ .rounded /* Colțuri rotunjite */ .px-1;
.hover/* Padding orizontal */;
```

## Testare

### Test Cases

1. **Celulă goală**: Verifică că se afișează "Click to add value"
2. **Editare**: Verifică că user poate edita celula goală
3. **Salvare**: Verifică că se creează celulă nouă în baza de date
4. **Actualizare**: Verifică că UI se actualizează corect
5. **Tipuri de coloane**: Verifică că funcționează pentru toate tipurile

### Scenarii de Test

- Celulă goală pentru coloană string
- Celulă goală pentru coloană number
- Celulă goală pentru coloană boolean
- Celulă goală pentru coloană date
- Celulă goală pentru coloană reference
- Editarea și salvarea cu valori valide
