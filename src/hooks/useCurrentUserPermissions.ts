/** @format */

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { Permissions } from "@/types/permissions";

export const useCurrentUserPermissions = () => {
	const [permissions, setPermissions] = useState<Permissions | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { tenant, token, user } = useApp();

	const fetchPermissions = useCallback(async () => {
		if (!tenant || !token || !user) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = await fetch(
				`/api/tenants/${tenant.id}/users/${user.id}/permisions`,
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
					"useCurrentUserPermissions - Failed to load permissions:",
					response.status,
					errorText,
				);
				throw new Error(`Failed to load permissions: ${response.status}`);
			}
		} catch (err) {
			console.error("useCurrentUserPermissions - Error:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setPermissions(null);
		} finally {
			setLoading(false);
		}
	}, [tenant, token, user]);

	useEffect(() => {
		if (token && user && tenant && !permissions) {
			fetchPermissions();
		} else if (!token || !user || !tenant) {
			setLoading(false);
		}
	}, [token, user, tenant, fetchPermissions, permissions]);

	const refetch = useCallback(() => {
		fetchPermissions();
	}, [fetchPermissions]);

	return {
		permissions,
		loading,
		error,
		refetch,
	};
};
