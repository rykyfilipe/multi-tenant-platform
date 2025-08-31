/** @format */

import React, { useState, useCallback, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Widget } from "@/types/dashboard";
import { NestedWidgetRenderer } from "./NestedWidgetRenderer";
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3, Layout, Sparkles, Move } from "lucide-react";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
	layout: any[];
	widgets: Widget[];
	isInitialLayoutSync: boolean;
	isEditMode: boolean;
	onLayoutChange: (layout: any[]) => void;
	onEdit: (widgetId: string) => void;
	onDelete: (widgetId: string) => void;
	onSettings: (widgetId: string) => void;
	onDrop: (e: React.DragEvent) => void;
	onDragOver: (e: React.DragEvent) => void;
	onAddChild: (parentId: string) => void;
	onWidgetSelect: (widgetId: string | null) => void;
	selectedWidgetId: string | null;
	onQuickAddWidget?: (type: string) => void;
	onMoveWidget?: (widgetId: string, newParentId: string | null) => void;
}

export function DashboardGrid({
	layout,
	widgets,
	isInitialLayoutSync,
	isEditMode,
	onLayoutChange,
	onEdit,
	onDelete,
	onSettings,
	onDrop,
	onDragOver,
	onAddChild,
	onWidgetSelect,
	selectedWidgetId,
	onQuickAddWidget,
	onMoveWidget,
}: DashboardGridProps) {
	const [selectedWidgetIdLocal, setSelectedWidgetIdLocal] = useState<
		string | null
	>(null);
	const [showGridOverlay, setShowGridOverlay] = useState(false);
	const [dragOverContainer, setDragOverContainer] = useState<string | null>(
		null,
	);
	const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);
	const gridRef = useRef<any>(null);

	// Filter widgets that should be in the grid (no parent - root level)
	const rootWidgets = widgets.filter((widget) => !widget.parentId);

	// Handle widget selection
	const handleWidgetSelect = (widgetId: string) => {
		setSelectedWidgetIdLocal(widgetId);
		onWidgetSelect(widgetId);
	};

	// Enhanced drag and drop handlers
	const handleDragStart = (e: React.DragEvent, widget: Widget) => {
		if (!isEditMode) return;

		setDraggedWidget(widget);
		e.dataTransfer.setData(
			"application/json",
			JSON.stringify({
				type: "widget-move",
				widgetId: widget.id,
				widgetType: widget.type,
				sourceParentId: widget.parentId,
			}),
		);
		e.dataTransfer.effectAllowed = "move";

		// Add visual feedback
		const target = e.currentTarget as HTMLElement;
		target.style.opacity = "0.5";
		target.style.transform = "rotate(2deg) scale(0.95)";
	};

	const handleDragEnd = (e: React.DragEvent) => {
		const target = e.currentTarget as HTMLElement;
		target.style.opacity = "1";
		target.style.transform = "rotate(0deg) scale(1)";
		setDraggedWidget(null);
		setDragOverContainer(null);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent, targetParentId: string | null) => {
		e.preventDefault();

		try {
			const data = JSON.parse(e.dataTransfer.getData("application/json"));

			if (data.type === "widget-move" && onMoveWidget) {
				const widgetId = data.widgetId;
				const sourceParentId = data.sourceParentId;

				// Don't drop on itself or its own parent
				if (widgetId === targetParentId || sourceParentId === targetParentId) {
					return;
				}

				// Move widget to new parent
				onMoveWidget(widgetId, targetParentId);
			}
		} catch (error) {
			console.error("Error parsing drag data:", error);
		}

		setDragOverContainer(null);
	};

	const handleContainerDragOver = (e: React.DragEvent, containerId: string) => {
		e.preventDefault();
		e.stopPropagation();

		if (draggedWidget && draggedWidget.id !== containerId) {
			setDragOverContainer(containerId);
			e.dataTransfer.dropEffect = "move";
		}
	};

	const handleContainerDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOverContainer(null);
	};

	// Quick add widget suggestions
	const quickAddSuggestions = [
		{
			type: "text",
			label: "Text Block",
			icon: "📝",
			description: "Add rich text content",
		},
		{
			type: "chart",
			label: "Chart",
			icon: "📊",
			description: "Visualize your data",
		},
		{
			type: "table",
			label: "Data Table",
			icon: "📋",
			description: "Organize information",
		},
		{
			type: "progress",
			label: "Progress",
			icon: "📈",
			description: "Track goals & metrics",
		},
		{
			type: "image",
			label: "Image",
			icon: "🖼️",
			description: "Display media content",
		},
		{
			type: "container",
			label: "Container",
			icon: "📦",
			description: "Group related widgets",
		},
	];

	const handleQuickAddWidget = (type: string) => {
		if (onQuickAddWidget) {
			onQuickAddWidget(type);
		}
	};

	return (
		<div
			className='flex-1 p-6 bg-gradient-to-br from-background via-background/50 to-card/20'
			onDrop={onDrop}
			onDragOver={onDragOver}>
			{/* Grid Controls */}
			{isEditMode && (
				<div className='flex items-center justify-between mb-6 p-4 bg-card/60 backdrop-blur-sm rounded-xl border border-border/50'>
					<div className='flex items-center space-x-4'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setShowGridOverlay(!showGridOverlay)}
							className={cn(
								"flex items-center space-x-2 transition-all duration-200",
								showGridOverlay
									? "bg-primary/10 border-primary/30 text-primary"
									: "",
							)}>
							<Grid3X3 className='w-4 h-4' />
							<span>Grid Overlay</span>
						</Button>

						<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
							<Layout className='w-4 h-4' />
							<span>Layout: {rootWidgets.length} widgets</span>
						</div>

						<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
							<Move className='w-4 h-4' />
							<span>Drag & Drop: {draggedWidget ? "Active" : "Ready"}</span>
						</div>
					</div>

					<div className='flex items-center space-x-2'>
						<Button
							variant='outline'
							size='sm'
							className='flex items-center space-x-2 text-xs'>
							<Sparkles className='w-3 h-3' />
							<span>Auto Layout</span>
						</Button>
					</div>
				</div>
			)}

			{rootWidgets.length === 0 ? (
				<div className='flex items-center justify-center min-h-[60vh]'>
					<div className='text-center max-w-md mx-auto'>
						<div className='w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center'>
							<Layout className='w-10 h-10 text-primary' />
						</div>
						<h3 className='text-xl font-semibold mb-3 text-foreground'>
							Your Dashboard is Empty
						</h3>
						<p className='text-muted-foreground mb-6 leading-relaxed'>
							Start building your dashboard by adding widgets. Drag and drop
							from the sidebar or use the quick add options below.
						</p>

						{/* Quick Add Widgets */}
						<div className='grid grid-cols-2 gap-3 mb-6'>
							{quickAddSuggestions.slice(0, 4).map((suggestion) => (
								<button
									key={suggestion.type}
									onClick={() => handleQuickAddWidget(suggestion.type)}
									className='p-3 bg-card/60 border border-border/50 rounded-lg hover:bg-card/80 hover:border-primary/30 transition-all duration-200 group text-left'>
									<div className='flex items-center space-x-2 mb-1'>
										<span className='text-lg'>{suggestion.icon}</span>
										<span className='text-sm font-medium text-foreground group-hover:text-primary transition-colors'>
											{suggestion.label}
										</span>
									</div>
									<p className='text-xs text-muted-foreground'>
										{suggestion.description}
									</p>
								</button>
							))}
						</div>

						<div className='text-xs text-muted-foreground'>
							💡 Tip: Use the sidebar to access all widget types and templates
						</div>
					</div>
				</div>
			) : (
				<div className='space-y-6'>
					{/* Grid Layout for Root Widgets */}
					<div
						className={cn(
							"relative transition-all duration-300",
							showGridOverlay && isEditMode ? "bg-grid-pattern" : "",
						)}>
						<ResponsiveGridLayout
							ref={gridRef}
							key={`grid-${isInitialLayoutSync}`}
							className='layout'
							layouts={{ lg: layout }}
							breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
							cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
							rowHeight={60}
							onLayoutChange={onLayoutChange}
							isDraggable={isEditMode && !isInitialLayoutSync}
							isResizable={isEditMode && !isInitialLayoutSync}
							margin={[20, 20]}
							containerPadding={[20, 20]}
							useCSSTransforms={true}
							preventCollision={false}
							compactType='vertical'
							style={{
								minHeight: "100%",
								position: "relative",
							}}>
							{rootWidgets.map((widget) => (
								<div
									key={widget.id}
									className={cn(
										"w-full h-full transition-all duration-200",
										selectedWidgetId === widget.id && isEditMode
											? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
											: "",
									)}>
									<NestedWidgetRenderer
										widget={widget}
										allWidgets={widgets}
										onEdit={onEdit}
										onDelete={onDelete}
										onSettings={onSettings}
										onAddChild={onAddChild}
										onSelect={handleWidgetSelect}
										selectedWidgetId={selectedWidgetId}
										isEditMode={isEditMode}
										onDragStart={handleDragStart}
										onDragEnd={handleDragEnd}
										onDragOver={handleDragOver}
										onDrop={handleDrop}
										onContainerDragOver={handleContainerDragOver}
										onContainerDragLeave={handleContainerDragLeave}
										dragOverContainer={dragOverContainer}
										draggedWidget={draggedWidget}
									/>
								</div>
							))}
						</ResponsiveGridLayout>

						{/* Grid Overlay Indicator */}
						{showGridOverlay && isEditMode && (
							<div className='absolute inset-0 pointer-events-none'>
								<div className='w-full h-full bg-gradient-to-r from-primary/5 to-transparent opacity-30' />
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
