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
	const [tables, setTables] = useState<CachedTableMeta[] | null>(null)
	const [tablesLoading, setTablesLoading] = useState(false)
	const [tablesError, setTablesError] = useState<string | null>(null)

	const loadTables = useCallback(async () => {
		if (!tenantId || !databaseId) return
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
			// Use dev API for now since we don't have authentication set up
			const data = await fetchJSON<{ tables: CachedTableMeta[] }>(`/api/dev/tables`)
			tablesCache.set(key, { value: data.tables ?? [], expireAt: now + TABLES_TTL_MS })
			setTables(data.tables ?? [])
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
		const data = await fetchJSON<{ columns: CachedColumnMeta[] }>(`/api/dev/tables/${tableId}/columns`)
		columnsCache.set(key, { value: data.columns ?? [], expireAt: now + COLUMNS_TTL_MS })
		return data.columns ?? []
	}, [tenantId, databaseId])

	const invalidate = useCallback(() => {
		invalidateTables(tenantId, databaseId)
	}, [tenantId, databaseId])

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
