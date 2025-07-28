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
			if (!response.ok) {
				// Încearcă să parsezi răspunsul ca JSON pentru a obține mesajul de eroare
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

				try {
					const errorData = await response.json();
					errorMessage =
						errorData.error ||
						errorData.message ||
						errorData.details ||
						errorMessage;
				} catch (parseError) {
					try {
						const textError = await response.text();
						errorMessage = textError || errorMessage;
					} catch (textParseError) {
						console.error("Could not parse error response:", textParseError);
					}
				}

				throw new Error(errorMessage);
			}

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
		} catch (error: any) {
			// Gestionează diferite tipuri de erori
			let errorMessage = "An unexpected error occurred";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "string") {
				errorMessage = error;
			} else if (error?.message) {
				errorMessage = error.message;
			}

			showAlert(errorMessage, "error");
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
