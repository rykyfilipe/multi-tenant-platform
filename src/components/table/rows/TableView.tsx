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
								rows.map((row) => {
									// Skip rows without valid ID
									if (!row || row.id === undefined || row.id === null) {
										return null;
									}

									return (
										<tr key={row.id} className='row-row'>
											{columns.map((col) => {
												// Skip columns without valid ID
												if (!col || col.id === undefined || col.id === null) {
													return null;
												}

												const cell = row.cells?.find(
													(cell) => cell && cell.columnId === col.id,
												);

												// If no cell exists for this column, create a virtual cell for editing
												if (!cell) {
													const virtualCell: Cell = {
														id: 0, // Virtual ID
														rowId: row.id,
														columnId: col.id,
														value: null,
													};

													return (
														<td key={`${row.id}-${col.id}-empty`}>
															<EditableCell
																columns={columns}
																cell={virtualCell}
																tables={tables}
																isEditing={
																	editingCell?.rowId === String(row.id) &&
																	Number(editingCell.columnId) === col.id
																}
																onStartEdit={() => {
																	onEditCell(
																		String(row.id),
																		String(col.id),
																		"virtual",
																	);
																}}
																onSave={(val) => {
																	onSaveCell(
																		String(col.id),
																		String(row.id),
																		"virtual",
																		val,
																	);
																}}
																onCancel={onCancelEdit}
															/>
														</td>
													);
												}

												// Validate cell has required properties
												if (!cell.id || !cell.rowId || !cell.columnId) {
													return (
														<td
															key={`${row.id}-${col.id}-invalid`}
															className='text-red-400 italic'>
															Invalid Cell
														</td>
													);
												}

												return (
													<td key={`${row.id}-${col.id}-${cell.id}`}>
														<EditableCell
															columns={columns}
															cell={cell}
															tables={tables}
															isEditing={
																editingCell?.rowId === String(row.id) &&
																Number(editingCell.columnId) === col.id
															}
															onStartEdit={() => {
																onEditCell(
																	String(cell.rowId),
																	String(cell.columnId),
																	String(cell.id),
																);
															}}
															onSave={(val) => {
																onSaveCell(
																	String(cell.columnId),
																	String(cell.rowId),
																	String(cell.id),
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
														onClick={() => onDeleteRow(String(row.id))}>
														<Trash2 />
													</Button>
												</td>
											)}
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
