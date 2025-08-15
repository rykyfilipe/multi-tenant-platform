/** @format */
"use client";

import { FormEvent, useEffect, useState, useCallback, useMemo, memo } from "react";
import { Table, CreateColumnRequest, Column } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import AddColumnForm from "./AddColumnForm";
import { TableView } from "./TableView";
import { ColumnOrderManager } from "./ColumnOrderManager";
import { TableHeaderEditor } from "../TableHeaderEditor";
import useColumnsTableEditor from "@/hooks/useColumnsTableEditor";
import { useDatabaseRefresh } from "@/hooks/useDatabaseRefresh";
import { Button } from "@/components/ui/button";
import { X, Move } from "lucide-react";
import Link from "next/link";
import { useTour } from "@reactour/tour";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";

interface Props {
	columns: Column[] | null;
	setColumns: (cols: Column[] | null) => void;
	table: Table;
}

export default function TableEditor({ table, columns, setColumns }: Props) {
	if (!columns) return;

	const { showAlert, token, user, tenant, loading } = useApp();
	const [tables, setTables] = useState<Table[] | null>(null);
	const [currentTable, setCurrentTable] = useState<Table>(table);
	const tenantId = tenant?.id;
	if (!token || !user) return;
	const [showForm, setShowForm] = useState(false);
	const [showOrderManager, setShowOrderManager] = useState(false);

	const [newColumn, setNewColumn] = useState<CreateColumnRequest | null>(null);

	// Verificăm permisiunile utilizatorului
	const { permissions: userPermissions } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || []
	);

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

	const { refreshAfterChange } = useDatabaseRefresh();

	const validateColumn = () => {
		const nameExists = columns.find((col) => col.name === newColumn?.name);
		const hasValidReference =
			newColumn?.type === "reference"
				? newColumn.referenceTableId !== undefined &&
				  newColumn.referenceTableId !== null
				: true;
		const hasValidPrimaryKey = !(
			newColumn?.primary && columns.some((col) => col.primary)
		);

		return !nameExists && hasValidReference && hasValidPrimaryKey;
	};

	const handleAdd = async (e: FormEvent) => {
		e.preventDefault();

		if (!token || !tenantId || !newColumn) {
			showAlert("Missing required information", "error");
			return;
		}

		// Verificăm dacă utilizatorul poate edita tabelul
		if (!tablePermissions.canEditTable()) {
			showAlert("You don't have permission to add columns to this table", "error");
			return;
		}

		if (!validateColumn()) {
			showAlert("Please fix validation errors", "error");
			return;
		}

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

			if (response.ok) {
				const createdColumns = await response.json();
				showAlert("Column added successfully!", "success");
				setNewColumn(null);
				setShowForm(false);

				// Update local columns state
				if (setColumns && columns) {
					setColumns([...columns, ...createdColumns]);
				}

				// Refresh database cache
				await refreshAfterChange();
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add column");
			}
		} catch (error: any) {
			console.error("Error adding column:", error);
			showAlert(
				error.message || "Failed to add column. Please try again.",
				"error",
			);
		}
	};

	const handleDeleteWrapper = async (columnId: string) => {
		await handleDeleteColumn(
			columnId,
			columns,
			setColumns,
			table,
			token,
			showAlert,
		);
		// Refresh database cache to update column counts
		await refreshAfterChange();
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

	const handleTableUpdate = async (updatedTable: Table) => {
		setCurrentTable(updatedTable);
		showAlert("Table updated successfully!", "success");
		await refreshAfterChange();
	};

	const fetchDatabase = useCallback(async () => {
		if (!tenant || !user || !token) return;
		try {
			// Fetch the specific database with full table and column details
			const response = await fetch(
				`/api/tenants/${tenant.id}/databases/${table.databaseId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			if (!response.ok) throw new Error("Failed to fetch database");
			const data = await response.json();
			if (data && data.tables) {
				setTables(data.tables || []);
			}
		} catch (error) {
			console.error("Error fetching database:", error);
			showAlert(
				"Failed to load database information. Please refresh the page.",
				"error",
			);
		}
	}, [tenant, user, token, table.databaseId, showAlert]);

	useEffect(() => {
		if (tenant && user && token && !tables) {
			fetchDatabase();
		}
	}, [fetchDatabase, tenant, user, token, tables]);
	const { setIsOpen, setCurrentStep } = useTour();

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
	}, []);

	// Verificăm dacă utilizatorul are acces la tabel
	if (!tablePermissions.canReadTable()) {
		return (
			<div className='space-y-6'>
				<div className='text-center py-12'>
					<div className='text-muted-foreground'>
						<p className='text-lg font-medium mb-2'>Access Denied</p>
						<p className='text-sm'>You don't have permission to view this table.</p>
					</div>
				</div>
			</div>
		);
	}

	// Demo column cleanup removed for production
	return (
		<div className='space-y-6'>
			{/* Table Header Editor */}
			<TableHeaderEditor
				table={currentTable}
				onTableUpdate={handleTableUpdate}
			/>

			{/* Header Actions */}
			<div className='flex flex-col sm:flex-row  items-start sm:items-center gap-4'>
				<div className='flex items-center space-x-3'>
					{/* Butonul Add Column - doar dacă utilizatorul poate edita */}
					{tablePermissions.canEditTable() && (
						<Button
							onClick={() => setShowForm((prev) => !prev)}
							className={`add-column-button ${
								user.role === "VIEWER" ? "opacity-0 pointer-events-none" : ""
							}`}>
							{showForm ? <X className='w-4 h-4' /> : "Add Column"}
						</Button>
					)}
					{showForm && (
						<span className='text-sm text-muted-foreground'>
							Fill in the form below to add a new column
						</span>
					)}
				</div>
				<div className='flex items-center space-x-2'>
					{/* Butonul Column Order - doar dacă utilizatorul poate edita */}
					{tablePermissions.canEditTable() && (
						<Button
							variant='outline'
							size='sm'
							onClick={() => setShowOrderManager(true)}
							disabled={user.role === "VIEWER"}
							className='order-columns-button'>
							<Move className='w-4 h-4 mr-2' />
							Column Order
						</Button>
					)}
					<Link
						href={`/home/database/table/${table.id}/rows`}
						className='rows-button'>
						<Button variant='outline' size='sm'>
							Manage Rows
						</Button>
					</Link>
				</div>
			</div>

			{/* Add Column Form - doar dacă utilizatorul poate edita */}
			{showForm && tablePermissions.canEditTable() && (
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

			{/* Column Order Manager Modal - doar dacă utilizatorul poate edita */}
			{showOrderManager && tablePermissions.canEditTable() && (
				<ColumnOrderManager
					columns={columns || []}
					setColumns={setColumns}
					table={table}
					onClose={() => setShowOrderManager(false)}
				/>
			)}
		</div>
	);
}
