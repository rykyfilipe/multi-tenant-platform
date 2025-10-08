/** @format */

// hooks/usePermissions.ts
import { useState, useEffect, useCallback } from "react";
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

	const fetchPermissions = useCallback(async () => {
		if (!tenant || !token || !user || !userId) {
			setLoading(false);
			return;
		}

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
				setPermissions(data || null);
			} else {
				const errorText = await response.text();
				console.error(
					"usePermissions - Failed to load permissions:",
					response.status,
					errorText,
				);
				throw new Error(`Failed to load permissions: ${response.status}`);
			}
		} catch (err) {
			console.error("usePermissions - Error:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setPermissions(null);
		} finally {
			setLoading(false);
		}
	}, [tenant, token, user, userId, showAlert]);

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
				const result = await response.json();
				// Permissions saved successfully
				showAlert("Permissions saved successfully", "success");
				return true;
			} else {
				const errorText = await response.text();
				console.error("Permissions save failed:", response.status, errorText);
				throw new Error(`Failed to save permissions: ${response.status}`);
			}
		} catch (err) {
			showAlert("Failed to save permissions. Please try again.", "error");
			return false;
		}
	};

	useEffect(() => {
		if (token && user && tenant && userId && !permissions) {
			fetchPermissions();
		} else if (!token || !user || !tenant || !userId) {
			setLoading(false);
		}
	}, [token, user, tenant, userId, fetchPermissions, permissions]);

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

	const fetchTables = useCallback(async () => {
		if (!tenant || !token || !user) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);

			const response = await fetch(
				`/api/tenants/${tenant.id}/databases/tables?includePredefined=false`,
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
				const errorText = await response.text();
				console.error(
					"useTables - Failed to load tables:",
					response.status,
					errorText,
				);
				throw new Error(`Failed to load tables: ${response.status}`);
			}
		} catch (err) {
			console.error("useTables - Error:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setTables([]);
		} finally {
			setLoading(false);
		}
	}, [tenant, token, user, showAlert]);

	useEffect(() => {
		if (token && user && tenant && !tables) {
			fetchTables();
		} else if (!token || !user || !tenant) {
			setLoading(false);
		}
	}, [token, user, tenant, fetchTables, tables]);

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
	const { tenant, user } = useApp();
	
	const userId = user?.id;

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
					userId: userId || 0,
					tableId,
					tenantId: tenant?.id || 0,
					canRead: field === "canRead" ? value : false,
					canEdit: field === "canEdit" ? value : false,
					canDelete: field === "canDelete" ? value : false,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
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

			const existingPermission = prev.columnsPermissions.find(
				(cp) => cp.tableId === tableId && cp.columnId === columnId,
			);

			if (existingPermission) {
				// Actualizăm permisiunea existentă
				return {
					...prev,
					columnsPermissions: prev.columnsPermissions.map((cp) =>
						cp.tableId === tableId && cp.columnId === columnId
							? { ...cp, [field]: value }
							: cp,
					),
				};
			} else {
				// Creăm o nouă permisiune pentru coloană
				const newColumnPermission: ColumnPermission = {
					id: Date.now() + columnId, // ID temporar
					userId: userId || 0,
					tableId,
					tenantId: tenant?.id || 0,
					columnId,
					canRead: field === "canRead" ? value : false,
					canEdit: field === "canEdit" ? value : false,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				return {
					...prev,
					columnsPermissions: [...prev.columnsPermissions, newColumnPermission],
				};
			}
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
