/** @format */

import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import {
	Dashboard,
	Widget,
	CreateDashboardRequest,
	CreateWidgetRequest,
} from "@/types/dashboard";

export interface PendingChange {
	type: "add" | "update" | "delete" | "layout";
	widget?: Widget;
	widgetId?: number;
	updates?: Partial<Widget> | any[];
}

export function useDashboard() {
	const { token } = useApp();
	const { toast } = useToast();

	const [dashboards, setDashboards] = useState<Dashboard[]>([]);
	const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
	const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	// Fetch dashboards on mount
	const fetchDashboards = useCallback(async () => {
		if (!token) {
			console.error("No token available for fetching dashboards");
			setIsLoading(false);
			return;
		}

		try {
			console.log("Fetching dashboards...");
			setIsLoading(true);
			setHasAttemptedFetch(true);

			const response = await fetch("/api/dashboards", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log("Dashboards fetched:", data);
				setDashboards(data);

				if (data.length > 0) {
					console.log("Setting current dashboard:", data[0]);
					setCurrentDashboard(data[0]);
				} else {
					console.log("No dashboards found");
				}
			} else {
				const errorText = await response.text();
				console.error("Error fetching dashboards:", response.status, errorText);
				toast({
					title: "Error",
					description: "Failed to fetch dashboards",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error fetching dashboards:", error);
			toast({
				title: "Error",
				description: "Failed to fetch dashboards",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [token, toast]);

	// Create default dashboard if none exists
	const createDefaultDashboard = useCallback(async () => {
		if (!token) {
			console.error("No token available for creating dashboard");
			toast({
				title: "Error",
				description: "Authentication required",
				variant: "destructive",
			});
			return;
		}

		try {
			console.log("Creating default dashboard...");
			const response = await fetch("/api/dashboards", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: "My Dashboard",
				} as CreateDashboardRequest),
			});

			if (response.ok) {
				const newDashboard = await response.json();
				console.log("Default dashboard created:", newDashboard);
				setDashboards([newDashboard]);
				setCurrentDashboard(newDashboard);
				toast({
					title: "Success",
					description: "Default dashboard created",
				});
			} else {
				const errorText = await response.text();
				console.error(
					"Failed to create dashboard:",
					response.status,
					errorText,
				);
				toast({
					title: "Error",
					description: "Failed to create dashboard",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error creating default dashboard:", error);
			toast({
				title: "Error",
				description: "Failed to create dashboard",
				variant: "destructive",
			});
		}
	}, [token, toast]);

	// Create new dashboard
	const createDashboard = useCallback(
		async (name: string) => {
			if (!name.trim() || !token) return;

			try {
				const response = await fetch("/api/dashboards", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						name: name.trim(),
					} as CreateDashboardRequest),
				});

				if (response.ok) {
					const newDashboard = await response.json();
					setDashboards((prev) => [newDashboard, ...prev]);
					setCurrentDashboard(newDashboard);
					toast({
						title: "Success",
						description: "Dashboard created successfully",
					});
					return newDashboard;
				} else {
					const errorText = await response.text();
					console.error(
						"Failed to create dashboard:",
						response.status,
						errorText,
					);
					toast({
						title: "Error",
						description: "Failed to create dashboard",
						variant: "destructive",
					});
				}
			} catch (error) {
				console.error("Error creating dashboard:", error);
				toast({
					title: "Error",
					description: "Failed to create dashboard",
					variant: "destructive",
				});
			}
		},
		[token, toast],
	);

	// Delete dashboard
	const deleteDashboard = useCallback(
		async (dashboardId: number) => {
			if (!token) {
				toast({
					title: "Error",
					description: "Authentication required",
					variant: "destructive",
				});
				return;
			}

			try {
				const response = await fetch(`/api/dashboards/${dashboardId}`, {
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					setDashboards((prev) => prev.filter((d) => d.id !== dashboardId));

					if (currentDashboard?.id === dashboardId) {
						setCurrentDashboard(null);
					}

					toast({
						title: "Success",
						description: "Dashboard deleted successfully",
					});
				} else {
					const errorText = await response.text();
					console.error(
						"Failed to delete dashboard:",
						response.status,
						errorText,
					);
					toast({
						title: "Error",
						description: "Failed to delete dashboard",
						variant: "destructive",
					});
				}
			} catch (error) {
				console.error("Error deleting dashboard:", error);
				toast({
					title: "Error",
					description: "Failed to delete dashboard",
					variant: "destructive",
				});
			}
		},
		[token, currentDashboard?.id, toast],
	);

	// Update dashboard name
	const updateDashboardName = useCallback(
		async (dashboardId: number, newName: string) => {
			if (!newName.trim() || !token) return;

			try {
				const response = await fetch(`/api/dashboards/${dashboardId}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name: newName.trim() }),
				});

				if (response.ok) {
					const updatedDashboard = await response.json();
					setCurrentDashboard(updatedDashboard);
					setDashboards((prev) =>
						prev.map((d) => (d.id === dashboardId ? updatedDashboard : d)),
					);
					toast({
						title: "Success",
						description: "Dashboard name updated successfully",
					});
					return updatedDashboard;
				} else {
					const errorText = await response.text();
					console.error(
						"Failed to update dashboard name:",
						response.status,
						errorText,
					);
					throw new Error("Failed to update dashboard name");
				}
			} catch (error) {
				console.error("Error updating dashboard name:", error);
				toast({
					title: "Error",
					description: "Failed to update dashboard name",
					variant: "destructive",
				});
			}
		},
		[token, toast],
	);

	// Set current dashboard
	const setCurrentDashboardById = useCallback(
		(dashboardId: number) => {
			const dashboard = dashboards.find((d) => d.id === dashboardId);
			setCurrentDashboard(dashboard || null);
		},
		[dashboards],
	);

	// Initialize on mount
	useEffect(() => {
		fetchDashboards();
	}, [fetchDashboards]);

	// Create default dashboard if none exists
	useEffect(() => {
		if (dashboards.length === 0 && !isLoading && hasAttemptedFetch) {
			console.log("No dashboards found, creating default dashboard...");
			createDefaultDashboard();
		}
	}, [dashboards.length, isLoading, hasAttemptedFetch, createDefaultDashboard]);

	return {
		// State
		dashboards,
		currentDashboard,
		isLoading,
		pendingChanges,
		isSaving,

		// Actions
		fetchDashboards,
		createDashboard,
		deleteDashboard,
		updateDashboardName,
		setCurrentDashboardById,
		setCurrentDashboard,
		setPendingChanges,
		setIsSaving,
	};
}
