/** @format */

import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Column, Row, Table } from "@/types/database";
import { useEffect, useState, useCallback, useMemo } from "react";

function useTable(id: string) {
	const { token, user, tenant } = useApp();
	const { selectedDatabase } = useDatabase();
	const userId = user?.id;
	const tenantId = tenant?.id;
	const databaseId = selectedDatabase?.id;

	const [loading, setLoading] = useState(true);
	const [table, setTable] = useState<Table | null>(null);
	const [columns, setColumns] = useState<Column[] | null>(null);
	const [rows, setRows] = useState<Row[] | null>(null);

	// Memoize the fetch function to prevent unnecessary re-creates
	const fetchTable = useCallback(async () => {
		if (!token || !userId || !tenantId || !databaseId) {
			setLoading(false);
			return;
		}

		try {
			// Fetch table metadata without rows for better performance
			const res = await fetch(
				`/api/tenants/${tenantId}/databases/${databaseId}/tables/${id}?includeRows=false`,
				{
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (!res.ok) throw new Error("Failed to fetch table");

			const data = await res.json();
			setTable(data);
			setColumns(data.columns || []);

			// Don't fetch rows here - let TableEditor handle row pagination
			setRows([]);
		} catch (err) {
			console.error("Error fetching table:", err);
		} finally {
			setLoading(false);
		}
	}, [id, tenantId, databaseId, token, userId]);

	useEffect(() => {
		// Only fetch if we don't have the table data or if the ID changed
		if (!table || table.id.toString() !== id) {
			fetchTable();
		}
	}, [id, table, fetchTable]);

	// Memoize the return value to prevent unnecessary re-renders
	return useMemo(
		() => ({
			table,
			setTable,
			columns,
			setColumns,
			loading,
			rows,
			setRows,
		}),
		[table, setTable, columns, setColumns, loading, rows, setRows],
	);
}

export default useTable;
