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
	const [refreshTrigger, setRefreshTrigger] = useState(0);

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
			console.log("🔍 useTable - Table data loaded:", {
				table: data,
				hasColumns: !!data.columns,
				columnsLength: data.columns?.length,
				tableId: data.id
			});
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

	// Function to refresh table data
	const refreshTable = useCallback(() => {
		setRefreshTrigger(prev => prev + 1);
	}, []);

	useEffect(() => {
		// Fetch table data when ID changes, table is missing, or refresh is triggered
		if (!table || table.id.toString() !== id || refreshTrigger > 0) {
			fetchTable();
		}
	}, [id, table, fetchTable, refreshTrigger]);

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
			refreshTable,
		}),
		[table, setTable, columns, setColumns, loading, rows, setRows, refreshTable],
	);
}

export default useTable;
