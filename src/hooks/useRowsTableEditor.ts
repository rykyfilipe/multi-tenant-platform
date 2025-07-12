/** @format */
import { useState } from "react";
import { Column, Row } from "@/types/database";

function useRowsTableEditor() {
	const [editingCell, setEditingCell] = useState<{
		rowId: string;
		columnId: string;
		cellId: string;
	} | null>(null);

	const handleCancelEdit = () => setEditingCell(null);

	const handleEditCell = (rowId: string, columnId: string, cellId: string) =>
		setEditingCell({ rowId, columnId, cellId });

	const handleSaveCell = async (
		columnId: string,
		rowId: string,
		cellId: string,
		value: any,
		table: any,
		token: string,
		user: any,
		showAlert: (message: string, type: "error" | "success") => void,
	) => {
		try {
			const response = await fetch(
				`/api/tenants/${user.tenantId}/database/tables/${table.id}/rows/${rowId}/cell/${cellId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						value,
					}),
				},
			);
			if (!response.ok) throw new Error("Failed to update cell");
			showAlert("Cell updated successfully", "success");

			setEditingCell(null);
		} catch (error) {
			showAlert("Error updating cell", "error");
		}
	};

	return {
		editingCell,
		setEditingCell,
		handleCancelEdit,
		handleEditCell,
		handleSaveCell,
	};
}

export default useRowsTableEditor;
