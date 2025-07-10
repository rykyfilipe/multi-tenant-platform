/** @format */
"use client";

import { useState } from "react";
import { Table, Row } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { AddRowForm } from "./AddRowForm";
import { TableView } from "./TableView";

interface Props {
	table: Table;
}

export default function TableEditor({ table }: Props) {
	const { showAlert } = useApp();
	console.log(table);
	const [rows, setRows] = useState<Row[]>(table.rows || []);
	const [editingCell, setEditingCell] = useState<{
		rowId: string;
		colName: string;
	} | null>(null);

	const handleAdd = (row: Row) => setRows((r) => [...r, row]);
	const handleDelete = (id: string) => {
		setRows((r) => r.filter((x) => x["id"].toFixed(2) !== id));
		showAlert("Row deleted", "success");
	};
	const handleEditCell = (rowId: string, colName: string) =>
		setEditingCell({ rowId, colName });
	const handleSaveCell = (rowId: string, colName: string, value: any) => {
		setRows((r) =>
			r.map((row) =>
				row["id"].toFixed(2) === rowId
					? { ...row, data: { ...row.data, [colName]: value } }
					: row,
			),
		);
		setEditingCell(null);
		showAlert("Cell updated", "success");
	};
	const handleCancelEdit = () => setEditingCell(null);

	return (
		<div className='space-y-6'>
			<AddRowForm
				columns={table.columns.create}
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
