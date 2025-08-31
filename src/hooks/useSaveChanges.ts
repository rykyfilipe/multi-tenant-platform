/** @format */

import { useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Dashboard, Widget } from "@/types/dashboard";
import { PendingChange } from "./useDashboard";

export function useSaveChanges() {
	const { token } = useApp();
	const { toast } = useToast();

	// Optimize pending changes to avoid redundant operations
	const optimizePendingChanges = useCallback((changes: PendingChange[]) => {
		const optimized: PendingChange[] = [];
		const widgetOperations = new Map<number, any>();

		// Process changes in order and optimize them
		for (const change of changes) {
			switch (change.type) {
				case "add":
					// If we're adding a widget, store it for potential optimization
					widgetOperations.set(change.widget!.id, {
						type: "add",
						data: change.widget,
					});
					break;

				case "update":
					const existingOp = widgetOperations.get(change.widgetId!);
					if (existingOp && existingOp.type === "add") {
						// If we're updating a widget that was just added, merge the operations
						// Instead of create + update, just create with final state
						const updates = change.updates as Partial<Widget>;
						widgetOperations.set(change.widgetId!, {
							type: "add",
							data: {
								...existingOp.data,
								...updates,
								config: {
									...existingOp.data.config,
									...updates?.config,
								},
								position: updates?.position || existingOp.data.position,
							},
						});
					} else {
						// Regular update operation
						widgetOperations.set(change.widgetId!, {
							type: "update",
							data: change,
						});
					}
					break;

				case "delete":
					const existingOperation = widgetOperations.get(change.widgetId!);
					if (existingOperation && existingOperation.type === "add") {
						// If we're deleting a widget that was just added, remove both operations
						// No need to create and then delete
						widgetOperations.delete(change.widgetId!);
					} else {
						// Regular delete operation
						widgetOperations.set(change.widgetId!, {
							type: "delete",
							data: change,
						});
					}
					break;

				case "layout":
					// Layout changes are always needed
					optimized.push(change);
					break;
			}
		}

		// Convert optimized operations back to array format
		widgetOperations.forEach((operation, widgetId) => {
			switch (operation.type) {
				case "add":
					optimized.push({ type: "add", widget: operation.data });
					break;
				case "update":
					optimized.push(operation.data);
					break;
				case "delete":
					optimized.push(operation.data);
					break;
			}
		});

		return optimized;
	}, []);

	// Save all pending changes to server
	const saveChanges = useCallback(
		async (
			currentDashboard: Dashboard,
			pendingChanges: PendingChange[],
			setCurrentDashboard: (dashboard: Dashboard | null) => void,
			setPendingChanges: (changes: PendingChange[]) => void,
			setIsSaving: (saving: boolean) => void,
		) => {
			if (!currentDashboard || pendingChanges.length === 0 || !token) {
				console.log("Cannot save changes:", {
					hasDashboard: !!currentDashboard,
					hasChanges: pendingChanges.length > 0,
					hasToken: !!token,
				});
				return;
			}

			setIsSaving(true);
			try {
				console.log("Saving changes with token:", !!token);

				// Optimize pending changes to avoid redundant operations
				const optimizedChanges = optimizePendingChanges(pendingChanges);
				console.log(
					"Original changes:",
					pendingChanges.length,
					"Optimized:",
					optimizedChanges.length,
				);

				// Process each optimized change
				for (const change of optimizedChanges) {
					switch (change.type) {
						case "add":
							// Create widget on server with final state (including any updates)
							const response = await fetch(
								`/api/dashboards/${currentDashboard.id}/widgets`,
								{
									method: "POST",
									headers: {
										"Content-Type": "application/json",
										Authorization: `Bearer ${token}`,
									},
									body: JSON.stringify({
										type: change.widget!.type,
										config: change.widget!.config,
										position: change.widget!.position,
										parentId:
											change.widget!.parentId && change.widget!.parentId > 0
												? change.widget!.parentId
												: undefined,
										order: change.widget!.order,
									}),
								},
							);

							if (response.ok) {
								const newWidget = await response.json();
								console.log("✅ Widget created successfully:", newWidget);

								// Replace temporary widget with real one
								setCurrentDashboard((prev) =>
									prev
										? {
												...prev,
												widgets: prev.widgets.map((w) =>
													w.id === change.widget!.id ? newWidget : w,
												),
										  }
										: null,
								);
							} else {
								const errorText = await response.text();
								console.error(
									"Failed to create widget:",
									response.status,
									errorText,
								);
								throw new Error(`Failed to create widget: ${response.status}`);
							}
							break;

						case "update":
							// Update widget on server
							const updateResponse = await fetch(
								`/api/dashboards/${currentDashboard.id}/widgets/${change.widgetId}`,
								{
									method: "PUT",
									headers: {
										"Content-Type": "application/json",
										Authorization: `Bearer ${token}`,
									},
									body: JSON.stringify(change.updates),
								},
							);

							if (!updateResponse.ok) {
								const errorText = await updateResponse.text();
								console.error(
									"Failed to update widget:",
									updateResponse.status,
									errorText,
								);
								throw new Error(
									`Failed to update widget: ${updateResponse.status}`,
								);
							}
							break;

						case "delete":
							// Delete widget on server
							const deleteResponse = await fetch(
								`/api/dashboards/${currentDashboard.id}/widgets/${change.widgetId}`,
								{
									method: "DELETE",
									headers: {
										Authorization: `Bearer ${token}`,
									},
								},
							);

							if (!deleteResponse.ok) {
								const errorText = await deleteResponse.text();
								console.error(
									"Failed to delete widget:",
									deleteResponse.status,
									errorText,
								);
								throw new Error(
									`Failed to delete widget: ${deleteResponse.status}`,
								);
							}
							break;

						case "layout":
							// Update widget positions on server
							for (const update of change.updates!) {
								console.log(
									"🔄 Layout update for widget:",
									update.id,
									"Position:",
									update.position,
								);

								// Ensure position has all required properties
								if (
									!update.position ||
									typeof update.position.x !== "number" ||
									typeof update.position.y !== "number" ||
									typeof update.position.width !== "number" ||
									typeof update.position.height !== "number"
								) {
									console.error("❌ Invalid position data:", update.position);
									continue;
								}

								const layoutResponse = await fetch(
									`/api/dashboards/${currentDashboard.id}/widgets/${update.id}`,
									{
										method: "PUT",
										headers: {
											"Content-Type": "application/json",
											Authorization: `Bearer ${token}`,
										},
										body: JSON.stringify({ position: update.position }),
									},
								);

								if (!layoutResponse.ok) {
									const errorText = await layoutResponse.text();
									console.error(
										"Failed to update widget position:",
										layoutResponse.status,
										errorText,
									);
									throw new Error(
										`Failed to update widget position: ${layoutResponse.status}`,
									);
								}
							}
							break;
					}
				}

				// Clear pending changes
				setPendingChanges([]);

				toast({
					title: "Success",
					description: "All changes saved to server",
				});
			} catch (error) {
				console.error("Error saving changes:", error);
				toast({
					title: "Error",
					description: "Failed to save some changes",
					variant: "destructive",
				});
			} finally {
				setIsSaving(false);
			}
		},
		[token, optimizePendingChanges, toast],
	);

	return {
		saveChanges,
		optimizePendingChanges,
	};
}
