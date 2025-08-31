/** @format */

import { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Row, Table } from "@/types/database";

interface PendingCellChange {
	rowId: string;
	columnId: string;
	cellId: string;
	value: any;
	originalValue: any;
}

interface BatchCellEditorOptions {
	table: Table | null;
	autoSaveDelay?: number; // Auto-save după X ms de inactivitate
	onSuccess?: (updatedCells: any[]) => void;
	onError?: (error: string) => void;
}

export function useBatchCellEditor(options: BatchCellEditorOptions) {
	const { tenant, token, showAlert } = useApp();
	const { selectedDatabase } = useDatabase();
	const tenantId = tenant?.id;
	const { table } = options;

	console.log("🔧 useBatchCellEditor initialized:", {
		hasTable: !!table,
		tableName: table?.name,
		tenantId,
		hasToken: !!token,
	});

	// State pentru modificările pending
	const [pendingChanges, setPendingChanges] = useState<
		Map<string, PendingCellChange>
	>(new Map());
	const [isEditingCell, setIsEditingCell] = useState<{
		rowId: string;
		columnId: string;
		cellId: string;
	} | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Refs pentru auto-save
	const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const { autoSaveDelay = 2000, onSuccess, onError } = options;

	// Generează cheia unică pentru o celulă
	const getCellKey = useCallback((rowId: string, columnId: string) => {
		return `${rowId}-${columnId}`;
	}, []);

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
			console.log("🔄 Adding pending change:", {
				rowId,
				columnId,
				cellId,
				newValue,
				originalValue,
			});

			const cellKey = getCellKey(rowId, columnId);

			setPendingChanges((prev) => {
				const newMap = new Map(prev);

				// Dacă valoarea este aceeași cu originalul, eliminăm din pending
				if (newValue === originalValue) {
					console.log(
						"❌ Removing pending change (same as original):",
						cellKey,
					);
					newMap.delete(cellKey);
				} else {
					console.log("✅ Adding pending change:", cellKey);
					newMap.set(cellKey, {
						rowId,
						columnId,
						cellId,
						value: newValue,
						originalValue,
					});
				}

				console.log("📊 Total pending changes:", newMap.size);
				return newMap;
			});

			// Programează auto-save
			if (autoSaveTimeoutRef.current) {
				clearTimeout(autoSaveTimeoutRef.current);
			}

			autoSaveTimeoutRef.current = setTimeout(() => {
				console.log("⏰ Auto-save triggered");
				if (saveFunctionRef.current) {
					saveFunctionRef.current();
				}
			}, autoSaveDelay);
		},
		[getCellKey, autoSaveDelay],
	);

	// Salvează toate modificările pending
	const savePendingChanges = useCallback(async () => {
		if (
			pendingChanges.size === 0 ||
			!tenantId ||
			!token ||
			!table ||
			!selectedDatabase
		) {
			return;
		}

		setIsSaving(true);

		try {
			// Grupează modificările pe rând pentru a optimiza request-urile
			const changesByRow = new Map<string, PendingCellChange[]>();

			pendingChanges.forEach((change) => {
				const existing = changesByRow.get(change.rowId) || [];
				existing.push(change);
				changesByRow.set(change.rowId, existing);
			});

			const allUpdatedCells: any[] = [];

			// Procesează fiecare rând cu batch API
			for (const [rowId, rowChanges] of changesByRow) {
				try {
					// Folosește noul endpoint batch pentru rând
					const batchPayload = {
						operations: rowChanges.map((change) => ({
							operation: "update",
							data: {
								rowId: change.rowId,
								columnId: change.columnId,
								cellId: change.cellId,
								value: change.value,
							},
						})),
					};

					const response = await fetch(
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

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						throw new Error(
							errorData.error ||
								errorData.message ||
								`HTTP ${response.status}: ${response.statusText}`,
						);
					}

					const batchResult = await response.json();
					allUpdatedCells.push(...(batchResult.updatedCells || []));
				} catch (rowError) {
					console.error(`Failed to update row ${rowId}:`, rowError);

					// Fallback la request-uri individuale pentru acest rând
					try {
						const individualUpdates = await Promise.all(
							rowChanges.map(async (change) => {
								const response = await fetch(
									`/api/tenants/${tenantId}/databases/${selectedDatabase.id}/tables/${table.id}/rows/${change.rowId}/cell/${change.cellId}`,
									{
										method: "PATCH",
										headers: {
											"Content-Type": "application/json",
											Authorization: `Bearer ${token}`,
										},
										body: JSON.stringify({
											value: change.value,
										}),
									},
								);

								if (!response.ok) {
									const errorData = await response.json().catch(() => ({}));
									throw new Error(
										errorData.error ||
											errorData.message ||
											`HTTP ${response.status}: ${response.statusText}`,
									);
								}

								return await response.json();
							}),
						);

						allUpdatedCells.push(...individualUpdates);
					} catch (fallbackError) {
						throw new Error(`Failed to update row ${rowId}: ${fallbackError}`);
					}
				}
			}

			// Curăță modificările pending după succes
			setPendingChanges(new Map());
			setIsEditingCell(null);

			// Notifică succesul
			showAlert(
				`Successfully updated ${allUpdatedCells.length} cell(s)`,
				"success",
			);
			onSuccess?.(allUpdatedCells);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to save changes";
			showAlert(errorMessage, "error");
			onError?.(errorMessage);
		} finally {
			setIsSaving(false);
		}
	}, [
		pendingChanges,
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
		setIsEditingCell(null);

		if (autoSaveTimeoutRef.current) {
			clearTimeout(autoSaveTimeoutRef.current);
		}

		showAlert("Changes discarded", "info");
	}, [showAlert]);

	// Verifică dacă o celulă are modificări pending
	const hasPendingChange = useCallback(
		(rowId: string, columnId: string) => {
			const cellKey = getCellKey(rowId, columnId);
			return pendingChanges.has(cellKey);
		},
		[pendingChanges, getCellKey],
	);

	// Obține valoarea pending pentru o celulă
	const getPendingValue = useCallback(
		(rowId: string, columnId: string) => {
			const cellKey = getCellKey(rowId, columnId);
			return pendingChanges.get(cellKey)?.value;
		},
		[pendingChanges, getCellKey],
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
		isEditingCell,
		isSaving,
		pendingChangesCount: pendingChanges.size,

		// Actions
		startEditing,
		cancelEditing,
		addPendingChange,
		savePendingChanges,
		discardPendingChanges,
		saveNow,

		// Helpers
		hasPendingChange,
		getPendingValue,
	};

	console.log("📤 useBatchCellEditor returning:", {
		pendingChangesCount: result.pendingChangesCount,
		isSaving: result.isSaving,
		isEditingCell: !!result.isEditingCell,
	});

	return result;
}
