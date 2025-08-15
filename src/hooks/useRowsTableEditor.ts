/** @format */
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
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
		if (user?.role === "VIEWER") return;
		setEditingCell({ rowId, columnId, cellId });
	};

	const { tenant } = useApp();
	const tenantId = tenant?.id;

	const handleSaveCell = async (
		columnId: string,
		rowId: string,
		cellId: string,
		rows: Row[],
		onSuccess: (newCell?: any) => void,
		value: any,
		table: any,
		token: string,
		user: any,
		showAlert: (
			message: string,
			type: "error" | "success" | "warning" | "info",
		) => void,
	) => {
		try {
			// Pentru celulele virtuale (care nu există încă), creăm o celulă nouă
			if (cellId === "virtual") {
				const url = `/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/${rowId}/cell`;
				const requestBody = {
					columnId: parseInt(columnId),
					value,
				};

				// Creating virtual cell

				const response = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(requestBody),
				});

				// Response received

				if (!response.ok) {
					let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
					try {
						const errorData = await response.json();
						errorMessage =
							errorData.error ||
							errorData.message ||
							errorData.details ||
							errorMessage;
						// Error data received
					} catch (parseError) {
						try {
							const textError = await response.text();
							errorMessage = textError || errorMessage;
							// Error text received
						} catch (textParseError) {
							console.error("Could not parse error response:", textParseError);
						}
					}
					throw new Error(errorMessage);
				}

				let newCell;
				try {
					newCell = await response.json();
				} catch (parseError) {
					console.error("Could not parse success response:", parseError);
					throw new Error("Invalid response format");
				}

				// Nu mai facem setRows aici - lăsăm părintele să gestioneze state-ul
				setEditingCell(null);
				showAlert("Data cell created successfully", "success");

				// Apelează callback-ul de succes cu noua celulă pentru a actualiza state-ul local
				onSuccess(newCell);
				return;
			}

			// Pentru celulele existente, actualizăm valoarea
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${table.databaseId}/tables/${table.id}/rows/${rowId}/cell/${cellId}`,
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

			// Obținem celula updatată din response
			let updatedCell;
			try {
				updatedCell = await response.json();
			} catch (parseError) {
				console.error("Could not parse success response:", parseError);
				throw new Error("Invalid response format");
			}

			// Nu mai facem setRows aici - lăsăm părintele să gestioneze state-ul
			setEditingCell(null);
			showAlert("Data cell updated successfully", "success");

			// Apelează callback-ul de succes cu celula updatată pentru a actualiza state-ul local
			onSuccess(updatedCell);
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
