/** @format */

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { Permissions } from "@/types/permissions";
import { useSession } from "next-auth/react";
import { checkPlanPermission } from "@/lib/planConstants";

export const useCurrentUserPermissions = () => {
	const [permissions, setPermissions] = useState<Permissions | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { tenant, token, user } = useApp();
	const { data: session } = useSession();

	const fetchPermissions = useCallback(async () => {
		if (!tenant || !token || !user) {
			setLoading(false);
			return;
		}

		const currentPlan = session?.subscription?.plan || "Free";

		// Check if the current plan supports permissions management
		if (!checkPlanPermission(currentPlan, "canManagePermissions")) {
			// For Free plan users, provide default full permissions since they can't be restricted
			setPermissions({
				tablePermissions: [],
				columnsPermissions: [],
			});
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
			} else if (response.status === 403) {
				// Handle 403 gracefully - likely a plan limitation
				const errorData = await response.json().catch(() => null);
				if (errorData?.plan === "permissions") {
					// This is a plan limitation, not a real error
					// Provide default permissions for Free users
					setPermissions({
						tablePermissions: [],
						columnsPermissions: [],
					});
				} else {
					throw new Error(`Access denied: ${response.status}`);
				}
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
	}, [tenant, token, user, session?.subscription?.plan]);

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
