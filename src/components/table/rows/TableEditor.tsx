/** @format */
"use client";

import { FormEvent, useState } from "react";
import { Table, Row, Column, RowSchema, CellSchema } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { AddRowForm } from "./AddRowForm";
import { TableView } from "./TableView";
import useRowsTableEditor from "@/hooks/useRowsTableEditor";

interface Props {
	table: Table;
	columns: Column[] | null;
	setColumns: (cols: Column[] | null) => void;

	rows: Row[] | null;
	setRows: (cols: Row[] | null) => void;
}

export default function TableEditor({
	table,
	columns,
	setColumns,
	rows,
	setRows,
}: Props) {
	if (!rows || !columns) return;

	const { showAlert, token, user } = useApp();

	if (!token || !user) return;

	const [cells, setCells] = useState<CellSchema[] | []>([]);

	const { editingCell, handleCancelEdit, handleEditCell, handleSaveCell } =
		useRowsTableEditor();

	async function handleAdd(e: FormEvent) {
		e.preventDefault();

		if (!token) return console.error("No token available");
		try {
			const response = await fetch(
				`/api/tenants/${user.tenantId}/database/tables/${table.id}/rows`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ rows: [{ cells: cells }] }),
				},
			);

			if (!response.ok) throw new Error("Failed to add row");

			const data = await response.json();
			showAlert("Row added successfully", "success");
			setRows([...(rows || []), data.newRow]);

			setCells([]);
		} catch (error) {
			showAlert("Error adding row", "error");
		}
	}

	const handleDelete = async (rowId: string) => {
		try {
			const response = await fetch(
				`/api/tenants/${user.tenantId}/database/tables/${table.id}/rows/${rowId}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) throw new Error("Failed to delete row");

			const updatedRows: Row[] = rows.filter((col) => col.id !== Number(rowId));
			setRows(updatedRows);
			showAlert("Row deleted successfully", "success");
		} catch (error) {
			showAlert("Error deleting row", "error");
		}
	};

	const handleSaveCellWrapper = (
		columnId: string,
		rowId: string,
		cellId: string,
		value: any,
	) => {
		handleSaveCell(
			columnId,
			rowId,
			cellId,
			value,
			table,
			token,
			user,
			showAlert,
		);
	};

	return (
		<div className='space-y-6'>
			<AddRowForm
				columns={columns}
				cells={cells}
				setCells={setCells}
				onAdd={handleAdd}
			/>

			<TableView
				table={table}
				columns={columns}
				rows={rows}
				editingCell={editingCell}
				onEditCell={handleEditCell}
				onSaveCell={handleSaveCellWrapper}
				onCancelEdit={handleCancelEdit}
				onDeleteRow={handleDelete}
			/>
		</div>
	);
}
