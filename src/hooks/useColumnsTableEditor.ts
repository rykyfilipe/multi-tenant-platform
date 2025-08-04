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

			// Construim obiectul de update cu câmpul specific
			const updateData: any = {};

			// Convertim valorile la tipurile corecte
			if (fieldName === "referenceTableId") {
				updateData[fieldName] = value ? Number(value) : null;
			} else if (
				fieldName === "required" ||
				fieldName === "primary" ||
				fieldName === "autoIncrement"
			) {
				updateData[fieldName] = Boolean(value);
			} else {
				updateData[fieldName] = value;
			}

			if (process.env.NODE_ENV === "development") {
				console.log("Column update - Field:", fieldName, "Value:", value);
				console.log("Column update - Update data:", updateData);
			}

			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns/${columnId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(updateData),
				},
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Column update failed:", response.status, errorText);
				throw new Error(`Failed to update column: ${response.status}`);
			}

			const updatedColumnData = await response.json();
			if (process.env.NODE_ENV === "development") {
				console.log("Column update - Response:", updatedColumnData);
			}

			// Actualizăm state-ul cu datele de la server
			setColumns(
				columns.map((col) =>
					col.id.toString() === columnId
						? { ...col, ...updatedColumnData }
						: col,
				),
			);

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

	const handleDeleteColumn = async (
		columnId: string,
		columns: Column[],
		setColumns: (cols: Column[]) => void,
		table: any,
		token: string,
		showAlert: (
			message: string,
			type: "error" | "success" | "warning" | "info",
		) => void,
	) => {
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/columns/${columnId}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				const errorMessage =
					errorData.error || `Failed to delete column: ${response.status}`;
				throw new Error(errorMessage);
			}

			// Actualizăm state-ul local prin eliminarea coloanei șterse
			setColumns(columns.filter((col) => col.id.toString() !== columnId));
			showAlert("Column deleted successfully", "success");
		} catch (error) {
			showAlert(
				error instanceof Error
					? error.message
					: "Failed to delete column. Please try again.",
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
		handleDeleteColumn,
	};
}

export default useColumnsTableEditor;
