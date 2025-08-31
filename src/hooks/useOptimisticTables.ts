/** @format */

import { useState, useCallback } from "react";
import { Table } from "@/types/database";

interface UseOptimisticTablesOptions {
	onSuccess?: () => void;
	onError?: (error: any) => void;
}

/**
 * Hook pentru managementul optimist al tabelelor
 */
export function useOptimisticTables(
	initialTables: Table[] = [],
	options: UseOptimisticTablesOptions = {},
) {
	const [tables, setTables] = useState<Table[]>(initialTables);
	const [pendingOperations, setPendingOperations] = useState<Set<string>>(
		new Set(),
	);

	// Generează ID-uri temporare pentru operațiuni optimiste
	const generateTempId = useCallback(() => {
		return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}, []);

	// Creează tabel optimist
	const createTable = useCallback(
		async (tableData: Omit<Table, "id">, apiCall: () => Promise<Table>) => {
			const tempId = generateTempId();
			const tempTable = { ...tableData, id: tempId as any };

			try {
				setPendingOperations((prev) => new Set(prev).add(tempId));

				// Adăugăm imediat tabelul optimist
				setTables((currentTables) => [...currentTables, tempTable]);

				// Executăm API call-ul
				const newTable = await apiCall();

				// Înlocuim tabelul temporar cu cel real
				setTables((currentTables) =>
					currentTables.map((table) =>
						table.id === tempId ? newTable : table,
					),
				);

				setPendingOperations((prev) => {
					const newSet = new Set(prev);
					newSet.delete(tempId);
					return newSet;
				});

				options.onSuccess?.();
				return newTable;
			} catch (error) {
				// Eliminăm tabelul optimist în caz de eroare
				setTables((currentTables) =>
					currentTables.filter((table) => table.id !== tempId),
				);

				setPendingOperations((prev) => {
					const newSet = new Set(prev);
					newSet.delete(tempId);
					return newSet;
				});

				options.onError?.(error);
				throw error;
			}
		},
		[generateTempId, options],
	);

	// Actualizează tabel optimist
	const updateTable = useCallback(
		async (
			tableId: number | string,
			updates: Partial<Table>,
			apiCall: () => Promise<Table>,
		) => {
			const operationId = `update_${tableId}_${Date.now()}`;

			try {
				setPendingOperations((prev) => new Set(prev).add(operationId));

				// Aplicăm imediat actualizarea optimistă
				setTables((currentTables) =>
					currentTables.map((table) =>
						table.id === tableId ? { ...table, ...updates } : table,
					),
				);

				// Executăm API call-ul
				const updatedTable = await apiCall();

				// Actualizăm cu datele reale de la server
				setTables((currentTables) =>
					currentTables.map((table) =>
						table.id === tableId ? updatedTable : table,
					),
				);

				setPendingOperations((prev) => {
					const newSet = new Set(prev);
					newSet.delete(operationId);
					return newSet;
				});

				options.onSuccess?.();
				return updatedTable;
			} catch (error) {
				// Revertim schimbarea în caz de eroare
				// Pentru simplitate, reîmprospătăm din initialTables
				setTables(initialTables);

				setPendingOperations((prev) => {
					const newSet = new Set(prev);
					newSet.delete(operationId);
					return newSet;
				});

				options.onError?.(error);
				throw error;
			}
		},
		[initialTables, options],
	);

	// Șterge tabel optimist
	const deleteTable = useCallback(
		async (tableId: number | string, apiCall: () => Promise<void>) => {
			const operationId = `delete_${tableId}_${Date.now()}`;
			let deletedTable: Table | null = null;

			try {
				setPendingOperations((prev) => new Set(prev).add(operationId));

				// Salvăm tabelul pentru a-l putea restaura în caz de eroare
				deletedTable = tables.find((table) => table.id === tableId) || null;

				// Eliminăm imediat tabelul din listă
				setTables((currentTables) =>
					currentTables.filter((table) => table.id !== tableId),
				);

				// Executăm API call-ul
				await apiCall();

				setPendingOperations((prev) => {
					const newSet = new Set(prev);
					newSet.delete(operationId);
					return newSet;
				});

				options.onSuccess?.();
			} catch (error) {
				// Restaurăm tabelul în caz de eroare
				if (deletedTable) {
					setTables((currentTables) => [...currentTables, deletedTable!]);
				}

				setPendingOperations((prev) => {
					const newSet = new Set(prev);
					newSet.delete(operationId);
					return newSet;
				});

				options.onError?.(error);
				throw error;
			}
		},
		[tables, options],
	);

	// Reset la starea inițială
	const resetTables = useCallback((newTables: Table[]) => {
		setTables(newTables);
		setPendingOperations(new Set());
	}, []);

	// Verifică dacă o operațiune este în curs
	const isPending = useCallback(
		(id?: string) => {
			if (id) {
				return (
					pendingOperations.has(id) ||
					pendingOperations.has(`update_${id}_*`) ||
					pendingOperations.has(`delete_${id}_*`)
				);
			}
			return pendingOperations.size > 0;
		},
		[pendingOperations],
	);

	return {
		tables,
		isPending,
		createTable,
		updateTable,
		deleteTable,
		resetTables,
		setTables,
	};
}
