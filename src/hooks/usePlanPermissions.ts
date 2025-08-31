/** @format */

import { useSession } from "next-auth/react";
import { useApp } from "@/contexts/AppContext";
import { useState, useEffect, useCallback } from "react";
import {
	checkPlanPermission,
	checkPlanAndLimitPermission,
	RoleRestrictions,
	PlanLimits,
} from "@/lib/planConstants";

interface PlanPermissions {
	canCreateDatabases: boolean;
	canCreateTables: boolean;
	canCreateUsers: boolean;
	canCreateRows: boolean;
	canImportData: boolean;
	canExportData: boolean;
	canUseAdvancedFeatures: boolean;
	canAccessAnalytics: boolean;
	canUseCustomIntegrations: boolean;
	canAccessAdvancedSecurity: boolean;
	canUsePrioritySupport: boolean;
	canUseDedicatedSupport: boolean;
}

export const usePlanPermissions = () => {
	const { data: session } = useSession();
	const { token } = useApp();
	const [currentCounts, setCurrentCounts] = useState<{
		databases: number;
		tables: number;
		users: number;
		storage: number;
		rows: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);

	const currentPlan = session?.subscription?.plan || "Free";

	const fetchCounts = useCallback(async () => {
		if (!session?.user?.id || !token) {
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/user/limits", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setCurrentCounts(data);
			} else {
				console.error("Failed to fetch limits:", response.status);
				setCurrentCounts({
					databases: 0,
					tables: 0,
					users: 0,
					storage: 0,
					rows: 0,
				});
			}
		} catch (error) {
			console.error("Error fetching limits:", error);
			setCurrentCounts({
				databases: 0,
				tables: 0,
				users: 0,
				storage: 0,
				rows: 0,
			});
		} finally {
			setLoading(false);
		}
	}, [session?.user?.id, token]);

	useEffect(() => {
		if (session?.user?.id && token && !currentCounts) {
			fetchCounts();
		} else if (!session?.user?.id || !token) {
			setLoading(false);
		}
	}, [session?.user?.id, token, fetchCounts, currentCounts]);

	// Verifică dacă o permisiune este disponibilă pentru planul curent
	const can = (permission: keyof RoleRestrictions): boolean => {
		return checkPlanPermission(currentPlan, permission);
	};

	// Verifică dacă o permisiune este disponibilă și dacă limita nu a fost atinsă
	const canWithLimit = (
		permission: keyof RoleRestrictions,
		limitType: keyof PlanLimits,
	): { allowed: boolean; reason?: string } => {
		const current = currentCounts?.[limitType] || 0;
		return checkPlanAndLimitPermission(
			currentPlan,
			permission,
			current,
			limitType,
		);
	};

	// Funcții helper pentru permisiuni specifice
	const canCreateDatabase = () =>
		canWithLimit("canCreateDatabases", "databases");
	const canCreateTable = () => canWithLimit("canCreateTables", "tables");
	const canCreateUser = () => canWithLimit("canCreateUsers", "users");

	const canMakeTablePublic = () => can("canMakeTablesPublic");
	const canManagePermissions = () => can("canManagePermissions");
	const canDeleteData = () => can("canDeleteData");
	const canExportData = () => can("canExportData");
	const canImportData = () => can("canImportData");
	const canViewAnalytics = () => can("canViewAnalytics");

	return {
		currentPlan,
		loading,
		currentCounts,
		can,
		canWithLimit,
		canCreateDatabase,
		canCreateTable,
		canCreateUser,

		canMakeTablePublic,
		canManagePermissions,
		canDeleteData,
		canExportData,
		canImportData,
		canViewAnalytics,
		refetch: fetchCounts,
	};
};
