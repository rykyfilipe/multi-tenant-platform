/** @format */
"use client";

import { Column, ColumnSchema } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Database, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { EditableCell } from "./EditableCell";

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
	columnSchemaMeta: FieldMeta[];
}

type FieldType = "string" | "boolean" | readonly string[];

interface FieldMeta {
	key: keyof ColumnSchema;
	type: FieldType;
	required: boolean;
	label: string;
	placeholder?: string;
}

export function TableView({
	columns,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteColumn,
	columnSchemaMeta,
}: Props) {
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
					className='overflow-auto'
					style={{
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}>
					<table className='w-full'>
						<thead>
							<tr>
								{columnSchemaMeta.map((meta) => (
									<th className='text-start p-2 border-b' key={meta.key}>
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
								columns.map((column) => (
									<tr
										key={column?.id || crypto.randomUUID()}
										className='hover:bg-gray-50'>
										{columnSchemaMeta.map((meta) => (
											<td key={meta.key} className='p-2 border-b'>
												<EditableCell
													column={column}
													fieldName={meta.key}
													fieldType={meta.type}
													isEditing={
														editingCell?.columnId === column.id?.toString() &&
														editingCell?.fieldName === meta.key
													}
													onStartEdit={() =>
														onEditCell(column.id?.toString(), meta.key)
													}
													onSave={(val: string) =>
														onSaveCell(column.id?.toString(), meta.key, val)
													}
													onCancel={onCancelEdit}
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
