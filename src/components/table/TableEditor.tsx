/** @format */
"use client";

import { useEffect, useState } from "react";
import { Table, Row } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { AddRowForm } from "./AddRowForm";
import { TableView } from "./TableView";

interface Props {
	table: Table;
}

export default function TableEditor({ table }: Props) {
	const { showAlert, token, user } = useApp();

	const [rows, setRows] = useState<Row[]>(table.rows || []);
	const [editingCell, setEditingCell] = useState<{
		rowId: string;
		colName: string;
	} | null>(null);

	const handleAdd = (row: Row) => setRows((r) => [...r, row]);
	const handleDelete = async (id: string) => {
		try {
			const response = await fetch(
				`/api/tenant/${user.tenantId}/database/table/${table.id}/rows?rowId=${id}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				},
			);
			if (!response.ok) throw new Error("Failed to delete row");

			setRows((r) => r.filter((x) => x["id"].toFixed(0) !== id));
			showAlert("Row deleted", "success");
		} catch (error) {
			showAlert("Eroare la stergere", "error");
		}
	};

	const handleEditCell = (rowId: string, colName: string) =>
		setEditingCell({ rowId, colName });

	const handleSaveCell = async (rowId: string, colName: string, value: any) => {
		try {
			setRows((prevRows) =>
				prevRows.map((row) =>
					row.id.toFixed(0) === rowId
						? { ...row, data: { ...row.data, [colName]: value } }
						: row,
				),
			);

			const updatedRow = rows.find((row) => row.id.toFixed(0) === rowId);
			if (!updatedRow) {
				throw new Error("Row not found");
			}

			const response = await fetch(
				`/api/tenant/${user.tenantId}/database/table/${table.id}/rows`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ updatedRow }),
				},
			);

			if (!response.ok) throw new Error("Failed to update row");

			showAlert("Row updated successfully", "success");
			setEditingCell(null);
		} catch (error) {
			setRows((prevRows) => [...prevRows]); // Force re-render with original data
			showAlert("Error updating row", "error");
			console.error("Update error:", error);
		}
	};
	const handleCancelEdit = () => setEditingCell(null);

	return (
		<div className='space-y-6'>
			<AddRowForm
				columns={table.columns}
				onAdd={handleAdd}
				rows={rows}
				setRows={setRows}
				table={table}
			/>
			<TableView
				table={table}
				rows={rows}
				editingCell={editingCell}
				onEditCell={handleEditCell}
				onSaveCell={handleSaveCell}
				onCancelEdit={handleCancelEdit}
				onDeleteRow={handleDelete}
			/>
		</div>
	);
}
