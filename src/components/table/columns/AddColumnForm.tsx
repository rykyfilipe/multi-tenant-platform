/** @format */

"use client";

import { FormEvent, useCallback, useMemo } from "react";
import { CreateColumnRequest, Table, Column } from "@/types/database";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "@radix-ui/react-label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";

interface Props {
	newColumn: CreateColumnRequest | null;
	setNewColumn: (col: CreateColumnRequest | null) => void;
	onAdd: (e: FormEvent) => void;
	tables: Table[] | null;
	existingColumns?: Column[];
}

type FieldType = "string" | "boolean" | readonly string[];

interface FieldMeta {
	key: keyof CreateColumnRequest;
	type: FieldType;
	required: boolean;
	label: string;
	placeholder?: string;
	referenceOptions?: { value: number | string; label: string }[];
}

export default function AddColumnForm({
	newColumn,
	setNewColumn,
	onAdd,
	tables,
	existingColumns = [],
}: Props) {
	if (!tables) return null;

	const currentColumn = useMemo(
		() =>
			newColumn || {
				name: "",
				type: "string" as const,
				required: false,
				primary: false,
				autoIncrement: false,
				referenceTableId: undefined,
			},
		[newColumn],
	);

	const updateColumn = useCallback(
		(key: keyof CreateColumnRequest, value: any) => {
			setNewColumn({
				...currentColumn,
				[key]: value,
			});
		},
		[currentColumn, setNewColumn],
	);

	const handleBooleanChange = useCallback(
		(key: keyof CreateColumnRequest, value: string) => {
			updateColumn(key, value === "true");
		},
		[updateColumn],
	);

	const handleStringChange = useCallback(
		(key: keyof CreateColumnRequest, value: string) => {
			updateColumn(key, value);
		},
		[updateColumn],
	);

	const renderBooleanField = useCallback(
		(field: FieldMeta) => {
			const value = currentColumn[field.key] as boolean;

			return (
				<div key={field.key} className='space-y-2'>
					<Label className='text-sm font-medium'>
						{field.label}
						{field.required && <span className='text-destructive ml-1'>*</span>}
					</Label>
					<Select
						value={String(value)}
						onValueChange={(val) => handleBooleanChange(field.key, val)}>
						<SelectTrigger>
							<SelectValue placeholder='Select option' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='false'>False</SelectItem>
							<SelectItem value='true'>True</SelectItem>
						</SelectContent>
					</Select>
				</div>
			);
		},
		[currentColumn, handleBooleanChange],
	);

	const renderEnumField = useCallback(
		(field: FieldMeta) => {
			const value = currentColumn[field.key] as string;
			const options =
				field.referenceOptions ?? (field.type as readonly string[]);

			return (
				<div key={field.key} className='space-y-2'>
					<Label className='text-sm font-medium'>
						{field.label}
						{field.required && <span className='text-destructive ml-1'>*</span>}
					</Label>
					<Select
						value={value?.toString()}
						onValueChange={(val) =>
							updateColumn(field.key, isNaN(Number(val)) ? val : Number(val))
						}>
						<SelectTrigger>
							<SelectValue
								placeholder={`Select ${field.label.toLowerCase()}`}
							/>
						</SelectTrigger>
						<SelectContent>
							{options.map((option) => (
								<SelectItem
									key={
										typeof option === "string" ? option : String(option.value)
									}
									value={
										typeof option === "string" ? option : String(option.value)
									}>
									{typeof option === "string"
										? option.charAt(0).toUpperCase() + option.slice(1)
										: option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			);
		},
		[currentColumn, updateColumn],
	);

	const renderStringField = useCallback(
		(field: FieldMeta) => {
			const value = currentColumn[field.key] as string;

			return (
				<div key={field.key} className='space-y-2'>
					<Label className='text-sm font-medium'>
						{field.label}
						{field.required && <span className='text-destructive ml-1'>*</span>}
					</Label>
					<Input
						type='text'
						value={value || ""}
						onChange={(e) => handleStringChange(field.key, e.target.value)}
						placeholder={
							field.placeholder || `Enter ${field.label.toLowerCase()}`
						}
						required={field.required}
						className='w-full'
					/>
				</div>
			);
		},
		[currentColumn, handleStringChange],
	);

	const columnSchemaMeta: FieldMeta[] = useMemo(() => {
		const base: FieldMeta[] = [
			{
				key: "name",
				type: "string",
				required: true,
				label: "Column Name",
				placeholder: "Enter column name",
			},
			{
				key: "type",
				type: ["string", "number", "boolean", "date", "reference"] as const,
				required: true,
				label: "Data Type",
			},
			{
				key: "required",
				type: "boolean",
				required: false,
				label: "Required",
			},
			{
				key: "primary",
				type: "boolean",
				required: false,
				label: "Primary Key",
			},
			{
				key: "autoIncrement",
				type: "boolean",
				required: false,
				label: "Auto Increment",
			},
		];

		// Dacă e de tip "reference", adaugă un câmp nou
		if (currentColumn.type === "reference") {
			// Filtrăm tabelele care au cheie primară definită
			const tablesWithPrimaryKey = tables.filter(
				(table) => table.columns && table.columns.some((col) => col.primary),
			);

			base.push({
				key: "referenceTableId",
				type: tablesWithPrimaryKey.map((t) =>
					t.id.toString(),
				) as readonly string[],
				required: true,
				label: "Reference Table",
				placeholder: "Select a table to reference",
				referenceOptions: tablesWithPrimaryKey.map((t) => ({
					value: t.id,
					label: t.name,
				})),
			});
		}

		return base;
	}, [currentColumn.type, tables]);

	const renderField = useCallback(
		(field: FieldMeta) => {
			if (field.type === "boolean") return renderBooleanField(field);
			if (Array.isArray(field.type)) return renderEnumField(field);
			return renderStringField(field);
		},
		[renderBooleanField, renderEnumField, renderStringField],
	);

	const isFormValid = useMemo(() => {
		const hasValidName = currentColumn.name.trim().length > 0;
		const hasValidType = currentColumn.type.length > 0;
		const hasValidReference =
			currentColumn.type === "reference"
				? currentColumn.referenceTableId !== undefined &&
				  currentColumn.referenceTableId !== null
				: true;
		const hasValidPrimaryKey = !(
			currentColumn.primary && existingColumns.some((col) => col.primary)
		);
		const hasAvailableReferenceTables =
			currentColumn.type === "reference"
				? tables &&
				  tables.filter(
						(table) =>
							table.columns && table.columns.some((col) => col.primary),
				  ).length > 0
				: true;

		return (
			hasValidName &&
			hasValidType &&
			hasValidReference &&
			hasValidPrimaryKey &&
			hasAvailableReferenceTables
		);
	}, [currentColumn, existingColumns, tables]);

	return (
		<div className='space-y-6'>
			<div className='text-center'>
				<h3 className='text-lg font-semibold text-foreground mb-2'>
					Create New Column
				</h3>
				<p className='text-sm text-muted-foreground'>
					Define the column properties and constraints
				</p>
			</div>

			<form onSubmit={onAdd} className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{columnSchemaMeta.map(renderField)}
				</div>

				{/* Validation Warnings */}
				{currentColumn.autoIncrement && currentColumn.type !== "number" && (
					<div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
						<p className='text-sm text-amber-800'>
							⚠️ Auto increment is typically used with number types
						</p>
					</div>
				)}

				{currentColumn.primary && currentColumn.required === false && (
					<div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
						<p className='text-sm text-blue-800'>
							💡 Primary keys are usually required
						</p>
					</div>
				)}

				{currentColumn.primary &&
					existingColumns.some((col) => col.primary) && (
						<div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
							<p className='text-sm text-red-800'>
								⚠️ This table already has a primary key. Only one primary key is
								allowed per table.
							</p>
						</div>
					)}

				{currentColumn.type === "reference" &&
					!currentColumn.referenceTableId && (
						<div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
							<p className='text-sm text-amber-800'>
								⚠️ Please select a reference table for this column
							</p>
						</div>
					)}

				{currentColumn.type === "reference" &&
					tables &&
					tables.filter(
						(table) =>
							table.columns && table.columns.some((col) => col.primary),
					).length === 0 && (
						<div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
							<p className='text-sm text-blue-800'>
								💡 No tables with primary keys available for reference. Tables
								must have a primary key defined before they can be referenced.
							</p>
						</div>
					)}

				<div className='flex justify-end space-x-3 pt-4'>
					<Button
						type='button'
						variant='outline'
						onClick={() => setNewColumn(null)}
						className='px-6'>
						Cancel
					</Button>
					<Button type='submit' disabled={!isFormValid} className='px-6'>
						Add Column
					</Button>
				</div>
			</form>
		</div>
	);
}
