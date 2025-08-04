/** @format */
"use client";

import { Table, Row, Column } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Database, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { EditableCell } from "./EditableCell";
import { useApp } from "@/contexts/AppContext";

interface Props {
	tables: Table[] | null;
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
	tables,
	table,
	rows,
	columns,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteRow,
}: Props) {
	const { user } = useApp();
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
				<div
					className='overflow-auto'
					style={{
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}>
					<table className='w-full'>
						<thead>
							<tr>
								{columns.map((col) => (
									<th className='text-start' key={col.name}>
										{col.name}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.length === 0 ? (
								<tr>
									<td
										colSpan={table.columns?.length ?? 0 + 1}
										className='text-center py-8'>
										No data yet.
									</td>
								</tr>
							) : (
								rows.map((row) => (
									<tr key={row.id}>
										{columns.map((col) => {
											const cell = row.cells?.find(
												(cell) => cell.columnId === col.id,
											);
											if (!cell) return;
											return (
												<td key={crypto.randomUUID()}>
													<EditableCell
														columns={columns}
														cell={cell}
														tables={tables}
														isEditing={
															editingCell?.rowId === row.id.toFixed(0) &&
															Number(editingCell.columnId) === col.id
														}
														onStartEdit={() => {
															onEditCell(
																cell.rowId.toString(),
																cell.columnId.toString(),
																cell.id.toString(),
															);
														}}
														onSave={(val) => {
															onSaveCell(
																cell.columnId.toString(),
																cell.rowId.toString(),
																cell.id.toString(),
																val,
															);
														}}
														onCancel={onCancelEdit}
													/>
												</td>
											);
										})}
										{user.role !== "VIEWER" && (
											<td>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => onDeleteRow(row["id"].toFixed(0))}>
													<Trash2 />
												</Button>
											</td>
										)}
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
