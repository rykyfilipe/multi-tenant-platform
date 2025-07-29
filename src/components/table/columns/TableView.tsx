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
		<Card className='shadow-lg'>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Database />
					<CardTitle>Table Columns</CardTitle>
					<span className='ml-auto'>
						{columns.length} column{columns.length !== 1 && "s"}
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<div
					className='table-content overflow-auto'
					style={{ scrollbarWidth: "none" }}>
					<table className='w-full'>
						<thead>
							<tr>
								{columnSchemaMeta.map((meta) => (
									<th key={meta.key} className='text-start p-2 border-b'>
										{meta.label}
									</th>
								))}
								<th className='text-start p-2 border-b'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{columns.length === 0 ? (
								<tr>
									<td
										colSpan={columnSchemaMeta.length + 1}
										className='text-center py-8'>
										No columns yet.
									</td>
								</tr>
							) : (
								columns.map((column, index) => (
									<tr
										key={column.id}
										className={`${
											index === 0 && "column-row"
										} hover:bg-gray-50`}>
										{columnSchemaMeta.map((meta) => (
											<td key={meta.key} className='p-2 border-b'>
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
										<td className='p-2 border-b'>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => onDeleteColumn(column.id.toString())}>
												<Trash2 className='h-4 w-4' />
											</Button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
