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

	// Funcție pentru detectarea automată a delimiterului
	const detectDelimiter = (text: string): string => {
		const lines = text.split('\n').slice(0, 5); // Verifică primele 5 linii
		const delimiters = [',', ';', '\t', '|'];
		let bestDelimiter = ',';
		let maxCount = 0;

		for (const delimiter of delimiters) {
			const counts = lines.map(line => (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length);
			const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
			
			if (avgCount > maxCount && avgCount > 0) {
				maxCount = avgCount;
				bestDelimiter = delimiter;
			}
		}

		return bestDelimiter;
	};

	// Funcție pentru parsarea corectă a CSV-ului
	const parseCSVLine = (line: string, delimiter: string): string[] => {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;
		let i = 0;

		while (i < line.length) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					// Escaped quote
					current += '"';
					i += 2;
				} else {
					// Toggle quote state
					inQuotes = !inQuotes;
					i++;
				}
			} else if (char === delimiter && !inQuotes) {
				// End of field
				result.push(current.trim());
				current = '';
				i++;
			} else {
				current += char;
				i++;
			}
		}

		// Add the last field
		result.push(current.trim());
		return result;
	};

	const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Verifică tipul de fișier
		if (!file.name.toLowerCase().endsWith('.csv')) {
			showAlert("Please select a CSV file.", "error");
			return;
		}

		setIsImporting(true);
		try {
			const text = await file.text();
			
			// Verifică dacă fișierul nu este gol
			if (!text.trim()) {
				showAlert("The CSV file is empty.", "error");
				return;
			}

			const lines = text.split("\n").filter(line => line.trim() !== "");
			
			if (lines.length < 2) {
				showAlert("The CSV file must contain at least a header and one data row.", "error");
				return;
			}

			// Detectează delimiterul automat
			const delimiter = detectDelimiter(text);
			console.log(`Detected delimiter: "${delimiter}"`);

			// Parsează header-ul
			const header = parseCSVLine(lines[0], delimiter).map((h) => h.trim());

			// Verifică dacă header-ul nu este gol
			if (header.length === 0) {
				showAlert("The CSV file header is empty.", "error");
				return;
			}

			// Verificăm ca toate coloanele din header să existe
			const missingColumns = header.filter(h => !columns.some(c => c.name === h));
			if (missingColumns.length > 0) {
				showAlert(
					`The CSV file contains unknown columns: ${missingColumns.join(', ')}. Please check the file format.`,
					"error",
				);
				return;
			}

			// Verifică dacă toate coloanele din tabel sunt prezente în CSV
			const csvColumns = header;
			const missingTableColumns = columns.filter(c => !csvColumns.includes(c.name));
			if (missingTableColumns.length > 0) {
				showAlert(
					`The CSV file is missing these table columns: ${missingTableColumns.map(c => c.name).join(', ')}. Please add them to your CSV file.`,
					"error",
				);
				return;
			}

			const parsedRows = lines.slice(1).map((line, index) => {
				try {
					const values = parseCSVLine(line, delimiter).map((v) => safeParse(v));

					// Verificăm dacă numărul de valori corespunde cu header-ul
					if (values.length !== header.length) {
						console.warn(`Row ${index + 2}: Expected ${header.length} columns, got ${values.length}`);
						return null;
					}

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
				} catch (error) {
					console.warn(`Error parsing row ${index + 2}:`, error);
					return null;
				}
			});

			// Filtrăm rândurile invalide
			const validRows = parsedRows.filter((r) => r !== null);

			if (validRows.length === 0) {
				const totalRows = lines.length - 1; // Exclude header
				showAlert(
					`No valid rows found for import. ${totalRows} rows were processed but none were valid. Please check your CSV file format and data.`,
					"error",
				);
				return;
			}

			// Afișează un mesaj informativ despre câte rânduri vor fi importate
			const totalRows = lines.length - 1; // Exclude header
			const skippedRows = totalRows - validRows.length;
			if (skippedRows > 0) {
				showAlert(
					`Found ${validRows.length} valid rows out of ${totalRows} total rows. ${skippedRows} rows will be skipped.`,
					"info",
				);
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

		// Returnează null pentru valori goale
		if (cleanVal === "" || cleanVal === "null" || cleanVal === "undefined") {
			return null;
		}

		// Încearcă să parseze ca JSON pentru valori complexe
		try {
			const parsed = JSON.parse(cleanVal);
			return parsed;
		} catch {
			// Dacă nu poate fi parsate ca JSON, returnează ca string
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
						<PopoverContent className='text-sm w-[300px] pointer-events-none'>
							<div className='space-y-2'>
								<p><strong>CSV Import Requirements:</strong></p>
								<ul className='list-disc list-inside space-y-1 text-xs'>
									<li>File must have .csv extension</li>
									<li>First row must contain column headers</li>
									<li>Headers must match table column names exactly</li>
									<li>Supports comma, semicolon, tab, or pipe delimiters</li>
									<li>Values with commas should be quoted</li>
								</ul>
							</div>
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
