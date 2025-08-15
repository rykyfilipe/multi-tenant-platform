<!-- @format -->

# Sistemul de Permisiuni - Ghid Complet

## Prezentare Generală

Sistemul de permisiuni implementat oferă control granular asupra accesului
utilizatorilor la tabele și coloane. Fiecare utilizator poate avea permisiuni
diferite pentru fiecare tabel și coloană individuală.

## Structura Permisiunilor

### Permisiuni la Nivel de Tabel

- **canRead**: Permite citirea datelor din tabel
- **canEdit**: Permite adăugarea, editarea și ștergerea rândurilor
- **canDelete**: Permite ștergerea rândurilor

### Permisiuni la Nivel de Coloană

- **canRead**: Permite vizualizarea coloanei
- **canEdit**: Permite editarea valorilor din coloană

## Implementarea Tehnică

### 1. Hook-uri de Permisiuni

#### `useCurrentUserPermissions()`

Încarcă permisiunile utilizatorului curent din backend.

```typescript
const { permissions, loading, error, refetch } = useCurrentUserPermissions();
```

#### `useTablePermissions(tableId, tablePermissions, columnPermissions)`

Gestionează permisiunile pentru un tabel specific și returnează funcții helper.

```typescript
const tablePermissions = useTablePermissions(
	table.id,
	userPermissions?.tablePermissions || [],
	userPermissions?.columnsPermissions || [],
);

// Verificări de permisiuni
const canRead = tablePermissions.canReadTable();
const canEdit = tablePermissions.canEditTable();
const canReadColumn = tablePermissions.canReadColumn(columnId);
const canEditColumn = tablePermissions.canEditColumn(columnId);
```

### 2. Filtrarea Coloanelor

Sistemul filtrează automat coloanele în funcție de permisiunile utilizatorului:

```typescript
// Obține doar coloanele vizibile
const visibleColumns = tablePermissions.getVisibleColumns(columns);

// Obține doar coloanele editabile
const editableColumns = tablePermissions.getEditableColumns(columns);
```

### 3. Verificări de Securitate

#### În Componentele de Afișare

```typescript
// Verifică dacă utilizatorul poate citi tabelul
if (!tablePermissions.canReadTable()) {
	return <AccessDeniedMessage />;
}

// Verifică dacă utilizatorul poate edita coloana
if (!tablePermissions.canEditColumn(column.id)) {
	return <ReadOnlyCell />;
}
```

#### În API-uri

```typescript
// Verifică permisiunile înainte de a returna date
if (role !== "ADMIN") {
	const permission = await prisma.tablePermission.findFirst({
		where: {
			userId: userId,
			tableId: Number(tableId),
			canRead: true,
		},
	});

	if (!permission) {
		return NextResponse.json({ error: "Access denied" }, { status: 403 });
	}
}
```

## Utilizarea în Componente

### TableView (Rânduri)

```typescript
export const TableView = memo(function TableView({ table, columns, ... }) {
  const { permissions: userPermissions } = useCurrentUserPermissions();
  const tablePermissions = useTablePermissions(
    table.id,
    userPermissions?.tablePermissions || [],
    userPermissions?.columnsPermissions || []
  );

  // Filtrează coloanele vizibile
  const visibleColumns = useMemo(() => {
    return tablePermissions.getVisibleColumns(columns);
  }, [columns, tablePermissions]);

  // Verifică accesul la tabel
  if (!tablePermissions.canReadTable()) {
    return <AccessDeniedMessage />;
  }

  return (
    <table>
      <thead>
        {visibleColumns.map(col => (
          <th key={col.id}>{col.name}</th>
        ))}
        {tablePermissions.canEditTable() && <th>Actions</th>}
      </thead>
      {/* ... restul componentei */}
    </table>
  );
});
```

### EditableCell

```typescript
export function EditableCell({ column, ... }) {
  const tablePermissions = useTablePermissions(/* ... */);
  const canEdit = tablePermissions.canEditColumn(column.id);

  if (!tablePermissions.canReadColumn(column.id)) {
    return <div>Access Denied</div>;
  }

  return (
    <div
      onDoubleClick={canEdit ? onStartEdit : undefined}
      className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
      title={!canEdit ? "No permission to edit" : "Double-click to edit"}
    >
      {/* ... conținutul celulei */}
    </div>
  );
}
```

## Gestionarea Permisiunilor

### Componenta PermissionManager

Oferă o interfață pentru administrarea permisiunilor:

```typescript
<PermissionManager
	table={table}
	columns={columns}
	onPermissionsUpdate={(permissions) => {
		// Salvează permisiunile în backend
		savePermissions(permissions);
	}}
/>
```

### Actualizarea Permisiunilor

```typescript
const handleTablePermissionChange = (field, value) => {
	const updatedPermissions = { ...editingPermissions };
	const existingPermission = updatedPermissions.tablePermissions.find(
		(tp) => tp.tableId === table.id,
	);

	if (existingPermission) {
		existingPermission[field] = value;
	} else {
		// Creează o nouă permisiune
		const newPermission = {
			id: Date.now(),
			userId: currentUserId,
			tableId: table.id,
			tenantId: currentTenantId,
			[field]: value,
			// ... alte câmpuri
		};
		updatedPermissions.tablePermissions.push(newPermission);
	}

	setEditingPermissions(updatedPermissions);
	setHasChanges(true);
};
```

## Securitate și Validare

### 1. Verificări la Nivel de Frontend

- Toate componentele verifică permisiunile înainte de afișare
- Butoanele și acțiunile sunt dezactivate pentru utilizatorii fără permisiuni
- Mesaje clare pentru utilizatorii fără acces

### 2. Verificări la Nivel de Backend

- Toate API-urile verifică permisiunile înainte de procesare
- Utilizatorii non-admin sunt restricționați la tabelele cu permisiuni
- Validarea se face la nivel de tenant pentru izolare

### 3. Izolarea Datelor

```typescript
// Verifică că tabelul aparține tenant-ului utilizatorului
const table = await prisma.table.findFirst({
	where: {
		id: Number(tableId),
		database: {
			tenantId: user.tenantId,
		},
	},
});
```

## Roluri și Permisiuni Implicite

### ADMIN

- Acces complet la toate tabelele și coloanele
- Poate gestiona permisiunile altor utilizatori
- Nu este afectat de restricțiile de permisiuni

### VIEWER

- Acces doar de citire (dacă are permisiuni)
- Nu poate edita date sau structură
- Butoanele de editare sunt dezactivate

### Utilizatori Standard

- Acces bazat pe permisiunile individuale
- Pot avea permisiuni diferite pentru fiecare tabel/coloană
- Interfața se adaptează automat la permisiunile lor

## Debugging și Monitorizare

### Logging

```typescript
console.log("Table permissions:", tablePermissions);
console.log("Column permissions:", columnPermissions);
console.log("User role:", user.role);
```

### Verificarea Permisiunilor

```typescript
// Verifică permisiunile pentru un tabel specific
const hasTableAccess = tablePermissions.hasAnyTableAccess;
const hasColumnAccess = tablePermissions.hasAnyColumnAccess;

// Verifică permisiunile pentru o coloană specifică
const canReadCol = tablePermissions.canReadColumn(columnId);
const canEditCol = tablePermissions.canEditColumn(columnId);
```

## Best Practices

### 1. Verificări Consistente

- Verifică întotdeauna permisiunile înainte de afișare
- Folosește hook-urile de permisiuni în toate componentele
- Nu te baza doar pe rolul utilizatorului

### 2. UX pentru Utilizatori

- Oferă mesaje clare când accesul este refuzat
- Dezactivează butoanele pentru acțiunile nepermise
- Folosește indicatoare vizuale pentru permisiuni

### 3. Performanță

- Memoizează verificările de permisiuni
- Filtrează datele la nivel de componentă
- Evită re-render-uri inutile

### 4. Securitate

- Verifică întotdeauna permisiunile la nivel de backend
- Validează tenant-ul pentru toate operațiunile
- Loghează încercările de acces neautorizat

## Troubleshooting

### Probleme Comune

#### 1. Coloanele nu se afișează

- Verifică dacă utilizatorul are `canRead` pentru tabel
- Verifică dacă utilizatorul are `canRead` pentru coloane
- Verifică dacă permisiunile sunt încărcate corect

#### 2. Editarea nu funcționează

- Verifică dacă utilizatorul are `canEdit` pentru tabel
- Verifică dacă utilizatorul are `canEdit` pentru coloană
- Verifică dacă rolul utilizatorului permite editarea

#### 3. Erori de permisiuni

- Verifică dacă utilizatorul aparține tenant-ului corect
- Verifică dacă permisiunile sunt salvate corect în baza de date
- Verifică dacă API-ul returnează permisiunile corecte

### Debugging

```typescript
// Adaugă în componenta cu probleme
useEffect(() => {
	console.log("Current permissions:", {
		userPermissions,
		tablePermissions,
		visibleColumns: tablePermissions.getVisibleColumns(columns),
		canReadTable: tablePermissions.canReadTable(),
		canEditTable: tablePermissions.canEditTable(),
	});
}, [userPermissions, tablePermissions, columns]);
```

## Concluzie

Sistemul de permisiuni implementat oferă:

- **Securitate granulară** la nivel de tabel și coloană
- **Interfață adaptivă** care se modifică în funcție de permisiuni
- **Validare robustă** la nivel de frontend și backend
- **Gestionare ușoară** a permisiunilor prin interfața administrativă
- **Performanță optimizată** cu verificări memoizate

Acest sistem asigură că utilizatorii pot accesa doar datele pentru care au
permisiuni, menținând în același timp o experiență de utilizare fluidă și
intuitivă.
