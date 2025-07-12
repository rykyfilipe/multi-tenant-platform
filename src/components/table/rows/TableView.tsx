/** @format */
"use client";

import { Table, Row, Column } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Database, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { EditableCell } from "./EditableCell";

interface Props {
	table: Table;
	rows: Row[];
	columns: Column[];

	editingCell: { rowId: string; columnId: string } | null;
	onEditCell: (rowId: string, columnId: string, cellId: string) => void;
	onSaveCell: (
		rowId: string,
		columnId: string,
		cellId: string,
		value: any,
	) => void;
	onCancelEdit: () => void;
	onDeleteRow: (rowId: string) => void;
}

export function TableView({
	table,
	rows,
	columns,
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
								{columns.map((col) => (
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
										{row.cells.map((cell) => (
											<td key={cell.id}>
												<EditableCell
													columns={columns}
													cell={cell}
													isEditing={
														editingCell?.rowId === row.id.toFixed(0) &&
														Number(editingCell.columnId) === cell.columnId
													}
													onStartEdit={() =>
														onEditCell(
															cell.rowId.toString(),
															cell.columnId.toString(),
															cell.id.toString(),
														)
													}
													onSave={(val) =>
														onSaveCell(
															cell.rowId.toString(),
															cell.columnId.toString(),
															cell.id.toString(),
															val,
														)
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
