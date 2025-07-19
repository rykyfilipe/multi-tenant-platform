/** @format */
import { useState, useEffect } from "react";
import { Column, ColumnSchema } from "@/types/database";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";

type FieldType = "string" | "boolean" | readonly string[];

interface Props {
	column: Column;
	fieldName: keyof ColumnSchema;
	fieldType: FieldType;
	isEditing: boolean;
	onStartEdit: () => void;
	onSave: (value: any) => void;
	onCancel: () => void;
}

export function EditableCell({
	column,
	fieldName,
	fieldType,
	isEditing,
	onStartEdit,
	onSave,
	onCancel,
}: Props) {
	const [value, setValue] = useState<any>(column[fieldName]);

	useEffect(() => {
		setValue(column[fieldName]);
	}, [column, fieldName]);

	const handleSave = () => {
		let processedValue = value;

		// Convert value based on field type
		if (fieldType === "boolean") {
			processedValue = value === "true" || value === true;
		} else if (Array.isArray(fieldType)) {
			// For dropdown/select fields, ensure value is in allowed options
			if (!fieldType.includes(value)) {
				processedValue = fieldType[0]; // Default to first option
			}
		}

		onSave(processedValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			onCancel();
		}
	};

	const renderValue = () => {
		if (fieldType === "boolean") {
			return column[fieldName] ? "Yes" : "No";
		}
		return column[fieldName]?.toString() || "";
	};

	if (isEditing) {
		return (
			<div className='flex items-center gap-2'>
				{fieldType === "boolean" ? (
					<Select
						value={value?.toString()}
						onValueChange={(val) => setValue(val)}>
						<SelectTrigger className='flex-1' onKeyDown={handleKeyDown}>
							<SelectValue placeholder='Select' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='true'>Yes</SelectItem>
							<SelectItem value='false'>No</SelectItem>
						</SelectContent>
					</Select>
				) : Array.isArray(fieldType) ? (
					<Select value={value} onValueChange={(val) => setValue(val)}>
						<SelectTrigger className='flex-1' onKeyDown={handleKeyDown}>
							<SelectValue placeholder='Select' />
						</SelectTrigger>
						<SelectContent>
							{fieldType.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Input
						value={value || ""}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={handleKeyDown}
						className='flex-1'
						autoFocus
					/>
				)}

				<Button size='sm' onClick={handleSave} className='p-1 h-8 w-8'>
					<Check className='h-4 w-4' />
				</Button>
				<Button
					size='sm'
					variant='ghost'
					onClick={onCancel}
					className='p-1 h-8 w-8'>
					<X className='h-4 w-4' />
				</Button>
			</div>
		);
	}

	return (
		<div
			className='cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[32px] flex items-center'
			onClick={onStartEdit}>
			{renderValue()}
		</div>
	);
}
