/** @format */

"use client";

import React, { useState } from "react";
import { Widget } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ChevronDown,
	ChevronRight,
	Plus,
	Edit2,
	Trash2,
	Settings,
} from "lucide-react";

interface WidgetTreeViewProps {
	widgets: Widget[];
	isEditMode?: boolean;
	onEdit: (widgetId: string) => void;
	onDelete: (widgetId: string) => void;
	onSettings: (widgetId: string) => void;
	onAddChild: (parentId: string) => void;
	onSelect: (widgetId: string) => void;
	selectedWidgetId?: string | null;
}

export function WidgetTreeView({
	widgets,
	isEditMode = false,
	onEdit,
	onDelete,
	onSettings,
	onAddChild,
	onSelect,
	selectedWidgetId,
}: WidgetTreeViewProps) {
	const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(
		new Set(),
	);

	// Get root widgets (no parent)
	const rootWidgets = widgets.filter((w) => !w.parentId);

	// Get children of a widget
	const getChildren = (widgetId: string) => {
		return widgets.filter((w) => w.parentId === widgetId);
	};

	// Toggle widget expansion
	const toggleExpansion = (widgetId: string) => {
		setExpandedWidgets((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(widgetId)) {
				newSet.delete(widgetId);
			} else {
				newSet.add(widgetId);
			}
			return newSet;
		});
	};

	// Render widget tree node
	const renderWidgetNode = (widget: Widget, level: number = 0) => {
		const children = getChildren(widget.id);
		const isExpanded = expandedWidgets.has(widget.id);
		const isSelected = selectedWidgetId === widget.id;
		const hasChildren = children.length > 0;

		return (
			<div key={widget.id} className='space-y-2'>
				{/* Widget Node */}
				<div
					className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
						isSelected
							? "bg-primary/10 border-primary ring-2 ring-primary/20"
							: "bg-card hover:bg-muted/50"
					}`}
					onClick={() => onSelect(widget.id)}
					style={{ marginLeft: `${level * 24}px` }}>
					{/* Expand/Collapse Button */}
					{hasChildren && (
						<Button
							variant='ghost'
							size='sm'
							onClick={(e) => {
								e.stopPropagation();
								toggleExpansion(widget.id);
							}}
							className='h-6 w-6 p-0 hover:bg-muted'>
							{isExpanded ? (
								<ChevronDown className='h-3 w-3' />
							) : (
								<ChevronRight className='h-3 w-3' />
							)}
						</Button>
					)}
					{!hasChildren && <div className='w-6' />}

					{/* Widget Icon */}
					<div className='w-8 h-8 bg-primary/20 rounded flex items-center justify-center'>
						{getWidgetIcon(widget.type)}
					</div>

					{/* Widget Info */}
					<div className='flex-1 min-w-0'>
						<div className='flex items-center gap-2'>
							<span className='font-medium truncate'>
								{widget.config?.title || `Widget ${widget.id}`}
							</span>
							<Badge variant='outline' className='text-xs'>
								{widget.type}
							</Badge>
							{/* Check if ID is a temporary one (you may need to adjust this logic) */}
							{widget.id.startsWith("temp_") && (
								<Badge variant='secondary' className='text-xs'>
									TEMP
								</Badge>
							)}
						</div>
						<div className='text-xs text-muted-foreground'>
							ID: {widget.id} • {children.length} children
						</div>
					</div>

					{/* Widget Actions */}
					{isEditMode && (
						<div className='flex items-center gap-1'>
							{/* Add Child Button */}
							<Button
								variant='ghost'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									onAddChild(widget.id);
								}}
								className='h-6 w-6 p-0 hover:bg-muted'
								title='Add child widget'>
								<Plus className='h-3 w-3' />
							</Button>

							<Button
								variant='ghost'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									onSettings(widget.id);
								}}
								className='h-6 w-6 p-0 hover:bg-muted'>
								<Settings className='h-3 w-3' />
							</Button>

							<Button
								variant='ghost'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									onEdit(widget.id);
								}}
								className='h-6 w-6 p-0 hover:bg-muted'>
								<Edit2 className='h-3 w-3' />
							</Button>

							<Button
								variant='ghost'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									onDelete(widget.id);
								}}
								className='h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive'>
								<Trash2 className='h-3 w-3' />
							</Button>
						</div>
					)}
				</div>

				{/* Children */}
				{hasChildren && isExpanded && (
					<div className='space-y-2'>
						{children
							.sort((a, b) => a.orderIndex - b.orderIndex)
							.map((child) => renderWidgetNode(child, level + 1))}
					</div>
				)}
			</div>
		);
	};

	// Get widget icon based on type
	const getWidgetIcon = (type: string) => {
		switch (type) {
			case "container":
				return "📦";
			case "text":
				return "📝";
			case "chart":
				return "📊";
			case "table":
				return "📋";
			case "progress":
				return "📈";
			case "image":
				return "🖼️";
			case "calendar":
				return "📅";
			default:
				return "🔧";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					📊 Widget Tree View
					<Badge variant='secondary'>{widgets.length} total widgets</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				{rootWidgets.length === 0 ? (
					<div className='text-center py-8 text-muted-foreground'>
						No widgets available
					</div>
				) : (
					<div className='space-y-2'>
						{rootWidgets
							.sort((a, b) => a.orderIndex - b.orderIndex)
							.map((widget) => renderWidgetNode(widget))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
