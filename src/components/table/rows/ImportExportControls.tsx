/** @format */

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useApp } from "@/contexts/AppContext";
import { Column, Row, Table } from "@/types/database";
import { Info } from "lucide-react";
import { useState, useMemo } from "react";

interface Props {
	columns: Column[];
	rows: Row[];
	table: Table;
}

// Funcție pentru crearea datelor de referință (similar cu EditableCell)
const createReferenceData = (tables: Table[] | null) => {
	const referenceData: Record<number, { id: number; displayValue: string }[]> = {};
	if (!tables) return referenceData;

	tables.forEach((table) => {
		const options: { id: number; displayValue: string }[] = [];
		if (Array.isArray(table.rows) && table.rows.length > 0) {
			table.rows.forEach((row) => {
				if (
					Array.isArray(row.cells) &&
					row.cells.length > 0 &&
					Array.isArray(table.columns)
				) {
					const displayParts: string[] = [];

					let addedColumns = 0;
					const maxColumns = 3;

					table.columns.forEach((column) => {
						if (addedColumns >= maxColumns) return;

						if (row.cells) {
							const cell = row.cells.find((c) => c.columnId === column.id);
							if (cell?.value != null && cell.value.toString().trim() !== "") {
								let formattedValue = cell.value.toString().trim();

								if (formattedValue.length > 15) {
									formattedValue = formattedValue.substring(0, 15) + "...";
								}

								if (column.type === "date") {
									try {
										formattedValue = new Date(formattedValue).toLocaleDateString("ro-RO");
									} catch {
										// fallback la valoarea brută
									}
								} else if (column.type === "boolean") {
									formattedValue = formattedValue === "true" ? "✓" : "✗";
								}

								if (addedColumns === 0 && column.primary) {
									displayParts.push(`#${formattedValue}`);
								} else {
									displayParts.push(formattedValue);
								}
								addedColumns++;
							}
						}
					});

					const displayValue = displayParts.length
						? displayParts.join(" • ").slice(0, 50)
						: `Row #${row.id || "unknown"}`;

					options.push({
						id: row.id || 0,
						displayValue,
					});
				}
			});
		}

		referenceData[table.id] = options;
	});

	return referenceData;
};

function ImportExportControls({ columns, rows, table }: Props) {
	const { tenant, token, showAlert, user } = useApp();
	const tenantId = tenant?.id;
	const [tables, setTables] = useState<Table[] | null>(null);

	// Fetch tables pentru referințe
	useMemo(() => {
		const fetchTables = async () => {
			if (!tenant || !token) return;

			try {
				const response = await fetch(
					`/api/tenants/${tenant.id}/databases/tables`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					},
				);

				if (response.ok) {
					const data = await response.json();
					setTables(data || []);
				}
			} catch (error) {
				console.error("Failed to fetch tables for export:", error);
			}
		};

		fetchTables();
	}, [tenant, token]);

	const handleExport = () => {
		const headers = columns.map((col) => col.name);
		
		// Creăm datele de referință pentru toate tabelele
		const referenceData = createReferenceData(tables);
		
		const csvRows = [
			headers.join(";"),
			...rows.map((row) => {
				const rowData = columns.map((col) => {
					const cell = row.cells?.find((c) => c.columnId === col.id);
					let value = cell?.value ?? "";
					
					// Pentru coloanele de tip "reference", înlocuim ID-ul cu numele
					if (col.type === "reference" && col.referenceTableId && value) {
						const referencedTableData = referenceData[col.referenceTableId];
						if (referencedTableData) {
							const referencedRow = referencedTableData.find(
								(refRow) => refRow.id === Number(value)
							);
							if (referencedRow) {
								value = referencedRow.displayValue;
							} else {
								value = `Unknown Row (ID: ${value})`;
							}
						} else {
							value = `Unknown Table (ID: ${col.referenceTableId})`;
						}
					}
					
					return JSON.stringify(value);
				});
				return rowData.join(";");
			}),
		];

		const blob = new Blob([csvRows.join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${table.name}_rows.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const lines = text.split("\n").filter(Boolean);

			const delimiter = ";";
			const header = lines[0].split(delimiter).map((h) => h.trim());

			// Verificăm ca toate coloanele din header să existe
			const isHeaderValid = header.every((h) =>
				columns.some((c) => c.name === h),
			);
			if (!isHeaderValid) {
				showAlert(
					"The CSV file contains unknown or missing columns. Please check the file format.",
					"error",
				);
				return;
			}

			const parsedRows = lines.slice(1).map((line) => {
				const values = line.split(delimiter).map((v) => safeParse(v));

				// Verificăm dacă numărul de valori corespunde
				if (values.length !== header.length) return null;

				const cells = values.map((value, i) => {
					const col = columns.find((c) => c.name === header[i]);
					if (!col) return null;

					// Validare tip
					const isValidType =
						(col.type === "number" && typeof value === "number") ||
						(col.type === "string" && typeof value === "string") ||
						(col.type === "boolean" && typeof value === "boolean") ||
						(col.type === "date" && !isNaN(Date.parse(value)));

					if (!isValidType) return null;

					return {
						columnId: col.id,
						value,
					};
				});

				// Dacă vreo celulă este invalidă, omitem întregul rând
				if (cells.includes(null)) return null;

				return { cells: cells as { columnId: number; value: any }[] };
			});

			// Filtrăm rândurile invalide
			const validRows = parsedRows.filter((r) => r !== null);

			if (validRows.length === 0) {
				showAlert(
					"No valid rows found for import. Please check your CSV file.",
					"error",
				);
				return;
			}

			const res = await fetch(
				`/api/tenants/${tenantId}/databases/tables/${table.id}/rows`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ rows: validRows }),
				},
			);

			if (!res.ok) {
				const { error } = await res.json();
				showAlert("Import failed: " + error, "error");
			} else {
				const data = await res.json();
				showAlert(
					`Successfully imported ${data.rows?.length || 0} rows!`,
					"success",
				);
				// Refresh the table data
				window.location.reload();
			}
		} catch (err) {
			showAlert("Failed to import data. Please try again.", "error");
		}
	};

	const safeParse = (val: string): any => {
		try {
			return JSON.parse(val);
		} catch {
			return val;
		}
	};
	const [open, setOpen] = useState(false);
	return (
		<div className='absolute right-3 bottom-3 flex items-center gap-2'>
			<Button
				className='rounded-br-none rounded-tr-none rounded-l-2xl'
				onClick={handleExport}>
				Export
			</Button>

			{user.role !== "VIEWER" && (
				<label htmlFor='import-csv'>
					<Popover open={open}>
						<PopoverTrigger asChild>
							<div
								onMouseEnter={() => setOpen(true)}
								onMouseLeave={() => setOpen(false)}>
								<Button
									asChild
									className='rounded-bl-none rounded-tl-none rounded-r-2xl bg-white text-black hover:bg-black/5'>
									<span className='flex items-center gap-1'>
										Import
										<Info className='w-4 h-4 text-muted-foreground' />
									</span>
								</Button>
							</div>
						</PopoverTrigger>
						<PopoverContent className='text-sm w-[260px] pointer-events-none'>
							Pentru ca importul să funcționeze, fișierul trebuie să conțină
							<strong> aceleași coloane</strong> ca tabela curentă.
						</PopoverContent>
					</Popover>
					<input
						type='file'
						id='import-csv'
						accept='.csv'
						className='hidden'
						onChange={handleImport}
					/>
				</label>
			)}
		</div>
	);
}

export default ImportExportControls;
