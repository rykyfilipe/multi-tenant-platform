/** @format */

"use client";

import { useState, KeyboardEvent } from "react";
import { Row } from "@/types/database";
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
	row: Row;
	colName: string;
	colType: string;
	isEditing: boolean;
	onStartEdit: () => void;
	onSave: (value: any) => void;
	onCancel: () => void;
}

export function EditableCell({
	row,
	colName,
	colType,
	isEditing,
	onStartEdit,
	onSave,
	onCancel,
}: Props) {
	const [value, setValue] = useState<any>(row.data[colName]);

	function handleKey(e: KeyboardEvent) {
		if (e.key === "Enter") onSave(value);
		if (e.key === "Escape") onCancel();
	}

	if (isEditing) {
		return (
			<div className='flex items-center gap-2'>
				{colType === "boolean" ? (
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
				) : (
					<Input
						className='w-max'
						type={
							colType === "date"
								? "date"
								: colType === "number"
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
	if (value == null || value === "") display = "Empty";
	else if (colType === "boolean") display = value ? "True" : "False";
	else if (colType === "date") display = new Date(value).toLocaleDateString();
	else display = String(value);

	return (
		<div onDoubleClick={onStartEdit} title='Double-click to edit'>
			{display}
		</div>
	);
}
