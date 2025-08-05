/** @format */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Table, CreateColumnRequest, Column } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import AddColumnForm from "./AddColumnForm";
import { TableView } from "./TableView";
import useColumnsTableEditor from "@/hooks/useColumnsTableEditor";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";
import { useTour } from "@reactour/tour";

interface Props {
	columns: Column[] | null;
	setColumns: (cols: Column[] | null) => void;
	table: Table;
}

export default function TableEditor({ table, columns, setColumns }: Props) {
	if (!columns) return;

	const { showAlert, token, user, tenant, loading } = useApp();
	const [tables, setTables] = useState<Table[] | null>(null);
	const tenantId = tenant?.id;
	if (!token || !user) return;
	const [showForm, setShowForm] = useState(false);

	const [newColumn, setNewColumn] = useState<CreateColumnRequest | null>(null);

	const columnSchemaMeta = useMemo(
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

	const {
		editingCell,
		handleCancelEdit,
		handleEditCell,
		handleSaveCell,
		handleDeleteColumn,
	} = useColumnsTableEditor();

	const validateColumn = () => {
		return !columns.find((col) => col.name === newColumn?.name);
	};

	async function handleAdd(e: FormEvent) {
		e.preventDefault();
		if (!newColumn) return;

		if (!token) return console.error("No token available");

		if (!validateColumn()) {
			showAlert(
				"A column with this name already exists. Please choose a different name.",
				"error",
			);
			return;
		}
		// Debug logging removed for production

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ columns: [newColumn] }),
				},
			);
			// Debug logging removed for production

			if (!response.ok) throw new Error("Failed to add column");

			const data = await response.json();
			// Data received

			showAlert(
				"Column added successfully! You can now start adding data.",
				"success",
			);

			// Handle both single column and array of columns
			const newColumns = Array.isArray(data) ? data : [data];
			setColumns([...(columns || []), ...newColumns]);
			setNewColumn(null);
		} catch (error) {
			showAlert(
				"Failed to add column. Please check your configuration and try again.",
				"error",
			);
		}
	}

	const handleDeleteWrapper = (columnId: string) => {
		handleDeleteColumn(columnId, columns, setColumns, table, token, showAlert);
	};

	const handleSaveCellWrapper = (
		columnId: string,
		fieldName: keyof Column,
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
			const response = await fetch(`/api/tenants/${tenant.id}/databases`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) throw new Error("Failed to fetch databases");
			const data = await response.json();
			if (data && data.length > 0) {
				// Găsim baza de date care conține tabela curentă
				const currentDatabase = data.find((db: any) =>
					db.tables.some((t: any) => t.id === table.id),
				);
				if (currentDatabase) {
					setTables(currentDatabase.tables || []);
				}
			}
		} catch (error) {
			showAlert(
				"Failed to load database information. Please refresh the page.",
				"error",
			);
		}
	};
	const { setIsOpen, setCurrentStep, isOpen, currentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		setTimeout(() => {
			const seen = localStorage.getItem("columns-editor-tour-seen");
			if (!seen) {
				localStorage.setItem("columns-editor-tour-seen", "true");
				// Demo column creation removed for production
				startTour();
			}
		}, 3000);
	}, [loading]);
	// Demo column cleanup removed for production
	return (
		<div className='space-y-6'>
			{/* Header Actions */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div className='flex items-center space-x-3'>
					<Button
						onClick={() => setShowForm((prev) => !prev)}
						className={`add-column-button ${
							user.role === "VIEWER" ? "opacity-0 pointer-events-none" : ""
						}`}>
						{showForm ? <X className='w-4 h-4' /> : "Add Column"}
					</Button>
					{showForm && (
						<span className='text-sm text-muted-foreground'>
							Fill in the form below to add a new column
						</span>
					)}
				</div>
				<Link
					href={`/home/database/table/${table.id}/rows`}
					className='rows-button'>
					<Button variant='outline' size='sm'>
						Manage Rows
					</Button>
				</Link>
			</div>

			{/* Add Column Form */}
			{showForm && (
				<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-6'>
					<AddColumnForm
						setNewColumn={setNewColumn}
						newColumn={newColumn}
						onAdd={handleAdd}
						tables={tables}
						existingColumns={columns}
					/>
				</div>
			)}

			{/* Columns Table */}
			<div className='table-content'>
				<TableView
					tables={tables}
					columns={columns || []}
					editingCell={editingCell}
					onEditCell={handleEditCell}
					onSaveCell={handleSaveCellWrapper}
					onCancelEdit={handleCancelEdit}
					onDeleteColumn={handleDeleteWrapper}
				/>
			</div>
		</div>
	);
}
