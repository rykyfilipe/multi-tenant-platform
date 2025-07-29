/** @format */

"use client";

import { useState, KeyboardEvent, useMemo, JSX } from "react";
import { Cell, Column, Row, Table } from "@/types/database";
import { Input } from "../../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";

interface Props {
	columns: Column[];
	cell: Cell;
	isEditing: boolean;
	onStartEdit: () => void;
	onSave: (value: any) => void;
	onCancel: () => void;
	tables: Table[] | null;
}

const createReferenceData = (tables: Table[] | null) => {
	const referenceData: Record<number, { id: number; displayValue: string }[]> =
		{};
	if (!tables) return referenceData;

	tables.forEach((table) => {
		const options: { id: number; displayValue: string }[] = [];
		console.log(table);
		if (Array.isArray(table.rows) && table.rows.length > 0) {
			table.rows.forEach((row) => {
				if (Array.isArray(row.cells) && row.cells.length > 0) {
					const displayParts: string[] = [];

					let addedColumns = 0;
					const maxColumns = 3;
					console.log(row.cells);

					table.columns.forEach((column) => {
						if (addedColumns >= maxColumns) return;

						const cell = row.cells.find((c) => c.columnId === column.id);
						if (cell?.value != null && cell.value.toString().trim() !== "") {
							let formattedValue = cell.value.toString().trim();

							if (formattedValue.length > 15) {
								formattedValue = formattedValue.substring(0, 15) + "...";
							}

							if (column.type === "date") {
								try {
									formattedValue = new Date(formattedValue).toLocaleDateString(
										"ro-RO",
									);
								} catch {
									// fallback la valoarea brută
								}
							} else if (column.type === "boolean") {
								formattedValue = formattedValue === "true" ? "✓" : "✗";
							}

							if (addedColumns === 0 && column.primary) {
								displayParts.push(`#${formattedValue}`);
							} else {
								displayParts.push(formattedValue);
							}
							addedColumns++;
						}
					});

					const displayValue = displayParts.length
						? displayParts.join(" • ").slice(0, 50)
						: `Row #${row.id}`;

					options.push({
						id: row.id,
						displayValue,
					});
				}
			});
		}

		referenceData[table.id] = options;
	});

	return referenceData;
};

export function EditableCell({
	columns,
	cell,
	isEditing,
	onStartEdit,
	onSave,
	onCancel,
	tables,
}: Props) {
	const [value, setValue] = useState<any>(cell.value);
	const column = columns?.find((col) => col.id === cell.columnId);
	const referenceData = useMemo(() => createReferenceData(tables), [tables]);

	if (!column) return null;
	const handleKey = (e: KeyboardEvent) => {
		if (e.key === "Enter") onSave(value);
		if (e.key === "Escape") onCancel();
	};

	let referenceSelect: JSX.Element | null = null;
	if (column.type === "reference") {
		const options = referenceData[column.referenceTableId ?? -1] ?? [];
		const referencedTable = tables?.find(
			(t) => t.id === column.referenceTableId,
		);

		referenceSelect = (
			<div className='flex flex-col gap-1'>
				<Select
					value={value ? String(value) : ""}
					onValueChange={(val) => setValue(Number(val))}>
					<SelectTrigger>
						<SelectValue
							placeholder={`Select ${referencedTable?.name || "reference"}`}
						/>
					</SelectTrigger>
					<SelectContent className='max-w-[400px]'>
						{options.length > 0 ? (
							options.map((opt) => (
								<SelectItem
									key={opt.id}
									value={String(opt.id)}
									className='truncate max-w-[380px]'>
									<span className='truncate' title={opt.displayValue}>
										{opt.displayValue}
									</span>
								</SelectItem>
							))
						) : (
							<SelectItem disabled value='no-options'>
								No {referencedTable?.name || "options"} available
							</SelectItem>
						)}
					</SelectContent>
				</Select>

				{process.env.NODE_ENV === "development" && (
					<div className=' text-xs text-muted-foreground'>
						Table: {referencedTable?.name} (ID: {column.referenceTableId}),
						Options: {options.length}
					</div>
				)}
			</div>
		);
	}

	if (isEditing) {
		return (
			<div className='flex items-start gap-2'>
				{column.type === "boolean" ? (
					<Select
						value={String(value)}
						onValueChange={(v) => setValue(v === "true")}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='true'>True</SelectItem>
							<SelectItem value='false'>False</SelectItem>
						</SelectContent>
					</Select>
				) : column.type === "reference" ? (
					referenceSelect
				) : (
					<Input
						className='w-max'
						type={
							column.type === "date"
								? "date"
								: column.type === "number"
								? "number"
								: "text"
						}
						value={value ?? ""}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={handleKey}
						autoFocus
					/>
				)}

				<Button variant='ghost' size='sm' onClick={() => onSave(value)}>
					✓
				</Button>
				<Button variant='ghost' size='sm' onClick={onCancel}>
					✕
				</Button>
			</div>
		);
	}

	let display: string;

	if (value == null || value === "") {
		display = "Empty";
	} else if (column.type === "boolean") {
		display = value === true ? "True" : "False";
	} else if (column.type === "date") {
		display = new Date(value).toLocaleDateString();
	} else if (column.type === "reference" && column.referenceTableId) {
		const referenceTable = tables?.find(
			(t) => t.id === column.referenceTableId,
		);
		const referencedRow = referenceTable?.rows?.find(
			(row: Row) => row.id === Number(value),
		);

		display = "";
		referencedRow?.cells.forEach((cell) => {
			display += `${cell.value} • `;
		});
	} else {
		display = String(value);
	}

	return (
		<div
			onDoubleClick={onStartEdit}
			title='Double-click to edit'
			className={` ${display === "Empty" && "text-gray-500 italic"} `}>
			<p className='max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis'>
				{display}
			</p>
		</div>
	);
}
