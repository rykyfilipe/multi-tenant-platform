/** @format */

import { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Row, Table } from "@/types/database";

interface PendingCellChange {
	rowId: string;
	columnId: string;
	cellId: string;
	newValue: any;
	originalValue: any;
	timestamp: number;
}

interface PendingNewRow {
	id: string; // ID temporar
	tableId: number;
	cells: Array<{
		id: string; // ID temporar pentru celulă
		rowId: string; // ID temporar pentru rând
		columnId: number;
		value: any;
	}>;
	createdAt: string;
	isLocalOnly: boolean;
}

interface BatchCellEditorOptions {
	table: Table | null;
	autoSaveDelay?: number; // Auto-save după X ms de inactivitate
	onSuccess?: (updatedCells: any[]) => void;
	onError?: (error: string) => void;
	onNewRowsAdded?: (newRows: PendingNewRow[]) => void;
	onNewRowsUpdated?: (updatedRows: PendingNewRow[]) => void;
}

export function useBatchCellEditor(options: BatchCellEditorOptions) {
	const { tenant, token, showAlert } = useApp();
	const { selectedDatabase } = useDatabase();
	const tenantId = tenant?.id;
	const { table } = options;

	

	// State pentru modificările pending
	const [pendingChanges, setPendingChanges] = useState<
		Map<string, PendingCellChange>
	>(new Map());
	const [pendingNewRows, setPendingNewRows] = useState<PendingNewRow[]>([]);
	const [isEditingCell, setIsEditingCell] = useState<{
		rowId: string;
		columnId: string;
		cellId: string;
	} | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Refs pentru auto-save
	const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const { autoSaveDelay = 2000, onSuccess, onError, onNewRowsAdded, onNewRowsUpdated } = options;

	// Generează cheia unică pentru o celulă
	const getCellKey = useCallback((rowId: string, columnId: string) => {
		return `${rowId}-${columnId}`;
	}, []);

	// Generează ID temporar pentru rânduri noi
	const generateTempId = useCallback(() => {
		return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}, []);

	// Adaugă un rând nou local
	const addNewRow = useCallback((rowData: Record<string, any>) => {
		console.log("🔍 useBatchCellEditor addNewRow called", { rowData, table: table?.id });
		if (!table) return;

		const tempRowId = generateTempId();
		const newRow: PendingNewRow = {
			id: tempRowId,
			tableId: table.id,
			cells: Object.entries(rowData).map(([columnId, value]) => ({
				id: `temp_cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				rowId: tempRowId,
				columnId: parseInt(columnId),
				value: value,
			})),
			createdAt: new Date().toISOString(),
			isLocalOnly: true,
		};

		console.log("✅ Adding new row to pendingNewRows:", newRow);
		setPendingNewRows(prev => [...prev, newRow]);
		onNewRowsAdded?.([newRow]);
	}, [table, generateTempId, onNewRowsAdded]);

	// Actualizează o celulă dintr-un rând local
	const updateLocalRowCell = useCallback((rowId: string, columnId: string, newValue: any) => {
		setPendingNewRows(prev => {
			const updatedRows = prev.map(row => {
				if (row.id === rowId) {
					const updatedCells = row.cells.map(cell => 
						cell.columnId.toString() === columnId 
							? { ...cell, value: newValue }
							: cell
					);
					return { ...row, cells: updatedCells };
				}
				return row;
			});
			
			onNewRowsUpdated?.(updatedRows);
			return updatedRows;
		});
	}, [onNewRowsUpdated]);

	// Elimină un rând local
	const removeLocalRow = useCallback((rowId: string) => {
		setPendingNewRows(prev => {
			const filtered = prev.filter(row => row.id !== rowId);
			onNewRowsUpdated?.(filtered);
			return filtered;
		});
	}, [onNewRowsUpdated]);

	// Începe editarea unei celule
	const startEditing = useCallback(
		(rowId: string, columnId: string, cellId: string) => {
			setIsEditingCell({ rowId, columnId, cellId });
		},
		[],
	);

	// Anulează editarea
	const cancelEditing = useCallback(() => {
		setIsEditingCell(null);
	}, []);

	// Ref pentru funcția de save pentru a evita dependency issues
	const saveFunctionRef = useRef<(() => Promise<void>) | null>(null);

	// Adaugă o modificare la batch-ul pending
	const addPendingChange = useCallback(
		(
			rowId: string,
			columnId: string,
			cellId: string,
			newValue: any,
			originalValue: any,
		) => {
			// Verifică dacă este un rând local (cu ID temporar)
			const isLocalRow = rowId.startsWith('temp_') || cellId.startsWith('temp_cell_');
			
			// Pentru rândurile locale, actualizează direct în pendingNewRows
			if (isLocalRow) {
				updateLocalRowCell(rowId, columnId, newValue);
				return;
			}

			

			const cellKey = getCellKey(rowId, columnId);

			setPendingChanges((prev) => {
				const newMap = new Map(prev);


				// Comparare mai robustă a valorilor
				const areEqual = (() => {
					// Cazuri speciale pentru null/undefined
					if (newValue == null && originalValue == null) {
						return true;
					}
					if (newValue == null || originalValue == null) {
						return false;
					}
					
					// Pentru string-uri, comparăm valorile normalizate
					if (typeof newValue === 'string' && typeof originalValue === 'string') {
						const trimmedNew = newValue.trim();
						const trimmedOriginal = originalValue.trim();
						return trimmedNew === trimmedOriginal;
					}
					
					// Pentru array-uri, comparăm conținutul
					if (Array.isArray(newValue) && Array.isArray(originalValue)) {
						if (newValue.length !== originalValue.length) {
							return false;
						}
						return newValue.every((val, index) => val === originalValue[index]);
					}
					
					// Pentru obiecte, comparăm JSON-ul
					if (typeof newValue === 'object' && typeof originalValue === 'object') {
						return JSON.stringify(newValue) === JSON.stringify(originalValue);
					}
					
					// Comparație strictă pentru restul
					return newValue === originalValue;
				})();

				// Dacă valoarea este aceeași cu originalul, eliminăm din pending
				if (areEqual) {
					newMap.delete(cellKey);
				} else {
					// Adăugăm modificarea în pending changes
					const pendingChange = {
						rowId,
						columnId,
						cellId,
						newValue,
						originalValue,
						timestamp: Date.now(),
					};
					newMap.set(cellKey, pendingChange);
				}
				return newMap;
			});

			// Programează auto-save doar dacă autoSaveDelay > 0
			if (autoSaveTimeoutRef.current) {
				clearTimeout(autoSaveTimeoutRef.current);
			}

			if (autoSaveDelay > 0) {
				autoSaveTimeoutRef.current = setTimeout(() => {
					if (saveFunctionRef.current) {
						saveFunctionRef.current();
					}
				}, autoSaveDelay);
			} else if (autoSaveDelay === 0) {
				// Pentru autoSaveDelay = 0, face save imediat
				if (saveFunctionRef.current) {
					// Folosește setTimeout pentru a evita probleme de sincronizare
					setTimeout(() => {
						if (saveFunctionRef.current) {
							saveFunctionRef.current();
						}
					}, 100);
				}
			}
			// Pentru autoSaveDelay < 0, nu face nimic (dezactivează auto-save)
		},
		[getCellKey, autoSaveDelay, updateLocalRowCell],
	);


	// Salvează toate modificările pending
	const savePendingChanges = useCallback(async () => {

		if (
			(pendingChanges.size === 0 && pendingNewRows.length === 0) ||
			!tenantId ||
			!token ||
			!table ||
			!selectedDatabase
		) {
			return;
		}

		setIsSaving(true);

		try {
			// Pregătește datele pentru request-uri separate (mai simple și mai sigur)
			const newRowsData = pendingNewRows.length > 0 ? pendingNewRows.map((row) => ({
				cells: row.cells.map((cell) => ({
					columnId: cell.columnId,
					value: cell.value,
				})),
			})) : [];

			// Grupează modificările existente pentru request-uri batch
			const changesByRow = new Map<string, PendingCellChange[]>();
			pendingChanges.forEach((change) => {
				const existing = changesByRow.get(change.rowId) || [];
				existing.push(change);
				changesByRow.set(change.rowId, existing);
			});

			const allUpdatedCells: any[] = [];
			const allNewRows: any[] = [];

			// 1. Salvează rândurile noi (dacă există)
			if (newRowsData.length > 0) {
				const newRowsResponse = await fetch(
					`/api/tenants/${tenantId}/databases/${selectedDatabase.id}/tables/${table.id}/rows/batch`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ rows: newRowsData }),
					},
				);

				if (!newRowsResponse.ok) {
					const errorData = await newRowsResponse.json().catch(() => ({}));
					throw new Error(
						errorData.error ||
							errorData.message ||
							`HTTP ${newRowsResponse.status}: ${newRowsResponse.statusText}`,
					);
				}

				const newRowsResult = await newRowsResponse.json();
				allNewRows.push(...(newRowsResult.rows || []));
				setPendingNewRows([]);
			}

			// 2. Actualizează celulele existente (dacă există modificări)
			if (changesByRow.size > 0) {
				
				// Un singur request pentru toate modificările
				const allOperations: any[] = [];
				changesByRow.forEach((rowChanges) => {
					rowChanges.forEach((change) => {
						allOperations.push({
							operation: "update",
							data: {
								rowId: change.rowId,
								columnId: change.columnId,
								cellId: change.cellId,
								value: change.newValue,
							},
						});
					});
				});

				const batchPayload = { operations: allOperations };

				const updateResponse = await fetch(
					`/api/tenants/${tenantId}/databases/${selectedDatabase.id}/tables/${table.id}/batch`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(batchPayload),
					},
				);

				if (!updateResponse.ok) {
					const errorData = await updateResponse.json().catch(() => ({}));
					throw new Error(
						errorData.error ||
							errorData.message ||
							`HTTP ${updateResponse.status}: ${updateResponse.statusText}`,
					);
				}

				const updateResult = await updateResponse.json();
				allUpdatedCells.push(...(updateResult.data?.updatedCells || []));
			}

			// Curăță modificările pending după succes
			setPendingChanges(new Map());
			setIsEditingCell(null);

			// Notifică succesulr
			const totalChanges = allUpdatedCells.length + allNewRows.length;
			showAlert(
				`Successfully saved ${totalChanges} item(s) - ${allNewRows.length} new rows, ${allUpdatedCells.length} cell updates`,
				"success",
			);
			
		// 🔧 FIX: Update local state with server response data
		// Include both new rows (from server) and cell updates to properly update UI
		const allUpdatedData = [...allNewRows, ...allUpdatedCells];
		onSuccess?.(allUpdatedData);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to save changes";
			showAlert(errorMessage, "error");
			
			// 🔧 FIX: Rollback precis pentru operațiunile eșuate
			// Nu curăța pending changes imediat, lasă-le pentru retry
			
			onError?.(errorMessage);
		} finally {
			setIsSaving(false);
		}
	}, [
		pendingChanges,
		pendingNewRows,
		tenantId,
		token,
		table,
		selectedDatabase,
		showAlert,
		onSuccess,
		onError,
	]);

	// Actualizează ref-ul cu funcția de save
	saveFunctionRef.current = savePendingChanges;


	// Anulează toate modificările pending
	const discardPendingChanges = useCallback(() => {
		setPendingChanges(new Map());
		setPendingNewRows([]);
		setIsEditingCell(null);

		if (autoSaveTimeoutRef.current) {
			clearTimeout(autoSaveTimeoutRef.current);
		}

		showAlert("Changes discarded", "info");
	}, [showAlert]);

	// 🔧 FIX: Rollback precis pentru operațiunile eșuate
	const rollbackOptimisticUpdates = useCallback((failedOperations: string[]) => {
		
		// Notifică callback-ul pentru rollback în UI
		onSuccess?.(failedOperations.map(op => {
			const [rowId, columnId] = op.split('-');
			return {
				id: `rollback-${Date.now()}`,
				rowId: parseInt(rowId),
				columnId: parseInt(columnId),
				value: null, // Signal pentru rollback
				isRollback: true
			};
		}));
	}, [onSuccess]);

	// Verifică dacă o celulă are modificări pending
	const hasPendingChange = useCallback(
		(rowId: string, columnId: string) => {
			// Pentru rândurile locale, verifică în pendingNewRows
			if (rowId.startsWith('temp_')) {
				const localRow = pendingNewRows.find(row => row.id === rowId);
				return !!localRow;
			}
			
			const cellKey = getCellKey(rowId, columnId);
			return pendingChanges.has(cellKey);
		},
		[pendingChanges, pendingNewRows, getCellKey],
	);

	// Obține valoarea pending pentru o celulă
	const getPendingValue = useCallback(
		(rowId: string, columnId: string) => {
			// Pentru rândurile locale, caută în pendingNewRows
			if (rowId.startsWith('temp_')) {
				const localRow = pendingNewRows.find(row => row.id === rowId);
				const cell = localRow?.cells.find(cell => cell.columnId.toString() === columnId);
				return cell?.value;
			}
			
			const cellKey = getCellKey(rowId, columnId);
			const pendingChange = pendingChanges.get(cellKey);
			return pendingChange?.newValue; // Use newValue instead of value
		},
		[pendingChanges, pendingNewRows, getCellKey],
	);

	// Salvează manual (forțat)
	const saveNow = useCallback(async () => {
		if (autoSaveTimeoutRef.current) {
			clearTimeout(autoSaveTimeoutRef.current);
		}
		await savePendingChanges();
	}, [savePendingChanges]);

	// Auto-save la beforeunload (când utilizatorul părăsește pagina)
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (pendingChanges.size > 0) {
				// Salvează rapid modificările înainte de a părăsi pagina
				savePendingChanges();

				// Afișează dialog de confirmare
				e.preventDefault();
				e.returnValue =
					"You have unsaved changes. Are you sure you want to leave?";
				return e.returnValue;
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [pendingChanges.size, savePendingChanges]);

	// Cleanup la unmount
	useEffect(() => {
		return () => {
			if (autoSaveTimeoutRef.current) {
				clearTimeout(autoSaveTimeoutRef.current);
			}
		};
	}, []);

	const result = {
		// State
		pendingChanges,
		pendingNewRows,
		isEditingCell,
		isSaving,
		pendingChangesCount: pendingChanges.size,
		pendingNewRowsCount: pendingNewRows.length,

		// Actions
		startEditing,
		cancelEditing,
		addPendingChange,
		addNewRow,
		updateLocalRowCell,
		removeLocalRow,
		savePendingChanges,
		discardPendingChanges,
		rollbackOptimisticUpdates, // 🔧 FIX: Export rollback function
		saveNow,

		// Helpers
		hasPendingChange,
		getPendingValue,
	};



	return result;
}
