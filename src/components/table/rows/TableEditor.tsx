/** @format */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Table, Row, Column, RowSchema, CellSchema } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { AddRowForm } from "./AddRowForm";
import { TableView } from "./TableView";
import useRowsTableEditor from "@/hooks/useRowsTableEditor";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ImportExportControls from "./ImportExportControls";
import { cn } from "@/lib/utils";
import { da } from "date-fns/locale";
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
	if (!rows || !columns) return;

	const { showAlert, token, user, tenant } = useApp();
	const tenantId = tenant?.id;
	const [showForm, setShowForm] = useState(false);
	const [tables, setTables] = useState<Table[] | null>(null);
	if (!token || !user) return;

	const [cells, setCells] = useState<CellSchema[] | []>([]);

	const { editingCell, handleCancelEdit, handleEditCell, handleSaveCell } =
		useRowsTableEditor();

	async function handleAdd(e: FormEvent) {
		e.preventDefault();

		if (!token) return console.error("No token available");
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/database/tables/${table.id}/rows`,
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
			showAlert("Row added successfully", "success");
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
			showAlert("Row deleted successfully", "success");
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
			const response = await fetch(
				`/api/tenants/${tenant.id}/database/tables`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			if (!response.ok) throw new Error("Failed to fetch database");
			const data = await response.json();
			setTables(data);
		} catch (error) {
			showAlert("Error loading database", "error");
		}
	};
	return (
		<div className='space-y-6'>
			<div className='w-full flex flex-col-reverse  xs:flex-row  justify-between items-center mb-4 gap-2'>
				<Button
					onClick={() => setShowForm((prev) => !prev)}
					className={
						user.role === "VIEWER" ? "opacity-0 pointer-events-none" : ""
					}>
					{showForm ? <X /> : <p className=''>Add new row</p>}
				</Button>
				<div className='flex flex-col items-end gap-5'>
					<Link href={`/home/database/table/${table.id}/columns`}>
						{user.role !== "VIEWER" && (
							<Button variant='outline' size='sm'>
								Edit columns
							</Button>
						)}
					</Link>
					<ImportExportControls rows={rows} columns={columns} table={table} />
				</div>
			</div>

			{showForm && (
				<AddRowForm
					columns={columns}
					cells={cells}
					setCells={setCells}
					onAdd={handleAdd}
					tables={tables}
				/>
			)}
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
	);
}
