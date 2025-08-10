/** @format */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Column, Row } from "@/types/database";
import { useApp } from "@/contexts/AppContext";

interface UseOptimizedTableProps {
	tableId: string;
	databaseId: string;
}

interface OptimizedTableState {
	table: Table | null;
	columns: Column[] | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

export function useOptimizedTable({
	tableId,
	databaseId,
}: UseOptimizedTableProps): OptimizedTableState {
	const { token, tenant } = useApp();
	const [table, setTable] = useState<Table | null>(null);
	const [columns, setColumns] = useState<Column[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTable = useCallback(async () => {
		if (!token || !tenant?.id || !tableId || !databaseId) {
			setLoading(false);
			return;
		}

		// Don't refetch if we already have the data
		if (table && table.id.toString() === tableId && columns) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/tenants/${tenant.id}/databases/${databaseId}/tables/${tableId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			if (!response.ok) {
				throw new Error("Failed to fetch table");
			}

			const data = await response.json();
			setTable(data);

			// Sort columns by order for consistent display
			const sortedColumns = data.columns?.sort(
				(a: Column, b: Column) => a.order - b.order,
			) || [];
			setColumns(sortedColumns);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Unknown error";
			setError(errorMessage);
			console.error("Error fetching table:", err);
		} finally {
			setLoading(false);
		}
	}, [token, tenant?.id, tableId, databaseId, table?.id]);

	// Memoized refetch function to avoid unnecessary re-renders
	const refetch = useCallback(async () => {
		setTable(null);
		setColumns(null);
		await fetchTable();
	}, [fetchTable]);

	useEffect(() => {
		fetchTable();
	}, [fetchTable]);

	// Memoized return value to prevent unnecessary re-renders
	const returnValue = useMemo(
		() => ({
			table,
			columns,
			loading,
			error,
			refetch,
		}),
		[table, columns, loading, error, refetch],
	);

	return returnValue;
}
