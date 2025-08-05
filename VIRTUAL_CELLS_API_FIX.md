# Fix pentru API-ul Celulelor Virtuale

## Problema

Când userul încerca să editeze o celulă goală (care nu există în baza de date), sistemul încerca să creeze o celulă nouă prin endpoint-ul `/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows/[rowId]/cell`, dar acest endpoint nu exista, rezultând în eroarea 404.

## Eroarea

```
404 Failed to load resource: the server responded with a status of 404 (Not Found)
Could not parse error response: TypeError: Failed to execute 'text' on 'Response': body stream already read
```

## Soluția Implementată

### 1. Crearea Endpoint-ului pentru Celule Noi

#### Fișier: `src/app/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows/[rowId]/cell/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
import { z } from "zod";

const CellCreateSchema = z.object({
	columnId: z.number(),
	value: z.any(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string; tableId: string; rowId: string }> }
) {
	const { tenantId, databaseId, tableId, rowId } = await params;
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (role === "VIEWER" || !isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const body = await request.json();
		const parsedData = CellCreateSchema.parse(body);
		const { columnId, value } = parsedData;

		// Verificări de securitate și validare
		// ... (verificări pentru database, row, column, permisiuni)

		// Creează celula nouă
		const newCell = await prisma.cell.create({
			data: {
				rowId: Number(rowId),
				columnId: Number(columnId),
				value: value,
			},
		});

		return NextResponse.json(newCell, { status: 201 });
	} catch (error) {
		console.error("Error creating cell:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
```

### 2. Corectarea Hook-ului pentru Celule Virtuale

#### Fișier: `src/hooks/useRowsTableEditor.ts`

```typescript
// Pentru celulele virtuale (care nu există încă), creăm o celulă nouă
if (cellId === "virtual") {
	const url = `/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/${rowId}/cell`;
	const requestBody = {
		columnId: parseInt(columnId),
		value,
	};
	
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(requestBody),
	});
	
	if (!response.ok) {
		// Gestionarea erorilor
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
		} catch (parseError) {
			try {
				const textError = await response.text();
				errorMessage = textError || errorMessage;
			} catch (textParseError) {
				console.error("Could not parse error response:", textParseError);
			}
		}
		throw new Error(errorMessage);
	}

	let newCell;
	try {
		newCell = await response.json();
	} catch (parseError) {
		console.error("Could not parse success response:", parseError);
		throw new Error("Invalid response format");
	}
	
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

### 3. Autentificarea Corectă

#### Problema Inițială
Endpoint-ul folosea `getServerSession(authOptions)` pentru autentificare, dar hook-ul trimitea un token Bearer.

#### Soluția
Endpoint-ul a fost modificat să folosească aceeași metodă de autentificare ca celelalte endpoint-uri:
- `verifyLogin(request)` - verifică dacă token-ul este valid
- `getUserFromRequest(request)` - extrage userId și role din token
- `checkUserTenantAccess(userId, tenantId)` - verifică accesul la tenant

### 4. Validarea cu Zod

#### Schema de Validare
```typescript
const CellCreateSchema = z.object({
	columnId: z.number(),
	value: z.any(),
});
```

#### Beneficii
- Validare strictă a tipurilor de date
- Mesaje de eroare clare
- Prevenirea erorilor de runtime

## Verificări de Securitate

### 1. Autentificare
- Verifică dacă userul este autentificat
- Verifică dacă token-ul este valid

### 2. Autorizare
- Verifică dacă userul aparține tenant-ului
- Verifică dacă userul nu este VIEWER
- Verifică permisiunile pentru tabel (pentru non-admin)

### 3. Validare
- Verifică dacă database-ul există și aparține tenant-ului
- Verifică dacă rândul există
- Verifică dacă coloana există
- Verifică dacă celula nu există deja

## Fluxul de Funcționare

### 1. User Face Click pe Celulă Goală
- Celula afișează "Click to add value"
- User face click pentru a edita

### 2. Sistemul Detectează Celula Virtuală
- `cellId === "virtual"` în hook
- Se trimite cererea POST la endpoint-ul nou

### 3. Endpoint-ul Procesează Cererea
- Validează autentificarea
- Verifică permisiunile
- Creează celula în baza de date
- Returnează celula nouă

### 4. UI Se Actualizează
- Hook-ul primește celula nouă
- Actualizează lista de rânduri
- Afișează mesaj de succes

## Testare

### Test Cases
1. **Celulă goală**: Verifică că se creează celulă nouă
2. **Autentificare**: Verifică că userul neautentificat primește 401
3. **Permisiuni**: Verifică că VIEWER primește 401
4. **Validare**: Verifică că datele invalide primește 400
5. **Duplicare**: Verifică că celula duplicată primește 409

### Scenarii de Test
- User autentificat editează celulă goală
- User neautentificat încearcă să editeze
- User VIEWER încearcă să editeze
- Celulă cu date invalide
- Celulă care există deja

## Beneficii

### 1. Funcționalitate Completă
- Userii pot edita orice celulă goală
- Sistemul gestionează automat crearea celulelor noi

### 2. Securitate
- Autentificare și autorizare complete
- Validare strictă a datelor
- Verificări de permisiuni

### 3. Experiență Utilizator
- Feedback vizual clar
- Mesaje de eroare descriptive
- Actualizare automată a UI-ului 