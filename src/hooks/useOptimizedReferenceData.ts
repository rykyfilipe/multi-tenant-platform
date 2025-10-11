/** @format */

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Table, Row } from "@/types/database";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";

interface ReferenceDataItem {
	id: number;
	displayValue: string;
	rowData: any;
}

interface UseOptimizedReferenceDataResult {
	referenceData: Record<number, ReferenceDataItem[]>;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
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
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Stable reference for tables using useMemo with deep comparison
	const stableTables = useMemo(() => {
		if (!tables) return null;
		return tables.map(t => ({
			id: t.id,
			name: t.name,
			columns: t.columns
		}));
	}, [tables?.length, tables?.map(t => t.id).join(',')]);

	// Helper to process rows to reference data
	const processRowsToReferenceData = useCallback((
		rowsData: Row[],
		tableId: number,
	): ReferenceDataItem[] => {
		const options: ReferenceDataItem[] = [];

		// Find the table to access columns
		const referenceTable = stableTables?.find((t) => t.id === tableId);
		if (!referenceTable?.columns) {
			return options;
		}

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
				const maxColumns = 5;
				const rowData: any = {};

				// Process columns for display and rowData
				referenceTable.columns?.forEach((column) => {
					if (!column || !column.id || addedColumns >= maxColumns) return;

					const cell = row.cells?.find(
						(c: any) => c && c.columnId === column.id,
					);
					if (cell?.value != null && cell.value.toString().trim() !== "") {
						let formattedValue = cell.value.toString().trim();

						// Store full row data
						rowData[column.name] = cell.value;

						if (formattedValue.length > 20) {
							formattedValue = formattedValue.substring(0, 20) + "...";
						}

						if (column.type === "date") {
							try {
								formattedValue = new Date(formattedValue).toLocaleDateString(
									"ro-RO",
								);
							} catch {
								// fallback to raw value
							}
						} else if (column.type === "boolean") {
							formattedValue = formattedValue === "true" ? "✓" : "✗";
						}

						displayParts.push(formattedValue);
						addedColumns++;
					}
				});

				const displayValue = displayParts.length
					? displayParts.join(" • ")
					: `Row #${row.id || "unknown"}`;

				options.push({
					id: typeof row.id === 'string' ? parseInt(row.id) : (row.id || 0),
					displayValue,
					rowData,
				});
			}
		});

		return options;
	}, [stableTables]);

	// Function to manually refresh reference data
	const refresh = useCallback(() => {
		setRefreshTrigger(prev => prev + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;

		const fetchReferenceData = async () => {
			// Guard clauses
			if (!tenant?.id || !selectedDatabase?.id || !token) {
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				if (referenceTableId) {
					// Fetch for specific table
					await fetchSingleTableData(referenceTableId);
				} else if (stableTables && Array.isArray(stableTables)) {
					// Fetch for referenced tables
					await fetchReferencedTablesData(stableTables);
				}
			} catch (err) {
				console.error("Error fetching reference data:", err);
				if (isMounted) {
					setError(
						err instanceof Error ? err.message : "Failed to fetch reference data",
					);
					setReferenceData({});
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		const fetchSingleTableData = async (tableId: number) => {
			const response = await fetch(
				`/api/tenants/${tenant!.id}/databases/${
					selectedDatabase!.id
				}/tables/${tableId}/rows?limit=1000&includeCells=true`,
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

			// Extract rows from the API response
			let rowsData: Row[] = [];
			if (Array.isArray(responseData)) {
				rowsData = responseData;
			} else if (responseData && typeof responseData === "object") {
				if (Array.isArray(responseData.data)) {
					rowsData = responseData.data;
				} else if (Array.isArray(responseData.rows)) {
					rowsData = responseData.rows;
				}
			}

			if (isMounted) {
				if (Array.isArray(rowsData) && rowsData.length > 0) {
					const options = processRowsToReferenceData(rowsData, tableId);
					setReferenceData({ [tableId]: options });
				} else {
					setReferenceData({ [tableId]: [] });
				}
			}
		};

		const fetchReferencedTablesData = async (tablesToProcess: Table[]) => {
			const allReferenceData: Record<number, ReferenceDataItem[]> = {};

			// Find only tables that are referenced by columns
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

			// Fetch only for referenced tables
			const fetchPromises = Array.from(referencedTableIds).map(
				async (tableId) => {
					try {
						const response = await fetch(
							`/api/tenants/${tenant!.id}/databases/${
								selectedDatabase!.id
							}/tables/${tableId}/rows?limit=1000&includeCells=true`,
							{
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "application/json",
								},
							},
						);

						if (response.ok) {
							const responseData = await response.json();

							// Extract rows from the API response
							let rowsData: Row[] = [];
							if (Array.isArray(responseData)) {
								rowsData = responseData;
							} else if (responseData && typeof responseData === "object") {
								if (Array.isArray(responseData.data)) {
									rowsData = responseData.data;
								} else if (Array.isArray(responseData.rows)) {
									rowsData = responseData.rows;
								}
							}

							if (Array.isArray(rowsData) && rowsData.length > 0) {
								const options = processRowsToReferenceData(rowsData, tableId);
								allReferenceData[tableId] = options;
							} else {
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
			if (isMounted) {
				setReferenceData(allReferenceData);
			}
		};

		fetchReferenceData();

		return () => {
			isMounted = false;
		};
	}, [referenceTableId, stableTables, tenant?.id, selectedDatabase?.id, token, processRowsToReferenceData, refreshTrigger]);

	return {
		referenceData,
		isLoading,
		error,
		refresh,
	};
};
