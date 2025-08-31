/** @format */

"use client";

import { FormEvent, useCallback, useMemo, useEffect, memo } from "react";
import { CellSchema, Column, Row, Table } from "@/types/database";
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
} from "@/lib/columnTypes";
import { SearchableReferenceSelect } from "./SearchableReferenceSelect";
import { MultipleReferenceSelect } from "./MultipleReferenceSelect";
import { useOptimizedReferenceData } from "@/hooks/useOptimizedReferenceData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Info, AlertCircle, AlertTriangle, Database } from "lucide-react";

interface Props {
	columns: Column[];
	onAdd: (e: FormEvent) => void;
	cells: CellSchema[];
	setCells: (cells: CellSchema[]) => void;
	tables: Table[] | null;
	serverError?: string | null; // Add server error prop
	isSubmitting?: boolean; // Add submitting state prop
}

// Type validation utilities
const validateCellValue = (
	value: string | string[],
	type: string,
	column?: Column,
): boolean => {
	switch (type) {
		case USER_FRIENDLY_COLUMN_TYPES.number:
			return (
				typeof value === "string" &&
				!isNaN(Number(value)) &&
				value.trim() !== ""
			);
		case USER_FRIENDLY_COLUMN_TYPES.yesNo:
			return (
				typeof value === "string" &&
				["true", "false"].includes(value.toLowerCase())
			);
		case USER_FRIENDLY_COLUMN_TYPES.date:
			return typeof value === "string" && !isNaN(Date.parse(value));
		case USER_FRIENDLY_COLUMN_TYPES.link:
			// For reference columns, always check if array has values (always multiple)
			return Array.isArray(value) && value.length > 0;
		case USER_FRIENDLY_COLUMN_TYPES.customArray:
			// Pentru customArray, verificăm că valoarea există în opțiunile definite
			if (column?.customOptions && column.customOptions.length > 0) {
				return (
					typeof value === "string" && column.customOptions.includes(value)
				);
			}
			return false; // Dacă nu sunt opțiuni definite, nu este valid
		case USER_FRIENDLY_COLUMN_TYPES.text:
		default:
			return true;
	}
};

const formatCellValue = (value: any, type: string, column?: Column): any => {
	switch (type) {
		case USER_FRIENDLY_COLUMN_TYPES.number:
			return Number(value);
		case USER_FRIENDLY_COLUMN_TYPES.yesNo:
			return value.toLowerCase() === "true";
		case USER_FRIENDLY_COLUMN_TYPES.date:
			return new Date(value).toISOString();
		case USER_FRIENDLY_COLUMN_TYPES.link:
			// For reference columns, ensure we return an array (always multiple)
			if (!Array.isArray(value)) {
				return value ? [value] : [];
			}
			return value; // Pentru coloanele de tip reference, păstrăm valoarea originală
		case USER_FRIENDLY_COLUMN_TYPES.customArray:
			return String(value); // Pentru customArray, păstrăm ca string
		case USER_FRIENDLY_COLUMN_TYPES.text:
		default:
			return value;
	}
};

const formatDateForInput = (value: string | string[]): string => {
	if (Array.isArray(value) || !value) return "";
	try {
		return new Date(value).toISOString().slice(0, 16);
	} catch {
		return "";
	}
};

export default memo(function AddRowForm({
	columns,
	onAdd,
	cells,
	setCells,
	tables,
	serverError,
	isSubmitting,
}: Props) {
	const { t } = useLanguage();
	const {
		referenceData,
		isLoading: isReferenceDataLoading,
		error: referenceDataError,
	} = useOptimizedReferenceData(tables);

	// Get cell value for a specific column
	const getCellValue = useCallback(
		(columnId: string) => {
			const cell = cells.find((c) => c.columnId === columnId);
			return cell?.value || "";
		},
		[cells],
	);

	// Update cell value
	const updateCell = useCallback(
		(columnId: string, value: any) => {
			setCells((prev) => {
				const existingIndex = prev.findIndex((c) => c.columnId === columnId);
				if (existingIndex >= 0) {
					// Update existing cell
					const updated = [...prev];
					updated[existingIndex] = { ...updated[existingIndex], value };
					return updated;
				} else {
					// Add new cell
					return [...prev, { columnId, value }];
				}
			});
		},
		[setCells],
	);

	// Form validation
	const formValidation = useMemo(() => {
		const errors: string[] = [];

		// Add server error if present
		if (serverError) {
			errors.push(serverError);
		}

		// Validate each column
		columns?.forEach((col) => {
			const cellValue = getCellValue(col.id);
			if (
				col.required &&
				(!cellValue || (Array.isArray(cellValue) && cellValue.length === 0))
			) {
				errors.push(`${col.name} is required`);
			} else if (cellValue && !validateCellValue(cellValue, col.type, col)) {
				errors.push(`${col.name} must be a valid ${col.type}`);
			}
		});

		return {
			isValid: errors.length === 0,
			errors,
		};
	}, [columns, getCellValue, serverError]);

	// Render field based on column type
	const renderField = useCallback(
		(column: Column) => {
			const cellValue =
				cells.find((c) => c.columnId === column.id)?.value || "";
			const hasError = formValidation.errors.some((error) =>
				error.toLowerCase().includes(column.name.toLowerCase()),
			);

			const divClassName = "space-y-3";
			const commonLabelJSX = (
				<div className='space-y-2'>
					<label className='text-sm font-medium text-foreground flex items-center gap-2'>
						{column.name}
						{column.isRequired && (
							<span className='text-destructive text-xs font-medium px-1.5 py-0.5 bg-destructive/10 rounded'>
								Required
							</span>
						)}
						{column.description && (
							<div className='group relative'>
								<Info className='w-4 h-4 text-muted-foreground hover:text-foreground cursor-help transition-colors' />
								<div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
									{column.description}
									<div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground'></div>
								</div>
							</div>
						)}
					</label>
					{column.description && (
						<p className='text-xs text-muted-foreground leading-relaxed'>
							{column.description}
						</p>
					)}
				</div>
			);

			switch (column.type) {
				case "text":
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Input
								value={typeof cellValue === "string" ? cellValue : ""}
								onChange={(e) => updateCell(column.id, e.target.value)}
								placeholder={`Enter ${column.name.toLowerCase()}...`}
								className={`w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
									hasError
										? "border-destructive ring-destructive/20"
										: "border-border/50 hover:border-border"
								}`}
							/>
							{hasError && (
								<div className='flex items-center gap-2 text-xs text-destructive'>
									<AlertCircle className='w-3 h-3' />
									This field has validation errors
								</div>
							)}
						</div>
					);

				case "boolean":
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Select
								value={typeof cellValue === "string" ? cellValue : ""}
								onValueChange={(val) => updateCell(column.id, val)}>
								<SelectTrigger
									className={`w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
										hasError
											? "border-destructive ring-destructive/20"
											: "border-border/50 hover:border-border"
									}`}>
									<SelectValue placeholder='Select a value...' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='false'>
										<div className='flex items-center gap-2'>
											<div className='w-2 h-2 bg-red-500 rounded-full'></div>
											False
										</div>
									</SelectItem>
									<SelectItem value='true'>
										<div className='flex items-center gap-2'>
											<div className='w-2 h-2 bg-green-500 rounded-full'></div>
											True
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					);

				case "number":
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Input
								type='number'
								value={typeof cellValue === "string" ? cellValue : ""}
								onChange={(e) => updateCell(column.id, e.target.value)}
								placeholder={`Enter ${column.name.toLowerCase()}...`}
								className={`w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
									hasError
										? "border-destructive ring-destructive/20"
										: "border-border/50 hover:border-border"
								}`}
								step='any'
							/>
						</div>
					);

				case "date":
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Input
								type='datetime-local'
								value={formatDateForInput(cellValue)}
								onChange={(e) => updateCell(column.id, e.target.value)}
								placeholder={`Select ${column.name.toLowerCase()}...`}
								className={`w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
									hasError
										? "border-destructive ring-destructive/20"
										: "border-border/50 hover:border-border"
								}`}
							/>
						</div>
					);

				case "reference":
					if (!column.referenceTableId) {
						return (
							<div key={`field-${column.id}`} className={divClassName}>
								{commonLabelJSX}
								<div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
									<div className='flex items-start gap-3'>
										<AlertTriangle className='w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0' />
										<div>
											<h4 className='text-sm font-medium text-amber-800 mb-1'>
												Reference table not configured
											</h4>
											<p className='text-xs text-amber-700'>
												This column references another table that hasn't been
												set up yet.
											</p>
										</div>
									</div>
								</div>
							</div>
						);
					}

					const options = referenceData[column.referenceTableId] ?? [];
					const referencedTable = tables?.find(
						(t) => t.id === column.referenceTableId,
					);

					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<MultipleReferenceSelect
								value={Array.isArray(cellValue) ? cellValue : []}
								onValueChange={(val) => updateCell(column.id, val as string[])}
								options={options}
								placeholder={`Select ${
									referencedTable?.name || "references"
								}...`}
								hasError={hasError}
								referencedTableName={referencedTable?.name}
								isMultiple={true}
								className='w-full'
								isLoading={isReferenceDataLoading}
								loadingError={referenceDataError}
								onValidationChange={(isValid, invalidCount) => {
									// Handle validation if needed
								}}
							/>

							{/* Reference table info */}
							<div className='flex items-center gap-2 text-xs text-muted-foreground'>
								<Database className='w-3 h-3' />
								<span>
									{referencedTable?.name || "Unknown table"} • {options.length}{" "}
									options available
								</span>
							</div>
						</div>
					);

				case "customArray":
					if (!column.customOptions || column.customOptions.length === 0) {
						return (
							<div key={`field-${column.id}`} className={divClassName}>
								{commonLabelJSX}
								<div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
									<div className='flex items-start gap-3'>
										<AlertTriangle className='w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0' />
										<div>
											<h4 className='text-sm font-medium text-amber-800 mb-1'>
												No custom options defined
											</h4>
											<p className='text-xs text-amber-700'>
												This column needs custom options to be configured first.
											</p>
										</div>
									</div>
								</div>
							</div>
						);
					}

					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Select
								value={typeof cellValue === "string" ? cellValue : ""}
								onValueChange={(val) => updateCell(column.id, val)}>
								<SelectTrigger
									className={`w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
										hasError
											? "border-destructive ring-destructive/20"
											: "border-border/50 hover:border-border"
									}`}>
									<SelectValue
										placeholder={`Select ${column.name.toLowerCase()}...`}
									/>
								</SelectTrigger>
								<SelectContent>
									{column.customOptions.map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					);

				default:
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Input
								value={typeof cellValue === "string" ? cellValue : ""}
								onChange={(e) => updateCell(column.id, e.target.value)}
								placeholder={`Enter ${column.name.toLowerCase()}...`}
								className={`w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
									hasError
										? "border-destructive ring-destructive/20"
										: "border-border/50 hover:border-border"
								}`}
							/>
						</div>
					);
			}
		},
		[
			cells,
			updateCell,
			formValidation.errors,
			referenceData,
			tables,
			isReferenceDataLoading,
			referenceDataError,
		],
	);

	// Enhanced form submit handler
	const handleSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault();

			// Format cell values according to their types
			const formattedCells = cells.map((cell) => {
				const column = columns?.find((col) => col.id === cell.columnId);
				if (column) {
					return {
						...cell,
						value: formatCellValue(cell.value, column.type, column),
					};
				}
				return cell;
			});

			// Update cells with formatted values
			setCells(formattedCells);

			// Call parent submit handler
			onAdd(e);
		},
		[cells, columns, setCells, onAdd],
	);

	// Clear form handler
	const handleClear = useCallback(() => {
		setCells([]);
	}, [setCells]);

	// Loading state
	if (!tables) {
		return (
			<Card className='shadow-lg border-0 bg-gradient-to-br from-background to-muted/20'>
				<CardContent className='flex items-center justify-center p-8'>
					<div className='text-muted-foreground'>
						{t("table.addRow.loadingTables")}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='shadow-lg border-0 bg-gradient-to-br from-background to-muted/20'>
			<CardHeader className='pb-4'>
				<CardTitle className='text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>
					{t("table.addRow.createNewRow")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-6'>
					{/* Form Fields */}
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{columns?.map(renderField) || (
							<div className='col-span-full text-center text-muted-foreground'>
								{t("table.addRow.noColumnsAvailable")}
							</div>
						)}
					</div>

					{/* Validation Errors - only show when there's a server error */}
					{serverError && formValidation.errors.length > 0 && (
						<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
							<p className='text-sm font-medium text-destructive mb-2'>
								{t("table.addRow.pleaseFixErrors")}:
							</p>
							<ul className='text-sm text-destructive-foreground space-y-1'>
								{formValidation.errors.map((error, index) => (
									<li key={index} className='flex items-start gap-2'>
										<span className='text-destructive'>•</span>
										{error}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Form Actions */}
					<div className='flex justify-end space-x-3 pt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={handleClear}
							disabled={cells.length === 0}>
							{t("table.addRow.clear")}
						</Button>
						<Button
							type='submit'
							disabled={!columns?.length || isSubmitting}
							className='min-w-[120px]'>
							{isSubmitting ? (
								<>
									<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
									{t("table.addRow.adding")}
								</>
							) : (
								t("table.addRow.addRow")
							)}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
});
