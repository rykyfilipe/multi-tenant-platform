/** @format */
"use client";

import { Column, ColumnSchema, FieldType, Table } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Database, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { EditableCell } from "./EditableCell";
import { useMemo } from "react";

interface Props {
	columns: Column[];
	editingCell: { columnId: string; fieldName: keyof ColumnSchema } | null;
	onEditCell: (columnId: string, fieldName: keyof ColumnSchema) => void;
	onSaveCell: (
		columnId: string,
		fieldName: keyof ColumnSchema,
		value: any,
	) => void;
	onCancelEdit: () => void;
	onDeleteColumn: (columnId: string) => void;
	tables: Table[] | null;
}

interface FieldMeta {
	key: keyof ColumnSchema;
	type: FieldType;
	required: boolean;
	label: string;
	placeholder?: string;
	referenceOptions?: { value: number | string; label: string }[];
}

export function TableView({
	columns,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteColumn,
	tables,
}: Props) {
	const columnSchemaMeta: FieldMeta[] = useMemo(() => {
		const base: FieldMeta[] = [
			{
				key: "name",
				type: "string",
				required: true,
				label: "Column Name",
			},
			{
				key: "type",
				type: ["string", "number", "boolean", "date", "reference"] as const,
				required: true,
				label: "Data Type",
			},
			{
				key: "required",
				type: "boolean",
				required: false,
				label: "Required",
			},
			{
				key: "primary",
				type: "boolean",
				required: false,
				label: "Primary Key",
			},
			{
				key: "autoIncrement",
				type: "boolean",
				required: false,
				label: "Auto Increment",
			},
			{
				key: "referenceTableId",
				type: tables?.map((t) => t.id.toString()) || [],
				required: false,
				label: "Reference Table",
				referenceOptions: tables?.map((t) => ({
					value: t.id,
					label: t.name,
				})),
			},
		];

		return base;
	}, [tables]);

	return (
		<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg overflow-hidden'>
			{/* Table Header */}
			<div className='flex items-center justify-between p-4 border-b border-border/20 bg-muted/30'>
				<div className='flex items-center gap-3'>
					<div className='p-2 bg-primary/10 rounded-lg'>
						<Database className='w-4 h-4 text-primary' />
					</div>
					<div>
						<h3 className='text-sm font-semibold text-foreground'>
							Table Columns
						</h3>
						<p className='text-xs text-muted-foreground'>
							{columns.length} column{columns.length !== 1 && "s"}
						</p>
					</div>
				</div>
			</div>

			{/* Table Content */}
			<div
				className='table-content overflow-auto'
				style={{ scrollbarWidth: "none" }}>
				<table className='w-full'>
					<thead>
						<tr className='bg-muted/20'>
							{columnSchemaMeta.map((meta) => (
								<th
									key={meta.key}
									className='text-start p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider'>
									{meta.label}
								</th>
							))}
							<th className='text-start p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-16'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{columns.length === 0 ? (
							<tr>
								<td
									colSpan={columnSchemaMeta.length + 1}
									className='text-center py-12'>
									<div className='text-muted-foreground'>
										<p className='text-sm font-medium'>No columns yet</p>
										<p className='text-xs mt-1'>
											Add your first column to get started
										</p>
									</div>
								</td>
							</tr>
						) : (
							columns.map((column, index) => (
								<tr
									key={column.id}
									className={`${
										index === 0 && "column-row"
									} hover:bg-muted/30 transition-colors border-b border-border/10`}>
									{columnSchemaMeta.map((meta) => (
										<td key={meta.key} className='p-3'>
											<EditableCell
												column={column}
												fieldName={meta.key}
												fieldType={meta.type}
												isEditing={
													editingCell?.columnId === column.id.toString() &&
													editingCell?.fieldName === meta.key
												}
												onStartEdit={() =>
													onEditCell(column.id.toString(), meta.key)
												}
												onSave={(val) =>
													onSaveCell(column.id.toString(), meta.key, val)
												}
												onCancel={onCancelEdit}
												referenceOptions={meta.referenceOptions}
											/>
										</td>
									))}
									<td className='p-3'>
										<Button
											variant='ghost'
											size='sm'
											onClick={() => onDeleteColumn(column.id.toString())}
											className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10'>
											<Trash2 className='h-4 w-4' />
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
