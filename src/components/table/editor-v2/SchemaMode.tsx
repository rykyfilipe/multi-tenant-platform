/** @format */
"use client";

import { useState, useEffect } from "react";
import { Column, Table, CreateColumnRequest } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Database,
	Table as TableIcon,
	Plus,
	Edit,
	Copy,
	Trash2,
	GripVertical,
	Eye,
	EyeOff,
	Asterisk,
	Fingerprint,
	Link,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getColumnTypeColor, getColumnTypeIcon, CONSTRAINT_BADGE_COLORS } from "@/lib/columnTypeStyles";
import { NoColumnsEmptyState } from "./EmptyStates";
import { EnhancedPropertiesPanel } from "./EnhancedPropertiesPanel";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
	table: Table;
	columns: Column[];
	selectedColumn: Column | null;
	onSelectColumn: (column: Column | null) => void;
	onAddColumn: (columnData: CreateColumnRequest) => void;
	onUpdateColumn: (updatedColumn: Partial<Column>) => void;
	onDeleteColumn: (columnId: string) => void;
	onDuplicateColumn?: (column: Column) => void;
	onToggleColumnVisibility?: (columnId: string) => void;
	onReorderColumns?: (fromIndex: number, toIndex: number) => void;
	tables: Table[];
	canEdit: boolean;
	isSubmitting?: boolean;
}

interface ColumnListItemProps {
	column: Column;
	isSelected: boolean;
	onClick: () => void;
	onEdit: () => void;
	onDuplicate?: () => void;
	onDelete: () => void;
	onToggleVisibility?: () => void;
	canEdit: boolean;
}

function ColumnListItem({
	column,
	isSelected,
	onClick,
	onEdit,
	onDuplicate,
	onDelete,
	onToggleVisibility,
	canEdit,
}: ColumnListItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: column.id.toString() });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
				isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm",
				!isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
				column.required && "border-l-4 border-l-amber-500",
				isDragging && "z-50 shadow-2xl ring-4 ring-primary/30",
			)}
			onClick={onClick}>
			{/* Drag Handle */}
			{canEdit && (
				<div 
					{...attributes} 
					{...listeners}
					className='cursor-grab active:cursor-grabbing touch-none'
					onClick={(e) => e.stopPropagation()}
				>
					<GripVertical className='w-4 h-4 text-muted-foreground' />
				</div>
			)}

		{/* Column Icon (by type) */}
		<div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", getColumnTypeColor(column.type))}>
			{(() => {
				const Icon = getColumnTypeIcon(column.type);
				return <Icon className="w-4 h-4" />;
			})()}
		</div>

			{/* Column Info */}
			<div className='flex-1 min-w-0'>
				<div className='flex items-center gap-2'>
					<h4 className='font-medium text-sm truncate'>{column.name}</h4>

					{/* Constraints Badges */}
					{column.required && (
						<Badge variant='secondary' className={cn("text-xs", CONSTRAINT_BADGE_COLORS.required)}>
							<Asterisk className='w-3 h-3 mr-1' />
							Required
						</Badge>
					)}
					{column.unique && (
						<Badge variant='secondary' className={cn("text-xs", CONSTRAINT_BADGE_COLORS.unique)}>
							<Fingerprint className='w-3 h-3 mr-1' />
							Unique
						</Badge>
					)}
					{column.referenceTableId && (
						<Badge variant='secondary' className={cn("text-xs", CONSTRAINT_BADGE_COLORS.foreign)}>
							<Link className='w-3 h-3 mr-1' />
							FK
						</Badge>
					)}
				</div>

				<div className='flex items-center gap-2 mt-1'>
					<Badge variant='outline' className={cn("text-xs border", getColumnTypeColor(column.type))}>
						{column.type}
					</Badge>

					{column.defaultValue && (
						<span className='text-xs text-muted-foreground truncate'>
							Default: {column.defaultValue}
						</span>
					)}
				</div>
			</div>

			{/* Actions */}
			{canEdit && (
				<div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
					<Button variant='ghost' size='sm' onClick={(e) => { e.stopPropagation(); onEdit(); }}>
						<Edit className='w-3 h-3' />
					</Button>
					{onDuplicate && (
						<Button variant='ghost' size='sm' onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
							<Copy className='w-3 h-3' />
						</Button>
					)}
					{onToggleVisibility && (
						<Button variant='ghost' size='sm' onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}>
							{column.order && column.order < 0 ? (
								<EyeOff className='w-3 h-3' />
							) : (
								<Eye className='w-3 h-3' />
							)}
						</Button>
					)}
					<Button
						variant='ghost'
						size='sm'
						onClick={(e) => { e.stopPropagation(); onDelete(); }}
						className='text-destructive hover:text-destructive'>
						<Trash2 className='w-3 h-3' />
					</Button>
				</div>
			)}
		</div>
	);
}

export function SchemaMode({
	table,
	columns,
	selectedColumn,
	onSelectColumn,
	onAddColumn,
	onUpdateColumn,
	onDeleteColumn,
	onDuplicateColumn,
	onToggleColumnVisibility,
	onReorderColumns,
	tables,
	canEdit,
	isSubmitting = false,
}: Props) {
	const [tableName, setTableName] = useState(table.name);
	const [tableDescription, setTableDescription] = useState(table.description || "");
	const [localColumns, setLocalColumns] = useState(columns);

	// Sensors for drag and drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // 8px movement before drag starts
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Sync local columns when prop changes
	useEffect(() => {
		setLocalColumns(columns);
	}, [columns]);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = localColumns.findIndex((col) => col.id.toString() === active.id);
			const newIndex = localColumns.findIndex((col) => col.id.toString() === over.id);

			const newColumns = arrayMove(localColumns, oldIndex, newIndex);
			setLocalColumns(newColumns);

			// Call parent handler if provided
			if (onReorderColumns) {
				onReorderColumns(oldIndex, newIndex);
			}
		}
	};

	// If no columns, show empty state
	if (columns.length === 0) {
		return (
			<div className='w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<NoColumnsEmptyState
					onAddColumn={() => {
						// Open properties panel with null to create new column
						onSelectColumn(null);
					}}
					onUseTemplate={() => {
						// TODO: Implement template selection
					}}
				/>
			</div>
		);
	}

	return (
		<div className='flex flex-col lg:flex-row gap-6 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-140px)]'>
			{/* Left Panel: Schema Panel (65%) */}
			<div className='w-full lg:w-[65%] space-y-6 overflow-y-auto pr-2 schema-columns-list'>
				{/* Table Settings Card */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<Database className='w-5 h-5 text-primary' />
								<CardTitle>Table Settings</CardTitle>
							</div>
							<Badge variant='outline'>Basic Info</Badge>
						</div>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							<div>
								<Label htmlFor='tableName'>Table Name *</Label>
								<Input
									id='tableName'
									value={tableName}
									onChange={(e) => setTableName(e.target.value)}
									placeholder='e.g., Customers'
									disabled={!canEdit}
								/>
							</div>

						<div>
							<Label>Total Columns</Label>
							<div className='flex items-center gap-2 px-3 py-2 bg-muted rounded-md'>
								<span className='text-2xl font-bold text-primary'>{columns.length}</span>
								<span className='text-sm text-muted-foreground'>columns defined</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								Configure columns in the list below
							</p>
						</div>
						</div>

						<div>
							<Label htmlFor='tableDescription'>Description</Label>
							<Textarea
								id='tableDescription'
								value={tableDescription}
								onChange={(e) => setTableDescription(e.target.value)}
								placeholder='Describe what this table stores...'
								rows={2}
								disabled={!canEdit}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Columns List Card */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<TableIcon className='w-5 h-5 text-primary' />
								<CardTitle>Columns ({columns.length})</CardTitle>
							</div>

							{canEdit && (
								<Button
									variant='outline'
									size='sm'
									onClick={() => onSelectColumn(null)}
									className='gap-2'>
									<Plus className='w-4 h-4' />
									Add Column
								</Button>
							)}
						</div>
					</CardHeader>

				<CardContent className='space-y-2'>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={localColumns.map((col) => col.id.toString())}
							strategy={verticalListSortingStrategy}
						>
							{localColumns.map((column) => (
								<ColumnListItem
									key={column.id}
									column={column}
									isSelected={selectedColumn?.id === column.id}
									onClick={() => onSelectColumn(column)}
									onEdit={() => onSelectColumn(column)}
									onDuplicate={onDuplicateColumn ? () => onDuplicateColumn(column) : undefined}
									onDelete={() => onDeleteColumn(column.id.toString())}
									onToggleVisibility={
										onToggleColumnVisibility
											? () => onToggleColumnVisibility(column.id.toString())
											: undefined
									}
									canEdit={canEdit}
								/>
							))}
						</SortableContext>
					</DndContext>
				</CardContent>
				</Card>
			</div>

			{/* Right Panel: Properties Panel (35%) - Sticky */}
		<div className='w-full lg:w-[35%] lg:sticky lg:top-20 min-h-[500px] lg:h-[calc(100vh-160px)] enhanced-properties-panel'>
			<EnhancedPropertiesPanel
				column={selectedColumn}
				onClose={() => onSelectColumn(null)}
				onSave={onUpdateColumn}
				onAdd={onAddColumn}
				tables={tables}
				existingColumns={columns}
				isSubmitting={isSubmitting}
			/>
		</div>
		</div>
	);
}

