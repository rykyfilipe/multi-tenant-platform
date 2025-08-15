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

interface Props {
	columns: Column[];
	onAdd: (e: FormEvent) => void;
	cells: CellSchema[];
	setCells: (cells: CellSchema[]) => void;
	tables: Table[] | null;
	serverError?: string | null; // Add server error prop
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




export const AddRowForm = memo(function AddRowForm({
	columns,
	onAdd,
	cells,
	setCells,
	tables,
	serverError,
}: Props) {
	// Optimizare: pentru coloanele de tip reference, folosim doar tabela referențiată
	const { referenceData } = useOptimizedReferenceData(tables, undefined);


	// Optimized cell update function
	const updateCell = useCallback(
		(columnId: number, value: string | string[]) => {
			const updatedCells = cells.filter(
				(cell: CellSchema) => cell.columnId !== columnId,
			);

			// For reference columns, check if array is empty (always multiple)
			const column = columns.find((col) => col.id === columnId);
			if (column?.type === "reference") {
				if (Array.isArray(value) && value.length > 0) {
					updatedCells.push({ columnId, value });
				}
			} else {
				// For single values, check if string is not empty
				if (typeof value === "string" && value.trim() !== "") {
					updatedCells.push({ columnId, value });
				}
			}

			setCells(updatedCells);
		},
		[cells, setCells, columns],
	);

	// Get cell value helper
	const getCellValue = useCallback(
		(columnId: number): string | string[] => {
			const cell = cells.find((cell) => cell.columnId === columnId);
			if (!cell) return "";

			// For reference columns, return array (always multiple)
			const column = columns.find((col) => col.id === columnId);
			if (column?.type === "reference") {
				if (Array.isArray(cell.value)) {
					return cell.value;
				}
				return cell.value ? [cell.value] : [];
			}

			return cell?.value?.toString() ?? "";
		},
		[cells, columns],
	);

	// Form validation - only show errors when there's a server error
	const formValidation = useMemo(() => {
		const errors: string[] = [];
		const requiredColumns = columns?.filter((col) => col.required) || [];

		// Only validate if there's a server error
		if (serverError) {
			// Check required fields
			requiredColumns.forEach((col) => {
				const cellValue = getCellValue(col.id);
				if (col.type === "reference") {
					// For reference columns, check if array has values (always multiple)
					if (!Array.isArray(cellValue) || cellValue.length === 0) {
						errors.push(`${col.name} is required`);
					}
				} else {
					// For single values, check if string is not empty
					if (typeof cellValue === "string" && !cellValue.trim()) {
						errors.push(`${col.name} is required`);
					}
				}
			});

			// Check type validation
			columns?.forEach((col) => {
				const cellValue = getCellValue(col.id);
				if (col.type === "reference") {
					// Skip validation for reference arrays (always multiple)
					return;
				}
				if (
					typeof cellValue === "string" &&
					cellValue.trim() &&
					!validateCellValue(cellValue, col.type, col)
				) {
					errors.push(`${col.name} must be a valid ${col.type}`);
				}
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}, [columns, getCellValue, serverError]);

	// Render field based on column type
	const renderField = useCallback(
		(column: Column) => {
			if (!column) {
				return null;
			}
			const cellValue = getCellValue(column.id);
			const hasError = formValidation.errors.some((error) =>
				error.includes(column.name),
			);

			const divClassName = `space-y-2`;
			const labelClassName = `text-sm font-medium ${
				hasError ? "text-destructive" : ""
			}`;

			const commonLabelJSX = (
				<Label className={labelClassName}>
					{column.name}
					{column.required && <span className='text-destructive ml-1'>*</span>}
				</Label>
			);

			switch (column.type) {
				case "boolean":
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Select
								value={typeof cellValue === "string" ? cellValue : ""}
								onValueChange={(val) => updateCell(column.id, val)}>
								<SelectTrigger className={hasError ? "border-destructive" : ""}>
									<SelectValue placeholder='Select value' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='false'>False</SelectItem>
									<SelectItem value='true'>True</SelectItem>
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
								placeholder={`Enter ${column.name.toLowerCase()}`}
								className={`w-full ${hasError ? "border-destructive" : ""}`}
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
								placeholder={`Enter ${column.name.toLowerCase()}`}
								className={`w-full ${hasError ? "border-destructive" : ""}`}
							/>
						</div>
					);

				case "reference":
					// Verificăm dacă avem referenceTableId
					if (!column.referenceTableId) {
						return (
							<div key={`field-${column.id}`} className={divClassName}>
								{commonLabelJSX}
								<div className='p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800'>
									⚠️ Reference table not configured for this column
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
								placeholder={`Select ${referencedTable?.name || "references"}`}
								hasError={hasError}
								referencedTableName={referencedTable?.name}
								isMultiple={true}
								className='w-full'
								onValidationChange={(isValid, invalidCount) => {
									// Handle validation if needed
								}}
							/>
							{/* Reference table info */}
							{process.env.NODE_ENV === "development" && (
								<div className='text-xs text-muted-foreground'>
									Table:{" "}
									{referencedTable?.name ||
										`Unknown (ID: ${column.referenceTableId})`}
									, Options: {options.length}, Multiple: Always Enabled
								</div>
							)}
						</div>
					);

				case "customArray":
					// Verificăm dacă avem customOptions
					if (!column.customOptions || column.customOptions.length === 0) {
						return (
							<div key={`field-${column.id}`} className={divClassName}>
								{commonLabelJSX}
								<div className='p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800'>
									⚠️ No custom options defined for this column
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
								<SelectTrigger className={hasError ? "border-destructive" : ""}>
									<SelectValue placeholder='Select an option' />
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

				case "string":
				case "text":
				default:
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Input
								type='text'
								value={typeof cellValue === "string" ? cellValue : ""}
								onChange={(e) => updateCell(column.id, e.target.value)}
								placeholder={`Enter ${column.name.toLowerCase()}`}
								className={`w-full ${hasError ? "border-destructive" : ""}`}
							/>
						</div>
					);
			}
		},
		[getCellValue, updateCell, formValidation.errors, referenceData, tables],
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
					<div className='text-muted-foreground'>Loading tables...</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='shadow-lg border-0 bg-gradient-to-br from-background to-muted/20'>
			<CardHeader className='pb-4'>
				<CardTitle className='text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>
					Create New Row
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-6'>
					{/* Form Fields */}
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{columns?.map(renderField) || (
							<div className='col-span-full text-center text-muted-foreground'>
								No columns available
							</div>
						)}
					</div>

					{/* Validation Errors - only show when there's a server error */}
					{serverError && formValidation.errors.length > 0 && (
						<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
							<p className='text-sm font-medium text-destructive mb-2'>
								Please fix the following errors:
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
							Clear
						</Button>
						<Button
							type='submit'
							disabled={!columns?.length}
							className='min-w-[120px]'>
							Add Row
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
});
