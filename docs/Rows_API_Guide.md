<!-- @format -->

# Rows API Guide

Această ghidă documentează noile rute API pentru gestionarea rândurilor din
tabele, inclusiv filtrarea avansată și exportul de date.

## Endpoints

### 1. Crearea Rândurilor (POST)

**Endpoint:**
`/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows`

**Descriere:** Creează rânduri noi în tabel (single sau bulk import).

**Metodă:** POST

**Body pentru single row:**

```json
{
	"cells": [
		{
			"columnId": 1,
			"value": "Valoare text"
		},
		{
			"columnId": 2,
			"value": 42
		}
	]
}
```

**Body pentru bulk import:**

```json
{
	"rows": [
		{
			"cells": [
				{
					"columnId": 1,
					"value": "Rând 1"
				}
			]
		},
		{
			"cells": [
				{
					"columnId": 1,
					"value": "Rând 2"
				}
			]
		}
	]
}
```

**Răspuns:**

```json
{
	"message": "Row created successfully",
	"row": {
		"id": 123,
		"tableId": 1
	}
}
```

### 2. Fetch-ul Simplu de Rânduri (GET)

**Endpoint:**
`/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows`

**Descriere:** Returnează rândurile din tabel cu paginare simplă, fără filtrare.

**Metodă:** GET

**Query Parameters:**

- `page` (optional): Numărul paginii (default: 1)
- `pageSize` (optional): Dimensiunea paginii (default: 25, max: 100)
- `includeCells` (optional): Include celulele (default: true)

**Exemplu:**

```
GET /api/tenants/1/databases/1/tables/1/rows?page=1&pageSize=50&includeCells=true
```

**Răspuns:**

```json
{
	"data": [
		{
			"id": 1,
			"tableId": 1,
			"cells": [
				{
					"columnId": 1,
					"value": "Valoare",
					"column": {
						"id": 1,
						"name": "Nume",
						"type": "text",
						"order": 1
					}
				}
			]
		}
	],
	"pagination": {
		"page": 1,
		"pageSize": 50,
		"totalRows": 100,
		"totalPages": 2,
		"hasNext": true,
		"hasPrev": false
	}
}
```

### 3. Fetch-ul cu Filtrare Avansată (GET)

**Endpoint:**
`/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows/filtered`

**Descriere:** Returnează rândurile filtrate cu suport pentru filtre complexe și
căutare globală.

**Metodă:** GET

**Query Parameters:**

- `page` (optional): Numărul paginii (default: 1)
- `pageSize` (optional): Dimensiunea paginii (default: 25, max: 100)
- `includeCells` (optional): Include celulele (default: true)
- `globalSearch` (optional): Căutare globală în toate coloanele
- `filters` (optional): Array JSON cu filtre (URL encoded)
- `sortBy` (optional): Criteriul de sortare (default: "id")
- `sortOrder` (optional): Ordinea de sortare (default: "asc")

**Exemplu de filtre:**

```json
[
	{
		"columnId": 1,
		"operator": "contains",
		"value": "text"
	},
	{
		"columnId": 2,
		"operator": "greater_than",
		"value": 100
	},
	{
		"columnId": 3,
		"operator": "between",
		"value": "2024-01-01",
		"secondValue": "2024-12-31"
	}
]
```

**Operatori suportați:**

**Pentru text:**

- `contains`: Conține text
- `equals`: Este egal cu
- `starts_with`: Începe cu
- `ends_with`: Se termină cu
- `is_empty`: Este gol
- `is_not_empty`: Nu este gol

**Pentru numere:**

- `equals`: Este egal cu
- `greater_than`: Mai mare decât
- `greater_than_or_equal`: Mai mare sau egal cu
- `less_than`: Mai mic decât
- `less_than_or_equal`: Mai mic sau egal cu
- `between`: Între două valori
- `not_between`: Nu este între două valori

**Pentru date:**

- `equals`: Este egal cu
- `greater_than`: După data
- `less_than`: Înainte de data
- `between`: Între două date
- `today`: Astăzi
- `yesterday`: Ieri
- `this_week`: Această săptămână
- `this_month`: Această lună
- `this_year`: Acest an

**Exemplu de request:**

```
GET /api/tenants/1/databases/1/tables/1/rows/filtered?page=1&pageSize=25&globalSearch=test&filters=%5B%7B%22columnId%22%3A1%2C%22operator%22%3A%22contains%22%2C%22value%22%3A%22text%22%7D%5D
```

### 4. Exportul de Date (GET)

**Endpoint:**
`/api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows/export`

**Descriere:** Exportă rândurile filtrate în format JSON sau CSV.

**Metodă:** GET

**Query Parameters:**

- `format` (optional): Formatul de export (json, csv) (default: json)
- `globalSearch` (optional): Căutare globală
- `filters` (optional): Array JSON cu filtre (URL encoded)
- `limit` (optional): Limita de rânduri (default: 10000, max: 10000)

**Exemplu:**

```
GET /api/tenants/1/databases/1/tables/1/rows/export?format=csv&globalSearch=test
```

**Răspuns CSV:**

- Returnează un fișier CSV cu header-ul `Content-Disposition` pentru download
- Numele fișierului: `{table_name}_export.csv`

**Răspuns JSON:**

```json
{
	"table": {
		"id": 1,
		"name": "Tabel Test"
	},
	"exportInfo": {
		"format": "json",
		"totalRows": 50,
		"filters": {
			"applied": [],
			"globalSearch": "test"
		},
		"exportedAt": "2024-01-15T10:30:00.000Z"
	},
	"data": [
		{
			"id": 1,
			"Nume": "Test 1",
			"Valoare": 100
		}
	]
}
```

## Utilizarea în Frontend

### Exemplu de filtrare cu React:

```typescript
import { useState, useEffect } from "react";

interface Filter {
	columnId: number;
	operator: string;
	value: any;
	secondValue?: any;
}

const useFilteredRows = (
	tenantId: string,
	databaseId: string,
	tableId: string,
) => {
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({});

	const fetchFilteredRows = async (
		page: number = 1,
		pageSize: number = 25,
		filters: Filter[] = [],
		globalSearch: string = "",
	) => {
		setLoading(true);
		try {
			const filtersParam = encodeURIComponent(JSON.stringify(filters));
			const url = `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows/filtered?page=${page}&pageSize=${pageSize}&globalSearch=${globalSearch}&filters=${filtersParam}`;

			const response = await fetch(url);
			const data = await response.json();

			setRows(data.data);
			setPagination(data.pagination);
		} catch (error) {
			console.error("Error fetching filtered rows:", error);
		} finally {
			setLoading(false);
		}
	};

	return { rows, pagination, loading, fetchFilteredRows };
};
```

### Exemplu de export:

```typescript
const exportData = async (format: "json" | "csv" = "json") => {
	try {
		const filtersParam = encodeURIComponent(JSON.stringify(filters));
		const url = `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows/export?format=${format}&globalSearch=${globalSearch}&filters=${filtersParam}`;

		if (format === "csv") {
			// Pentru CSV, folosim window.open pentru download
			window.open(url, "_blank");
		} else {
			// Pentru JSON, facem fetch normal
			const response = await fetch(url);
			const data = await response.json();
			console.log("Exported data:", data);
		}
	} catch (error) {
		console.error("Error exporting data:", error);
	}
};
```

## Securitate și Permisiuni

- Toate rutele verifică autentificarea utilizatorului
- Se verifică accesul la tenant și baza de date
- Pentru utilizatorii non-admin, se verifică permisiunile specifice:
  - `canRead` pentru fetch și export
  - `canCreate` pentru crearea rândurilor
  - `canDelete` pentru ștergerea rândurilor

## Limitări și Considerații

- **Paginare:** Maximum 100 rânduri per pagină
- **Export:** Maximum 10,000 rânduri per export
- **Filtre:** Suportă filtre complexe cu AND logic
- **Performanță:** Filtrele sunt optimizate pentru baze de date mari
- **Caching:** Se recomandă implementarea de caching pentru query-urile
  frecvente

## Gestionarea Erorilor

Toate rutele returnează erori standardizate:

```json
{
	"error": "Descrierea erorii",
	"status": 400
}
```

**Coduri de status comune:**

- `200`: Succes
- `201`: Creat cu succes
- `400`: Bad Request (parametri invalizi)
- `401`: Neautorizat
- `403`: Acces interzis
- `404`: Nu găsit
- `500`: Eroare internă server
