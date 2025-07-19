/** @format */
import { useApp } from "@/contexts/AppContext";
import { Row } from "@/types/database";
import { useState } from "react";

function useRowsTableEditor() {
	const { user } = useApp();
	const [editingCell, setEditingCell] = useState<{
		rowId: string;
		columnId: string;
		cellId: string;
	} | null>(null);

	const handleCancelEdit = () => setEditingCell(null);

	const handleEditCell = (rowId: string, columnId: string, cellId: string) => {
		if (user.role === "VIEWER") return;
		setEditingCell({ rowId, columnId, cellId });
	};

	const { tenant } = useApp();
	const tenantId = tenant?.id;

	const handleSaveCell = async (
		columnId: string,
		rowId: string,
		cellId: string,
		rows: Row[],
		setRows: (rows: Row[]) => void,
		value: any,
		table: any,
		token: string,
		user: any,
		showAlert: (message: string, type: "error" | "success") => void,
	) => {
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/database/tables/${table.id}/rows/${rowId}/cell/${cellId}`,
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

			console.log(rowId + " " + cellId);

			const updatedRows = rows.map((row) => {
				if (row.id.toString() !== rowId) return row;

				const updatedCells = row.cells.map((cell) => {
					if (cell.id.toString() === cellId) {
						return { ...cell, value };
					}
					return cell;
				});

				return { ...row, cells: updatedCells };
			});

			setRows(updatedRows);

			setEditingCell(null);
			showAlert("Cell updated successfully", "success");
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
