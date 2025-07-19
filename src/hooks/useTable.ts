/** @format */

import { useApp } from "@/contexts/AppContext";
import { Column, Row, Table } from "@/types/database";
import { useEffect, useState } from "react";

function useTable(id: string) {
	const { token, user, tenant } = useApp();
	const userId = user?.id;
	const tenantId = tenant?.id;

	const [loading, setLoading] = useState(true);
	const [table, setTable] = useState<Table | null>(null);
	const [columns, setColumns] = useState<Column[] | null>(null);
	const [rows, setRows] = useState<Row[] | null>(null);

	useEffect(() => {
		if (!token || !userId || !tenantId) return;

		const fetchTable = async () => {
			try {
				const res = await fetch(
					`/api/tenants/${tenantId}/database/tables/${id}`,
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

		fetchTable();
	}, [id, tenantId, token, userId]);

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
