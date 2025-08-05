/** @format */

"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
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
import {
	USER_FRIENDLY_COLUMN_TYPES,
	COLUMN_TYPE_LABELS,
	COLUMN_TYPE_DESCRIPTIONS,
	PROPERTY_LABELS,
	PROPERTY_DESCRIPTIONS,
} from "@/lib/columnTypes";
import { X, Plus } from "lucide-react";

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

	const [newOption, setNewOption] = useState("");

	const currentColumn = useMemo(
		() =>
			newColumn || {
				name: "",
				type: USER_FRIENDLY_COLUMN_TYPES.text,
				required: false,
				primary: false,
				referenceTableId: undefined,
				customOptions: [],
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

	const handleAddCustomOption = useCallback(() => {
		if (newOption.trim() && currentColumn.customOptions) {
			const updatedOptions = [...currentColumn.customOptions, newOption.trim()];
			updateColumn("customOptions", updatedOptions);
			setNewOption("");
		}
	}, [newOption, currentColumn.customOptions, updateColumn]);

	const handleRemoveCustomOption = useCallback((index: number) => {
		if (currentColumn.customOptions) {
			const updatedOptions = currentColumn.customOptions.filter((_, i) => i !== index);
			updateColumn("customOptions", updatedOptions);
		}
	}, [currentColumn.customOptions, updateColumn]);

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
										? COLUMN_TYPE_LABELS[
												option as keyof typeof COLUMN_TYPE_LABELS
										  ] || option.charAt(0).toUpperCase() + option.slice(1)
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

	const renderCustomOptionsField = useCallback(() => {
		return (
			<div className='space-y-3 col-span-2'>
				<Label className='text-sm font-medium'>
					Custom Options
					<span className='text-destructive ml-1'>*</span>
				</Label>
				<div className='space-y-2'>
					<div className='flex gap-2'>
						<Input
							type='text'
							value={newOption}
							onChange={(e) => setNewOption(e.target.value)}
							placeholder='Enter option value'
							className='flex-1'
							onKeyPress={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleAddCustomOption();
								}
							}}
						/>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={handleAddCustomOption}
							disabled={!newOption.trim()}
						>
							<Plus className='w-4 h-4' />
						</Button>
					</div>
					
					{currentColumn.customOptions && currentColumn.customOptions.length > 0 && (
						<div className='space-y-2'>
							<p className='text-xs text-muted-foreground'>Added options:</p>
							<div className='flex flex-wrap gap-2'>
								{currentColumn.customOptions.map((option, index) => (
									<div
										key={index}
										className='flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm'
									>
										<span>{option}</span>
										<button
											type='button'
											onClick={() => handleRemoveCustomOption(index)}
											className='text-muted-foreground hover:text-destructive'
										>
											<X className='w-3 h-3' />
										</button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}, [newOption, currentColumn.customOptions, handleAddCustomOption, handleRemoveCustomOption]);

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
				type: Object.values(USER_FRIENDLY_COLUMN_TYPES) as readonly string[],
				required: true,
				label: "Data Type",
			},
			{
				key: "required",
				type: "boolean",
				required: false,
				label: PROPERTY_LABELS.required,
			},
			{
				key: "primary",
				type: "boolean",
				required: false,
				label: PROPERTY_LABELS.primary,
			},
		];

		// Dacă e de tip "link", adaugă un câmp nou
		if (currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.link) {
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

	const hasAvailableReferenceTables = useMemo(() => {
		return currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.link
			? tables &&
					tables.filter(
						(table) =>
							table.columns && table.columns.some((col) => col.primary),
					).length > 0
			: true;
	}, [currentColumn.type, tables]);

	const isFormValid = useMemo(() => {
		const hasValidName = currentColumn.name.trim().length > 0;
		const hasValidType = currentColumn.type.length > 0;
		const hasValidReference =
			currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.link
				? currentColumn.referenceTableId !== undefined &&
				  currentColumn.referenceTableId !== null
				: true;
		const hasValidPrimaryKey = !(
			currentColumn.primary && existingColumns.some((col) => col.primary)
		);
		const hasValidCustomOptions = 
			currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.customArray
				? currentColumn.customOptions && currentColumn.customOptions.length > 0
				: true;

		return (
			hasValidName &&
			hasValidType &&
			hasValidReference &&
			hasValidPrimaryKey &&
			hasValidCustomOptions &&
			hasAvailableReferenceTables
		);
	}, [currentColumn, existingColumns, hasAvailableReferenceTables]);

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

				{/* Custom Options Field for customArray type */}
				{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.customArray && 
					renderCustomOptionsField()}

				{/* Validation Warnings */}
				{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.link &&
					!hasAvailableReferenceTables && (
						<div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
							<p className='text-sm text-amber-800'>
								⚠️ No tables with primary keys available for linking
							</p>
						</div>
					)}

				{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.customArray &&
					(!currentColumn.customOptions || currentColumn.customOptions.length === 0) && (
						<div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
							<p className='text-sm text-amber-800'>
								⚠️ Please add at least one option for the custom dropdown
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

				{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.link &&
					!currentColumn.referenceTableId && (
						<div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
							<p className='text-sm text-amber-800'>
								⚠️ Please select a table to link to
							</p>
						</div>
					)}

				{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.link &&
					tables &&
					tables.filter(
						(table) =>
							table.columns && table.columns.some((col) => col.primary),
					).length === 0 && (
						<div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
							<p className='text-sm text-blue-800'>
								💡 No tables with primary keys available for linking. Tables
								must have a primary key defined before they can be linked.
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
