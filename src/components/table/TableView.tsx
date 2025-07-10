/** @format */
"use client";

import { Table, Row } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Database, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { EditableCell } from "./EditableCell";

interface Props {
	table: Table;
	rows: Row[];
	editingCell: { rowId: string; colName: string } | null;
	onEditCell: (rowId: string, colName: string) => void;
	onSaveCell: (rowId: string, colName: string, value: any) => void;
	onCancelEdit: () => void;
	onDeleteRow: (rowId: string) => void;
}

export function TableView({
	table,
	rows,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteRow,
}: Props) {
	return (
		<Card className='shadow-lg'>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Database />
					<CardTitle>Table Data</CardTitle>
					<span className='ml-auto'>
						{rows.length} row{rows.length !== 1 && "s"}
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr>
								{table.columns.map((col) => (
									<th className='text-start' key={col.name}>
										{col.name}
									</th>
								))}
								<th className='text-start'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{rows.length === 0 ? (
								<tr>
									<td
										colSpan={table.columns.length + 1}
										className='text-center py-8'>
										No data yet.
									</td>
								</tr>
							) : (
								rows.map((row) => (
									<tr key={row.id}>
										{table.columns.map((col) => (
											<td key={col.name}>
												<EditableCell
													row={row}
													colName={col.name}
													colType={col.type}
													isEditing={
														editingCell?.rowId === row["id"].toFixed(0) &&
														editingCell.colName === col.name
													}
													onStartEdit={() =>
														onEditCell(row["id"].toFixed(0), col.name)
													}
													onSave={(val) =>
														onSaveCell(row["id"].toFixed(0), col.name, val)
													}
													onCancel={onCancelEdit}
												/>
											</td>
										))}
										<td>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => onDeleteRow(row["id"].toFixed(0))}>
												<Trash2 />
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
