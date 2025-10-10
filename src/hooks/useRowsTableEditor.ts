/** @format */
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Row, Table } from "@/types/database";
import { useState } from "react";
import { useBatchCellEditor } from "./useBatchCellEditor";

interface UseRowsTableEditorOptions {
	table: Table | null;
	onCellsUpdated?: (updatedCells: any[]) => void;
	onError?: (error: string) => void;
}

function useRowsTableEditor(
	options: UseRowsTableEditorOptions = { table: null },
) {
	const { user } = useApp();
	const { table, onCellsUpdated, onError } = options;


	// Folosim noul batch editor
	const {
		pendingChanges,
		pendingNewRows,
		isEditingCell,
		startEditing,
		cancelEditing,
		addPendingChange,
		addNewRow,
		updateLocalRowCell,
		removeLocalRow,
		savePendingChanges,
		discardPendingChanges,
		rollbackOptimisticUpdates, // 🔧 FIX: Import rollback function
		saveNow,
		hasPendingChange,
		getPendingValue,
		pendingChangesCount,
		pendingNewRowsCount,
		isSaving,
	} = useBatchCellEditor({
		table,
		autoSaveDelay: -1, // Disable auto-save completely for batch editing
		onSuccess: onCellsUpdated,
		onError: onError || ((error) => {
			// Handle error silently or with proper error handling
		}),
	onNewRowsAdded: (newRows) => {
		// Don't call onCellsUpdated for local temporary rows
		// They are already displayed through pendingNewRows
		// onCellsUpdated should only be called for saved rows from server
		console.log("🔍 New rows added to local batch:", newRows);
	},
	onNewRowsUpdated: (updatedRows) => {
		// Don't call onCellsUpdated for local temporary row updates
		// They are already displayed through pendingNewRows
		// onCellsUpdated should only be called for saved rows from server
		console.log("🔍 Local rows updated in batch:", updatedRows);
	},
	});

	const handleCancelEdit = () => cancelEditing();

	const handleEditCell = (rowId: string, columnId: string, cellId: string) => {
		startEditing(rowId, columnId, cellId);
	};

	const { tenant } = useApp();
	const tenantId = tenant?.id;

	// Nouă funcție pentru salvarea celulelor care folosește batch editor
	const handleSaveCell = async (
		columnId: string,
		rowId: string,
		cellId: string,
		rows: Row[],
		onSuccess: (newCell?: any) => void,
		value: any,
		_table: any, // Nu mai folosim table-ul din parametri, îl avem în context
		_token: string, // Nu mai folosim token-ul din parametri, îl avem în context
		_user: any, // Nu mai folosim user-ul din parametri, îl avem în context
		_showAlert: (
			message: string,
			type: "error" | "success" | "warning" | "info",
		) => void, // Nu mai folosim showAlert din parametri, îl avem în context
		options?: { keepEditing?: boolean }, // New optional parameter to control editing behavior
	) => {
		console.log('🔍 [handleSaveCell] Called with:', {
			columnId,
			rowId,
			cellId,
			value,
			valueType: typeof value,
			rowsCount: rows.length
		});
		
		// Găsim celula existentă pentru a obține valoarea originală
		const currentRow = rows.find((row) => row.id.toString() === rowId);
		const existingCell = currentRow?.cells?.find(
			(cell) => cell.columnId.toString() === columnId,
		);
		const originalValue = existingCell?.value ?? null;
		
		console.log('🔍 [handleSaveCell] Row structure:', {
			currentRow: currentRow ? {
				id: currentRow.id,
				cellsCount: currentRow.cells?.length || 0,
				cells: currentRow.cells?.map(c => ({
					id: c.id,
					columnId: c.columnId,
					value: c.value,
					valueType: typeof c.value
				}))
			} : 'not found',
			lookingForColumnId: columnId,
			cellIdParam: cellId
		});
		
		console.log('🔍 [handleSaveCell] Original value:', {
			originalValue,
			originalValueType: typeof originalValue,
			existingCell: existingCell ? {
				id: existingCell.id,
				columnId: existingCell.columnId,
				value: existingCell.value
			} : 'not found',
			currentRow: currentRow ? 'found' : 'not found'
		});

		// Adăugăm modificarea la batch-ul pending
		addPendingChange(rowId, columnId, cellId, value, originalValue);

		// Anulăm editarea doar dacă nu este specificat să o păstrăm
		if (!options?.keepEditing) {
			cancelEditing();
		}

		// Apelăm callback-ul pentru actualizare optimistă a UI-ului
		onSuccess({
			id: cellId === "virtual" ? `temp-${Date.now()}` : cellId,
			columnId: parseInt(columnId),
			rowId: parseInt(rowId),
			value: value,
		});
	};

	return {
		// Compatibilitate cu API-ul existent
		editingCell: isEditingCell,
		setEditingCell: (cell: any) => {
			if (cell) {
				startEditing(cell.rowId, cell.columnId, cell.cellId);
			} else {
				cancelEditing();
			}
		},
		handleCancelEdit,
		handleEditCell,
		handleSaveCell,

		// Noi funcționalități pentru batch editing
		pendingChanges,
		pendingNewRows,
		pendingChangesCount,
		pendingNewRowsCount,
		isSaving,
		hasPendingChange,
		getPendingValue,
		savePendingChanges: saveNow,
		discardPendingChanges,
		rollbackOptimisticUpdates, // 🔧 FIX: Export rollback function
		
		// Funcționalități pentru rânduri noi
		addNewRow,
		updateLocalRowCell,
		removeLocalRow,
	};
}

export default useRowsTableEditor;
