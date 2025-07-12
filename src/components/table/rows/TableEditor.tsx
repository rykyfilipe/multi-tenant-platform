/** @format */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Table, Row } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { AddRowForm } from "./AddRowForm";
import { TableView } from "./TableView";
import { validateAndTransform } from "@/lib/utils";

interface Props {
	table: Table;
}

export default function TableEditor({ table }: Props) {
	const { showAlert, token, user } = useApp();

	const [rows, setRows] = useState<Row[]>(table.rows || []);
	const [newRow, setNewRow] = useState<Record<string, any>>({});
	const [rowId, setRowId] = useState((table.rows[rows.length - 1]?.id + 1) | 0);

	const [editingCell, setEditingCell] = useState<{
		rowId: string;
		colName: string;
	} | null>(null);

	const handleCancelEdit = () => setEditingCell(null);
	const handleEditCell = (rowId: string, colName: string) =>
		setEditingCell({ rowId, colName });

	async function handleAdd(e: FormEvent) {
		e.preventDefault();
		if (!validateAndTransform(table, newRow, rowId, setNewRow, showAlert))
			return;

		// Convert types properly
		const processedData: Record<string, any> = {};
		table.columns.forEach((col) => {
			const value = newRow[col.name];
			if (value !== undefined && value !== null && value !== "") {
				switch (col.type) {
					case "number":
						processedData[col.name] = Number(value);
						break;
					case "boolean":
						processedData[col.name] = value === "true";
						break;
					case "date":
						processedData[col.name] = new Date(value).toISOString();
						break;
					default:
						processedData[col.name] = value;
				}
			} else if (col.defaultValue) {
				processedData[col.name] = col.defaultValue;
			}
		});

		const row: Row = {
			id: rowId,
			data: processedData,
		};
		console.log(row);
		if (!token) return console.error("No token available");

		try {
			const response = await fetch(
				`/api/tenant/${user.tenantId}/database/table/${table.id}/rows`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ row }),
				},
			);
			if (!response.ok) throw new Error("Failed to add row");

			showAlert("Row added succesfuly", "success");

			setRows([...rows, row]);
			setRowId(rowId + 1);
			setNewRow({});
		} catch (error) {
			showAlert("Error at adding a row", "error");
		}
	}

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
			setRows((prevRows) => [...prevRows]);
			showAlert("Error updating row", "error");
		}
	};

	return (
		<div className='space-y-6'>
			<AddRowForm
				columns={table.columns}
				onAdd={handleAdd}
				newRow={newRow}
				setNewRow={setNewRow}
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
