/** @format */

import React from "react";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";

interface WidgetToolbarProps {
	pendingChangesCount: number;
	isSaving: boolean;
	isEditMode: boolean;
	onToggleEditMode: () => void;
	onSaveChanges: () => void;
	onResetChanges: () => void;
	onDragStart: (e: React.DragEvent, widgetType: string) => void;
	onDragEnd: () => void;
}

const WIDGET_TYPES = [
	{ type: "container", label: "Container", icon: "📦" },
	{ type: "text", label: "Text", icon: "📝" },
	{ type: "chart", label: "Chart", icon: "📊" },
	{ type: "progress", label: "Progress", icon: "📈" },
	{ type: "table", label: "Table", icon: "📋" },
	{ type: "calendar", label: "Calendar", icon: "📅" },
	{ type: "image", label: "Image", icon: "🖼️" },
];

export function WidgetToolbar({
	pendingChangesCount,
	isSaving,
	isEditMode,
	onToggleEditMode,
	onSaveChanges,
	onResetChanges,
	onDragStart,
	onDragEnd,
}: WidgetToolbarProps) {
	return (
		<div className='flex items-center justify-between p-4 border-b bg-card'>
			{/* Widget Types */}
			<div className='flex items-center space-x-2'>
				<span className='text-sm font-medium text-muted-foreground mr-2'>
					Add Widget:
				</span>
				{WIDGET_TYPES.map((widgetType) => (
					<Button
						key={widgetType.type}
						variant='outline'
						size='sm'
						draggable
						onDragStart={(e) => onDragStart(e, widgetType.type)}
						onDragEnd={onDragEnd}
						className='flex items-center space-x-2 cursor-grab active:cursor-grabbing'>
						<span>{widgetType.icon}</span>
						<span>{widgetType.label}</span>
					</Button>
				))}
			</div>

			{/* Actions */}
			<div className='flex items-center space-x-2'>
				{/* Edit Dashboard Toggle */}
				<Button
					variant={isEditMode ? 'default' : 'outline'}
					size='sm'
					onClick={onToggleEditMode}
					className='flex items-center space-x-2'>
					{isEditMode ? '🔒 View Mode' : '✏️ Edit Dashboard'}
				</Button>

				{/* Reset Changes */}
				{pendingChangesCount > 0 && (
					<Button
						variant='outline'
						size='sm'
						onClick={onResetChanges}
						className='flex items-center space-x-2'>
						<RotateCcw className='h-4 w-4' />
						<span>Reset</span>
					</Button>
				)}

				{/* Save Changes */}
				{pendingChangesCount > 0 && (
					<Button
						onClick={onSaveChanges}
						disabled={isSaving}
						className='flex items-center space-x-2'>
						<Save className='h-4 w-4' />
						<span>
							{isSaving ? "Saving..." : `Save Changes (${pendingChangesCount})`}
						</span>
					</Button>
				)}
			</div>
		</div>
	);
}
