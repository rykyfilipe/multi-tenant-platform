/** @format */
"use client";

import { useState } from "react";
import { Column, Row, Table } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, FileText } from "lucide-react";
import { EditableCell } from "../rows/EditableCell";
import { InlineRowCreator } from "./InlineRowCreator";
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
	tables?: Table[];
	onRefreshReferenceData?: () => void;
	// Inline row creator props
	showInlineRowCreator?: boolean;
	onSaveNewRow?: (rowData: Record<string, any>) => void;
	onCancelNewRow?: () => void;
	isSavingNewRow?: boolean;
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
	tables = [],
	onRefreshReferenceData,
	showInlineRowCreator = false,
	onSaveNewRow,
	onCancelNewRow,
	isSavingNewRow = false,
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
		const pendingValue = getPendingValue(row.id.toString(), column.id.toString());
		// Use pending value if available, otherwise use cell value
		return pendingValue !== undefined ? pendingValue : (cell?.value ?? null);
	};

	const getCellId = (row: Row, column: Column) => {
		const cell = row.cells?.find(c => c.columnId === column.id);
		return cell?.id?.toString() ?? "virtual";
	};

	const isAllSelected = rows.length > 0 && selectedRows.size === rows.length;
	const isIndeterminate = selectedRows.size > 0 && selectedRows.size < rows.length;

	if (rows.length === 0) {
		return (
			<div>
				{/* Modern Select All Header - Mobile Optimized */}
				<div className="flex border-b border-neutral-200 bg-neutral-50 min-w-max">
					<div 
						className="w-12 sm:w-16 flex-shrink-0 border-r border-neutral-200 bg-neutral-100 flex items-center justify-center px-2 sm:px-4 py-2"
					>
						<Checkbox
							checked={false}
							disabled={true}
							className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 pointer-events-none w-4 h-4"
						/>
					</div>
					
					{/* Data columns header - Mobile Optimized */}
					<div className="flex-1 flex items-center justify-between px-2 sm:px-4 py-2 min-w-0">
						<span className="text-xs sm:text-sm font-semibold text-neutral-700 truncate">
							No rows yet
						</span>
					</div>
					
					{/* Empty space for add column button */}
					<div className="w-12 sm:w-16 flex-shrink-0 border-l border-neutral-200 bg-neutral-100" />
				</div>

				{/* Inline Row Creator - Always show if user can edit */}
				{canEdit && (
					<InlineRowCreator
						columns={columns}
						onSave={onSaveNewRow || (() => {})}
						onCancel={onCancelNewRow || (() => {})}
						isSaving={isSavingNewRow}
						tables={tables}
					/>
				)}
				
				{/* Debug info - remove after fixing */}
				{process.env.NODE_ENV === 'development' && (
					<div className="text-xs text-gray-500 p-2 bg-yellow-50 border border-yellow-200">
						Debug: showInlineRowCreator={showInlineRowCreator.toString()}, canEdit={canEdit.toString()}, 
						onSaveNewRow={!!onSaveNewRow}, onCancelNewRow={!!onCancelNewRow}
					</div>
				)}

				{/* Empty state message */}
				<div className="flex flex-col items-center justify-center py-16 px-8 text-center">
					<div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
						<FileText className="w-8 h-8 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-semibold text-foreground mb-2">No Data</h3>
					<p className="text-muted-foreground">
						This table doesn't have any rows yet. Use the form above to add your first row.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Modern Select All Header - Mobile Optimized */}
			<div className="flex border-b border-neutral-200 bg-neutral-50 min-w-max">
				<div 
					className="w-12 sm:w-16 flex-shrink-0 border-r border-neutral-200 bg-neutral-100 flex items-center justify-center px-2 sm:px-4 py-2 cursor-pointer hover:bg-neutral-200 transition-colors duration-200"
					onClick={() => handleSelectAll(!isAllSelected)}
				>
					<Checkbox
						checked={isAllSelected}
						onCheckedChange={handleSelectAll}
						ref={(el) => {
							if (el) (el as any).indeterminate = isIndeterminate;
						}}
						className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 pointer-events-none w-4 h-4"
					/>
				</div>
				
				{/* Data columns header - Mobile Optimized */}
				<div className="flex-1 flex items-center justify-between px-2 sm:px-4 py-2 min-w-0">
					<span className="text-xs sm:text-sm font-semibold text-neutral-700 truncate">
						{selectedRows.size > 0 ? `${selectedRows.size} row${selectedRows.size === 1 ? '' : 's'} selected` : 'Select rows to manage'}
					</span>
					
					{/* Delete selected button */}
					{selectedRows.size > 0 && canDelete && (
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDeleteSelected}
							className="h-6 sm:h-7 px-2 sm:px-3 text-xs hover:bg-red-600 transition-colors duration-200 flex-shrink-0"
						>
							<Trash2 className="w-3 h-3 mr-1" />
							<span className="hidden sm:inline">Delete ({selectedRows.size})</span>
							<span className="sm:hidden">({selectedRows.size})</span>
						</Button>
					)}
				</div>
				
				{/* Empty space for add column button */}
				<div className="w-12 sm:w-16 flex-shrink-0 border-l border-neutral-200 bg-neutral-100" />
			</div>

			{/* Inline Row Creator - Always show if user can edit */}
			{canEdit && (
				<InlineRowCreator
					columns={columns}
					onSave={onSaveNewRow || (() => {})}
					onCancel={onCancelNewRow || (() => {})}
					isSaving={isSavingNewRow}
					tables={tables}
				/>
			)}
			
			{/* Debug info - remove after fixing */}
			{process.env.NODE_ENV === 'development' && (
				<div className="text-xs text-gray-500 p-2 bg-yellow-50 border border-yellow-200">
					Debug: showInlineRowCreator={showInlineRowCreator.toString()}, canEdit={canEdit.toString()}, 
					onSaveNewRow={!!onSaveNewRow}, onCancelNewRow={!!onCancelNewRow}
				</div>
			)}

			{/* Data Rows */}
			{rows.map((row, rowIndex) => {
				const isSelected = selectedRows.has(row.id.toString());
				const isDeleting = deletingRows.has(row.id.toString());
				const isLocalRow = (row as any).isLocalOnly;

				return (
					<div
						key={row.id}
						className={cn(
							"flex border-b border-neutral-200 hover:bg-neutral-100 transition-all duration-200 group min-w-max",
							isSelected && "bg-blue-50",
							isDeleting && "opacity-50",
							isLocalRow && "bg-yellow-50 border-yellow-200"
						)}
					>
						{/* Row Selection - Mobile Optimized */}
						<div 
							className="w-12 sm:w-16 flex-shrink-0 border-r border-neutral-200 bg-neutral-50 flex items-center justify-center px-2 sm:px-4 py-2 cursor-pointer hover:bg-neutral-100 transition-colors duration-200"
							onClick={() => handleSelectRow(row.id.toString(), !isSelected)}
						>
							<Checkbox
								checked={isSelected}
								onCheckedChange={(checked) => handleSelectRow(row.id.toString(), checked as boolean)}
								className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 pointer-events-none w-4 h-4"
							/>
						</div>

						{/* Data Cells */}
						{columns.map((column) => {
							const cellValue = getCellValue(row, column);
							const cellId = getCellId(row, column);
							const isEditing = editingCell?.rowId === row.id.toString() && editingCell?.columnId === column.id.toString();
							const hasPending = hasPendingChange(row.id.toString(), column.id.toString());
							const pendingValue = getPendingValue(row.id.toString(), column.id.toString());

							return (
								<div
									key={`${row.id}-${column.id}`}
									className={cn(
										"flex-1 min-w-[100px] sm:min-w-[120px] border-r border-neutral-200 px-2 sm:px-4 py-2 hover:bg-neutral-50 transition-all duration-200 cursor-pointer",
										hasPending && "bg-yellow-50 border-yellow-200",
										"group/cell"
									)}
									onClick={() => canEdit && onEditCell(row.id.toString(), column.id.toString(), cellId.toString())}
									style={{ width: Math.max(200, 100) }}
								>
									{isEditing ? (
										<EditableCell
											columns={[column]}
											cell={{
												id: cellId.toString(),
												rowId: row.id,
												columnId: column.id,
												value: cellValue,
												column: column
											}}
											isEditing={true}
											onStartEdit={() => {}}
											onSave={(value) => onSaveCell(column.id.toString(), row.id.toString(), cellId.toString(), value)}
											onCancel={onCancelEdit}
											tables={tables}
											hasPendingChange={hasPending}
											pendingValue={pendingValue}
											onRefreshReferenceData={onRefreshReferenceData}
										/>
									) : (
										<div className="w-full h-6 sm:h-8 flex items-center">
											{hasPending ? (
												// Show pending value as primary value with yellow background
												<span className="text-xs sm:text-sm text-yellow-800 font-medium bg-yellow-100 px-2 py-1 rounded truncate">
													{pendingValue !== null && pendingValue !== undefined 
														? String(pendingValue) 
														: <span className="text-yellow-600 italic">empty</span>
													}
												</span>
											) : (
												// Show original value
												<span className="text-xs sm:text-sm text-neutral-700 truncate">
													{cellValue !== null && cellValue !== undefined 
														? String(cellValue) 
														: <span className="text-neutral-400 italic">empty</span>
													}
												</span>
											)}
										</div>
									)}
								</div>
							);
						})}

						{/* Empty space for add column button */}
						<div className="w-12 sm:w-16 flex-shrink-0 border-l border-neutral-200 bg-neutral-50" />
					</div>
				);
			})}
		</div>
	);
}
