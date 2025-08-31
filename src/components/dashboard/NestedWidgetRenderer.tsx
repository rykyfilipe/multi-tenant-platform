/** @format */

"use client";

import React, { useState } from "react";
import { Widget } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import {
	Edit2,
	Trash2,
	Settings,
	Plus,
	ChevronDown,
	ChevronRight,
	MoreHorizontal,
	GripVertical,
} from "lucide-react";
import { WidgetRenderer } from "./WidgetRenderer";
import { cn } from "@/lib/utils";

interface NestedWidgetRendererProps {
	widget: Widget;
	allWidgets: Widget[];
	level?: number;
	isEditMode?: boolean;
	onEdit: (widgetId: string) => void;
	onDelete: (widgetId: string) => void;
	onSettings: (widgetId: string) => void;
	onAddChild: (parentId: string) => void;
	onSelect: (widgetId: string) => void;
	selectedWidgetId?: string | null;
	onDragStart?: (e: React.DragEvent, widget: Widget) => void;
	onDragEnd?: (e: React.DragEvent) => void;
	onDragOver?: (e: React.DragEvent) => void;
	onDrop?: (e: React.DragEvent, targetParentId: string | null) => void;
	onContainerDragOver?: (e: React.DragEvent, containerId: string) => void;
	onContainerDragLeave?: (e: React.DragEvent) => void;
	dragOverContainer?: string | null;
	draggedWidget?: Widget | null;
}

export function NestedWidgetRenderer({
	widget,
	allWidgets,
	level = 0,
	isEditMode = false,
	onEdit,
	onDelete,
	onSettings,
	onAddChild,
	onSelect,
	selectedWidgetId,
	onDragStart,
	onDragEnd,
	onDragOver,
	onDrop,
	onContainerDragOver,
	onContainerDragLeave,
	dragOverContainer,
	draggedWidget,
}: NestedWidgetRendererProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [isHovered, setIsHovered] = useState(false);

	// Get direct children of this widget
	const children = allWidgets.filter((w) => w.parentId === widget.id);

	// Check if this widget is selected
	const isSelected = selectedWidgetId === widget.id;

	// Check if this container is being dragged over
	const isDragOverTarget = dragOverContainer === widget.id;

	// Handle widget selection
	const handleWidgetClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onSelect(widget.id);
	};

	// Handle add child widget
	const handleAddChild = (e: React.MouseEvent) => {
		e.stopPropagation();
		onAddChild(widget.id);
	};

	// Handle expand/collapse
	const handleToggleExpand = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsExpanded(!isExpanded);
	};

	// Enhanced drag handlers
	const handleWidgetDragStart = (e: React.DragEvent) => {
		if (onDragStart) {
			onDragStart(e, widget);
		}
	};

	const handleWidgetDragEnd = (e: React.DragEvent) => {
		if (onDragEnd) {
			onDragEnd(e);
		}
	};

	const handleContainerDrop = (e: React.DragEvent) => {
		if (onDrop && widget.type === "container") {
			onDrop(e, widget.id);
		}
	};

	const handleContainerDragOver = (e: React.DragEvent) => {
		if (onContainerDragOver && widget.type === "container") {
			onContainerDragOver(e, widget.id);
		}
	};

	const handleContainerDragLeave = (e: React.DragEvent) => {
		if (onContainerDragLeave) {
			onContainerDragLeave(e);
		}
	};

	// Widget type configuration
	const widgetTypeConfig: Record<
		Widget["type"],
		{ icon: string; color: string; label: string }
	> = {
		container: {
			icon: "📦",
			color: "from-blue-500 to-blue-600",
			label: "Container",
		},
		title: {
			icon: "📝",
			color: "from-green-500 to-green-600",
			label: "Title",
		},
		paragraph: {
			icon: "📄",
			color: "from-green-500 to-green-600",
			label: "Paragraph",
		},
		list: {
			icon: "📋",
			color: "from-yellow-500 to-yellow-600",
			label: "List",
		},
		chart: {
			icon: "📊",
			color: "from-purple-500 to-purple-600",
			label: "Chart",
		},
		table: {
			icon: "📋",
			color: "from-orange-500 to-orange-600",
			label: "Table",
		},
		progress: {
			icon: "📈",
			color: "from-pink-500 to-pink-600",
			label: "Progress",
		},
		image: {
			icon: "🖼️",
			color: "from-indigo-500 to-indigo-600",
			label: "Image",
		},
		calendar: {
			icon: "📅",
			color: "from-teal-500 to-teal-600",
			label: "Calendar",
		},
		tasks: {
			icon: "✅",
			color: "from-emerald-500 to-emerald-600",
			label: "Tasks",
		},
	};

	const config = widgetTypeConfig[widget.type];

	return (
		<div className='relative transition-all duration-300 group'>
			{/* Widget Container */}
			<div
				className={cn(
					"relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer",
					isSelected && isEditMode
						? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg"
						: "hover:ring-1 hover:ring-primary/30 hover:shadow-md",
					isHovered && isEditMode && "ring-1 ring-primary/20",
					isDragOverTarget && "ring-2 ring-primary/40 bg-primary/5",
					widget.type === "container" &&
						isDragOverTarget &&
						"bg-gradient-to-br from-primary/10 to-primary/5",
				)}
				style={{
					backgroundColor: widget.config?.background || undefined,
					borderColor: widget.config?.border?.color || undefined,
					borderWidth: widget.config?.border?.width || undefined,
					borderRadius: widget.config?.border?.radius || undefined,
				}}
				onClick={handleWidgetClick}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				// Drag and drop handlers for the widget itself
				draggable={isEditMode}
				onDragStart={handleWidgetDragStart}
				onDragEnd={handleWidgetDragEnd}
				// Container drop zone handlers
				onDrop={handleContainerDrop}
				onDragOver={handleContainerDragOver}
				onDragLeave={handleContainerDragLeave}>
				{/* Widget Header */}
				<div
					className={cn(
						"flex items-center justify-between p-3 border-b border-border/30 transition-all duration-200",
						isEditMode
							? "bg-muted/30"
							: "bg-gradient-to-r from-muted/20 to-muted/10",
						isDragOverTarget && "bg-primary/20 border-primary/40",
					)}>
					<div className='flex items-center space-x-3 flex-1 min-w-0'>
						{/* Drag Handle */}
						{isEditMode && (
							<div className='flex-shrink-0 cursor-grab active:cursor-grabbing opacity-60 group-hover:opacity-100 transition-opacity duration-200'>
								<GripVertical className='h-4 w-4 text-muted-foreground' />
							</div>
						)}

						{/* Expand/Collapse Button for containers */}
						{widget.type === "container" && children.length > 0 && (
							<Button
								variant='ghost'
								size='sm'
								onClick={handleToggleExpand}
								className='h-6 w-6 p-0 hover:bg-muted/50 rounded-md transition-all duration-200'>
								{isExpanded ? (
									<ChevronDown className='h-3 w-3' />
								) : (
									<ChevronRight className='h-3 w-3' />
								)}
							</Button>
						)}

						{/* Widget Type Badge */}
						<div
							className={cn(
								"flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-medium text-white",
								`bg-gradient-to-r ${config.color}`,
							)}>
							<span>{config.icon}</span>
							<span>{config.label}</span>
						</div>

						{/* Widget Title */}
						<div className='flex-1 min-w-0'>
							<h4 className='text-sm font-semibold text-foreground truncate'>
								{widget.config?.title || `${config.label} Widget`}
							</h4>
						</div>
					</div>

					{/* Action Buttons */}
					{isEditMode && (
						<div className='flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200'>
							<Button
								variant='ghost'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									onEdit(widget.id);
								}}
								className='h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary rounded-md transition-all duration-200'>
								<Edit2 className='h-3 w-3' />
							</Button>

							<Button
								variant='ghost'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									onSettings(widget.id);
								}}
								className='h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary rounded-md transition-all duration-200'>
								<Settings className='h-3 w-3' />
							</Button>

							{widget.type === "container" && (
								<Button
									variant='ghost'
									size='sm'
									onClick={handleAddChild}
									className='h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary rounded-md transition-all duration-200'>
									<Plus className='h-3 w-3' />
								</Button>
							)}

							<Button
								variant='ghost'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									onDelete(widget.id);
								}}
								className='h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all duration-200'>
								<Trash2 className='h-3 w-3' />
							</Button>
						</div>
					)}
				</div>

				{/* Widget Content */}
				<div className='p-4'>
					<WidgetRenderer
						widget={widget}
						isEditMode={isEditMode}
						onSelect={() => onSelect(widget.id)}
					/>
				</div>

				{/* Widget Footer - Show children count for containers */}
				{widget.type === "container" && children.length > 0 && (
					<div className='px-4 py-2 bg-muted/20 border-t border-border/30'>
						<div className='flex items-center justify-between text-xs text-muted-foreground'>
							<span>
								{children.length} child widget{children.length !== 1 ? "s" : ""}
							</span>
							{isEditMode && (
								<Button
									variant='ghost'
									size='sm'
									onClick={handleAddChild}
									className='h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary transition-all duration-200'>
									<Plus className='h-3 w-3 mr-1' />
									Add Widget
								</Button>
							)}
						</div>
					</div>
				)}

				{/* Drop Zone Indicator for Containers */}
				{widget.type === "container" && isEditMode && (
					<div
						className={cn(
							"absolute inset-0 pointer-events-none transition-all duration-200",
							isDragOverTarget
								? "bg-primary/20 border-2 border-dashed border-primary/40 rounded-xl"
								: "opacity-0",
						)}>
						<div className='absolute inset-0 flex items-center justify-center'>
							<div className='text-center'>
								<div className='text-2xl mb-2'>📥</div>
								<p className='text-sm font-medium text-primary'>
									Drop here to add to container
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Children Container */}
			{children.length > 0 && isExpanded && (
				<div className='mt-4 ml-8 space-y-4'>
					{/* Vertical line connector */}
					<div className='absolute left-4 top-full w-px h-4 bg-border/50' />

					{children.map((child, index) => (
						<div key={child.id} className='relative'>
							{/* Horizontal line connector */}
							<div className='absolute left-0 top-1/2 w-4 h-px bg-border/50 transform -translate-y-1/2' />

							<NestedWidgetRenderer
								widget={child}
								allWidgets={allWidgets}
								level={level + 1}
								isEditMode={isEditMode}
								onEdit={onEdit}
								onDelete={onDelete}
								onSettings={onSettings}
								onAddChild={onAddChild}
								onSelect={onSelect}
								selectedWidgetId={selectedWidgetId}
								onDragStart={onDragStart}
								onDragEnd={onDragEnd}
								onDragOver={onDragOver}
								onDrop={onDrop}
								onContainerDragOver={onContainerDragOver}
								onContainerDragLeave={onContainerDragLeave}
								dragOverContainer={dragOverContainer}
								draggedWidget={draggedWidget}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
