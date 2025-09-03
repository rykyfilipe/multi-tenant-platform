/** @format */

"use client";

import { useState } from "react";
import { Column } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Move,
	ArrowUp,
	ArrowDown,
	Save,
	X,
	Settings,
	GripVertical,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";
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
	verticalListSortingStrategy,
useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ColumnOrderManagerProps {
	columns: Column[];
	setColumns: (columns: Column[]) => void;
	table: any;
	onClose: () => void;
}

interface SortableColumnItemProps {
	column: Column;
	index: number;
	totalColumns: number;
	onMoveUp: (index: number) => void;
	onMoveDown: (index: number) => void;
	getColumnTypeLabel: (type: string) => string;
}

function SortableColumnItem({
	column,
	index,
	totalColumns,
	onMoveUp,
	onMoveDown,
	getColumnTypeLabel,
}: SortableColumnItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: column.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className='flex items-center justify-between p-3 border border-border/20 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-move'
			{...attributes}
			{...listeners}>
			<div className='flex items-center gap-3 flex-1'>
				<GripVertical className='w-4 h-4 text-muted-foreground' />
				<div className='flex-1'>
					<div className='font-medium text-sm'>{column.name}</div>
					<div className='flex items-center gap-2 mt-1'>
						<Badge variant='outline' className='text-xs'>
							{getColumnTypeLabel(column.type)}
						</Badge>
						{column.primary && (
							<Badge variant='default' className='text-xs'>
								Primary
							</Badge>
						)}
						{column.required && (
							<Badge variant='secondary' className='text-xs'>
								Required
							</Badge>
						)}
					</div>
				</div>
			</div>

			<div className='flex items-center gap-1'>
				<Button
					variant='ghost'
					size='sm'
					onClick={(e) => {
						e.stopPropagation();
						onMoveUp(index);
					}}
					disabled={index === 0}
					className='h-8 w-8 p-0'>
					<ArrowUp className='w-4 h-4' />
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={(e) => {
						e.stopPropagation();
						onMoveDown(index);
					}}
					disabled={index === totalColumns - 1}
					className='h-8 w-8 p-0'>
					<ArrowDown className='w-4 h-4' />
				</Button>
			</div>
		</div>
	);
}

export function ColumnOrderManager({
	columns,
	setColumns,
	table,
	onClose,
}: ColumnOrderManagerProps) {
	const { token, tenant, showAlert } = useApp();
	const [reorderedColumns, setReorderedColumns] = useState<Column[]>(columns);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Funcție pentru handleDragEnd
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (active.id !== over?.id) {
			setReorderedColumns((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over?.id);

				const newItems = arrayMove(items, oldIndex, newIndex);

				// Actualizează ordinea
				newItems.forEach((col, i) => {
					col.order = i;
				});

				return newItems;
			});
		}
	};

	// Funcție pentru mutarea unei coloane în sus
	const moveColumnUp = (index: number) => {
		if (index === 0) return;

		const newColumns = [...reorderedColumns];
		const temp = newColumns[index];
		newColumns[index] = newColumns[index - 1];
		newColumns[index - 1] = temp;

		// Actualizează ordinea
		newColumns.forEach((col, i) => {
			col.order = i;
		});

		setReorderedColumns(newColumns);
	};

	// Funcție pentru mutarea unei coloane în jos
	const moveColumnDown = (index: number) => {
		if (index === reorderedColumns.length - 1) return;

		const newColumns = [...reorderedColumns];
		const temp = newColumns[index];
		newColumns[index] = newColumns[index + 1];
		newColumns[index + 1] = temp;

		// Actualizează ordinea
		newColumns.forEach((col, i) => {
			col.order = i;
		});

		setReorderedColumns(newColumns);
	};

	// Funcție pentru salvarea ordinii
	const saveColumnOrder = async () => {
		if (!token || !tenant) return;

		try {
			// Actualizează ordinea pentru fiecare coloană
			const updatePromises = reorderedColumns.map((column) =>
				fetch(
					`/api/tenants/${tenant.id}/databases/${table.databaseId}/tables/${table.id}/columns/${column.id}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ order: column.order }),
					},
				),
			);

			await Promise.all(updatePromises);

			// Actualizează starea locală
			setColumns(reorderedColumns);
			showAlert("Column order saved successfully!", "success");
			onClose();
		} catch (error) {
			console.error("Error saving column order:", error);
			showAlert("Failed to save column order", "error");
		}
	};

	// Funcție pentru resetarea ordinii
	const resetOrder = () => {
		const originalOrder = [...columns].sort((a, b) => a.order - b.order);
		setReorderedColumns(originalOrder);
	};

	const getColumnTypeLabel = (type: string) => {
		switch (type) {
			case USER_FRIENDLY_COLUMN_TYPES.text:
				return "Text";
			case USER_FRIENDLY_COLUMN_TYPES.number:
				return "Number";
			case USER_FRIENDLY_COLUMN_TYPES.yesNo:
				return "Yes/No";
			case USER_FRIENDLY_COLUMN_TYPES.date:
				return "Date";
			case USER_FRIENDLY_COLUMN_TYPES.link:
				return "Link";
			case USER_FRIENDLY_COLUMN_TYPES.customArray:
				return "Custom";
			default:
				return type;
		}
	};

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<Card className='w-full max-w-2xl max-h-[80vh] overflow-hidden'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
					<div className='flex items-center gap-2'>
						<Settings className='w-5 h-5' />
						<CardTitle>Manage Column Order</CardTitle>
					</div>
					<Button variant='ghost' size='sm' onClick={onClose}>
						<X className='w-4 h-4' />
					</Button>
				</CardHeader>

				<CardContent className='space-y-4'>
					<div className='text-sm text-muted-foreground mb-4'>
						Drag and drop or use the arrow buttons to reorder columns. The order
						will be saved when you click "Save Order".
					</div>

					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}>
						<SortableContext
							items={reorderedColumns.map((col) => col.id)}
							strategy={verticalListSortingStrategy}>
							<div className='space-y-2 max-h-96 overflow-y-auto'>
								{reorderedColumns.map((column, index) => (
									<SortableColumnItem
										key={column.id}
										column={column}
										index={index}
										totalColumns={reorderedColumns.length}
										onMoveUp={moveColumnUp}
										onMoveDown={moveColumnDown}
										getColumnTypeLabel={getColumnTypeLabel}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>

					<div className='flex items-center justify-between pt-4 border-t'>
						<Button variant='outline' onClick={resetOrder}>
							Reset Order
						</Button>
						<div className='flex items-center gap-2'>
							<Button variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<Button onClick={saveColumnOrder}>
								<Save className='w-4 h-4 mr-2' />
								Save Order
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
