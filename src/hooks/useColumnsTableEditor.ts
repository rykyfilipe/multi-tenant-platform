/** @format */
import { useState } from "react";
import { Column } from "@/types/database";
import { useApp } from "@/contexts/AppContext";

function useColumnsTableEditor() {
	const { user } = useApp();
	const [editingCell, setEditingCell] = useState<{
		columnId: string;
		fieldName: keyof Column;
	} | null>(null);

	const handleCancelEdit = () => setEditingCell(null);

	const handleEditCell = (columnId: string, fieldName: keyof Column) => {
		if (user.role !== "VIEWER") setEditingCell({ columnId, fieldName });
	};

	const { tenant } = useApp();
	const tenantId = tenant?.id;

	const handleSaveCell = async (
		columnId: string,
		fieldName: keyof Column,
		value: any,
		columns: Column[],
		setColumns: (cols: Column[]) => void,
		table: any,
		token: string,
		user: any,
		showAlert: (
			message: string,
			type: "error" | "success" | "warning" | "info",
		) => void,
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
				`/api/tenants/${tenantId}/database/${table.databaseId}/tables/${table.id}/columns/${columnId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						field: fieldName,
						value: value,
					}),
				},
			);

			if (!response.ok) throw new Error("Failed to update column");

			showAlert("Column configuration updated successfully", "success");
			setEditingCell(null);
		} catch (error) {
			// Revert local state on error
			setColumns([...columns]);
			showAlert(
				"Failed to update column configuration. Please try again.",
				"error",
			);
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
