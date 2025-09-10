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
import { cn } from "@/lib/utils";

interface Props {
	newColumn: CreateColumnRequest | null;
	setNewColumn: (column: CreateColumnRequest | null) => void;
	onAdd: (e: FormEvent) => void;
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
			setNewColumn({ ...newColumn, [field]: value });
		}
		
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: "" }));
		}
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (validateForm()) {
			onAdd(e);
		}
	};

	if (!newColumn) return null;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Basic Properties */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Basic Properties</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Column Name</Label>
						<Input
							id="name"
							value={newColumn.name || ""}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className={cn(errors.name && "border-destructive")}
							placeholder="Enter column name..."
						/>
						{errors.name && (
							<p className="text-sm text-destructive flex items-center gap-1">
								<AlertCircle className="w-3 h-3" />
								{errors.name}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="type">Data Type</Label>
						<Select
							value={newColumn.type || ""}
							onValueChange={(value) => handleInputChange("type", value)}
						>
							<SelectTrigger className={cn(errors.type && "border-destructive")}>
								<SelectValue placeholder="Select data type" />
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
							<p className="text-sm text-destructive flex items-center gap-1">
								<AlertCircle className="w-3 h-3" />
								{errors.type}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="semanticType">Semantic Type (Optional)</Label>
						<Input
							id="semanticType"
							value={newColumn.semanticType || ""}
							onChange={(e) => handleInputChange("semanticType", e.target.value)}
							placeholder="e.g., email, phone, url"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description (Optional)</Label>
						<Textarea
							id="description"
							value={newColumn.description || ""}
							onChange={(e) => handleInputChange("description", e.target.value)}
							placeholder="Describe what this column stores..."
							rows={3}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Constraints */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Constraints</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label htmlFor="required">Required</Label>
							<p className="text-xs text-muted-foreground">
								This column must have a value
							</p>
						</div>
						<Switch
							id="required"
							checked={newColumn.required || false}
							onCheckedChange={(checked) => handleInputChange("required", checked)}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label htmlFor="unique">Unique</Label>
							<p className="text-xs text-muted-foreground">
								All values in this column must be unique
							</p>
						</div>
						<Switch
							id="unique"
							checked={newColumn.unique || false}
							onCheckedChange={(checked) => handleInputChange("unique", checked)}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label htmlFor="primary">Primary Key</Label>
							<p className="text-xs text-muted-foreground">
								This column is the primary key for the table
							</p>
						</div>
						<Switch
							id="primary"
							checked={newColumn.primary || false}
							onCheckedChange={(checked) => handleInputChange("primary", checked)}
						/>
						{errors.primary && (
							<p className="text-sm text-destructive flex items-center gap-1">
								<AlertCircle className="w-3 h-3" />
								{errors.primary}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Reference Settings */}
			{newColumn.type === "reference" && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Reference Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="referenceTableId">Reference Table</Label>
							<Select
								value={newColumn.referenceTableId?.toString() || ""}
								onValueChange={(value) => handleInputChange("referenceTableId", parseInt(value))}
							>
								<SelectTrigger className={cn(errors.referenceTableId && "border-destructive")}>
									<SelectValue placeholder="Select reference table" />
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
								<p className="text-sm text-destructive flex items-center gap-1">
									<AlertCircle className="w-3 h-3" />
									{errors.referenceTableId}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Default Value */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Default Value</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="defaultValue">Default Value (Optional)</Label>
						<Input
							id="defaultValue"
							value={newColumn.defaultValue || ""}
							onChange={(e) => handleInputChange("defaultValue", e.target.value)}
							placeholder="Enter default value..."
						/>
						<p className="text-xs text-muted-foreground">
							This value will be used when no value is provided for this column
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Submit Button */}
			<div className="flex justify-end">
				<Button 
					type="submit"
					disabled={isSubmitting}
					className="bg-primary hover:bg-primary/90"
				>
					{isSubmitting ? (
						<>
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
							Adding Column...
						</>
					) : (
						"Add Column"
					)}
				</Button>
			</div>
		</form>
	);
}
