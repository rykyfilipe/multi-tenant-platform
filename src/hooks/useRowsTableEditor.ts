/** @format */
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Row, Table } from "@/types/database";
import { useState } from "react";
import { useBatchCellEditor } from "./useBatchCellEditor";

interface UseRowsTableEditorOptions {
	table: Table | null;
	onCellsUpdated?: (updatedCells: any[]) => void;
}

function useRowsTableEditor(
	options: UseRowsTableEditorOptions = { table: null },
) {
	const { user } = useApp();
	const { table, onCellsUpdated } = options;

	console.log(
		"🎣 useRowsTableEditor initialized with table:",
		table?.name || "No table",
	);

	// Folosim noul batch editor
	const {
		isEditingCell,
		startEditing,
		cancelEditing,
		addPendingChange,
		savePendingChanges,
		discardPendingChanges,
		saveNow,
		hasPendingChange,
		getPendingValue,
		pendingChangesCount,
		isSaving,
	} = useBatchCellEditor({
		table,
		autoSaveDelay: 0, // Disable auto-save - only save on explicit click
		onSuccess: onCellsUpdated,
		onError: (error) => {
			console.error("Batch save error:", error);
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
	) => {
		console.log("💾 handleSaveCell called:", {
			rowId,
			columnId,
			cellId,
			value,
		});

		// Găsim celula existentă pentru a obține valoarea originală
		const currentRow = rows.find((row) => row.id.toString() === rowId);
		const existingCell = currentRow?.cells?.find(
			(cell) => cell.columnId.toString() === columnId,
		);
		const originalValue = existingCell?.value ?? null;

		console.log("🔍 Found original value:", originalValue);

		// Adăugăm modificarea la batch-ul pending
		addPendingChange(rowId, columnId, cellId, value, originalValue);

		// Anulăm editarea
		cancelEditing();

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
		pendingChangesCount,
		isSaving,
		hasPendingChange,
		getPendingValue,
		savePendingChanges: saveNow,
		discardPendingChanges,
	};
}

export default useRowsTableEditor;
