/** @format */

import { useMemo, useState, useEffect } from "react";
import { Table, Row } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";

interface ReferenceDataItem {
	id: number;
	displayValue: string;
	primaryKeyValue: any;
}

interface UseOptimizedReferenceDataResult {
	referenceData: Record<number, ReferenceDataItem[]>;
	isLoading: boolean;
	error: string | null;
}

// Hook optimizat pentru reference data
export const useOptimizedReferenceData = (
	tables: Table[] | null,
	referenceTableId?: number,
): UseOptimizedReferenceDataResult => {
	const { tenant, token } = useApp();
	const { selectedDatabase } = useDatabase();
	const [referenceData, setReferenceData] = useState<
		Record<number, ReferenceDataItem[]>
	>({});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchReferenceData = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Verificăm că avem toate datele necesare
				if (!tenant?.id || !selectedDatabase?.id || !token) {
					throw new Error("Missing tenant, database, or token information");
				}

				if (referenceTableId) {
					// Fetch pentru un singur tabel specific
					await fetchSingleTableData(referenceTableId);
				} else if (tables && Array.isArray(tables)) {
					// Fetch doar pentru tabelele care sunt referențiate de coloane
					await fetchReferencedTablesData(tables);
				}
			} catch (err) {
				console.error("Error fetching reference data:", err);
				setError(
					err instanceof Error ? err.message : "Failed to fetch reference data",
				);
				setReferenceData({});
			} finally {
				setIsLoading(false);
			}
		};

		const fetchSingleTableData = async (tableId: number) => {
			const response = await fetch(
				`/api/tenants/${tenant!.id}/databases/${
					selectedDatabase!.id
				}/tables/${tableId}/rows?limit=1000`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch rows: ${response.statusText}`);
			}

			const responseData = await response.json();

			// Verificăm structura response-ului și extragem rândurile
			let rowsData: Row[] = [];
			if (Array.isArray(responseData)) {
				// Dacă response-ul este direct un array de rânduri
				rowsData = responseData;
			} else if (responseData && typeof responseData === "object") {
				// Dacă response-ul este un obiect cu proprietatea rows
				if (Array.isArray(responseData.rows)) {
					rowsData = responseData.rows;
				} else if (Array.isArray(responseData.data)) {
					rowsData = responseData.data;
				}
			}

			// Verificăm că avem rânduri valide
			if (Array.isArray(rowsData) && rowsData.length > 0) {
				const options = processRowsToReferenceData(rowsData, tableId);
				const newReferenceData: Record<number, ReferenceDataItem[]> = {};
				newReferenceData[tableId] = options;
				setReferenceData(newReferenceData);
			} else {
				// Dacă nu avem rânduri, setăm un array gol
				const newReferenceData: Record<number, ReferenceDataItem[]> = {};
				newReferenceData[tableId] = [];
				setReferenceData(newReferenceData);
			}
		};

		const fetchReferencedTablesData = async (tablesToProcess: Table[]) => {
			const allReferenceData: Record<number, ReferenceDataItem[]> = {};

			// Găsim doar tabelele care sunt referențiate de coloane
			const referencedTableIds = new Set<number>();

			tablesToProcess.forEach((table) => {
				if (table.columns) {
					table.columns.forEach((column) => {
						if (
							column.referenceTableId &&
							column.referenceTableId !== table.id
						) {
							referencedTableIds.add(column.referenceTableId);
						}
					});
				}
			});

			// Fetch doar pentru tabelele referențiate
			const fetchPromises = Array.from(referencedTableIds).map(
				async (tableId) => {
					try {
						const response = await fetch(
							`/api/tenants/${tenant!.id}/databases/${
								selectedDatabase!.id
							}/tables/${tableId}/rows?limit=1000`,
							{
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "application/json",
								},
							},
						);

						if (response.ok) {
							const responseData = await response.json();

							// Verificăm structura response-ului și extragem rândurile
							let rowsData: Row[] = [];
							if (Array.isArray(responseData)) {
								// Dacă response-ul este direct un array de rânduri
								rowsData = responseData;
							} else if (responseData && typeof responseData === "object") {
								// Dacă response-ul este un obiect cu proprietatea rows
								if (Array.isArray(responseData.rows)) {
									rowsData = responseData.rows;
								} else if (Array.isArray(responseData.data)) {
									rowsData = responseData.data;
								}
							}

							// Verificăm că avem rânduri valide
							if (Array.isArray(rowsData) && rowsData.length > 0) {
								const options = processRowsToReferenceData(rowsData, tableId);
								allReferenceData[tableId] = options;
							} else {
								// Dacă nu avem rânduri, setăm un array gol
								allReferenceData[tableId] = [];
							}
						}
					} catch (err) {
						console.error(`Error fetching data for table ${tableId}:`, err);
						allReferenceData[tableId] = [];
					}
				},
			);

			await Promise.all(fetchPromises);
			setReferenceData(allReferenceData);
		};

		const processRowsToReferenceData = (
			rowsData: Row[],
			tableId: number,
		): ReferenceDataItem[] => {
			const options: ReferenceDataItem[] = [];

			// Găsim tabela pentru a accesa coloanele
			const referenceTable = tables?.find((t) => t.id === tableId);
			if (!referenceTable?.columns) return options;

			rowsData.forEach((row) => {
				if (
					row &&
					row.id &&
					row.cells &&
					Array.isArray(row.cells) &&
					row.cells.length > 0
				) {
					const displayParts: string[] = [];
					let addedColumns = 0;
					const maxColumns = 3;
					let primaryKeyValue: any = null;

					// Mai întâi găsim coloana primară pentru acest rând
					const primaryColumn = referenceTable.columns?.find((col) => col.primary);
					if (primaryColumn) {
						const primaryCell = row.cells?.find(
							(c: any) => c && c.columnId === primaryColumn.id,
						);
						if (primaryCell?.value != null && primaryCell.value.toString().trim() !== "") {
							primaryKeyValue = primaryCell.value;
						}
					}

					// Apoi procesăm coloanele pentru display
					referenceTable.columns?.forEach((column) => {
						if (!column || !column.id || addedColumns >= maxColumns) return;

						const cell = row.cells?.find(
							(c: any) => c && c.columnId === column.id,
						);
						if (cell?.value != null && cell.value.toString().trim() !== "") {
							let formattedValue = cell.value.toString().trim();

							if (formattedValue.length > 15) {
								formattedValue = formattedValue.substring(0, 15) + "...";
							}

							if (column.type === "date") {
								try {
									formattedValue = new Date(formattedValue).toLocaleDateString(
										"ro-RO",
									);
								} catch {
									// fallback la valoarea brută
								}
							} else if (column.type === "boolean") {
								formattedValue = formattedValue === "true" ? "✓" : "✗";
							}

							displayParts.push(formattedValue);
							addedColumns++;
						}
					});

					const displayValue = displayParts.length
						? displayParts.join(" • ").slice(0, 50)
						: `Row #${row.id || "unknown"}`;

					options.push({
						id: row.id || 0,
						displayValue,
						// Pentru referințe, folosim valoarea reală a coloanei primary ca primaryKeyValue
						primaryKeyValue: primaryKeyValue || row.id,
					});
				}
			});

			return options;
		};

		fetchReferenceData();
	}, [referenceTableId, tables, tenant?.id, selectedDatabase?.id, token]);

	return {
		referenceData,
		isLoading,
		error,
	};
};
