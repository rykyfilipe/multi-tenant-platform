/** @format */
"use client";

import { FormEvent, useState } from "react";
import { Column, CreateColumnRequest, Table } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";
import { SemanticColumnType, SEMANTIC_TYPE_LABELS, SEMANTIC_TYPE_GROUPS } from "@/lib/semantic-types";
import { cn } from "@/lib/utils";

interface Props {
	newColumn: CreateColumnRequest | null;
	setNewColumn: (column: CreateColumnRequest | null) => void;
	onAdd: (columnData: CreateColumnRequest) => void;
	tables: Table[];
	existingColumns: Column[];
	isSubmitting: boolean;
}

export function AddColumnForm({
	newColumn,
	setNewColumn,
	onAdd,
	tables,
	existingColumns,
	isSubmitting,
}: Props) {
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!newColumn?.name?.trim()) {
			newErrors.name = "Column name is required";
		} else {
			const nameExists = existingColumns.some(col => col.name === newColumn.name);
			if (nameExists) {
				newErrors.name = "A column with this name already exists";
			}
		}

		if (!newColumn?.type) {
			newErrors.type = "Column type is required";
		}

		if (newColumn?.type === "reference" && !newColumn?.referenceTableId) {
			newErrors.referenceTableId = "Reference table is required for reference columns";
		}

		if (newColumn?.primary && existingColumns.some(col => col.primary)) {
			newErrors.primary = "Only one primary key is allowed per table";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (field: keyof CreateColumnRequest, value: any) => {
		if (newColumn) {
			const updatedColumn = { ...newColumn, [field]: value };
			
			// Force required and unique for primary key columns
			if (field === 'primary' && value === true) {
				updatedColumn.required = true;
				updatedColumn.unique = true;
			}
			
			setNewColumn(updatedColumn);
		}
		
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: "" }));
		}
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (validateForm() && newColumn) {
			onAdd(newColumn);
		}
	};

	if (!newColumn) return null;

	return (
		<div className="bg-white border border-neutral-200 rounded-2xl shadow-md transition-all duration-200">
			{/* Modern Horizontal Toolbar */}
			<form onSubmit={handleSubmit} className="px-4 py-2">
				<div className="flex items-center gap-4 flex-wrap">
					{/* Column Name */}
					<div className="flex items-center gap-2 min-w-0">
						<Label htmlFor="name" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Name</Label>
						<Input
							id="name"
							value={newColumn.name || ""}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className={cn("h-8 w-32 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500", errors.name && "border-red-500")}
							placeholder="Column name"
						/>
						{errors.name && (
							<div className="flex items-center gap-1 text-xs text-red-600">
								<AlertCircle className="w-3 h-3" />
								{errors.name}
							</div>
						)}
					</div>

					{/* Data Type */}
					<div className="flex items-center gap-2 min-w-0">
						<Label htmlFor="type" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Type</Label>
						<Select
							value={newColumn.type || ""}
							onValueChange={(value) => handleInputChange("type", value)}
						>
							<SelectTrigger className={cn("h-8 w-32 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500", errors.type && "border-red-500")}>
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(USER_FRIENDLY_COLUMN_TYPES).map(([key, value]) => (
									<SelectItem key={key} value={value}>
										{key}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.type && (
							<div className="flex items-center gap-1 text-xs text-red-600">
								<AlertCircle className="w-3 h-3" />
								{errors.type}
							</div>
						)}
					</div>

					{/* Semantic Type */}
					<div className="flex items-center gap-2 min-w-0">
						<Label htmlFor="semanticType" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Semantic</Label>
						<Select
							value={newColumn.semanticType || ""}
							onValueChange={(value) => handleInputChange("semanticType", value)}
						>
							<SelectTrigger className="h-8 w-32 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500">
								<SelectValue placeholder="Semantic" />
							</SelectTrigger>
							<SelectContent className="max-h-60">
								{Object.entries(SEMANTIC_TYPE_GROUPS).map(([groupName, types]) => (
									<div key={groupName}>
										<div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 bg-neutral-50">
											{groupName}
										</div>
										{types.map((type) => (
											<SelectItem key={type} value={type}>
												{SEMANTIC_TYPE_LABELS[type]}
											</SelectItem>
										))}
									</div>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Default Value */}
					<div className="flex items-center gap-2 min-w-0">
						<Label htmlFor="defaultValue" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Default</Label>
						<Input
							id="defaultValue"
							value={newColumn.defaultValue || ""}
							onChange={(e) => handleInputChange("defaultValue", e.target.value)}
							className="h-8 w-24 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
							placeholder="Default"
						/>
					</div>

					{/* Reference Table */}
					{newColumn.type === "reference" && (
						<div className="flex items-center gap-2 min-w-0">
							<Label htmlFor="referenceTableId" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Reference</Label>
							<Select
								value={newColumn.referenceTableId?.toString() || ""}
								onValueChange={(value) => handleInputChange("referenceTableId", parseInt(value))}
							>
								<SelectTrigger className={cn("h-8 w-32 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500", errors.referenceTableId && "border-red-500")}>
									<SelectValue placeholder="Table" />
								</SelectTrigger>
								<SelectContent>
									{tables.map((table) => (
										<SelectItem key={table.id} value={table.id.toString()}>
											{table.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.referenceTableId && (
								<div className="flex items-center gap-1 text-xs text-red-600">
									<AlertCircle className="w-3 h-3" />
									{errors.referenceTableId}
								</div>
							)}
						</div>
					)}

					{/* Separator */}
					<div className="w-px h-6 bg-neutral-200" />

					{/* Switches */}
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1.5">
							<Switch
								id="required"
								checked={newColumn.required || false}
								onCheckedChange={(checked) => handleInputChange("required", checked)}
								className="data-[state=checked]:bg-neutral-900"
							/>
							<Label htmlFor="required" className="text-xs font-medium text-neutral-700">Required</Label>
						</div>

						<div className="flex items-center gap-1.5">
							<Switch
								id="unique"
								checked={newColumn.unique || false}
								onCheckedChange={(checked) => handleInputChange("unique", checked)}
								className="data-[state=checked]:bg-neutral-900"
							/>
							<Label htmlFor="unique" className="text-xs font-medium text-neutral-700">Unique</Label>
						</div>

						<div className="flex items-center gap-1.5">
							<Switch
								id="primary"
								checked={newColumn.primary || false}
								onCheckedChange={(checked) => handleInputChange("primary", checked)}
								className="data-[state=checked]:bg-neutral-900"
							/>
							<Label htmlFor="primary" className="text-xs font-medium text-neutral-700">Primary</Label>
						</div>
						{errors.primary && (
							<div className="flex items-center gap-1 text-xs text-red-600">
								<AlertCircle className="w-3 h-3" />
								{errors.primary}
							</div>
						)}
					</div>

					{/* Separator */}
					<div className="w-px h-6 bg-neutral-200" />

					{/* Submit Button */}
					<Button 
						type="submit"
						disabled={isSubmitting}
						className="h-8 px-4 text-xs bg-neutral-900 hover:bg-neutral-800 text-white"
					>
						{isSubmitting ? (
							<>
								<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
								Adding...
							</>
						) : (
							"Add Column"
						)}
					</Button>
				</div>

				{/* Description - Compact horizontal input */}
				{newColumn.description && (
					<div className="mt-3 pt-3 border-t border-neutral-100">
						<div className="flex items-center gap-2">
							<Label htmlFor="description" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Description</Label>
							<Input
								id="description"
								value={newColumn.description || ""}
								onChange={(e) => handleInputChange("description", e.target.value)}
								placeholder="Column description..."
								className="h-7 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
							/>
						</div>
					</div>
				)}
			</form>
		</div>
	);
}
