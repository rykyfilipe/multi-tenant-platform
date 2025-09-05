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
import { SemanticTypeSelector } from "@/components/ui/semantic-type-selector";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
	newColumn: CreateColumnRequest | null;
	setNewColumn: (col: CreateColumnRequest | null) => void;
	onAdd: (e: FormEvent) => void;
	tables: Table[] | null;
	existingColumns?: Column[];
	isSubmitting?: boolean;
} // Props interface with submitting state

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
	isSubmitting = false,
}: Props) {
	const [newOption, setNewOption] = useState("");
	const { t } = useLanguage();

	const currentColumn = useMemo(() => {
		const column = {
			name: newColumn?.name || "",
			type: newColumn?.type || USER_FRIENDLY_COLUMN_TYPES.text,
			semanticType: newColumn?.semanticType || "",
			required: newColumn?.required || false,
			primary: newColumn?.primary || false,
			referenceTableId: newColumn?.referenceTableId || undefined,
			customOptions: newColumn?.customOptions || [],
			order: newColumn?.order || 0,
		};

		return column;
	}, [newColumn]);

	const updateColumn = useCallback(
		(key: keyof CreateColumnRequest, value: any) => {
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
							t("columnTypes.categories.vintage"),
							t("columnTypes.categories.handmade"),
							t("columnTypes.categories.digitalProducts"),
						];
						break;

					case "product_brand":
						columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
						customOptions = t("columnTypes.brands").split(", ");
						break;

					case "invoice_payment_method":
						columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
						customOptions = [
							"Credit Card",
							"Debit Card",
							"Bank Transfer",
							"Cash",
							"Check",
							"PayPal",
							"Stripe",
							"Apple Pay",
							"Google Pay",
							"Cryptocurrency",
							"Wire Transfer",
							"ACH",
							"Money Order",
							"Cashier's Check",
						];
						break;

					case "invoice_payment_terms":
						columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
						customOptions = [
							"Net 30",
							"Net 60",
							"Net 90",
							"Due on Receipt",
							"Net 15",
							"Net 45",
							"Net 120",
							"2/10 Net 30",
							"1/10 Net 30",
							"Net 7",
							"Net 14",
							"Net 21",
							"Net 45",
							"Net 75",
							"Net 100",
						];
						break;

					case "yesNo":
					case "boolean":
						columnType = USER_FRIENDLY_COLUMN_TYPES.yesNo;
						break;

					case "product_image":
						columnType = USER_FRIENDLY_COLUMN_TYPES.text;
						break;

					case "customer_country":
					case "company_country":
						columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
						customOptions = [
							"United States",
							"Canada",
							"United Kingdom",
							"Germany",
							"France",
							"Italy",
							"Spain",
							"Netherlands",
							"Belgium",
							"Switzerland",
							"Austria",
							"Sweden",
							"Norway",
							"Denmark",
							"Finland",
							"Poland",
							"Czech Republic",
							"Hungary",
							"Romania",
							"Bulgaria",
							"Greece",
							"Portugal",
							"Ireland",
							"Luxembourg",
							"Slovakia",
							"Slovenia",
							"Croatia",
							"Estonia",
							"Latvia",
							"Lithuania",
							"Malta",
							"Cyprus",
							"Australia",
							"New Zealand",
							"Japan",
							"South Korea",
							"China",
							"India",
							"Brazil",
							"Mexico",
							"Argentina",
							"Chile",
							"Colombia",
							"Peru",
							"Venezuela",
							"Uruguay",
							"Paraguay",
							"Ecuador",
							"Bolivia",
						];
						break;

					case "customer_city":
					case "company_city":
						columnType = USER_FRIENDLY_COLUMN_TYPES.customArray;
						customOptions = [
							"New York",
							"Los Angeles",
							"Chicago",
							"Houston",
							"Phoenix",
							"Philadelphia",
							"San Antonio",
							"San Diego",
							"Dallas",
							"San Jose",
							"Austin",
							"Jacksonville",
							"Fort Worth",
							"Columbus",
							"Charlotte",
							"San Francisco",
							"Indianapolis",
							"Seattle",
							"Denver",
							"Washington",
							"Boston",
							"El Paso",
							"Nashville",
							"Detroit",
							"Oklahoma City",
							"Portland",
							"Las Vegas",
							"Memphis",
							"Louisville",
							"Baltimore",
							"London",
							"Paris",
							"Berlin",
							"Madrid",
							"Rome",
							"Amsterdam",
							"Brussels",
							"Vienna",
							"Zurich",
							"Stockholm",
							"Oslo",
							"Copenhagen",
							"Helsinki",
							"Warsaw",
							"Prague",
							"Budapest",
							"Bucharest",
							"Sofia",
						];
						break;

					case "product_weight":
					case "product_dimensions":
					case "product_price":
					case "product_sku":
					case "unit_price":
					case "total_price":
					case "tax_amount":
					case "discount_amount":
					case "invoice_total":
					case "invoice_subtotal":
					case "invoice_tax":
					case "invoice_discount":
					case "invoice_late_fee":
					case "quantity":
					case "tax_rate":
					case "discount_rate":
					case "amount":
					case "price":
						columnType = USER_FRIENDLY_COLUMN_TYPES.number;
						break;

					case "invoice_date":
					case "invoice_due_date":
					case "date":
						columnType = USER_FRIENDLY_COLUMN_TYPES.date;
						break;

					case "customer_email":
					case "email":
						columnType = USER_FRIENDLY_COLUMN_TYPES.text;
						break;

					case "customer_phone":
					case "phone":
						columnType = USER_FRIENDLY_COLUMN_TYPES.text;
						break;

					case "customer_address":
					case "customer_street":
					case "customer_street_number":
					case "customer_postal_code":
					case "company_address":
					case "company_street":
					case "company_street_number":
					case "company_postal_code":
					case "company_iban":
					case "company_bic":
					case "company_bank":
					case "address":
						columnType = USER_FRIENDLY_COLUMN_TYPES.text;
						break;

					case "customer_tax_id":
					case "customer_registration_number":
					case "company_tax_id":
					case "company_registration_number":
					case "tax_id":
					case "registration_number":
						columnType = USER_FRIENDLY_COLUMN_TYPES.text;
						break;

					case "product_name":
					case "product_description":
					case "customer_name":
					case "company_name":
					case "invoice_number":
					case "invoice_series":
					case "invoice_notes":
					case "name":
					case "description":
					case "code":
					case "id":
					case "reference":
					case "notes":
					case "comments":
					default:
						columnType = USER_FRIENDLY_COLUMN_TYPES.text;
						break;
				}

				setNewColumn({
					name: newColumn?.name || "",
					type: columnType,
					semanticType: value,
					required: newColumn?.required || false,
					primary: newColumn?.primary || false,
					referenceTableId: newColumn?.referenceTableId || undefined,
					customOptions: customOptions,
					order: newColumn?.order || 0,
				});
			} else {
				setNewColumn({
					name: newColumn?.name || "",
					type: newColumn?.type || USER_FRIENDLY_COLUMN_TYPES.text,
					semanticType: newColumn?.semanticType || "",
					required: newColumn?.required || false,
					primary: newColumn?.primary || false,
					referenceTableId: newColumn?.referenceTableId || undefined,
					customOptions: newColumn?.customOptions || [],
					order: newColumn?.order || 0,
					[key]: value,
				});
			}
		},
		[setNewColumn, newColumn, t],
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
	}, [newOption, updateColumn, currentColumn.customOptions]);

	const handleRemoveCustomOption = useCallback(
		(index: number) => {
			if (currentColumn.customOptions) {
				const updatedOptions = currentColumn.customOptions.filter(
					(_, i) => i !== index,
				);
				updateColumn("customOptions", updatedOptions);
			}
		},
		[updateColumn, currentColumn.customOptions],
	);

	const renderBooleanField = useCallback(
		(field: FieldMeta) => {
			const value = currentColumn[field.key] as boolean;

			// Check if this is the primary key field and if another column is already primary
			const isPrimaryKeyField = field.key === "primary";
			const hasExistingPrimaryKey = existingColumns.some((col) => col.primary);
			const isDisabled = isPrimaryKeyField && hasExistingPrimaryKey && !value;

			return (
				<div key={field.key} className='space-y-2'>
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
		[existingColumns, handleBooleanChange, currentColumn],
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
		[updateColumn, currentColumn],
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
		[handleStringChange, currentColumn],
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

					{currentColumn.customOptions &&
						currentColumn.customOptions.length > 0 && (
							<div className='space-y-2'>
								<p className='text-xs text-muted-foreground'>Added options:</p>
								<div className='flex flex-wrap gap-2'>
									{currentColumn.customOptions.map((option, index) => (
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
		currentColumn.customOptions,
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
		if (currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.link && tables) {
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
	}, [currentColumn.type, tables, t]);

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

	if (!tables) return null;

	return (
		<div className='space-y-6'>
			<div className='text-center'>
				<h3 className='text-lg font-semibold text-foreground mb-2'>
					{t("column.createNewColumn")}
				</h3>
				<p className='text-sm text-muted-foreground'>
					{t("column.defineColumnPropertiesAndConstraints")}
				</p>
			</div>

			<form onSubmit={onAdd} className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{columnSchemaMeta.map(renderField)}
				</div>

				{/* Semantic Type Selector */}
				<div className='col-span-2'>
					<SemanticTypeSelector
						value={currentColumn.semanticType}
						onChange={(value) => updateColumn("semanticType", value)}
						placeholder='Choose what this column represents (optional)...'
						variant='compact'
					/>
				</div>

				{/* Semantic Type Auto-configuration Notifications */}
				{currentColumn.semanticType && (
					<div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
						<div className='flex items-center gap-2'>
							<CheckCircle2 className='w-4 h-4 text-green-600' />
							<div className='text-sm text-green-800'>
								<strong>Column Auto-configured:</strong> Based on the semantic
								type "
								{COLUMN_TYPE_LABELS[
									currentColumn.semanticType as keyof typeof COLUMN_TYPE_LABELS
								] || currentColumn.semanticType}
								", the column has been automatically configured:
								<ul className='mt-2 ml-4 list-disc space-y-1'>
									<li>
										<strong>Type:</strong>{" "}
										{COLUMN_TYPE_LABELS[
											currentColumn.type as keyof typeof COLUMN_TYPE_LABELS
										] || currentColumn.type}
									</li>
									{currentColumn.type ===
										USER_FRIENDLY_COLUMN_TYPES.customArray &&
										currentColumn.customOptions &&
										currentColumn.customOptions.length > 0 && (
											<li>
												<strong>Options:</strong>{" "}
												{currentColumn.customOptions.length} predefined options
												available
											</li>
										)}
									{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.number && (
										<li>
											<strong>Format:</strong> Numeric input with validation
										</li>
									)}
									{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.date && (
										<li>
											<strong>Format:</strong> Date picker with calendar
											interface
										</li>
									)}
									{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.text && (
										<li>
											<strong>Format:</strong> Free text input
										</li>
									)}
									{currentColumn.type === USER_FRIENDLY_COLUMN_TYPES.yesNo && (
										<li>
											<strong>Format:</strong> Yes/No dropdown selection
										</li>
									)}
								</ul>
							</div>
						</div>
					</div>
				)}

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
					(!currentColumn.customOptions ||
						currentColumn.customOptions.length === 0) && (
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
							table &&
							table.columns &&
							Array.isArray(table.columns) &&
							table.columns.length > 0 &&
							// Exclude arrays filled with null values (from backward compatibility)
							table.columns.some(
								(col) => col && typeof col === "object" && col.primary,
							),
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
						{t("column.cancel")}
					</Button>
					<Button
						type='submit'
						disabled={!isFormValid || isSubmitting}
						className='px-6'>
						{isSubmitting ? (
							<>
								<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
								{t("column.adding")}
							</>
						) : (
							t("column.addColumn")
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
