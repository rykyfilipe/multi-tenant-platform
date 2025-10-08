/** @format */
"use client";

import { useState, useEffect } from "react";
import { Column, Row, Table } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X, Check, Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";
import { MultipleReferenceSelect } from "../rows/MultipleReferenceSelect";
import { useOptimizedReferenceData } from "@/hooks/useOptimizedReferenceData";
import { Badge } from "@/components/ui/badge";

interface Props {
	columns: Column[];
	onSave?: (rowData: Record<string, any>) => void;
	onCancel?: () => void;
	isSaving?: boolean;
	tables?: Table[];
}

export function InlineRowCreator({ columns, onSave, onCancel, isSaving = false, tables = [] }: Props) {
	const [rowData, setRowData] = useState<Record<string, any>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Hook for reference data - same as EditableCell
	const { referenceData } = useOptimizedReferenceData(tables);

	// Initialize row data with default values
	useEffect(() => {
		console.log("🔍 InlineRowCreator useEffect called", { columns: columns.length });
		const initialData: Record<string, any> = {};
		columns.forEach((column) => {
			// Auto-fill created_at with current timestamp
			if (column.name === "created_at" && column.type === USER_FRIENDLY_COLUMN_TYPES.date) {
				initialData[column.id.toString()] = new Date().toISOString();
			} else if (column.defaultValue) {
				initialData[column.id.toString()] = column.defaultValue;
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.yesNo) {
				initialData[column.id.toString()] = false;
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.number) {
				initialData[column.id.toString()] = 0;
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
				initialData[column.id.toString()] = [];
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
				initialData[column.id.toString()] = "";
			} else {
				initialData[column.id.toString()] = "";
			}
		});
		console.log("✅ Setting initial rowData:", initialData);
		setRowData(initialData);
	}, [columns]);

	const handleInputChange = (columnId: string, value: any) => {
		setRowData(prev => ({ ...prev, [columnId]: value }));
		
		// Clear error when user starts typing
		if (errors[columnId]) {
			setErrors(prev => ({ ...prev, [columnId]: "" }));
		}
	};

	const validateRow = () => {
		const newErrors: Record<string, string> = {};
		
		columns.forEach((column) => {
			if (column.required) {
				const value = rowData[column.id.toString()];
				
				// Validare specifică pentru fiecare tip de coloană
				let isValid = true;
				
				if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
					// Pentru coloanele de referință, verificăm că array-ul nu este gol
					isValid = Array.isArray(value) && value.length > 0;
				} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
					// Pentru customArray, verificăm că valoarea există în opțiunile definite
					isValid = value && column.customOptions && column.customOptions.includes(value);
				} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.yesNo) {
					// Pentru boolean, orice valoare este validă (true/false)
					isValid = value !== null && value !== undefined;
				} else {
					// Pentru restul tipurilor, verificăm că nu este gol
					isValid = value !== null && value !== undefined && value !== "";
				}
				
				if (!isValid) {
					newErrors[column.id.toString()] = `${column.name} is required`;
				}
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		console.log("🔍 InlineRowCreator handleSave called", { rowData, validateResult: validateRow() });
		if (validateRow()) {
			// Adaugă rândul în batch-ul de rânduri noi locale
			console.log("✅ Calling onSave with rowData:", rowData);
			if (onSave) {
				onSave(rowData);
				// Clear the form after successful save
				clearForm();
			} else {
				console.warn("⚠️ onSave function not provided");
			}
		}
	};

	const clearForm = () => {
		const initialData: Record<string, any> = {};
		columns.forEach((column) => {
			if (column.defaultValue) {
				initialData[column.id.toString()] = column.defaultValue;
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.yesNo) {
				initialData[column.id.toString()] = false;
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.number) {
				initialData[column.id.toString()] = 0;
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
				initialData[column.id.toString()] = [];
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
				initialData[column.id.toString()] = "";
			} else {
				initialData[column.id.toString()] = "";
			}
		});
		setRowData(initialData);
		setErrors({});
	};

	const getColumnTypeLabel = (type: string): string => {
		const typeMap: Record<string, string> = {
			[USER_FRIENDLY_COLUMN_TYPES.text]: "Text",
			[USER_FRIENDLY_COLUMN_TYPES.number]: "Number",
			[USER_FRIENDLY_COLUMN_TYPES.yesNo]: "Yes/No",
			[USER_FRIENDLY_COLUMN_TYPES.date]: "Date",
			[USER_FRIENDLY_COLUMN_TYPES.link]: "Reference",
			[USER_FRIENDLY_COLUMN_TYPES.customArray]: "Select",
		};
		return typeMap[type] || "Text";
	};

	const renderCellEditor = (column: Column) => {
		const value = rowData[column.id.toString()];
		const error = errors[column.id.toString()];

		// Read-only columns (created_at) - show value but don't allow editing
		if (column.readOnly || (column.name === "created_at" && column.isLocked)) {
			return (
				<div className="h-8 flex items-center px-2 bg-muted/50 rounded text-xs text-muted-foreground italic">
					{value ? new Date(value).toLocaleString() : 'Auto-generated'}
				</div>
			);
		}

		switch (column.type) {
			case USER_FRIENDLY_COLUMN_TYPES.yesNo:
				return (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={value || false}
							onCheckedChange={(checked) => handleInputChange(column.id.toString(), checked)}
						/>
					</div>
				);

			case USER_FRIENDLY_COLUMN_TYPES.date:
				return (
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"w-full justify-start text-left font-normal h-8 min-w-0",
									!value && "text-muted-foreground",
									error && "border-destructive"
								)}
								style={{ minWidth: '120px', maxWidth: '100%' }}
							>
								<CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
								<span className="truncate">
									{value ? format(new Date(value), "PPP") : "Pick a date"}
								</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={value ? new Date(value) : undefined}
								onSelect={(date) => handleInputChange(column.id.toString(), date?.toISOString())}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
				);

			case USER_FRIENDLY_COLUMN_TYPES.link:
				// Use the same MultipleReferenceSelect as EditableCell
				const options = referenceData[column.referenceTableId ?? -1] ?? [];
				const referencedTable = tables?.find((t) => t.id === column.referenceTableId);

				return (
					<MultipleReferenceSelect
						value={value}
						onValueChange={(val) => handleInputChange(column.id.toString(), val)}
						options={options}
						placeholder={`Select ${referencedTable?.name || "references"}`}
						referencedTableName={referencedTable?.name}
						isMultiple={true}
						hasError={!!error}
						className="w-full"
					/>
				);

			case USER_FRIENDLY_COLUMN_TYPES.number:
				return (
					<Input
						type="number"
						value={value || ""}
						onChange={(e) => handleInputChange(column.id.toString(), parseFloat(e.target.value) || 0)}
						className={cn("h-8 w-full min-w-0", error && "border-destructive")}
						placeholder="0"
						style={{ minWidth: '120px', maxWidth: '100%' }}
					/>
				);

			case USER_FRIENDLY_COLUMN_TYPES.customArray:
				return (
					<Select
						value={value?.toString() || "none"}
						onValueChange={(val) => handleInputChange(column.id.toString(), val === "none" ? "" : val)}
					>
						<SelectTrigger className={cn("h-8 w-full min-w-0", error && "border-destructive")} style={{ minWidth: '120px', maxWidth: '100%' }}>
							<SelectValue placeholder="Select an option..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">None</SelectItem>
							{column.customOptions?.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);

			case USER_FRIENDLY_COLUMN_TYPES.text:
			default:
				return (
					<Input
						value={value || ""}
						onChange={(e) => handleInputChange(column.id.toString(), e.target.value)}
						className={cn("h-8 w-full min-w-0", error && "border-destructive")}
						placeholder={`Enter ${column.name.toLowerCase()}...`}
						style={{ minWidth: '120px', maxWidth: '100%' }}
					/>
				);
		}
	};

	return (
		<div className="flex border-b-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors duration-200 min-w-max">
			{/* Row selection column - matches RowGrid structure */}
			<div className="w-12 sm:w-16 flex-shrink-0 border-r border-blue-200 bg-blue-100 flex items-center justify-center px-2 sm:px-4 py-2">
				<Plus className="w-4 h-4 text-blue-600" />
			</div>

			{/* Data cells - matches RowGrid cell structure exactly */}
			{columns.map((column) => (
				<div
					key={column.id}
					className="flex-1 min-w-[100px] sm:min-w-[120px] border-r border-blue-200 px-2 sm:px-4 py-2 hover:bg-blue-50 transition-all duration-200"
					style={{ width: Math.max(200, 100) }}
				>
					<div className="w-full space-y-1.5">
						{/* Column details header */}
						<div className="flex items-center justify-between gap-2 mb-1">
							<div className="flex items-center gap-2 min-w-0 flex-1">
								<span className="text-xs font-semibold text-foreground truncate">
									{column.name}
								</span>
								{column.required && (
									<span className="text-destructive text-xs flex-shrink-0">*</span>
								)}
							</div>
							<div className="flex items-center gap-1 flex-shrink-0">
								{(column.readOnly || column.isLocked) && (
									<Lock className="w-3 h-3 text-muted-foreground" />
								)}
								<Badge 
									variant="secondary" 
									className="text-[10px] px-1.5 py-0 h-4 bg-muted/50 text-muted-foreground border-border"
								>
									{getColumnTypeLabel(column.type)}
								</Badge>
							</div>
						</div>
						
						{/* Input field */}
						{renderCellEditor(column)}
						
						{/* Error message */}
						{errors[column.id.toString()] && (
							<p className="text-xs text-destructive mt-1">
								{errors[column.id.toString()]}
							</p>
						)}
					</div>
				</div>
			))}

			{/* Actions column - matches RowGrid empty space structure */}
			<div className="w-12 sm:w-16 flex-shrink-0 border-l border-blue-200 bg-blue-100 flex items-center justify-center gap-1 px-2 sm:px-4 py-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleSave}
					disabled={isSaving}
					className="h-6 w-6 p-0 hover:bg-green-100 text-green-600 hover:text-green-700"
					title="Save new row"
				>
					<Check className="w-3 h-3" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						clearForm();
						if (onCancel) {
							onCancel();
						}
					}}
					disabled={isSaving}
					className="h-6 w-6 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
					title="Cancel adding row"
				>
					<X className="w-3 h-3" />
				</Button>
			</div>
		</div>
	);
}
