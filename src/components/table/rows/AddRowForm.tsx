/** @format */

"use client";

import { FormEvent, useCallback, useMemo } from "react";
import { CellSchema, Column } from "@/types/database";
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
	columns: Column[];
	onAdd: (e: FormEvent) => void;
	cells: CellSchema[];
	setCells: (cells: CellSchema[]) => void;
}

// Type validation utilities
const validateCellValue = (value: string, type: string): boolean => {
	switch (type) {
		case "number":
			return !isNaN(Number(value)) && value.trim() !== "";
		case "boolean":
			return ["true", "false"].includes(value.toLowerCase());
		case "date":
			return !isNaN(Date.parse(value));
		case "string":
		default:
			return true;
	}
};

const formatCellValue = (value: string, type: string): any => {
	console.log(value);
	switch (type) {
		case "number":
			return Number(value);
		case "boolean":
			return value.toLowerCase() === "true";
		case "date":
			return new Date(value).toISOString();
		case "string":
		default:
			return value;
	}
};

export function AddRowForm({ columns, onAdd, cells, setCells }: Props) {
	// Optimized cell update function
	const updateCell = useCallback(
		(columnId: number, value: string) => {
			console.log(value);

			const updatedCells = cells.filter(
				(cell: CellSchema) => cell.columnId !== columnId,
			);

			if (value.trim() !== "") {
				updatedCells.push({ columnId, value });
			}

			setCells(updatedCells);
		},
		[cells, setCells],
	);

	// Get cell value helper
	const getCellValue = useCallback(
		(columnId: number): string => {
			const cell = cells.find((cell) => cell.columnId === columnId);
			return cell?.value?.toString() ?? "";
		},
		[cells],
	);

	// Form validation
	const formValidation = useMemo(() => {
		const errors: string[] = [];
		const requiredColumns = columns.filter((col) => col.required);

		// Check required fields
		requiredColumns.forEach((col) => {
			const cellValue = getCellValue(col.id);
			if (!cellValue.trim()) {
				errors.push(`${col.name} is required`);
			}
		});

		// Check type validation
		columns.forEach((col) => {
			const cellValue = getCellValue(col.id);
			if (cellValue.trim() && !validateCellValue(cellValue, col.type)) {
				errors.push(`${col.name} must be a valid ${col.type}`);
			}
		});

		return {
			isValid: errors.length === 0,
			errors,
		};
	}, [columns, getCellValue]);

	// Render field based on column type
	const renderField = useCallback(
		(column: Column) => {
			const cellValue = getCellValue(column.id);
			const hasError = formValidation.errors.some((error) =>
				error.includes(column.name),
			);

			const divClassName = `space-y-2`;
			const labelClassName = `text-sm font-medium ${
				hasError ? "text-destructive" : ""
			}`;

			switch (column.type) {
				case "boolean":
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							<Label className={labelClassName}>
								{column.name}
								{column.required && (
									<span className='text-destructive ml-1'>*</span>
								)}
							</Label>
							<Select
								value={cellValue}
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
							<Label className={labelClassName}>
								{column.name}
								{column.required && (
									<span className='text-destructive ml-1'>*</span>
								)}
							</Label>
							<Input
								type='number'
								value={cellValue}
								onChange={(e) => updateCell(column.id, e.target.value)}
								placeholder={`Enter ${column.name.toLowerCase()}`}
								required={column.required}
								className={`w-full ${hasError ? "border-destructive" : ""}`}
								step='any'
							/>
						</div>
					);

				case "date":
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							<Label className={labelClassName}>
								{column.name}
								{column.required && (
									<span className='text-destructive ml-1'>*</span>
								)}
							</Label>
							<Input
								type='datetime-local'
								value={cellValue}
								onChange={(e) => updateCell(column.id, e.target.value)}
								placeholder={`Enter ${column.name.toLowerCase()}`}
								required={column.required}
								className={`w-full ${hasError ? "border-destructive" : ""}`}
							/>
						</div>
					);

				case "string":
				default:
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							<Label className={labelClassName}>
								{column.name}
								{column.required && (
									<span className='text-destructive ml-1'>*</span>
								)}
							</Label>
							<Input
								type='text'
								value={cellValue}
								onChange={(e) => updateCell(column.id, e.target.value)}
								placeholder={`Enter ${column.name.toLowerCase()}`}
								required={column.required}
								className={`w-full ${hasError ? "border-destructive" : ""}`}
							/>
						</div>
					);
			}
		},
		[getCellValue, updateCell, formValidation.errors],
	);

	// Enhanced form submit handler
	const handleSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault();

			if (!formValidation.isValid) {
				return;
			}

			// Format cell values according to their types
			const formattedCells = cells.map((cell) => {
				const column = columns.find((col) => col.id === cell.columnId);
				if (column) {
					return {
						...cell,
						value: formatCellValue(cell.value, column.type),
					};
				}
				return cell;
			});
			// Update cells with formatted values
			setCells(formattedCells);

			// Call parent submit handler
			onAdd(e);
		},
		[formValidation.isValid, cells, columns, setCells, onAdd],
	);

	// Clear form handler
	const handleClear = useCallback(() => {
		setCells([]);
	}, [setCells]);

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
						{columns.map(renderField)}
					</div>

					{/* Validation Errors */}
					{formValidation.errors.length > 0 && (
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
							disabled={!formValidation.isValid || columns.length === 0}
							className='min-w-[120px]'>
							Add Row
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
