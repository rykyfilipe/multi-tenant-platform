/** @format */
"use client";

import { useState } from "react";
import { Column, Row } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { EditableCell } from "../rows/EditableCell";
import { cn } from "@/lib/utils";

interface Props {
	columns: Column[];
	rows: Row[];
	editingCell: { rowId: string; columnId: string } | null;
	onEditCell: (rowId: string, columnId: string, cellId: string) => void;
	onSaveCell: (columnId: string, rowId: string, cellId: string, value: any) => Promise<void>;
	onCancelEdit: () => void;
	onDeleteRow: (rowId: string) => void;
	onDeleteMultipleRows: (rowIds: string[]) => void;
	deletingRows: Set<string>;
	hasPendingChange: (rowId: string, columnId: string) => boolean;
	getPendingValue: (rowId: string, columnId: string) => any;
	canEdit: boolean;
	canDelete: boolean;
}

export function RowGrid({
	columns,
	rows,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteRow,
	onDeleteMultipleRows,
	deletingRows,
	hasPendingChange,
	getPendingValue,
	canEdit,
	canDelete,
}: Props) {
	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

	const handleSelectRow = (rowId: string, checked: boolean) => {
		setSelectedRows(prev => {
			const newSet = new Set(prev);
			if (checked) {
				newSet.add(rowId);
			} else {
				newSet.delete(rowId);
			}
			return newSet;
		});
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedRows(new Set(rows.map(row => row.id.toString())));
		} else {
			setSelectedRows(new Set());
		}
	};

	const handleDeleteSelected = () => {
		if (selectedRows.size > 0) {
			onDeleteMultipleRows(Array.from(selectedRows));
			setSelectedRows(new Set());
		}
	};

	const getCellValue = (row: Row, column: Column) => {
		const cell = row.cells?.find(c => c.columnId === column.id);
		return cell?.value ?? null;
	};

	const isAllSelected = rows.length > 0 && selectedRows.size === rows.length;
	const isIndeterminate = selectedRows.size > 0 && selectedRows.size < rows.length;

	if (rows.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 px-8 text-center">
				<div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
					<Edit className="w-8 h-8 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-semibold text-foreground mb-2">No Data</h3>
				<p className="text-muted-foreground">
					This table doesn't have any rows yet. Add your first row to get started.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			{/* Select All Header */}
			<div className="flex border-b border-border/20 bg-muted/20">
				<div className="w-16 flex-shrink-0 border-r border-border/20 bg-muted/50 flex items-center justify-center p-2">
					<Checkbox
						checked={isAllSelected}
						onCheckedChange={handleSelectAll}
						ref={(el) => {
							if (el) (el as any).indeterminate = isIndeterminate;
						}}
					/>
				</div>
				
				{/* Data columns header */}
				<div className="flex-1 flex items-center justify-between px-4">
					<span className="text-sm font-medium text-muted-foreground">
						{selectedRows.size > 0 ? `${selectedRows.size} row${selectedRows.size === 1 ? '' : 's'} selected` : 'Select rows to manage'}
					</span>
					
					{/* Delete selected button */}
					{selectedRows.size > 0 && canDelete && (
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDeleteSelected}
							className="h-7 px-3 text-xs"
						>
							<Trash2 className="w-3 h-3 mr-1" />
							Delete ({selectedRows.size})
						</Button>
					)}
				</div>
				
				{/* Empty space for add column button */}
				<div className="w-16 flex-shrink-0 border-l border-border/20 bg-muted/50" />
			</div>

			{/* Data Rows */}
			{rows.map((row, rowIndex) => {
				const isSelected = selectedRows.has(row.id.toString());
				const isDeleting = deletingRows.has(row.id.toString());
				const isLocalRow = (row as any).isLocalOnly;

				return (
					<div
						key={row.id}
						className={cn(
							"flex border-b border-border/10 hover:bg-muted/30 transition-colors duration-200 group",
							isSelected && "bg-primary/5",
							isDeleting && "opacity-50",
							isLocalRow && "bg-yellow-50 border-yellow-200"
						)}
					>
						{/* Row Number & Selection */}
						<div className="w-16 flex-shrink-0 border-r border-border/20 bg-muted/20 flex items-center justify-center p-2">
							<div className="flex items-center gap-2">
								<Checkbox
									checked={isSelected}
									onCheckedChange={(checked) => handleSelectRow(row.id.toString(), checked as boolean)}
								/>
								<span className="text-xs text-muted-foreground font-mono">
									{rowIndex + 1}
								</span>
							</div>
						</div>

						{/* Data Cells */}
						{columns.map((column) => {
							const cellValue = getCellValue(row, column);
							const isEditing = editingCell?.rowId === row.id.toString() && editingCell?.columnId === column.id.toString();
							const hasPending = hasPendingChange(row.id.toString(), column.id.toString());
							const pendingValue = getPendingValue(row.id.toString(), column.id.toString());

							return (
								<div
									key={`${row.id}-${column.id}`}
									className={cn(
										"flex-1 min-w-[120px] border-r border-border/10 p-2 hover:bg-muted/20 transition-colors duration-200",
										hasPending && "bg-yellow-50 border-yellow-200"
									)}
								>
									{isEditing ? (
										<EditableCell
											columns={[column]}
											cell={{
												id: "virtual",
												rowId: row.id,
												columnId: column.id,
												value: cellValue,
												column: column
											}}
											isEditing={true}
											onStartEdit={() => {}}
											onSave={(value) => onSaveCell(column.id.toString(), row.id.toString(), "virtual", value)}
											onCancel={onCancelEdit}
											tables={[]} // Will be passed from parent if needed
										/>
									) : (
										<div
											className={cn(
												"w-full h-8 flex items-center px-2 rounded cursor-pointer hover:bg-muted/30 transition-colors duration-200",
												canEdit && "hover:border hover:border-primary/20"
											)}
											onClick={() => canEdit && onEditCell(row.id.toString(), column.id.toString(), "virtual")}
										>
											<span className="text-sm truncate">
												{cellValue !== null && cellValue !== undefined 
													? String(cellValue) 
													: <span className="text-muted-foreground italic">empty</span>
												}
											</span>
											{hasPending && (
												<span className="ml-2 text-xs text-yellow-600 font-medium">
													{pendingValue !== null && pendingValue !== undefined 
														? String(pendingValue) 
														: "empty"
													}
												</span>
											)}
										</div>
									)}
								</div>
							);
						})}

						{/* Empty space for add column button */}
						<div className="w-16 flex-shrink-0 border-l border-border/20 bg-muted/20" />
					</div>
				);
			})}
		</div>
	);
}
