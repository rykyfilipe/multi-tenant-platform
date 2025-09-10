/** @format */
"use client";

import { useState, useEffect } from "react";
import { Column, Row } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
	columns: Column[];
	onSave: (rowData: Record<string, any>) => void;
	onCancel: () => void;
	isSaving?: boolean;
}

export function InlineRowCreator({ columns, onSave, onCancel, isSaving = false }: Props) {
	const [rowData, setRowData] = useState<Record<string, any>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Initialize row data with default values
	useEffect(() => {
		const initialData: Record<string, any> = {};
		columns.forEach((column) => {
			if (column.defaultValue) {
				initialData[column.id.toString()] = column.defaultValue;
			} else if (column.type === "boolean") {
				initialData[column.id.toString()] = false;
			} else if (column.type === "number") {
				initialData[column.id.toString()] = 0;
			} else {
				initialData[column.id.toString()] = "";
			}
		});
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
				if (value === null || value === undefined || value === "") {
					newErrors[column.id.toString()] = `${column.name} is required`;
				}
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (validateRow()) {
			onSave(rowData);
		}
	};

	const renderCellEditor = (column: Column) => {
		const value = rowData[column.id.toString()];
		const error = errors[column.id.toString()];

		switch (column.type) {
			case "boolean":
				return (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={value || false}
							onCheckedChange={(checked) => handleInputChange(column.id.toString(), checked)}
						/>
					</div>
				);

			case "date":
				return (
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"w-full justify-start text-left font-normal h-8",
									!value && "text-muted-foreground",
									error && "border-destructive"
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{value ? format(new Date(value), "PPP") : "Pick a date"}
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

			case "reference":
				return (
					<Select
						value={value?.toString() || ""}
						onValueChange={(val) => handleInputChange(column.id.toString(), val)}
					>
						<SelectTrigger className={cn("h-8", error && "border-destructive")}>
							<SelectValue placeholder="Select..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">None</SelectItem>
							{/* TODO: Add reference options */}
						</SelectContent>
					</Select>
				);

			case "number":
				return (
					<Input
						type="number"
						value={value || ""}
						onChange={(e) => handleInputChange(column.id.toString(), parseFloat(e.target.value) || 0)}
						className={cn("h-8", error && "border-destructive")}
						placeholder="0"
					/>
				);

			default:
				return (
					<Input
						value={value || ""}
						onChange={(e) => handleInputChange(column.id.toString(), e.target.value)}
						className={cn("h-8", error && "border-destructive")}
						placeholder={`Enter ${column.name.toLowerCase()}...`}
					/>
				);
		}
	};

	return (
		<div className="flex border-b border-border/20 bg-primary/5 hover:bg-primary/10 transition-colors duration-200">
			{/* Row number */}
			<div className="w-16 flex-shrink-0 border-r border-border/20 bg-primary/10 flex items-center justify-center p-2">
				<Plus className="w-4 h-4 text-primary" />
			</div>

			{/* Data cells */}
			{columns.map((column) => (
				<div
					key={column.id}
					className="flex-1 min-w-[120px] border-r border-border/20 p-2"
				>
					<div className="space-y-1">
						{renderCellEditor(column)}
						{errors[column.id.toString()] && (
							<p className="text-xs text-destructive">
								{errors[column.id.toString()]}
							</p>
						)}
					</div>
				</div>
			))}

			{/* Actions */}
			<div className="w-16 flex-shrink-0 border-l border-border/20 bg-primary/10 flex items-center justify-center gap-1 p-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleSave}
					disabled={isSaving}
					className="h-6 w-6 p-0 hover:bg-green-100 text-green-600 hover:text-green-700"
				>
					<Check className="w-3 h-3" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onCancel}
					disabled={isSaving}
					className="h-6 w-6 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
				>
					<X className="w-3 h-3" />
				</Button>
			</div>
		</div>
	);
}
