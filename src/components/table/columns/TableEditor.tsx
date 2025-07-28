/** @format */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Table, ColumnSchema, Column, FieldMeta } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import AddColumnForm from "./AddColumnForm";
import { TableView } from "./TableView";
import useColumnsTableEditor from "@/hooks/useColumnsTableEditor";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";

interface Props {
	columns: Column[] | null;
	setColumns: (cols: Column[] | null) => void;
	table: Table;
}

export default function TableEditor({ table, columns, setColumns }: Props) {
	if (!columns) return;

	const { showAlert, token, user, tenant } = useApp();
	const [tables, setTables] = useState<Table[] | null>(null);
	const tenantId = tenant?.id;
	if (!token || !user) return;
	const [showForm, setShowForm] = useState(false);

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
				type: ["string", "number", "boolean", "date", "reference"] as const,
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
			{
				key: "referenceTableId",
				type: "string",
				required: false,
				label: "Reference Table",
				placeholder: "Select a table",
			},
		],
		[],
	);

	const { editingCell, handleCancelEdit, handleEditCell, handleSaveCell } =
		useColumnsTableEditor();

	const validateColumn = () => {
		return !columns.find((col) => col.name === newColumn?.name);
	};

	async function handleAdd(e: FormEvent) {
		e.preventDefault();
		if (!newColumn) return;

		if (!token) return console.error("No token available");

		if (!validateColumn()) {
			showAlert("This column already exists", "error");
			return;
		}
		console.log(newColumn);

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/database/tables/${table.id}/columns`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ columns: [newColumn] }),
				},
			);
			console.log(response);

			if (!response.ok) throw new Error("Failed to add column");

			const data = await response.json();

			showAlert("Column added successfully", "success");

			setColumns([...(columns || []), data.newColumn]);

			setNewColumn(null);
		} catch (error) {
			showAlert("Error adding column", "error");
		}
	}

	const handleDelete = async (columnId: string) => {
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/database/tables/${table.id}/columns/${columnId}`,
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

	useEffect(() => {
		fetchDatabase();
	}, []);

	const fetchDatabase = async () => {
		if (!tenant || !user || !token) return;
		try {
			const response = await fetch(`/api/tenants/${tenant.id}/database`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) throw new Error("Failed to fetch database");
			const data = await response.json();
			setTables(data.tables);
		} catch (error) {
			showAlert("Error loading database", "error");
		}
	};

	return (
		<div className='space-y-6'>
			<div className='w-full flex flex-col-reverse  xs:flex-row  justify-between items-center mb-4 gap-2'>
				<Button
					onClick={() => setShowForm((prev) => !prev)}
					className={`${user.role === "VIEWER" && "opacity-0"}`}>
					{showForm ? <X /> : "Add new column"}
				</Button>
				<Link href={`/home/database/table/${table.id}/rows`} className=''>
					<Button variant='outline' size='sm'>
						Edit rows
					</Button>
				</Link>
			</div>
			{showForm && (
				<AddColumnForm
					setNewColumn={setNewColumn}
					newColumn={newColumn}
					onAdd={handleAdd}
					tables={tables}
				/>
			)}
			<TableView
				tables={tables}
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
