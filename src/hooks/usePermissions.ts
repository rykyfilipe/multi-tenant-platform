/** @format */

// hooks/usePermissions.ts
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import {
	Permissions,
	TablePermission,
	ColumnPermission,
	TableInfo,
} from "@/types/permissions";

export const usePermissions = (userId: string) => {
	const [permissions, setPermissions] = useState<Permissions | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { tenant, token, user, showAlert } = useApp();

	const fetchPermissions = async () => {
		if (!tenant || !token || !user) return;

		try {
			setLoading(true);
			const response = await fetch(
				`/api/tenants/${tenant.id}/users/${userId}/permisions`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				setPermissions({
					tablePermissions: data.tablePermissions || [],
					columnsPermissions: data.columnsPermissions || [],
				});
				showAlert("Permissions loaded successfully", "success");
			} else {
				throw new Error("Failed to load permissions");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			showAlert("Failed to load permissions", "error");
		} finally {
			setLoading(false);
		}
	};

	const savePermissions = async () => {
		if (!permissions || !tenant || !token) return;

		try {
			const response = await fetch(
				`/api/tenants/${tenant.id}/users/${userId}/permisions`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						tablePermissions: permissions.tablePermissions,
						columnsPermissions: permissions.columnsPermissions,
					}),
				},
			);

			if (response.ok) {
				showAlert("Permissions saved successfully", "success");
				return true;
			} else {
				throw new Error("Failed to save permissions");
			}
		} catch (err) {
			showAlert("Failed to save permissions", "error");
			return false;
		}
	};

	useEffect(() => {
		fetchPermissions();
	}, [token, user, tenant, userId]);

	return {
		permissions,
		setPermissions,
		loading,
		error,
		savePermissions,
		refetch: fetchPermissions,
	};
};

// hooks/useTables.ts
export const useTables = () => {
	const [tables, setTables] = useState<TableInfo[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { tenant, token, user, showAlert } = useApp();

	const fetchTables = async () => {
		if (!tenant || !token || !user) return;

		try {
			setLoading(true);
			const response = await fetch(
				`/api/tenants/${tenant.id}/database/tables`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				setTables(data || []);
			} else {
				throw new Error("Failed to load tables");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			showAlert("Failed to load tables", "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTables();
	}, [token, user, tenant]);

	return {
		tables,
		loading,
		error,
		refetch: fetchTables,
	};
};

// hooks/usePermissionUpdates.ts
export const usePermissionUpdates = (
	permissions: Permissions | null,
	setPermissions: React.Dispatch<React.SetStateAction<Permissions | null>>,
) => {
	const [hasChanges, setHasChanges] = useState(false);

	const updateTablePermission = (
		tableId: number,
		field: keyof Pick<TablePermission, "canRead" | "canEdit" | "canDelete">,
		value: boolean,
	) => {
		setPermissions((prev) => {
			if (!prev) return prev;

			const existingPermission = prev.tablePermissions.find(
				(tp) => tp.tableId === tableId,
			);

			if (existingPermission) {
				return {
					...prev,
					tablePermissions: prev.tablePermissions.map((tp) =>
						tp.tableId === tableId ? { ...tp, [field]: value } : tp,
					),
				};
			} else {
				const newPermission: TablePermission = {
					id: Date.now(),
					userId: 1, // This should come from context
					tableId,
					tenantId: 1, // This should come from context
					canRead: field === "canRead" ? value : false,
					canEdit: field === "canEdit" ? value : false,
					canDelete: field === "canDelete" ? value : false,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				return {
					...prev,
					tablePermissions: [...prev.tablePermissions, newPermission],
				};
			}
		});
		setHasChanges(true);
	};

	const updateColumnPermission = (
		tableId: number,
		columnId: number,
		field: keyof Pick<ColumnPermission, "canRead" | "canEdit">,
		value: boolean,
	) => {
		setPermissions((prev) => {
			if (!prev) return prev;

			return {
				...prev,
				columnsPermissions: prev.columnsPermissions.map((cp) =>
					cp.tableId === tableId && cp.columnId === columnId
						? { ...cp, [field]: value }
						: cp,
				),
			};
		});
		setHasChanges(true);
	};

	const resetChanges = () => {
		setHasChanges(false);
	};

	return {
		hasChanges,
		updateTablePermission,
		updateColumnPermission,
		resetChanges,
	};
};
