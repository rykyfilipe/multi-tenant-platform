/** @format */

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useApp } from "@/contexts/AppContext";
import { Column, Row, Table } from "@/types/database";
import { Info, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";

interface Props {
	columns: Column[];
	rows: Row[];
	table: Table;
	filters?: any[];
	globalSearch?: string;
	onRefresh?: () => void;
}

function ImportExportControls({
	columns,
	rows,
	table,
	filters,
	globalSearch,
	onRefresh,
}: Props) {
	const { tenant, token, showAlert, user } = useApp();
	const tenantId = tenant?.id;

	// Get user permissions
	const { permissions: userPermissions } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);
	const [isImporting, setIsImporting] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	// Handle CSV export
	const handleExportCSV = async () => {
		if (!tenantId || !token) {
			showAlert("Missing authentication information", "error");
			return;
		}

		setIsExporting(true);
		try {
			// Build query parameters for export
			const params = new URLSearchParams({
				format: "csv",
				limit: "10000",
			});

			if (globalSearch && globalSearch.trim()) {
				params.append("globalSearch", globalSearch.trim());
			}

			if (filters && filters.length > 0) {
				params.append("filters", JSON.stringify(filters));
			}

			const exportUrl = new URL(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/export`,
				window.location.origin,
			);

			// Add query parameters
			exportUrl.search = params.toString();

			// Fetch CSV data with timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			const response = await fetch(exportUrl, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`Export failed: ${response.status}`);
			}

			// Get CSV content and create download
			const csvContent = await response.text();

			// Validate CSV content
			if (!csvContent || csvContent.trim().length === 0) {
				throw new Error("Export returned empty content");
			}

			const blob = new Blob([csvContent], {
				type: "text/csv;charset=utf-8;",
			});
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `table_${table.id}_export_${
				new Date().toISOString().split("T")[0]
			}.csv`;
			a.click();
			window.URL.revokeObjectURL(url);

			showAlert("Export completed successfully!", "success");
		} catch (error: any) {
			console.error("Export error:", error);
			if (error.name === "AbortError") {
				showAlert(
					"Export timed out. Please try again with fewer filters.",
					"error",
				);
			} else {
				showAlert("Export failed. Please try again.", "error");
			}
		} finally {
			setIsExporting(false);
		}
	};

	const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsImporting(true);
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

			// Folosim noul endpoint de import
			const res = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/import`,
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
				const errorData = await res.json();
				if (res.status === 400) {
					// Eroare de validare - afișează detalii complete
					let errorMessage = errorData.error || "Import failed";

					if (errorData.summary) {
						const summary = errorData.summary;
						errorMessage = `Import failed: ${summary.totalRows} rows processed, ${summary.validRows} valid, ${summary.invalidRows} invalid`;

						if (errorData.details && errorData.details.length > 0) {
							errorMessage += `\n\nFirst few errors:\n${errorData.details
								.slice(0, 3)
								.join("\n")}`;
						}
					} else if (errorData.details) {
						errorMessage = `Validation failed:\n${errorData.details
							.slice(0, 5)
							.join("\n")}`;
					}

					showAlert(errorMessage, "error");
				} else {
					showAlert(
						"Import failed: " + (errorData.error || "Unknown error"),
						"error",
					);
				}
			} else {
				const data = await res.json();

				if (res.status === 207) {
					// Import cu avertismente (status 207 Multi-Status)
					const warningMessage = data.warnings
						? `Import completed with warnings: ${data.warnings.join("; ")}`
						: data.message || "Import completed with warnings";
					showAlert(warningMessage, "warning");
				} else {
					// Import complet reușit
					showAlert(
						`Successfully imported ${data.importedRows || 0} rows!`,
						"success",
					);
				}

				// Refresh the table data
				if (onRefresh) {
					onRefresh();
				} else {
					// Fallback la reload dacă nu avem funcția de refresh
					window.location.reload();
				}

				// Reset input-ul de fișier pentru a permite importul aceluiași fișier din nou
				const fileInput = document.getElementById(
					"import-csv",
				) as HTMLInputElement;
				if (fileInput) {
					fileInput.value = "";
				}
			}
		} catch (err: any) {
			showAlert("Failed to import data. Please try again.", "error");
		} finally {
			setIsImporting(false);

			// Reset input-ul de fișier în toate cazurile
			const fileInput = document.getElementById(
				"import-csv",
			) as HTMLInputElement;
			if (fileInput) {
				fileInput.value = "";
			}
		}
	};

	const safeParse = (val: string): any => {
		// Curăță valoarea de caractere speciale
		let cleanVal = val.trim();

		// Elimină caracterele de sfârșit de linie
		cleanVal = cleanVal.replace(/\r?\n/g, "");

		// Elimină ghilimelele dacă sunt în jurul valorii
		if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
			cleanVal = cleanVal.slice(1, -1);
		}

		try {
			return JSON.parse(cleanVal);
		} catch {
			return cleanVal;
		}
	};

	const [open, setOpen] = useState(false);
	return (
		<div className='flex items-center gap-2'>
			{/* CSV Export Button */}
			<Button
				onClick={handleExportCSV}
				disabled={isExporting}
				variant='outline'
				size='sm'
				className='flex items-center gap-2'>
				<Download className='w-4 h-4' />
				Export CSV
			</Button>

			{/* Allow import/export based on table permissions rather than hard-coded role check */}
			{tablePermissions.canEditTable() && (
				<label htmlFor='import-csv'>
					<Popover open={open}>
						<PopoverTrigger asChild>
							<div
								onMouseEnter={() => setOpen(true)}
								onMouseLeave={() => setOpen(false)}>
								<Button
									asChild
									disabled={isImporting}
									variant='outline'
									size='sm'
									className='flex items-center gap-2'>
									<span className='flex items-center gap-2'>
										{isImporting ? (
											<>
												<div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
												Importing...
											</>
										) : (
											<>
												Import
												<Info className='w-4 h-4 text-muted-foreground' />
											</>
										)}
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
						disabled={isImporting}
					/>
				</label>
			)}

			{/* Show export status */}
			{isExporting && (
				<div className='flex items-center gap-2 text-sm text-muted-foreground ml-2'>
					<div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
					Exporting...
				</div>
			)}

			{isImporting && (
				<div className='flex items-center gap-2 text-sm text-muted-foreground ml-2'>
					<div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
					Importing...
				</div>
			)}
		</div>
	);
}

export default ImportExportControls;
