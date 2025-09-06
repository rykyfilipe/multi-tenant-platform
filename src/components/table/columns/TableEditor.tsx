/** @format */
"use client";

import {
	FormEvent,
	useEffect,
	useState,
	useCallback,
	useMemo,
	memo,
} from "react";
import { Table, CreateColumnRequest, Column } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import AddColumnForm from "./AddColumnForm"; // Component for adding columns
import { TableView } from "./TableView";
import { ColumnOrderManager } from "./ColumnOrderManager";
import { TableHeaderEditor } from "../TableHeaderEditor";
import EditColumnForm from "./EditColumnForm";
import { useDatabaseRefresh } from "@/hooks/useDatabaseRefresh";
import { Button } from "@/components/ui/button";
import { X, Move } from "lucide-react";
import Link from "next/link";
import { useTour } from "@reactour/tour";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";

interface Props {
	columns: Column[] | null;
	setColumns: (cols: Column[] | null) => void;
	table: Table;
}

export default function TableEditor({ table, columns, setColumns }: Props) {
	const { showAlert, token, user, tenant, loading } = useApp();
	const [tables, setTables] = useState<Table[] | null>(null);
	const [currentTable, setCurrentTable] = useState<Table>(table);
	const [showForm, setShowForm] = useState(false);
	const [showOrderManager, setShowOrderManager] = useState(false);
	const [editingColumn, setEditingColumn] = useState<Column | null>(null);

	const [newColumn, setNewColumn] = useState<CreateColumnRequest | null>(null);
	const [isAddingColumn, setIsAddingColumn] = useState(false);
	const [isUpdatingColumn, setIsUpdatingColumn] = useState(false);

	// Verificăm permisiunile utilizatorului
	const { permissions: userPermissions } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	const { refreshAfterChange } = useDatabaseRefresh();
	const tenantId = tenant?.id;

	const handleDeleteColumn = async (columnId: string) => {
		if (!token || !tenantId) {
			showAlert("Missing required information", "error");
			return;
		}

		// Verificăm dacă utilizatorul poate edita tabelul
		if (!tablePermissions.canEditTable()) {
			showAlert(
				"You don't have permission to delete columns from this table",
				"error",
			);
			return;
		}

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns/${columnId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (response.ok) {
				showAlert("Column deleted successfully!", "success");
				// Actualizare optimistă: eliminăm coloana din lista locală
				if (setColumns && columns) {
					setColumns(columns.filter((col) => col.id.toString() !== columnId));
				}
				await refreshAfterChange();
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete column");
			}
		} catch (error: any) {
			console.error("Error deleting column:", error);
			showAlert(
				error.message || "Failed to delete column. Please try again.",
				"error",
			);
		}
	};

	const handleEditColumn = (column: Column) => {
		setEditingColumn(column);
	};

	const handleUpdateColumn = async (updatedColumn: Partial<Column>) => {
		if (!token || !tenantId || !editingColumn) {
			showAlert("Missing required information", "error");
			return;
		}

		// Verificăm dacă utilizatorul poate edita tabelul
		if (!tablePermissions.canEditTable()) {
			showAlert(
				"You don't have permission to edit columns in this table",
				"error",
			);
			return;
		}

		setIsUpdatingColumn(true);

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns/${editingColumn.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(updatedColumn),
				},
			);

			if (response.ok) {
				const updatedColumnData = await response.json();
				showAlert("Column updated successfully!", "success");

				// Actualizare optimistă: actualizăm coloana în lista locală
				if (setColumns && columns) {
					setColumns(
						columns.map((col) =>
							col.id === editingColumn.id
								? { ...col, ...updatedColumnData }
								: col,
						),
					);
				}

				setEditingColumn(null);
				await refreshAfterChange();
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update column");
			}
		} catch (error: any) {
			console.error("Error updating column:", error);
			showAlert(
				error.message || "Failed to update column. Please try again.",
				"error",
			);
		} finally {
			setIsUpdatingColumn(false);
		}
	};

	const validateColumn = () => {
		const nameExists = columns?.find((col) => col.name === newColumn?.name);
		const hasValidReference =
			newColumn?.type === "reference"
				? newColumn.referenceTableId !== undefined &&
				  newColumn.referenceTableId !== null
				: true;
		const hasValidPrimaryKey = !(
			newColumn?.primary && columns?.some((col) => col.primary)
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
			showAlert(
				"You don't have permission to add columns to this table",
				"error",
			);
			return;
		}

		if (!validateColumn()) {
			showAlert("Please fix validation errors", "error");
			return;
		}

		// Prevent multiple submissions
		if (isAddingColumn) return;

		setIsAddingColumn(true);

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

				// Actualizare optimistă: adăugăm imediat coloanele noi la lista locală
				if (setColumns && columns) {
					setColumns([...columns, ...createdColumns]);
				}

				// Nu mai facem refresh complet, folosim actualizarea optimistă
				// await refreshAfterChange();
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
		} finally {
			setIsAddingColumn(false);
		}
	};

	const handleDeleteWrapper = async (columnId: string) => {
		await handleDeleteColumn(columnId);
	};

	// Funcția handleSaveCellWrapper nu mai este necesară cu noul sistem

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
						<p className='text-sm'>
							You don't have permission to view this table.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Demo column cleanup removed for production
	if (!columns) return null;
	if (!token || !user) return null;

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
							onClick={() => {
								setShowForm((prev) => !prev);
								// Initialize newColumn with default values when opening the form
								if (!showForm) {
									setNewColumn({
										name: "",
										type: USER_FRIENDLY_COLUMN_TYPES.text,
										semanticType: "",
										required: false,
										primary: false,
										referenceTableId: undefined,
										customOptions: [],
										order: 0,
									});
								}
							}}
							disabled={isAddingColumn || user.role === "VIEWER"}
							className="add-column-button">
							{showForm ? (
								<X className='w-4 h-4' />
							) : isAddingColumn ? (
								<>
									<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
									Adding...
								</>
							) : (
								"Add Column"
							)}
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
						isSubmitting={isAddingColumn}
					/>
				</div>
			)}

			{/* Edit Column Form - doar dacă utilizatorul poate edita */}
			{editingColumn && tablePermissions.canEditTable() && (
				<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-6'>
					<EditColumnForm
						column={editingColumn}
						onSave={handleUpdateColumn}
						onCancel={() => setEditingColumn(null)}
						tables={tables}
						existingColumns={columns || []}
						isSubmitting={isUpdatingColumn}
					/>
				</div>
			)}

			{/* Columns Table */}
			<div className='table-content'>
				<TableView
					tables={tables}
					columns={columns || []}
					onEditColumn={handleEditColumn}
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
