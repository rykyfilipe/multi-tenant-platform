/** @format */
import { useState } from "react";
import { Column, ColumnSchema } from "@/types/database";

function useColumnsTableEditor() {
	const [editingCell, setEditingCell] = useState<{
		columnId: string;
		fieldName: keyof ColumnSchema;
	} | null>(null);

	const handleCancelEdit = () => setEditingCell(null);

	const handleEditCell = (columnId: string, fieldName: keyof ColumnSchema) =>
		setEditingCell({ columnId, fieldName });

	const handleSaveCell = async (
		columnId: string,
		fieldName: keyof ColumnSchema,
		value: any,
		columns: Column[],
		setColumns: (cols: Column[]) => void,
		table: any,
		token: string,
		user: any,
		showAlert: (message: string, type: "error" | "success") => void,
	) => {
		try {
			// Update local state first
			setColumns(
				columns.map((col) =>
					col.id.toString() === columnId ? { ...col, [fieldName]: value } : col,
				),
			);

			const updatedColumn = columns.find(
				(col) => col.id.toString() === columnId,
			);
			if (!updatedColumn) {
				throw new Error("Column not found");
			}

			const response = await fetch(
				`/api/tenants/${user.tenantId}/database/tables/${table.id}/columns/${columnId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						[fieldName]: value,
					}),
				},
			);

			if (!response.ok) throw new Error("Failed to update column");

			showAlert("Column updated successfully", "success");
			setEditingCell(null);
		} catch (error) {
			// Revert local state on error
			setColumns([...columns]);
			showAlert("Error updating column", "error");
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

export default useColumnsTableEditor;
