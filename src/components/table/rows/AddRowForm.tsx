/** @format */

"use client";

import { FormEvent, useCallback, useMemo } from "react";
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

interface Props {
	columns: Column[];
	onAdd: (e: FormEvent) => void;
	cells: CellSchema[];
	setCells: (cells: CellSchema[]) => void;
	tables: Table[] | null;
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
		case "reference":
			return value.trim() !== "" && !isNaN(Number(value));
		case "string":
		default:
			return true;
	}
};

const formatCellValue = (value: any, type: string): any => {
	switch (type) {
		case "number":
			return Number(value);
		case "boolean":
			return value.toLowerCase() === "true";
		case "date":
			return new Date(value).toISOString();
		case "reference":
			return Number(value);
		case "string":
		default:
			return value;
	}
};

const formatDateForInput = (value: string): string => {
	if (!value) return "";
	try {
		return new Date(value).toISOString().slice(0, 16);
	} catch {
		return value;
	}
};

// Funcție optimizată pentru crearea datelor de referință - afișează tot rândul (compact)
const createReferenceData = (tables: Table[] | null) => {
	const referenceData: Record<number, { id: number; displayValue: string }[]> =
		{};

	if (!tables) return referenceData;

	// Pentru fiecare tabel, creează o listă de opțiuni disponibile
	tables.forEach((table) => {
		const options: { id: number; displayValue: string }[] = [];

		if (Array.isArray(table.rows) && table.rows.length > 0) {
			table.rows.forEach((row) => {
				if (Array.isArray(row.cells) && row.cells.length > 0) {
					// Creează un string cu valorile importante din rând
					const displayParts: string[] = [];

					// Sortează coloanele pentru o afișare consistentă (primary key primul)
					const sortedColumns = [...table.columns].sort((a, b) => {
						if (a.primary && !b.primary) return -1;
						if (!a.primary && b.primary) return 1;
						if (a.autoIncrement && !b.autoIncrement) return -1;
						if (!a.autoIncrement && b.autoIncrement) return 1;
						return a.name.localeCompare(b.name);
					});

					// Ia doar primele 2-3 coloane importante
					const maxColumns =
						table.columns.length > 3 ? 3 : table.columns.length;
					let addedColumns = 0;

					table.columns.forEach((column) => {
						if (addedColumns >= maxColumns) return;

						const cell = row.cells.find((c) => c.columnId === column.id);
						if (cell && cell.value !== undefined && cell.value !== null) {
							const value = cell.value.toString().trim();
							if (value !== "") {
								// Formatează valoarea pentru afișare (mai compact)
								let formattedValue = value;

								// Limitează lungimea valorilor individuale
								if (formattedValue.length > 15) {
									formattedValue = formattedValue.substring(0, 15) + "...";
								}

								// Formatează datele pentru o citire mai ușoară
								if (column.type === "date") {
									try {
										const date = new Date(value);
										formattedValue = date.toLocaleDateString("ro-RO");
									} catch (e) {
										formattedValue = value;
									}
								} else if (column.type === "boolean") {
									formattedValue = value === "true" ? "✓" : "✗";
								}

								// Pentru prima coloană (de obicei ID), nu pune numele coloanei
								if (addedColumns === 0 && column.primary) {
									displayParts.push(`#${formattedValue}`);
								} else {
									displayParts.push(formattedValue);
								}

								addedColumns++;
							}
						}
					});

					// Creează string-ul final pentru afișare (limitat la 50 caractere)
					let displayValue = "";
					if (displayParts.length > 0) {
						displayValue = displayParts.join(" • ");

						// Limitează lungimea totală
						if (displayValue.length > 50) {
							displayValue = displayValue.substring(0, 47) + "...";
						}
					} else {
						// Fallback dacă nu găsim nimic
						displayValue = `Row #${row.id}`;
					}

					options.push({
						id: row.id,
						displayValue: displayValue,
					});
				}
			});
		}

		// Folosește ID-ul tabelului ca și cheie
		referenceData[table.id] = options;
	});

	return referenceData;
};

export function AddRowForm({ columns, onAdd, cells, setCells, tables }: Props) {
	const referenceData = useMemo(() => createReferenceData(tables), [tables]);

	// Optimized cell update function
	const updateCell = useCallback(
		(columnId: number, value: string) => {
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
							{commonLabelJSX}
							<Input
								type='number'
								value={cellValue}
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
					// Aici este fix-ul principal - folosim referenceTableId
					const options = referenceData[column.referenceTableId ?? -1] ?? [];
					const referencedTable = tables?.find(
						(t) => t.id === column.referenceTableId,
					);

					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Select
								value={cellValue}
								onValueChange={(val) => updateCell(column.id, val)}>
								<SelectTrigger className={hasError ? "border-destructive" : ""}>
									<SelectValue
										placeholder={`Select ${
											referencedTable?.name || "reference"
										}`}
									/>
								</SelectTrigger>
								<SelectContent className='max-w-[400px]'>
									{options.length > 0 ? (
										options.map((opt) => (
											<SelectItem
												key={opt.id}
												value={String(opt.id)}
												className='max-w-[380px] truncate'>
												<span className='truncate' title={opt.displayValue}>
													{opt.displayValue}
												</span>
											</SelectItem>
										))
									) : (
										<SelectItem disabled value='no-options'>
											No {referencedTable?.name || "options"} available
										</SelectItem>
									)}
								</SelectContent>
							</Select>
							{/* Debug info - poți să o ștergi după testare */}
							{process.env.NODE_ENV === "development" && (
								<div className='text-xs text-muted-foreground'>
									Table: {referencedTable?.name} (ID: {column.referenceTableId}
									), Options: {options.length}
								</div>
							)}
						</div>
					);

				case "string":
				default:
					return (
						<div key={`field-${column.id}`} className={divClassName}>
							{commonLabelJSX}
							<Input
								type='text'
								value={cellValue}
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
