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
import {
	USER_FRIENDLY_COLUMN_TYPES,
	COLUMN_TYPE_LABELS,
} from "@/lib/columnTypes";
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
		if (Array.isArray(table.rows) && table.rows.length > 0) {
			table.rows.forEach((row) => {
				if (
					Array.isArray(row.cells) &&
					row.cells.length > 0 &&
					Array.isArray(table.columns)
				) {
					const displayParts: string[] = [];

					let addedColumns = 0;
					const maxColumns = 3;

					table.columns.forEach((column) => {
						if (addedColumns >= maxColumns) return;

						if (row.cells) {
							const cell = row.cells.find((c) => c.columnId === column.id);
							if (cell?.value != null && cell.value.toString().trim() !== "") {
								let formattedValue = cell.value.toString().trim();

								if (formattedValue.length > 15) {
									formattedValue = formattedValue.substring(0, 15) + "...";
								}

								if (column.type === "date") {
									try {
										formattedValue = new Date(
											formattedValue,
										).toLocaleDateString("ro-RO");
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
						}
					});

					const displayValue = displayParts.length
						? displayParts.join(" • ").slice(0, 50)
						: `Row #${row.id || "unknown"}`;

					options.push({
						id: row.id || 0,
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
	// Handle cases where cell might be undefined or missing properties
	if (!cell || !cell.columnId) {
		return <div className='text-gray-400 italic'>Empty</div>;
	}

	const [value, setValue] = useState<any>(cell.value);
	const column = columns?.find((col) => col.id === cell.columnId);
	const referenceData = useMemo(() => createReferenceData(tables), [tables]);

	if (!column) return null;
	const handleKey = (e: KeyboardEvent) => {
		if (e.key === "Enter") onSave(value);
		if (e.key === "Escape") onCancel();
	};

	let referenceSelect: JSX.Element | null = null;
	if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
		const options = referenceData[column.referenceTableId ?? -1] ?? [];

		const referencedTable = tables?.find(
			(t) => t.id === column.referenceTableId,
		);

		referenceSelect = (
			<div className='flex flex-col gap-1'>
				<Select
					value={value ? String(value) : ""}
					onValueChange={(val) => setValue(val)}>
					<SelectTrigger>
						<SelectValue
							placeholder={`Select ${referencedTable?.name || "reference"}`}
						/>
					</SelectTrigger>
					<SelectContent className='max-w-[400px]'>
						{/* Opțiunea pentru valoarea curentă dacă nu există în lista de opțiuni */}
						{value &&
							!options.some((opt) => {
								let primaryKeyValue = opt.displayValue;
								if (opt.displayValue.startsWith("#")) {
									primaryKeyValue = opt.displayValue
										.substring(1)
										.split(" • ")[0];
								}
								return primaryKeyValue === value;
							}) && (
								<SelectItem
									value={String(value)}
									className='truncate max-w-[380px] text-red-600'>
									<span className='truncate' title={`Invalid: ${value}`}>
										⚠️ Invalid: {value}
									</span>
								</SelectItem>
							)}

						{options.length > 0 ? (
							options.map((opt) => {
								// Extragem valoarea cheii primare din displayValue
								let primaryKeyValue = opt.displayValue;
								if (opt.displayValue.startsWith("#")) {
									primaryKeyValue = opt.displayValue
										.substring(1)
										.split(" • ")[0];
								}

								return (
									<SelectItem
										key={opt.id}
										value={primaryKeyValue}
										className='truncate max-w-[380px]'>
										<span className='truncate' title={opt.displayValue}>
											{opt.displayValue}
										</span>
									</SelectItem>
								);
							})
						) : (
							<SelectItem disabled value='no-options'>
								No {referencedTable?.name || "options"} available
							</SelectItem>
						)}
					</SelectContent>
				</Select>

				{process.env.NODE_ENV === "development" && (
					<div className=' text-xs text-muted-foreground'>
						Table:{" "}
						{referencedTable?.name ||
							`Unknown (ID: ${column.referenceTableId})`}
						, Options: {options.length}
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
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.link ? (
					referenceSelect
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.customArray ? (
					<Select
						value={String(value || "")}
						onValueChange={(v) => setValue(v)}>
						<SelectTrigger>
							<SelectValue placeholder='Select an option' />
						</SelectTrigger>
						<SelectContent>
							{column.customOptions && column.customOptions.length > 0 ? (
								column.customOptions.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))
							) : (
								<SelectItem disabled value='no-options'>
									No options available
								</SelectItem>
							)}
						</SelectContent>
					</Select>
				) : (
					<Input
						className='w-max'
						type={
							column.type === USER_FRIENDLY_COLUMN_TYPES.date
								? "date"
								: column.type === USER_FRIENDLY_COLUMN_TYPES.number
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
		display = "Double-click to add value";
	} else if (column.type === "boolean") {
		display = value === true ? "True" : "False";
	} else if (column.type === "date") {
		display = new Date(value).toLocaleDateString();
	} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
		// Pentru coloanele customArray, verificăm dacă valoarea există în opțiunile definite
		if (column.customOptions && column.customOptions.includes(value)) {
			display = String(value);
		} else {
			display = `⚠️ Invalid: ${value}`;
		}
	} else if (
		column.type === USER_FRIENDLY_COLUMN_TYPES.link &&
		column.referenceTableId
	) {
		// Pentru coloanele de referință, verificăm dacă valoarea există în tabelul de referință
		const referenceTable = tables?.find(
			(t) => t.id === column.referenceTableId,
		);

		if (referenceTable && referenceTable.columns) {
			const refPrimaryKeyColumn = referenceTable.columns.find(
				(col) => col.primary,
			);

			if (refPrimaryKeyColumn && referenceTable.rows) {
				// Căutăm rândul cu cheia primară specificată
				const referenceRow = referenceTable.rows.find((refRow) => {
					if (!refRow.cells) return false;
					const refPrimaryKeyCell = refRow.cells.find(
						(refCell) => refCell.columnId === refPrimaryKeyColumn.id,
					);
					return refPrimaryKeyCell && refPrimaryKeyCell.value === value;
				});

				if (referenceRow) {
					// Valoarea există, afișăm cheia primară
					display = String(value);
				} else {
					// Valoarea nu există, afișăm un mesaj de eroare și permitem editarea
					display = `⚠️ Invalid: ${value}`;
				}
			} else {
				// Nu există cheie primară în tabelul de referință
				display = `⚠️ No primary key in ${referenceTable.name}`;
			}
		} else {
			// Tabelul de referință nu există - afișăm valoarea normal
			display = String(value);
		}
	} else {
		display = String(value);
	}

	// Determinăm stilul în funcție de tipul de afișare
	const getDisplayStyle = () => {
		if (display === "Double-click to add value") {
			return "text-gray-400 italic  rounded px-2 py-1 cursor-pointer hover:translate-y-[-1px] transition-colors";
		} else if (display.startsWith("⚠️")) {
			return "text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1";
		}
		return "cursor-pointer hover:translate-y-[-1px] rounded px-1 transition-colors";
	};

	return (
		<div
			onDoubleClick={onStartEdit}
			title={
				value == null || value === ""
					? "Double-click to add value"
					: "Double-click to edit"
			}
			className={`${getDisplayStyle()}`}>
			<p className='max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis select-none'>
				{display}
			</p>
		</div>
	);
}
