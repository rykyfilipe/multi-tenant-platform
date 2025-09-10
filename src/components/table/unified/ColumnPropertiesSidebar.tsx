/** @format */
"use client";

import { useState, useEffect } from "react";
import { Column, Table } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Save, AlertCircle } from "lucide-react";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";
import { cn } from "@/lib/utils";

interface Props {
	column: Column | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (updatedColumn: Partial<Column>) => void;
	tables: Table[];
	existingColumns: Column[];
	isSubmitting: boolean;
}

export function ColumnPropertiesSidebar({
	column,
	isOpen,
	onClose,
	onSave,
	tables,
	existingColumns,
	isSubmitting,
}: Props) {
	const [formData, setFormData] = useState<Partial<Column>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (column) {
			setFormData({
				name: column.name,
				type: column.type,
				semanticType: column.semanticType || "",
				required: column.required || false,
				primary: column.primary || false,
				unique: column.unique || false,
				referenceTableId: column.referenceTableId || undefined,
				defaultValue: column.defaultValue || "",
				description: column.description || "",
				order: column.order || 0,
			});
			setErrors({});
		}
	}, [column]);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name?.trim()) {
			newErrors.name = "Column name is required";
		} else if (formData.name !== column?.name) {
			const nameExists = existingColumns.some(col => col.name === formData.name);
			if (nameExists) {
				newErrors.name = "A column with this name already exists";
			}
		}

		if (!formData.type) {
			newErrors.type = "Column type is required";
		}

		if (formData.type === "reference" && !formData.referenceTableId) {
			newErrors.referenceTableId = "Reference table is required for reference columns";
		}

		if (formData.primary && existingColumns.some(col => col.primary && col.id !== column?.id)) {
			newErrors.primary = "Only one primary key is allowed per table";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (validateForm()) {
			onSave(formData);
		}
	};

	const handleInputChange = (field: keyof Column, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: "" }));
		}
	};

	if (!isOpen || !column) return null;

	return (
		<div className="fixed inset-0 z-50 flex">
			{/* Backdrop */}
			<div 
				className="flex-1 bg-black/50 backdrop-blur-sm" 
				onClick={onClose}
			/>
			
			{/* Sidebar */}
			<div className="w-96 bg-card border-l border-border/20 shadow-2xl overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-card border-b border-border/20 p-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold text-foreground">Column Properties</h2>
							<p className="text-sm text-muted-foreground">
								Configure the properties for "{column.name}"
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-8 w-8 p-0"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
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
									value={formData.name || ""}
									onChange={(e) => handleInputChange("name", e.target.value)}
									className={cn(errors.name && "border-destructive")}
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
									value={formData.type || ""}
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
									value={formData.semanticType || ""}
									onChange={(e) => handleInputChange("semanticType", e.target.value)}
									placeholder="e.g., email, phone, url"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description (Optional)</Label>
								<Textarea
									id="description"
									value={formData.description || ""}
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
									checked={formData.required || false}
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
									checked={formData.unique || false}
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
									checked={formData.primary || false}
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
					{formData.type === "reference" && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Reference Settings</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="referenceTableId">Reference Table</Label>
									<Select
										value={formData.referenceTableId?.toString() || ""}
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
									value={formData.defaultValue || ""}
									onChange={(e) => handleInputChange("defaultValue", e.target.value)}
									placeholder="Enter default value..."
								/>
								<p className="text-xs text-muted-foreground">
									This value will be used when no value is provided for this column
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Footer */}
				<div className="sticky bottom-0 bg-card border-t border-border/20 p-6">
					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button 
							onClick={handleSave}
							disabled={isSubmitting}
							className="bg-primary hover:bg-primary/90"
						>
							{isSubmitting ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
									Saving...
								</>
							) : (
								<>
									<Save className="w-4 h-4 mr-2" />
									Save Changes
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
