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
		// Allow editing based on permissions rather than hard-coded role check
		// This enables flexible permission management where even VIEWERs can edit if granted permissions
		setEditingCell({ columnId, fieldName });
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
			// Special handling for semantic type CURRENCY
			if (fieldName === "semanticType" && value === "currency") {
				// Automatically set column type to customArray and populate with currency codes
				const currencyCodes = [
					"USD", "EUR", "RON", "GBP", "JPY", "CHF", "CAD", "AUD", 
					"CNY", "INR", "BRL", "MXN", "KRW", "SGD", "HKD", "NZD",
					"SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RUB", "TRY",
					"ZAR", "BGN", "HRK", "RSD", "UAH", "MDL"
				];

				// Prepare update data for both fields
				const updateData = {
					semanticType: value,
					type: "customArray",
					customOptions: currencyCodes
				};

				// Update the column on the server first
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
				
				// Update local state with server response (optimistic update)
				setColumns(
					columns.map((col) =>
						col.id.toString() === columnId
							? { ...col, ...updatedColumnData }
							: col,
					),
				);

				showAlert("Currency column auto-configured successfully! Column type set to Custom Array with all supported currency codes.", "success");
				setEditingCell(null);
				return;
			}

			// Construim obiectul de update cu câmpul specific
			const updateData: any = {};

			// Convertim valorile la tipurile corecte
			if (fieldName === "referenceTableId") {
				updateData[fieldName] = value ? Number(value) : null;
			} else if (fieldName === "required" || fieldName === "primary") {
				updateData[fieldName] = Boolean(value);
			} else if (fieldName === "customOptions") {
				// Ensure customOptions is an array
				updateData[fieldName] = Array.isArray(value) ? value : [];
			} else {
				updateData[fieldName] = value;
			}

			// Special handling for column type change to customArray
			if (fieldName === "type" && value === "customArray") {
				// If changing to customArray, ensure customOptions exist
				const currentColumn = columns.find(col => col.id.toString() === columnId);
				if (currentColumn && (!currentColumn.customOptions || currentColumn.customOptions.length === 0)) {
					updateData.customOptions = [];
				}
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

			// Actualizăm state-ul cu datele de la server (optimistic update)
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
