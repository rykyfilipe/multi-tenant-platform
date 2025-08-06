/** @format */

import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Column, Row, Table } from "@/types/database";
import { useEffect, useState } from "react";

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

	useEffect(() => {
		if (!token || !userId || !tenantId || !databaseId) return;

		const fetchTable = async () => {
			try {
				const res = await fetch(
					`/api/tenants/${tenantId}/databases/${databaseId}/tables/${id}`,
					{
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				if (!res.ok) throw new Error("Failed to fetch table");

				const data = await res.json();
				setTable(data);
				setColumns(data.columns || []);
				setRows(data.rows || []);
			} catch (err) {
				console.error("Error fetching table:", err);
			} finally {
				setLoading(false);
			}
		};

		// Only fetch if we don't have the table data or if the ID changed
		if (!table || table.id.toString() !== id) {
			fetchTable();
		}
	}, [id, tenantId, databaseId, token, userId, table]);

	return {
		table,
		setTable,
		columns,
		setColumns,
		loading,
		rows,
		setRows,
	};
}

export default useTable;
