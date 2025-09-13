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

		setPendingNewRows(prev => [...prev, newRow]);
		onNewRowsAdded?.([newRow]);
		
		console.log("🆕 Added new local row:", newRow);
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
		
		console.log("🔄 Updated local row cell:", { rowId, columnId, newValue });
	}, [onNewRowsUpdated]);

	// Elimină un rând local
	const removeLocalRow = useCallback((rowId: string) => {
		setPendingNewRows(prev => {
			const filtered = prev.filter(row => row.id !== rowId);
			onNewRowsUpdated?.(filtered);
			return filtered;
		});
		
		console.log("🗑️ Removed local row:", rowId);
	}, [onNewRowsUpdated]);

	// Începe editarea unei celule
	const startEditing = useCallback(
		(rowId: string, columnId: string, cellId: string) => {
			console.log("🔍 DEBUG: startEditing called", { rowId, columnId, cellId });
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

				console.log("🔍 DEBUG: addPendingChange - comparing values", { 
					newValue, 
					originalValue, 
					cellKey,
					newValueType: typeof newValue,
					originalValueType: typeof originalValue,
					newValueStringified: JSON.stringify(newValue),
					originalValueStringified: JSON.stringify(originalValue)
				});

				// Comparare mai robustă a valorilor
				const areEqual = (() => {
					// Cazuri speciale pentru null/undefined
					if (newValue == null && originalValue == null) {
						console.log("🔍 DEBUG: Both values are null/undefined");
						return true;
					}
					if (newValue == null || originalValue == null) {
						console.log("🔍 DEBUG: One value is null/undefined");
						return false;
					}
					
					// Pentru string-uri, comparăm valorile normalizate
					if (typeof newValue === 'string' && typeof originalValue === 'string') {
						const trimmedNew = newValue.trim();
						const trimmedOriginal = originalValue.trim();
						const result = trimmedNew === trimmedOriginal;
						console.log("🔍 DEBUG: String comparison", { 
							newValue, 
							originalValue, 
							trimmedNew, 
							trimmedOriginal, 
							result 
						});
						return result;
					}
					
					// Pentru array-uri, comparăm conținutul
					if (Array.isArray(newValue) && Array.isArray(originalValue)) {
						if (newValue.length !== originalValue.length) {
							console.log("🔍 DEBUG: Array length mismatch", { 
								newLength: newValue.length, 
								originalLength: originalValue.length 
							});
							return false;
						}
						const result = newValue.every((val, index) => val === originalValue[index]);
						console.log("🔍 DEBUG: Array comparison", { result, newValue, originalValue });
						return result;
					}
					
					// Pentru obiecte, comparăm JSON-ul
					if (typeof newValue === 'object' && typeof originalValue === 'object') {
						const result = JSON.stringify(newValue) === JSON.stringify(originalValue);
						console.log("🔍 DEBUG: Object comparison", { result, newValue, originalValue });
						return result;
					}
					
					// Comparație strictă pentru restul
					const result = newValue === originalValue;
					console.log("🔍 DEBUG: Strict comparison", { result, newValue, originalValue });
					return result;
				})();

				console.log("🔍 DEBUG: Final comparison result", { areEqual, newValue, originalValue });

				// Dacă valoarea este aceeași cu originalul, eliminăm din pending
				if (areEqual) {
					console.log("🔍 DEBUG: Values are equal, removing from pending changes");
					newMap.delete(cellKey);
				} else {
					// Adăugăm modificarea în pending changes
					console.log("🔍 DEBUG: Values are different, adding to pending changes");
					const pendingChange = {
						rowId,
						columnId,
						cellId,
						newValue,
						originalValue,
						timestamp: Date.now(),
					};
					console.log("🔍 DEBUG: Setting pending change", pendingChange);
					newMap.set(cellKey, pendingChange);
				}

				console.log("🔍 DEBUG: Final pending changes map size:", newMap.size);
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
						console.log("🔍 DEBUG: Calling saveFunctionRef.current");
						if (saveFunctionRef.current) {
							saveFunctionRef.current();
						} else {
							console.error("❌ saveFunctionRef.current is null!");
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
		console.log("💾 savePendingChanges called with:", {
			pendingChangesCount: pendingChanges.size,
			pendingNewRowsCount: pendingNewRows.length,
			pendingChanges: Array.from(pendingChanges.entries()),
			hasTenantId: !!tenantId,
			hasToken: !!token,
			hasTable: !!table,
			hasSelectedDatabase: !!selectedDatabase,
		});
		
		console.log("🔍 DEBUG: Full pendingChanges map:", pendingChanges);
		console.log("🔍 DEBUG: PendingChanges keys:", Array.from(pendingChanges.keys()));
		console.log("🔍 DEBUG: PendingChanges values:", Array.from(pendingChanges.values()));

		if (
			(pendingChanges.size === 0 && pendingNewRows.length === 0) ||
			!tenantId ||
			!token ||
			!table ||
			!selectedDatabase
		) {
			console.log("❌ savePendingChanges: Missing requirements or no changes, skipping save");
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
				console.log("🚀 Saving new rows:", newRowsData);
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
				console.log("✅ New rows saved successfully:", allNewRows);
			}

			// 2. Actualizează celulele existente (dacă există modificări)
			console.log("🔍 DEBUG: changesByRow size:", changesByRow.size);
			console.log("🔍 DEBUG: changesByRow content:", Array.from(changesByRow.entries()));
			
			if (changesByRow.size > 0) {
				console.log("🚀 Updating existing cells:", changesByRow.size, "rows");
				
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
				console.log("🚀 Batch update payload:", batchPayload);

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
				console.log("🔍 DEBUG: Server response for cell updates:", updateResult);
				console.log("🔍 DEBUG: updateResult.updatedCells:", updateResult.updatedCells);
				console.log("✅ Cell updates saved successfully:", allUpdatedCells);
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
			console.log("🔄 Updating local state with server response:", { allUpdatedCells, allNewRows });
			onSuccess?.([...allUpdatedCells, ...allNewRows]);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to save changes";
			showAlert(errorMessage, "error");
			
			// 🔧 FIX: Rollback precis pentru operațiunile eșuate
			// Nu curăța pending changes imediat, lasă-le pentru retry
			console.log("❌ Batch save failed, keeping pending changes for potential retry");
			
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
	console.log("🔍 DEBUG: saveFunctionRef set to savePendingChanges");


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
		console.log("🔄 Rolling back optimistic updates for failed operations:", failedOperations);
		
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
			const hasPending = pendingChanges.has(cellKey);
			console.log("🔍 DEBUG: hasPendingChange", { rowId, columnId, cellKey, hasPending, totalPending: pendingChanges.size });
			return hasPending;
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
				console.log("🔍 DEBUG: getPendingValue for local row", { rowId, columnId, cellValue: cell?.value });
				return cell?.value;
			}
			
			const cellKey = getCellKey(rowId, columnId);
			const pendingChange = pendingChanges.get(cellKey);
			const pendingValue = pendingChange?.newValue; // Use newValue instead of value
			console.log("🔍 DEBUG: getPendingValue", { 
				rowId, 
				columnId, 
				cellKey, 
				pendingValue, 
				hasPending: pendingChanges.has(cellKey), 
				pendingChange,
				allPendingKeys: Array.from(pendingChanges.keys())
			});
			return pendingValue;
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
