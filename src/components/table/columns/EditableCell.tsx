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
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";

type FieldType = "string" | "boolean" | "date" | readonly string[];

interface Props {
	column: Column;
	fieldName: keyof Column;
	fieldType: FieldType;
	isEditing: boolean;
	onStartEdit: () => void;
	onSave: (value: any) => void;
	onCancel: () => void;
	referenceOptions?: { value: string | number; label: string }[];
	allColumns: Column[];
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
	allColumns,
}: Props) {
	const [value, setValue] = useState<any>(column[fieldName]);

	useEffect(() => {
		setValue(column[fieldName]);
	}, [column, fieldName]);

	// Verificăm permisiunile pentru această coloană
	const { permissions: userPermissions } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		column.tableId,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || []
	);

	// Verificăm dacă utilizatorul poate citi această coloană
	if (!tablePermissions.canReadColumn(column.id)) {
		return <div className='text-gray-400 italic'>Access Denied</div>;
	}

	// Verificăm dacă utilizatorul poate edita această coloană
	const canEdit = tablePermissions.canEditColumn(column.id);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			onSave(value);
		} else if (e.key === "Escape") {
			onCancel();
		}
	};

	const renderValue = () => {
		if (fieldName === "referenceTableId") {
			// Pentru coloanele de tip reference, afișăm numele tabelului de referință
			if (column.type !== "reference") {
				return "Not applicable";
			}
			return column[fieldName]
				? `Unknown Table (ID: ${column[fieldName]})`
				: "No table selected";
		}

		if (fieldType === "boolean") {
			if (
				fieldName === "primary" &&
				allColumns.some((col) => col.id !== column.id && col.primary)
			) {
				return column[fieldName] ? "Yes" : "No (disabled)";
			}
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
		// Verificăm dacă utilizatorul poate edita această coloană
		if (!canEdit) {
			return (
				<div className='flex items-center w-full gap-2'>
					<div className='flex-1 p-2 bg-muted rounded text-sm text-muted-foreground'>
						You don't have permission to edit this column
					</div>
					<Button variant='ghost' size='sm' onClick={onCancel}>
						✕
					</Button>
				</div>
			);
		}

		// Dacă încercăm să edităm referenceTableId pentru o coloană care nu este de tip reference, nu permitem editarea
		if (fieldName === "referenceTableId" && column.type !== "reference") {
			return (
				<div className='flex items-center w-full gap-2'>
					<div className='flex-1 p-2 bg-muted rounded text-sm text-muted-foreground'>
						Not applicable for this column type
					</div>
					<Button variant='ghost' size='sm' onClick={onCancel}>
						✕
					</Button>
				</div>
			);
		}

		return (
			<div className='flex items-center w-full gap-2'>
				{Array.isArray(fieldType) || fieldName === "referenceTableId" ? (
					<Select
						value={value?.toString()}
						onValueChange={(val) => setValue(val)}>
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
								: (fieldType as string[]).map((option) => {
										return (
											<SelectItem key={option} value={option}>
												{option}
											</SelectItem>
										);
								  })}
						</SelectContent>
					</Select>
				) : fieldType === "boolean" ? (
					<div className='flex-1 space-y-2'>
						<Select
							value={value?.toString()}
							onValueChange={(val) => setValue(val === "true")}>
							<SelectTrigger className='flex-1'>
								<SelectValue placeholder='Select' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem
									value='true'
									disabled={
										fieldName === "primary" &&
										allColumns.some(
											(col) => col.id !== column.id && col.primary,
										)
									}>
									Yes
								</SelectItem>
								<SelectItem value='false'>No</SelectItem>
							</SelectContent>
						</Select>
						{fieldName === "primary" &&
							allColumns.some((col) => col.id !== column.id && col.primary) && (
								<p className='text-xs text-muted-foreground'>
									⚠️ Another column is already set as primary key
								</p>
							)}
					</div>
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
		<div
			className={`w-full ${
				(fieldName === "referenceTableId" && column.type !== "reference") ||
				(fieldName === "primary" &&
					allColumns.some((col) => col.id !== column.id && col.primary)) ||
				!canEdit
					? "cursor-not-allowed opacity-50"
					: "cursor-pointer"
			}`}
			onClick={
				(fieldName === "referenceTableId" && column.type !== "reference") ||
				(fieldName === "primary" &&
					allColumns.some((col) => col.id !== column.id && col.primary)) ||
				!canEdit
					? undefined
					: onStartEdit
			}
			title={
				!canEdit
					? "You don't have permission to edit this column"
					: (fieldName === "referenceTableId" && column.type !== "reference") ||
					  (fieldName === "primary" &&
							allColumns.some((col) => col.id !== column.id && col.primary))
					? "This field cannot be edited"
					: "Click to edit"
			}>
			<p className='max-w-[100px] truncate'>{renderValue()}</p>
		</div>
	);
}
