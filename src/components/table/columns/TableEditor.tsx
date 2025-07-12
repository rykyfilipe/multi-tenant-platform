/** @format */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { Table, ColumnSchema, Column, FieldMeta } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import AddColumnForm from "./AddColumnForm";
import { TableView } from "./TableView";
import useColumnsTableEditor from "@/hooks/useColumnsTableEditor";

interface Props {
	columns: Column[] | null;
	setColumns: (cols: Column[] | null) => void;
	table: Table;
}

export default function TableEditor({ table, columns, setColumns }: Props) {
	if (!columns) return;

	const { showAlert, token, user } = useApp();

	if (!token || !user) return;

	const [newColumn, setNewColumn] = useState<ColumnSchema | null>(null);

	const columnSchemaMeta: FieldMeta[] = useMemo(
		() => [
			{
				key: "name",
				type: "string",
				required: true,
				label: "Column Name",
				placeholder: "Enter column name",
			},
			{
				key: "type",
				type: ["string", "number", "boolean", "date"] as const,
				required: true,
				label: "Data Type",
			},
			{
				key: "required",
				type: "boolean",
				required: false,
				label: "Required",
			},
			{
				key: "primary",
				type: "boolean",
				required: false,
				label: "Primary Key",
			},
			{
				key: "autoIncrement",
				type: "boolean",
				required: false,
				label: "Auto Increment",
			},
		],
		[],
	);

	const { editingCell, handleCancelEdit, handleEditCell, handleSaveCell } =
		useColumnsTableEditor();

	async function handleAdd(e: FormEvent) {
		e.preventDefault();
		if (!newColumn) return;

		if (!token) return console.error("No token available");

		try {
			const response = await fetch(
				`/api/tenants/${user.tenantId}/database/tables/${table.id}/columns`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ columns: [newColumn] }),
				},
			);

			if (!response.ok) throw new Error("Failed to add column");

			const addedColumn = await response.json();
			showAlert("Column added successfully", "success");

			setColumns([...(columns || []), ...addedColumn]);

			setNewColumn(null);
		} catch (error) {
			showAlert("Error adding column", "error");
		}
	}

	const handleDelete = async (columnId: string) => {
		try {
			const response = await fetch(
				`/api/tenants/${user.tenantId}/database/tables/${table.id}/columns/${columnId}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) throw new Error("Failed to delete column");

			const updatedColumns: Column[] = columns.filter(
				(col) => col.id !== Number(columnId),
			);
			setColumns(updatedColumns);
			showAlert("Column deleted successfully", "success");
		} catch (error) {
			showAlert("Error deleting column", "error");
		}
	};

	const handleSaveCellWrapper = (
		columnId: string,
		fieldName: keyof ColumnSchema,
		value: any,
	) => {
		handleSaveCell(
			columnId,
			fieldName,
			value,
			columns,
			setColumns,
			table,
			token,
			user,
			showAlert,
		);
	};

	return (
		<div className='space-y-6'>
			<AddColumnForm
				setNewColumn={setNewColumn}
				newColumn={newColumn}
				onAdd={handleAdd}
				columnSchemaMeta={columnSchemaMeta}
			/>

			<TableView
				columnSchemaMeta={columnSchemaMeta}
				columns={columns || []}
				editingCell={editingCell}
				onEditCell={handleEditCell}
				onSaveCell={handleSaveCellWrapper}
				onCancelEdit={handleCancelEdit}
				onDeleteColumn={handleDelete}
			/>
		</div>
	);
}
