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
		// Special handling for semantic types - auto-configure column type and options
		if (key === "semanticType" && value) {
			let columnType: (typeof USER_FRIENDLY_COLUMN_TYPES)[keyof typeof USER_FRIENDLY_COLUMN_TYPES] =
				USER_FRIENDLY_COLUMN_TYPES.text;
			let customOptions: string[] = [];

			// Auto-configure column type and options based on semantic type
			switch (value) {
				case "currency":
				case "invoice_currency":
				case "invoice_base_currency":
					columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
					customOptions = t("columnTypes.currencies").split(", ");
					break;

				case "product_status":
				case "invoice_status":
				case "status":
					columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
					customOptions = [
						t("columnTypes.status.active"),
						t("columnTypes.status.inactive"),
						t("columnTypes.status.draft"),
						t("columnTypes.status.published"),
						t("columnTypes.status.archived"),
						t("columnTypes.status.pending"),
						t("columnTypes.status.completed"),
						t("columnTypes.status.cancelled"),
					];
					break;

				case "product_category":
					columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
					customOptions = [
						t("columnTypes.categories.electronics"),
						t("columnTypes.categories.clothing"),
						t("columnTypes.categories.books"),
						t("columnTypes.categories.homeGarden"),
						t("columnTypes.categories.sports"),
						t("columnTypes.categories.automotive"),
						t("columnTypes.categories.healthBeauty"),
						t("columnTypes.categories.toysGames"),
						t("columnTypes.categories.foodBeverages"),
						t("columnTypes.categories.jewelry"),
						t("columnTypes.categories.toolsHardware"),
						t("columnTypes.categories.petSupplies"),
						t("columnTypes.categories.officeSupplies"),
						t("columnTypes.categories.babyProducts"),
						t("columnTypes.categories.gardenOutdoor"),
						t("columnTypes.categories.music"),
						t("columnTypes.categories.movies"),
						t("columnTypes.categories.art"),
						t("columnTypes.categories.collectibles"),
						t("columnTypes.categories.antiques"),
					];
					break;

				case "product_price":
				case "price":
				case "amount":
				case "unit_price":
				case "total_price":
				case "tax_amount":
				case "discount_amount":
					columnType = USER_FRIENDLY_COLUMN_TYPES.number;
					break;

				case "product_vat":
				case "tax_rate":
				case "discount_rate":
					columnType = USER_FRIENDLY_COLUMN_TYPES.number;
					break;

				case "quantity":
					columnType = USER_FRIENDLY_COLUMN_TYPES.number;
					break;

				case "invoice_date":
				case "invoice_due_date":
				case "date":
					columnType = USER_FRIENDLY_COLUMN_TYPES.date;
					break;

				case "product_name":
				case "customer_name":
				case "name":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "product_description":
				case "description":
				case "notes":
				case "comments":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "email":
				case "customer_email":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "phone":
				case "customer_phone":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "address":
				case "customer_address":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "city":
				case "customer_city":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "country":
				case "customer_country":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "postal_code":
				case "customer_postal_code":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "tax_id":
				case "customer_tax_id":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "registration_number":
				case "customer_registration_number":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "street":
				case "customer_street":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "street_number":
				case "customer_street_number":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "iban":
				case "company_iban":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "bic":
				case "company_bic":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "bank":
				case "company_bank":
					columnType = USER_FRIENDLY_COLUMN_TYPES.text;
					break;

				case "unit_of_measure":
					columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
					customOptions = [
						t("columnTypes.units.piece"),
						t("columnTypes.units.kg"),
						t("columnTypes.units.gram"),
						t("columnTypes.units.liter"),
						t("columnTypes.units.meter"),
						t("columnTypes.units.cm"),
						t("columnTypes.units.mm"),
						t("columnTypes.units.hour"),
						t("columnTypes.units.day"),
						t("columnTypes.units.week"),
						t("columnTypes.units.month"),
						t("columnTypes.units.year"),
					];
					break;

				default:
					// Keep current type for unknown semantic types
					columnType = (editedColumn.type as (typeof USER_FRIENDLY_COLUMN_TYPES)[keyof typeof USER_FRIENDLY_COLUMN_TYPES]) || USER_FRIENDLY_COLUMN_TYPES.text;
					break;
			}

			// Update the column with the new type and options
			setEditedColumn((prev) => ({
				...prev,
				[key]: value,
				type: columnType,
				customOptions: customOptions,
			}));
			return;
		}

		setEditedColumn((prev) => ({
			...prev,
			[key]: value,
		}));
	}, [t, editedColumn.type]);

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
