/** @format */

"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Column } from "@/types/database";

type FieldType = "string" | "boolean" | "date" | string[];

interface Props {
	column: Column;
	fieldName: keyof Column;
	fieldType: FieldType;
	isEditing: boolean;
	onStartEdit: () => void;
	onSave: (value: any) => void;
	onCancel: () => void;
	referenceOptions?: { value: string | number; label: string }[];
}

export function EditableCell({
	column,
	fieldName,
	fieldType,
	isEditing,
	onStartEdit,
	onSave,
	onCancel,
	referenceOptions,
}: Props) {
	const [value, setValue] = useState<any>(column[fieldName]);

	useEffect(() => {
		setValue(column[fieldName]);
	}, [column, fieldName]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			onSave(value);
		} else if (e.key === "Escape") {
			onCancel();
		}
	};

	const renderValue = () => {
		if (fieldName === "referenceTableId" && referenceOptions?.length) {
			const option = referenceOptions.find(
				(opt) => opt.value === column[fieldName],
			);
			return option?.label || `ID: ${column[fieldName]}`;
		}

		if (fieldType === "boolean") {
			return column[fieldName] ? "Yes" : "No";
		}

		if (fieldType === "date" && column[fieldName]) {
			return new Date(column[fieldName] as string).toLocaleDateString();
		}

		if (column[fieldName] === null || column[fieldName] === "") {
			return "Empty";
		}

		return column[fieldName]?.toString() || "";
	};

	if (isEditing) {
		return (
			<div className='flex items-center w-full gap-2'>
				{Array.isArray(fieldType) || fieldName === "referenceTableId" ? (
					<Select
						value={value?.toString()}
						onValueChange={(val) => setValue(Number(val))}>
						<SelectTrigger className='flex-1'>
							<SelectValue placeholder='Select' />
						</SelectTrigger>
						<SelectContent>
							{fieldName === "referenceTableId" && referenceOptions?.length
								? referenceOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value.toString()}>
											{opt.label}
										</SelectItem>
								  ))
								: (fieldType as string[]).map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
								  ))}
						</SelectContent>
					</Select>
				) : fieldType === "boolean" ? (
					<Select
						value={value?.toString()}
						onValueChange={(val) => setValue(val === "true")}>
						<SelectTrigger className='flex-1'>
							<SelectValue placeholder='Select' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='true'>Yes</SelectItem>
							<SelectItem value='false'>No</SelectItem>
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

				<Button variant='ghost' size='sm' onClick={() => onSave(value)}>
					✓
				</Button>
				<Button variant='ghost' size='sm' onClick={onCancel}>
					✕
				</Button>
			</div>
		);
	}

	return (
		<div className='cursor-pointer w-full' onClick={onStartEdit}>
			<p className='max-w-[100px] truncate'>{renderValue()}</p>
		</div>
	);
}
