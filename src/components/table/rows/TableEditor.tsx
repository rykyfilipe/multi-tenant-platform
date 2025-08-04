/** @format */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Table, Row, Column } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { AddRowForm } from "./AddRowForm";
import { TableView } from "./TableView";
import useRowsTableEditor from "@/hooks/useRowsTableEditor";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ImportExportControls from "./ImportExportControls";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
	// Debug pentru columns
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			console.log("TableEditor - Columns:", columns);
			console.log("TableEditor - Columns length:", columns?.length || 0);
			console.log(
				"TableEditor - Reference columns:",
				columns?.filter((col) => col.type === "reference") || [],
			);
		}
	}, [columns]);
	if (!rows || !columns) return;

	const { showAlert, token, user, tenant } = useApp();
	const { selectedDatabase } = useDatabase();
	const tenantId = tenant?.id;
	const [showForm, setShowForm] = useState(false);
	const [tables, setTables] = useState<Table[] | null>(null);
	if (!token || !user) return;

	const [cells, setCells] = useState<any[]>([]);

	const { editingCell, handleCancelEdit, handleEditCell, handleSaveCell } =
		useRowsTableEditor();

	async function handleAdd(e: FormEvent) {
		e.preventDefault();

		if (!token) return console.error("No token available");
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ cells: cells }),
				},
			);

			if (!response.ok) {
				// Încearcă să parsezi răspunsul ca JSON pentru a obține mesajul de eroare
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

				try {
					const errorData = await response.json();
					errorMessage =
						errorData.error ||
						errorData.message ||
						errorData.details ||
						errorMessage;
				} catch (parseError) {
					try {
						const textError = await response.text();
						errorMessage = textError || errorMessage;
					} catch (textParseError) {
						console.error("Could not parse error response:", textParseError);
					}
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			showAlert("Data row added successfully!", "success");
			setRows([...(rows || []), data]);
			setTables((prev: any) =>
				prev?.map((t: any) => {
					if (t.id === table.id) {
						return {
							...t,
							rows: [...(t.rows || []), data],
						};
					}
					return t;
				}),
			);

			setCells([]);
		} catch (error: any) {
			// Gestionează diferite tipuri de erori
			let errorMessage = "An unexpected error occurred";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "string") {
				errorMessage = error;
			} else if (error?.message) {
				errorMessage = error.message;
			}

			showAlert(errorMessage, "error");
		}
	}

	const handleDelete = async (rowId: string) => {
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/${rowId}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				// Încearcă să parsezi răspunsul ca JSON pentru a obține mesajul de eroare
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

				try {
					const errorData = await response.json();
					errorMessage =
						errorData.error ||
						errorData.message ||
						errorData.details ||
						errorMessage;
				} catch (parseError) {
					try {
						const textError = await response.text();
						errorMessage = textError || errorMessage;
					} catch (textParseError) {
						console.error("Could not parse error response:", textParseError);
					}
				}

				throw new Error(errorMessage);
			}
			const updatedRows: Row[] = rows.filter((col) => col.id !== Number(rowId));
			setRows(updatedRows);
			showAlert("Data row removed successfully", "success");
		} catch (error: any) {
			// Gestionează diferite tipuri de erori
			let errorMessage = "Failed to remove data row. Please try again.";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "string") {
				errorMessage = error;
			} else if (error?.message) {
				errorMessage = error.message;
			}

			showAlert(errorMessage, "error");
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
			rows,
			setRows,
			value,
			table,
			token,
			user,
			showAlert,
		);
	};
	useEffect(() => {
		fetchTables();
	}, [tenant?.id, selectedDatabase?.id, token, user]);

	// Refresh data when columns change
	useEffect(() => {
		if (columns && columns.length > 0) {
			// Refetch table data to get updated rows with new column cells
			const refreshTableData = async () => {
				if (!token || !tenant?.id || !selectedDatabase?.id) return;

				const maxRetries = 3;
				let retryCount = 0;

				const attemptRefresh = async (): Promise<boolean> => {
					try {
						const res = await fetch(
							`/api/tenants/${tenant.id}/databases/${selectedDatabase.id}/tables/${table.id}`,
							{
								method: "GET",
								headers: { Authorization: `Bearer ${token}` },
							},
						);
						if (res.ok) {
							const data = await res.json();
							const newRows = data.rows || [];

							// Check if all rows have cells for all columns
							const allRowsHaveAllCells = newRows.every((row: any) => {
								if (!row.cells || !Array.isArray(row.cells)) return false;
								return columns.every((col) =>
									row.cells.some((cell: any) => cell.columnId === col.id),
								);
							});

							if (allRowsHaveAllCells || retryCount >= maxRetries) {
								setRows(newRows);
								return true;
							}
						}
					} catch (error) {
						console.error("Error refreshing table data:", error);
					}
					return false;
				};

				// Try to refresh with retries
				while (retryCount < maxRetries) {
					const success = await attemptRefresh();
					if (success) break;

					retryCount++;
					if (retryCount < maxRetries) {
						// Wait before retrying (exponential backoff)
						await new Promise((resolve) =>
							setTimeout(resolve, 1000 * retryCount),
						);
					}
				}
			};

			refreshTableData();
		}
	}, [columns, token, tenant?.id, selectedDatabase?.id, table.id]);

	const fetchTables = async () => {
		if (!tenant || !user || !token || !selectedDatabase?.id) return;
		try {
			const response = await fetch(
				`/api/tenants/${tenant.id}/databases/${selectedDatabase.id}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			if (!response.ok) throw new Error("Failed to fetch database");
			const data = await response.json();

			// API-ul returnează o singură bază de date, nu un array
			if (data && data.tables) {
				setTables(data.tables || []);
				if (process.env.NODE_ENV === "development") {
					console.log("TableEditor - Fetched tables:", data.tables);
				}
			}
		} catch (error) {
			console.error("Error fetching tables:", error);
			showAlert(
				"Failed to load database information. Please refresh the page.",
				"error",
			);
		}
	};
	return (
		<div className='space-y-6'>
			{/* Header Actions */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div className='flex items-center justify-between w-full space-x-3'>
					<Button
						onClick={() => setShowForm((prev) => !prev)}
						className={
							user.role === "VIEWER" ? "opacity-0 pointer-events-none" : ""
						}>
						{showForm ? <X className='w-4 h-4' /> : "Add Row"}
					</Button>
					{showForm && (
						<span className='text-sm text-muted-foreground'>
							Fill in the form below to add a new row
						</span>
					)}
					<Link
						href={`/home/database/table/${table.id}/columns`}
						className='rows-button'>
						<Button variant='outline' size='sm'>
							Manage Columns
						</Button>
					</Link>
				</div>
				<div className='flex items-center space-x-3'>
					<ImportExportControls rows={rows} columns={columns} table={table} />
				</div>
			</div>

			{/* Add Row Form */}
			{showForm && (
				<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-6'>
					{process.env.NODE_ENV === "development" && (
						<div className='mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs'>
							Debug - Columns: {columns?.length || 0}, Reference columns:{" "}
							{columns?.filter((col) => col.type === "reference").length || 0}
						</div>
					)}
					<AddRowForm
						columns={columns}
						cells={cells}
						setCells={setCells}
						onAdd={handleAdd}
						tables={tables}
					/>
				</div>
			)}

			{/* Rows Table */}
			<div className='table-content'>
				<TableView
					tables={tables}
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
		</div>
	);
}
