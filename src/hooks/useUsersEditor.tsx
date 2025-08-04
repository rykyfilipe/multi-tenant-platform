/** @format */
import { useApp } from "@/contexts/AppContext";
import { User } from "@/types/user";
import { useState } from "react";

function useUsersEditor() {
	const { user } = useApp();

	const [editingCell, setEditingCell] = useState<{
		userId: string;
		fieldName: string;
	} | null>(null);

	const handleCancelEdit = () => setEditingCell(null);

	const handleEditCell = (userId: string, fieldName: string) => {
		if (user.role !== "ADMIN") return;
		setEditingCell({ userId, fieldName });
	};

	const { tenant } = useApp();
	const tenantId = tenant?.id;

	const handleSaveCell = async (
		userId: string,
		fieldName: keyof User,
		users: User[],
		setUsers: (users: User[]) => void,
		value: any,
		token: string,
		showAlert: (
			message: string,
			type: "error" | "success" | "warning" | "info",
		) => void,
	) => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/users/${userId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					[fieldName]: value, // trimite update corect către API
				}),
			});
			if (!response.ok) throw new Error("Failed to update cell");

			// Actualizează local users
			const updatedUsers = users.map((user) => {
				if (user.id.toString() !== userId) return user;

				return {
					...user,
					[fieldName]: value,
				};
			});

			setUsers(updatedUsers);
			setEditingCell(null);
			showAlert("User information updated successfully", "success");
		} catch (error) {
			showAlert(
				"Failed to update user information. Please try again.",
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

export default useUsersEditor;
