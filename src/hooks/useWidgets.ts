/** @format */

import { useState, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Dashboard, Widget, CreateWidgetRequest } from "@/types/dashboard";
import { PendingChange } from "./useDashboard";

export function useWidgets(
	currentDashboard: Dashboard | null,
	setCurrentDashboard: React.Dispatch<React.SetStateAction<Dashboard | null>>,
	pendingChanges: PendingChange[],
	setPendingChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>,
	setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
) {
	const { token } = useApp();
	const { toast } = useToast();
	const [isInitialLayoutSync, setIsInitialLayoutSync] = useState(true);
	const [layout, setLayout] = useState<any[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [draggedWidgetType, setDraggedWidgetType] = useState<string | null>(
		null,
	);

	// Generate temporary widget ID (100000-100089 range)
	const generateTempWidgetId = useCallback(() => {
		return 100000 + Math.floor(Math.random() * 89);
	}, []);

	// Add widget
	const addWidget = useCallback(
		async (widgetData: CreateWidgetRequest) => {
			if (!currentDashboard) return;

			const tempWidget: Widget = {
				...widgetData,
				id: generateTempWidgetId(),
				dashboardId: currentDashboard.id,
				parentId: widgetData.parentId,
				type: widgetData.type,
				config: widgetData.config,
				position: widgetData.position,
				order: widgetData.order || 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				children: [],
			};

			// Update local state immediately
			setCurrentDashboard((prev) => {
				if (!prev) return null;

				const existingWidget = prev.widgets.find((w) => w.id === tempWidget.id);
				if (existingWidget) {
					console.log(
						"⚠️ Widget with same ID already exists, skipping duplicate",
					);
					return prev;
				}

				let updatedWidgets = [...prev.widgets, tempWidget];
				if (tempWidget.parentId) {
					updatedWidgets = updatedWidgets.map((w) => {
						if (w.id === tempWidget.parentId) {
							return {
								...w,
								children: [...(w.children || []), tempWidget],
							};
						}
						return w;
					});
				}

				return {
					...prev,
					widgets: updatedWidgets,
				};
			});

			// Update layout immediately for widgets without parent
			if (!tempWidget.parentId) {
				const newLayoutItem = {
					i: tempWidget.id.toString(),
					x: tempWidget.position.x,
					y: tempWidget.position.y,
					w: tempWidget.position.width,
					h: tempWidget.position.height,
					minW: 2,
					minH: 2,
					isDraggable: true,
					isResizable: true,
				};
				setLayout((prev) => [...prev, newLayoutItem]);
			}

			// Add to pending changes
			setPendingChanges((prev) => [
				...prev,
				{ type: "add", widget: tempWidget },
			]);

			toast({
				title: "Widget added locally",
				description: "Click 'Save Changes' to persist to server",
			});
		},
		[
			currentDashboard,
			generateTempWidgetId,
			setCurrentDashboard,
			setPendingChanges,
			toast,
		],
	);

	// Update widget
	const updateWidget = useCallback(
		(widgetId: number, updates: Partial<Widget>) => {
			if (!currentDashboard) return;

			// Don't allow updating temporary widgets until they're saved
			if (widgetId >= 100000 && widgetId <= 100089) {
				console.log("⚠️ Skipping update of temporary widget:", widgetId);
				return;
			}

			// Update local state immediately
			setCurrentDashboard((prev) =>
				prev
					? {
							...prev,
							widgets: prev.widgets.map((w) =>
								w.id === widgetId
									? {
											...w,
											...updates,
											updatedAt: new Date().toISOString(),
									  }
									: w,
							),
					  }
					: null,
			);

			// Add to pending changes
			setPendingChanges((prev) => [
				...prev,
				{ type: "update", widgetId, updates },
			]);

			toast({
				title: "Widget updated locally",
				description: "Click 'Save Changes' to persist to server",
			});
		},
		[currentDashboard, setCurrentDashboard, setPendingChanges, toast],
	);

	// Update widget live (for preview)
	const updateWidgetLive = useCallback(
		(widgetId: number, updates: Partial<Widget>) => {
			if (!currentDashboard) return;

			setCurrentDashboard((prev) =>
				prev
					? {
							...prev,
							widgets: prev.widgets.map((w) =>
								w.id === widgetId
									? {
											...w,
											...updates,
											updatedAt: new Date().toISOString(),
									  }
									: w,
							),
					  }
					: null,
			);
		},
		[currentDashboard, setCurrentDashboard],
	);

	// Delete widget
	const deleteWidget = useCallback(
		(widgetId: number) => {
			if (!currentDashboard) return;

			// Don't allow deletion of temporary widgets until they're saved
			if (widgetId >= 100000 && widgetId <= 100089) {
				console.log("⚠️ Skipping deletion of temporary widget:", widgetId);
				// Remove from local state immediately for UI feedback
				setCurrentDashboard((prev) =>
					prev
						? {
								...prev,
								widgets: prev.widgets.filter((w) => w.id !== widgetId),
						  }
						: null,
				);
				return;
			}

			// Get the widget to check if it has children
			const widgetToDelete = currentDashboard.widgets.find((w) => w.id === widgetId);
			if (!widgetToDelete) return;

			// Collect all widget IDs to delete (including children recursively)
			const widgetsToDelete = new Set<number>();
			const collectWidgetIds = (widgetId: number) => {
				widgetsToDelete.add(widgetId);
				const children = currentDashboard.widgets.filter((w) => w.parentId === widgetId);
				children.forEach((child) => collectWidgetIds(child.id));
			};
			collectWidgetIds(widgetId);

			// Update local state immediately
			setCurrentDashboard((prev) =>
				prev
					? {
							...prev,
							widgets: prev.widgets.filter((w) => !widgetsToDelete.has(w.id)),
					  }
					: null,
			);

			// Remove from layout if it's a root widget
			if (!widgetToDelete.parentId) {
				setLayout((prev) => prev.filter((item) => item.i !== widgetId.toString()));
			}

			// Add to pending changes
			setPendingChanges((prev) => [
				...prev,
				{ type: "delete", widgetId: Array.from(widgetsToDelete) },
			]);

			toast({
				title: widgetsToDelete.size > 1 ? "Widgets deleted locally" : "Widget deleted locally",
				description: "Click 'Save Changes' to persist to server",
			});
		},
		[currentDashboard, setCurrentDashboard, setPendingChanges, setLayout, toast],
	);

	// Handle layout change
	const handleLayoutChange = useCallback(
		(newLayout: any[]) => {
			// Prevent layout changes during initial sync
			if (isInitialLayoutSync) {
				console.log("🔄 Skipping layout change during initial sync");
				return;
			}

			// Check if this is a real user interaction
			if (currentDashboard) {
				const serverLayout = currentDashboard.widgets
					.filter((widget) => !widget.parentId)
					.map((widget) => ({
						i: widget.id.toString(),
						x: widget.position.x,
						y: widget.position.y,
						w: widget.position.width,
						h: widget.position.height,
					}));

				const isIdenticalToServer =
					JSON.stringify(newLayout) === JSON.stringify(serverLayout);
				if (isIdenticalToServer) {
					console.log("🔄 Layout identical to server data, skipping update");
					return;
				}

				const isSameAsCurrentLayout =
					JSON.stringify(newLayout) === JSON.stringify(layout);
				if (isSameAsCurrentLayout) {
					console.log("🔄 Layout identical to current layout, skipping update");
					return;
				}
			}

			console.log("🔄 Layout change triggered by user interaction");
			setLayout(newLayout);

			// Update local widget positions
			if (currentDashboard) {
				setCurrentDashboard((prev) =>
					prev
						? {
								...prev,
								widgets: prev.widgets.map((widget) => {
									if (widget.parentId) return widget;

									const layoutItem = newLayout.find(
										(item) => item.i === widget.id.toString(),
									);
									if (layoutItem) {
										return {
											...widget,
											position: {
												x: layoutItem.x,
												y: layoutItem.y,
												width: layoutItem.w,
												height: layoutItem.h,
											},
											updatedAt: new Date().toISOString(),
										};
									}
									return widget;
								}),
						  }
						: null,
				);

				// Add layout changes to pending changes
				const layoutUpdates = newLayout
					.filter((item) => {
						const itemId = parseInt(item.i);
						return itemId > 0 && itemId < 100000; // Only real widgets
					})
					.map((item) => ({
						id: parseInt(item.i),
						position: {
							x: item.x,
							y: item.y,
							width: item.w,
							height: item.h,
						},
					}));

				if (layoutUpdates.length > 0) {
					setPendingChanges((prev) => [
						...prev.filter((change) => change.type !== "layout"),
						{ type: "layout", updates: layoutUpdates },
					]);
				}
			}
		},
		[
			currentDashboard,
			isInitialLayoutSync,
			layout,
			setCurrentDashboard,
			setPendingChanges,
		],
	);

	// Sync layout with server data
	const syncLayoutWithServer = useCallback(
		(dashboard: Dashboard) => {
			if (dashboard.widgets.length > 0) {
				const uniqueWidgets = dashboard.widgets
					.filter(
						(widget, index, self) =>
							index === self.findIndex((w) => w.id === widget.id),
					)
					.filter((widget) => !widget.parentId);

				const newLayout = uniqueWidgets.map((widget) => ({
					i: widget.id.toString(),
					x: widget.position.x,
					y: widget.position.y,
					w: widget.position.width,
					h: widget.position.height,
					minW: 2,
					minH: 2,
					isDraggable: true,
					isResizable: true,
				}));

				// Only update if different
				const isLayoutDifferent =
					JSON.stringify(newLayout) !== JSON.stringify(layout);
				if (isLayoutDifferent) {
					console.log("🔄 Layout differs from current, updating...");
					setLayout(newLayout);
				} else {
					console.log("🔄 Layout unchanged, skipping update");
				}

				setIsInitialLayoutSync(false);
			}
		},
		[layout],
	);

	// Drag & Drop handlers
	const handleDragStart = useCallback(
		(e: React.DragEvent, widgetType: string) => {
			setDraggedWidgetType(widgetType);
			setIsDragging(true);
			e.dataTransfer.effectAllowed = "copy";
			e.dataTransfer.setData("text/plain", widgetType);
		},
		[],
	);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
		setDraggedWidgetType(null);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent, targetWidgetId?: number) => {
			e.preventDefault();

			let widgetTypeToUse = draggedWidgetType;
			if (!widgetTypeToUse) {
				widgetTypeToUse = e.dataTransfer.getData("text/plain");
			}

			if (!widgetTypeToUse || !currentDashboard) return;

			// Find widget type configuration
			const widgetType = WIDGET_TYPES.find((w) => w.type === widgetTypeToUse);
			if (!widgetType) return;

			let newWidget: CreateWidgetRequest;

			if (targetWidgetId) {
				// Drop into container
				newWidget = {
					type: widgetType.type,
					config: widgetType.defaultConfig,
					position: { x: 0, y: 0, width: 4, height: 3 },
					parentId: targetWidgetId,
					order: currentDashboard.widgets.length,
				};
			} else {
				// Drop into grid
				newWidget = {
					type: widgetType.type,
					config: widgetType.defaultConfig,
					position: widgetType.defaultPosition,
					order: currentDashboard.widgets.length,
				};
			}

			addWidget(newWidget);
			setDraggedWidgetType(null);
			setIsDragging(false);
		},
		[draggedWidgetType, currentDashboard, addWidget],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	}, []);

	return {
		// State
		layout,
		isDragging,
		draggedWidgetType,
		isInitialLayoutSync,

		// Actions
		addWidget,
		updateWidget,
		updateWidgetLive,
		deleteWidget,
		handleLayoutChange,
		syncLayoutWithServer,
		handleDragStart,
		handleDragEnd,
		handleDrop,
		handleDragOver,
		setLayout,
		setIsInitialLayoutSync,
	};
}

// Widget types configuration
const WIDGET_TYPES = [
	{
		type: "container" as const,
		label: "Container",
		defaultConfig: {
			title: "Container",
			backgroundColor: "#f8fafc",
			borderColor: "#e2e8f0",
			borderWidth: 1,
			borderRadius: 8,
			padding: 16,
		},
		defaultPosition: { x: 0, y: 0, width: 6, height: 4 },
	},
	{
		type: "text" as const,
		label: "Text",
		defaultConfig: {
			title: "Text Widget",
			content: "Enter your text here",
			backgroundColor: "#ffffff",
			textColor: "#000000",
			fontSize: 16,
			fontWeight: "normal",
			padding: 16,
		},
		defaultPosition: { x: 0, y: 0, width: 4, height: 3 },
	},
	{
		type: "chart" as const,
		label: "Chart",
		defaultConfig: {
			title: "Chart Widget",
			chartType: "line" as const,
			backgroundColor: "#ffffff",
			borderColor: "#e2e8f0",
			borderWidth: 1,
			borderRadius: 8,
			padding: 16,
		},
		defaultPosition: { x: 0, y: 0, width: 6, height: 4 },
	},
	{
		type: "progress" as const,
		label: "Progress",
		defaultConfig: {
			title: "Progress Widget",
			progressValue: 65,
			progressMax: 100,
			backgroundColor: "#ffffff",
			borderColor: "#e2e8f0",
			borderWidth: 1,
			borderRadius: 8,
			padding: 16,
		},
		defaultPosition: { x: 0, y: 0, width: 4, height: 3 },
	},
	{
		type: "table" as const,
		label: "Table",
		defaultConfig: {
			title: "Table Widget",
			backgroundColor: "#ffffff",
			borderColor: "#e2e8f0",
			borderWidth: 1,
			borderRadius: 8,
			padding: 16,
		},
		defaultPosition: { x: 0, y: 0, width: 8, height: 5 },
	},
	{
		type: "calendar" as const,
		label: "Calendar",
		defaultConfig: {
			title: "Calendar Widget",
			backgroundColor: "#ffffff",
			borderColor: "#e2e8f0",
			borderWidth: 1,
			borderRadius: 8,
			padding: 16,
		},
		defaultPosition: { x: 0, y: 0, width: 6, height: 5 },
	},
	{
		type: "image" as const,
		label: "Image",
		defaultConfig: {
			title: "Image Widget",
			imageUrl: "",
			backgroundColor: "#ffffff",
			borderColor: "#e2e8f0",
			borderWidth: 1,
			borderRadius: 8,
			padding: 16,
		},
		defaultPosition: { x: 0, y: 0, width: 4, height: 4 },
	},
];
