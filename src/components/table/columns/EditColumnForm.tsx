/** @format */
"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Column, Table } from "@/types/database";
import { Button } from "../../ui/button";
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
	PROPERTY_LABELS,
} from "@/lib/columnTypes";
import { X, Plus } from "lucide-react";
import { SemanticTypeSelector } from "@/components/ui/semantic-type-selector";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
	column: Column;
	onSave: (updatedColumn: Partial<Column>) => void;
	onCancel: () => void;
	tables: Table[] | null;
	existingColumns: Column[];
	isSubmitting?: boolean;
}

type FieldType = "string" | "boolean" | readonly string[];

interface FieldMeta {
	key: keyof Column;
	type: FieldType;
	required: boolean;
	label: string;
	placeholder?: string;
	referenceOptions?: { value: number | string; label: string }[];
}

export default function EditColumnForm({
	column,
	onSave,
	onCancel,
	tables,
	existingColumns = [],
	isSubmitting = false,
}: Props) {
	const [newOption, setNewOption] = useState("");
	const { t } = useLanguage();

	const [editedColumn, setEditedColumn] = useState<Partial<Column>>({
		name: column.name,
		type: column.type,
		semanticType: column.semanticType,
		required: column.required,
		primary: column.primary,
		referenceTableId: column.referenceTableId,
		customOptions: column.customOptions || [],
	});

	const updateColumn = useCallback((key: keyof Column, value: any) => {
		setEditedColumn((prev) => ({
			...prev,
			[key]: value,
		}));
	}, []);

	const handleBooleanChange = useCallback(
		(key: keyof Column, value: string) => {
			updateColumn(key, value === "true");
		},
		[updateColumn],
	);

	const handleStringChange = useCallback(
		(key: keyof Column, value: string) => {
			updateColumn(key, value);
		},
		[updateColumn],
	);

	const handleAddCustomOption = useCallback(() => {
		if (newOption.trim() && editedColumn.customOptions) {
			const updatedOptions = [...editedColumn.customOptions, newOption.trim()];
			updateColumn("customOptions", updatedOptions);
			setNewOption("");
		}
	}, [newOption, updateColumn, editedColumn.customOptions]);

	const handleRemoveCustomOption = useCallback(
		(index: number) => {
			if (editedColumn.customOptions) {
				const updatedOptions = editedColumn.customOptions.filter(
					(_, i) => i !== index,
				);
				updateColumn("customOptions", updatedOptions);
			}
		},
		[updateColumn, editedColumn.customOptions],
	);

	const renderBooleanField = useCallback(
		(field: FieldMeta) => {
			const value = editedColumn[field.key] as boolean;

			// Check if this is the primary key field and if another column is already primary
			const isPrimaryKeyField = field.key === "primary";
			const hasExistingPrimaryKey = existingColumns.some(
				(col) => col.id !== column.id && col.primary,
			);
			const isDisabled = isPrimaryKeyField && hasExistingPrimaryKey && !value;

			return (
				<div key={String(field.key)} className='space-y-2'>
					<Label className='text-sm font-medium'>
						{field.label}
						{field.required && <span className='text-destructive ml-1'>*</span>}
					</Label>
					<Select
						value={String(value)}
						onValueChange={(val) => handleBooleanChange(field.key, val)}
						disabled={isDisabled}>
						<SelectTrigger
							className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}>
							<SelectValue placeholder='Select option' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='false'>False</SelectItem>
							<SelectItem value='true' disabled={isDisabled}>
								True
							</SelectItem>
						</SelectContent>
					</Select>
					{isDisabled && (
						<p className='text-xs text-muted-foreground'>
							⚠️ Another column is already set as primary key. Only one primary
							key is allowed per table.
						</p>
					)}
				</div>
			);
		},
		[existingColumns, handleBooleanChange, editedColumn, column.id],
	);

	const renderEnumField = useCallback(
		(field: FieldMeta) => {
			const value = editedColumn[field.key] as string;
			const options =
				field.referenceOptions ?? (field.type as readonly string[]);

			return (
				<div key={String(field.key)} className='space-y-2'>
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
		[updateColumn, editedColumn],
	);

	const renderStringField = useCallback(
		(field: FieldMeta) => {
			const value = editedColumn[field.key] as string;

			return (
				<div key={String(field.key)} className='space-y-2'>
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
		[handleStringChange, editedColumn],
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
								if (e.key === "Enter") {
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
							disabled={!newOption.trim()}>
							<Plus className='w-4 h-4' />
						</Button>
					</div>

					{editedColumn.customOptions &&
						editedColumn.customOptions.length > 0 && (
							<div className='space-y-2'>
								<p className='text-xs text-muted-foreground'>Added options:</p>
								<div className='flex flex-wrap gap-2'>
									{editedColumn.customOptions.map((option, index) => (
										<div
											key={index}
											className='flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm'>
											<span>{option}</span>
											<button
												type='button'
												onClick={() => handleRemoveCustomOption(index)}
												className='text-muted-foreground hover:text-destructive'>
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
	}, [
		newOption,
		handleAddCustomOption,
		handleRemoveCustomOption,
		editedColumn.customOptions,
	]);

	const columnSchemaMeta: FieldMeta[] = useMemo(() => {
		const base: FieldMeta[] = [
			{
				key: "name",
				type: "string",
				required: true,
				label: t("column.name"),
				placeholder: t("column.enterColumnName"),
			},
			{
				key: "type",
				type: Object.values(USER_FRIENDLY_COLUMN_TYPES) as readonly string[],
				required: true,
				label: t("column.dataType"),
				placeholder: t("column.selectDataType"),
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
		if (editedColumn.type === USER_FRIENDLY_COLUMN_TYPES.link && tables) {
			// Filtrăm tabelele care au cheie primară definită
			const tablesWithPrimaryKey = tables.filter(
				(table) =>
					table &&
					table.columns &&
					Array.isArray(table.columns) &&
					table.columns.length > 0 &&
					// Exclude arrays filled with null values (from backward compatibility)
					table.columns.some(
						(col) => col && typeof col === "object" && col.primary,
					),
			);

			base.push({
				key: "referenceTableId",
				type: tablesWithPrimaryKey.map((t) =>
					t.id.toString(),
				) as readonly string[],
				required: true,
				label: t("column.referenceTable"),
				placeholder: t("column.selectReferenceTable"),
				referenceOptions: tablesWithPrimaryKey.map((t) => ({
					value: t.id,
					label: t.name,
				})),
			});
		}

		return base;
	}, [editedColumn.type, tables, t]);

	const renderField = useCallback(
		(field: FieldMeta) => {
			if (field.type === "boolean") return renderBooleanField(field);
			if (Array.isArray(field.type)) return renderEnumField(field);
			return renderStringField(field);
		},
		[renderBooleanField, renderEnumField, renderStringField],
	);

	const hasAvailableReferenceTables = useMemo(() => {
		return editedColumn.type === USER_FRIENDLY_COLUMN_TYPES.link
			? tables &&
					tables.filter(
						(table) =>
							table &&
							table.columns &&
							Array.isArray(table.columns) &&
							table.columns.length > 0 &&
							// Exclude arrays filled with null values (from backward compatibility)
							table.columns.some(
								(col) => col && typeof col === "object" && col.primary,
							),
					).length > 0
			: true;
	}, [editedColumn.type, tables]);

	const isFormValid = useMemo(() => {
		const hasValidName =
			editedColumn.name && editedColumn.name.trim().length > 0;
		const hasValidType = editedColumn.type && editedColumn.type.length > 0;
		const hasValidReference =
			editedColumn.type === USER_FRIENDLY_COLUMN_TYPES.link
				? editedColumn.referenceTableId !== undefined &&
				  editedColumn.referenceTableId !== null
				: true;
		const hasValidPrimaryKey = !(
			editedColumn.primary &&
			existingColumns.some((col) => col.id !== column.id && col.primary)
		);
		const hasValidCustomOptions =
			editedColumn.type === USER_FRIENDLY_COLUMN_TYPES.customArray
				? editedColumn.customOptions && editedColumn.customOptions.length > 0
				: true;

		return (
			hasValidName &&
			hasValidType &&
			hasValidReference &&
			hasValidPrimaryKey &&
			hasValidCustomOptions &&
			hasAvailableReferenceTables
		);
	}, [editedColumn, existingColumns, column.id, hasAvailableReferenceTables]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (isFormValid) {
			onSave(editedColumn);
		}
	};

	if (!tables) return null;

	return (
		<div className='space-y-6'>
			<div className='text-center'>
				<h3 className='text-lg font-semibold text-foreground mb-2'>
					Edit Column: {column.name}
				</h3>
				<p className='text-sm text-muted-foreground'>
					Modify column properties and constraints
				</p>
			</div>

			<form onSubmit={handleSubmit} className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{columnSchemaMeta.map(renderField)}
				</div>

				{/* Semantic Type Selector */}
				<div className='col-span-2'>
					<SemanticTypeSelector
						value={editedColumn.semanticType || ""}
						onChange={(value) => updateColumn("semanticType", value)}
						placeholder='Choose what this column represents (optional)...'
						variant='compact'
					/>
				</div>

				{/* Custom Options Field for customArray type */}
				{editedColumn.type === USER_FRIENDLY_COLUMN_TYPES.customArray &&
					renderCustomOptionsField()}

				{/* Validation Warnings */}
				{editedColumn.type === USER_FRIENDLY_COLUMN_TYPES.link &&
					!hasAvailableReferenceTables && (
						<div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
							<p className='text-sm text-amber-800'>
								⚠️ No tables with primary keys available for linking
							</p>
						</div>
					)}

				{editedColumn.type === USER_FRIENDLY_COLUMN_TYPES.customArray &&
					(!editedColumn.customOptions ||
						editedColumn.customOptions.length === 0) && (
						<div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
							<p className='text-sm text-amber-800'>
								⚠️ Please add at least one option for the custom dropdown
							</p>
						</div>
					)}

				{editedColumn.primary && editedColumn.required === false && (
					<div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
						<p className='text-sm text-blue-800'>
							💡 Primary keys are usually required
						</p>
					</div>
				)}

				{editedColumn.primary &&
					existingColumns.some(
						(col) => col.id !== column.id && col.primary,
					) && (
						<div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
							<p className='text-sm text-red-800'>
								⚠️ This table already has a primary key. Only one primary key is
								allowed per table.
							</p>
						</div>
					)}

				<div className='flex justify-end space-x-3 pt-4'>
					<Button
						type='button'
						variant='outline'
						onClick={onCancel}
						className='px-6'>
						Cancel
					</Button>
					<Button
						type='submit'
						disabled={!isFormValid || isSubmitting}
						className='px-6'>
						{isSubmitting ? (
							<>
								<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
								Updating...
							</>
						) : (
							"Update Column"
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
