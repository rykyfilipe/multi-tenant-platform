import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface CachedTableMeta {
	id: number
	name: string
	description?: string | null
	_count?: { columns?: number; rows?: number }
}

export interface CachedColumnMeta {
	id: number
	name: string
	type: string
	isRequired: boolean
}

interface CacheEntry<T> {
	value: T
	expireAt: number
}

const TABLES_TTL_MS = 60_000
const COLUMNS_TTL_MS = 60_000

const tablesCache = new Map<string, CacheEntry<CachedTableMeta[]>>()
const columnsCache = new Map<string, CacheEntry<CachedColumnMeta[]>>()

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, init)
	if (!res.ok) {
		throw new Error(`Request failed ${res.status}: ${await res.text()}`)
	}
	return res.json() as Promise<T>
}

function cacheKeyTables(tenantId: number, databaseId: number) {
	return `${tenantId}:${databaseId}:tables`
}

function cacheKeyColumns(tenantId: number, databaseId: number, tableId: number) {
	return `${tenantId}:${databaseId}:table:${tableId}:columns`
}

export function invalidateTables(tenantId: number, databaseId: number) {
	tablesCache.delete(cacheKeyTables(tenantId, databaseId))
}

export function invalidateColumns(tenantId: number, databaseId: number, tableId: number) {
	columnsCache.delete(cacheKeyColumns(tenantId, databaseId, tableId))
}

export function useSchemaCache(tenantId: number, databaseId: number) {
	console.log('[useSchemaCache] Initialized with:', {
		tenantId,
		databaseId,
		hasTenantId: !!tenantId,
		hasDatabaseId: !!databaseId
	});
	
	const [tables, setTables] = useState<CachedTableMeta[] | null>(null)
	const [tablesLoading, setTablesLoading] = useState(false)
	const [tablesError, setTablesError] = useState<string | null>(null)

	const loadTables = useCallback(async () => {
		console.log('[useSchemaCache] loadTables called:', {
			tenantId,
			databaseId,
			hasTenantId: !!tenantId,
			hasDatabaseId: !!databaseId
		});
		
		if (!tenantId || !databaseId) {
			console.log('[useSchemaCache] Missing tenantId or databaseId, returning');
			return;
		}
		const key = cacheKeyTables(tenantId, databaseId)
		const now = Date.now()
		const cached = tablesCache.get(key)
		if (cached && cached.expireAt > now) {
			setTables(cached.value)
			return
		}
		setTablesLoading(true)
		setTablesError(null)
		try {
		// Prefer tenant API; fall back to dev API if unauthorized
		let data: { tables: CachedTableMeta[] } | null = null
		try {
			const res = await fetch(`/api/tenants/${tenantId}/databases/${databaseId}/tables?includePredefined=true`)
			if (res.ok) {
				data = await res.json()
			} else if (res.status === 401 || res.status === 403) {
				console.warn('[useSchemaCache] Auth blocked, falling back to /api/dev/tables')
				data = await fetchJSON<{ tables: CachedTableMeta[] }>(`/api/dev/tables`)
			} else {
				throw new Error(`Tables request failed ${res.status}`)
			}
			} catch (err) {
				console.warn('[useSchemaCache] Primary tables request failed, trying /api/dev/tables', err)
				data = await fetchJSON<{ tables: CachedTableMeta[] }>(`/api/dev/tables`)
			}
			tablesCache.set(key, { value: data?.tables ?? [], expireAt: now + TABLES_TTL_MS })
			setTables(data?.tables ?? [])
		} catch (e) {
			setTablesError(e instanceof Error ? e.message : 'Failed to load tables')
		} finally {
			setTablesLoading(false)
		}
	}, [tenantId, databaseId])

	useEffect(() => {
		loadTables()
	}, [loadTables])

	const getColumns = useCallback(async (tableId: number): Promise<CachedColumnMeta[]> => {
		if (!tenantId || !databaseId || !tableId) return []
		const key = cacheKeyColumns(tenantId, databaseId, tableId)
		const now = Date.now()
		const cached = columnsCache.get(key)
		if (cached && cached.expireAt > now) {
			return cached.value
		}
		const data = await fetchJSON<{ success: boolean; columns: CachedColumnMeta[] }>(`/api/dev/tables/${tableId}/columns`)
		columnsCache.set(key, { value: data.columns ?? [], expireAt: now + COLUMNS_TTL_MS })
		return data.columns ?? []
	}, [tenantId, databaseId])

	const invalidate = useCallback(() => {
		invalidateTables(tenantId, databaseId)
	}, [tenantId, databaseId])

	// Don't auto-load tables - let components control when to load

	return {
		tables,
		tablesLoading,
		tablesError,
		loadTables,
		getColumns,
		invalidate,
		columns: [], // Add empty columns array as fallback
	}
}
