/** @format */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Table, Row, Column } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { AddRowForm } from "./AddRowForm";
import { TableView } from "./TableView";
import useRowsTableEditor from "@/hooks/useRowsTableEditor";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ImportExportControls from "./ImportExportControls";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useDatabase } from "@/contexts/DatabaseContext";

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

	const { showAlert, token, user, tenant } = useApp();
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
				`/api/tenants/${tenantId}/database/${table.databaseId}/tables/${table.id}/rows`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ rows: [{ cells: cells }] }),
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
			setRows([...(rows || []), data.newRow]);
			setTables((prev: any) =>
				prev?.map((t: any) => {
					if (t.id === table.id) {
						return {
							...t,
							rows: [...(t.rows || []), data.newRow],
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
				`/api/tenants/${tenantId}/database/tables/${table.id}/rows/${rowId}`,
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
	}, []);

	const fetchTables = async () => {
		if (!tenant || !user || !token) return;
		try {
			const response = await fetch(`/api/tenants/${tenant.id}/database`, {
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
	return (
		<div className='space-y-6'>
			{/* Header Actions */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div className='flex items-center space-x-3'>
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
				</div>
				<div className='flex items-center space-x-3'>
					<ImportExportControls rows={rows} columns={columns} table={table} />
				</div>
			</div>

			{/* Add Row Form */}
			{showForm && (
				<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-6'>
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
