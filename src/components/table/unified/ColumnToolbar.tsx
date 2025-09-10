/** @format */
"use client";

import { useState, useEffect } from "react";
import { Column, CreateColumnRequest, Table } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { 
	Plus, 
	Save, 
	Trash2, 
	Settings, 
	X, 
	AlertCircle,
	ChevronDown
} from "lucide-react";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";
import { SemanticColumnType, SEMANTIC_TYPE_LABELS, SEMANTIC_TYPE_GROUPS } from "@/lib/semantic-types";
import { cn } from "@/lib/utils";

interface Props {
	columns: Column[];
	selectedColumn: Column | null;
	onSelectColumn: (column: Column | null) => void;
	onSave: (updatedColumn: Partial<Column>) => void;
	onDelete: (columnId: string) => void;
	onAdd: (e: React.FormEvent) => void;
	tables: Table[];
	isSubmitting: boolean;
	isOpen: boolean;
	onClose: () => void;
}

export function ColumnToolbar({
	columns,
	selectedColumn,
	onSelectColumn,
	onSave,
	onDelete,
	onAdd,
	tables,
	isSubmitting,
	isOpen,
	onClose,
}: Props) {
	const [formData, setFormData] = useState<Partial<Column>>({});
	const [newColumn, setNewColumn] = useState<CreateColumnRequest | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isAddingNew, setIsAddingNew] = useState(false);

	useEffect(() => {
		if (selectedColumn) {
			setFormData({
				name: selectedColumn.name,
				type: selectedColumn.type,
				semanticType: selectedColumn.semanticType || "",
				required: selectedColumn.required || false,
				primary: selectedColumn.primary || false,
				unique: selectedColumn.unique || false,
				referenceTableId: selectedColumn.referenceTableId || undefined,
				defaultValue: selectedColumn.defaultValue || "",
				description: selectedColumn.description || "",
				order: selectedColumn.order || 0,
			});
			setIsAddingNew(false);
		} else {
			setFormData({});
			setIsAddingNew(true);
			setNewColumn({
				name: "",
				type: USER_FRIENDLY_COLUMN_TYPES.text,
				semanticType: "",
				required: false,
				primary: false,
				referenceTableId: undefined,
				customOptions: [],
				order: 0,
			});
		}
		setErrors({});
	}, [selectedColumn]);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (isAddingNew) {
			if (!newColumn?.name?.trim()) {
				newErrors.name = "Column name is required";
			} else {
				const nameExists = columns.some(col => col.name === newColumn?.name);
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

			if (newColumn?.primary && columns.some(col => col.primary)) {
				newErrors.primary = "Only one primary key is allowed per table";
			}
		} else {
			if (!formData.name?.trim()) {
				newErrors.name = "Column name is required";
			} else if (formData.name !== selectedColumn?.name) {
				const nameExists = columns.some(col => col.name === formData.name);
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

			if (formData.primary && columns.some(col => col.primary && col.id !== selectedColumn?.id)) {
				newErrors.primary = "Only one primary key is allowed per table";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (validateForm()) {
			if (isAddingNew && newColumn) {
				onAdd(new Event('submit') as any);
			} else {
				onSave(formData);
			}
		}
	};

	const handleDelete = () => {
		if (selectedColumn && !selectedColumn.primary) {
			onDelete(selectedColumn.id.toString());
		}
	};

	const handleInputChange = (field: keyof Column | keyof CreateColumnRequest, value: any) => {
		if (isAddingNew && newColumn) {
			setNewColumn({ ...newColumn, [field]: value });
		} else {
			setFormData(prev => ({ ...prev, [field]: value }));
		}
		
		// Clear error when user starts typing
		if (errors[field as string]) {
			setErrors(prev => ({ ...prev, [field as string]: "" }));
		}
	};

	const currentData = isAddingNew ? newColumn : formData;
	const isDisabled = !isOpen;

	return (
		<div className={`bg-card border border-border/20 rounded-lg shadow-sm transition-all duration-200 ${
			isDisabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
		}`}>
			<div className="p-4">
				{/* Header */}
				<div className="flex items-center gap-3 mb-4">
					<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
						<Settings className="w-4 h-4 text-primary" />
					</div>
					<div>
						<h3 className="font-semibold text-foreground">
							{isDisabled ? "Column Editor" : isAddingNew ? "Add New Column" : `Edit Column: ${selectedColumn?.name}`}
						</h3>
						<p className="text-xs text-muted-foreground">
							{isDisabled ? "Select a column to edit or add a new one" : isAddingNew ? "Configure column properties" : "Update column settings"}
						</p>
					</div>
				</div>

				{/* Column Selector */}
				<div className="flex items-center gap-4 mb-4">
					<Label className="text-sm font-medium whitespace-nowrap">Column:</Label>
					<Select
						value={selectedColumn?.id?.toString() || "new"}
						onValueChange={(value) => {
							if (value === "new") {
								onSelectColumn(null);
							} else {
								const column = columns.find(col => col.id.toString() === value);
								onSelectColumn(column || null);
							}
						}}
						disabled={isDisabled}
					>
						<SelectTrigger className="w-48">
							<SelectValue placeholder={isDisabled ? "Select a column" : "Select column"} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="new">
								<div className="flex items-center gap-2">
									<Plus className="w-4 h-4" />
									Add New Column
								</div>
							</SelectItem>
							{columns.map((column) => (
								<SelectItem key={column.id} value={column.id.toString()}>
									<div className="flex items-center gap-2">
										<span className="font-medium">{column.name}</span>
										<span className="text-xs text-muted-foreground">({column.type})</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Form Fields */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
					{/* Column Name */}
					<div className="space-y-2">
						<Label htmlFor="name" className="text-xs font-medium">Name</Label>
						<Input
							id="name"
							value={currentData?.name || ""}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className={cn("h-8", errors.name && "border-destructive")}
							placeholder="Column name"
							disabled={isDisabled}
						/>
						{errors.name && (
							<p className="text-xs text-destructive flex items-center gap-1">
								<AlertCircle className="w-3 h-3" />
								{errors.name}
							</p>
						)}
					</div>

					{/* Data Type */}
					<div className="space-y-2">
						<Label htmlFor="type" className="text-xs font-medium">Type</Label>
						<Select
							value={currentData?.type || ""}
							onValueChange={(value) => handleInputChange("type", value)}
							disabled={isDisabled}
						>
							<SelectTrigger className={cn("h-8", errors.type && "border-destructive")}>
								<SelectValue placeholder="Select type" />
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
							<p className="text-xs text-destructive flex items-center gap-1">
								<AlertCircle className="w-3 h-3" />
								{errors.type}
							</p>
						)}
					</div>

					{/* Semantic Type */}
					<div className="space-y-2">
						<Label htmlFor="semanticType" className="text-xs font-medium">Semantic Type</Label>
						<Select
							value={currentData?.semanticType || ""}
							onValueChange={(value) => handleInputChange("semanticType", value)}
							disabled={isDisabled}
						>
							<SelectTrigger className="h-8">
								<SelectValue placeholder="Select semantic type" />
							</SelectTrigger>
							<SelectContent className="max-h-60">
								{Object.entries(SEMANTIC_TYPE_GROUPS).map(([groupName, types]) => (
									<div key={groupName}>
										<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
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
					<div className="space-y-2">
						<Label htmlFor="defaultValue" className="text-xs font-medium">Default Value</Label>
						<Input
							id="defaultValue"
							value={currentData?.defaultValue || ""}
							onChange={(e) => handleInputChange("defaultValue", e.target.value)}
							className="h-8"
							placeholder="Default value"
							disabled={isDisabled}
						/>
					</div>

					{/* Reference Table */}
					{currentData?.type === "reference" && (
						<div className="space-y-2">
							<Label htmlFor="referenceTableId" className="text-xs font-medium">Reference Table</Label>
							<Select
								value={currentData?.referenceTableId?.toString() || ""}
								onValueChange={(value) => handleInputChange("referenceTableId", parseInt(value))}
								disabled={isDisabled}
							>
								<SelectTrigger className={cn("h-8", errors.referenceTableId && "border-destructive")}>
									<SelectValue placeholder="Select table" />
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
								<p className="text-xs text-destructive flex items-center gap-1">
									<AlertCircle className="w-3 h-3" />
									{errors.referenceTableId}
								</p>
							)}
						</div>
					)}
				</div>

				{/* Switches */}
				<div className="flex items-center gap-6 mb-4">
					<div className="flex items-center gap-2">
						<Switch
							id="required"
							checked={currentData?.required || false}
							onCheckedChange={(checked) => handleInputChange("required", checked)}
							disabled={isDisabled}
						/>
						<Label htmlFor="required" className="text-xs font-medium">Required</Label>
					</div>

					<div className="flex items-center gap-2">
						<Switch
							id="unique"
							checked={currentData?.unique || false}
							onCheckedChange={(checked) => handleInputChange("unique", checked)}
							disabled={isDisabled}
						/>
						<Label htmlFor="unique" className="text-xs font-medium">Unique</Label>
					</div>

					<div className="flex items-center gap-2">
						<Switch
							id="primary"
							checked={currentData?.primary || false}
							onCheckedChange={(checked) => handleInputChange("primary", checked)}
							disabled={isDisabled}
						/>
						<Label htmlFor="primary" className="text-xs font-medium">Primary Key</Label>
					</div>
				</div>

				{/* Description */}
				<div className="space-y-2 mb-4">
					<Label htmlFor="description" className="text-xs font-medium">Description</Label>
					<Textarea
						id="description"
						value={currentData?.description || ""}
						onChange={(e) => handleInputChange("description", e.target.value)}
						placeholder="Column description..."
						rows={2}
						className="resize-none"
						disabled={isDisabled}
					/>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between pt-4 border-t border-border/20">
					<div className="flex items-center gap-2">
						{selectedColumn && !selectedColumn.primary && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleDelete}
								disabled={isDisabled || isSubmitting}
								className="text-destructive hover:text-destructive hover:bg-destructive/10"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete Column
							</Button>
						)}
					</div>

					<div className="flex items-center gap-2">
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isDisabled || isSubmitting}
							className="bg-primary hover:bg-primary/90"
						>
							{isSubmitting ? (
								<>
									<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
									{isAddingNew ? "Adding..." : "Saving..."}
								</>
							) : (
								<>
									<Save className="w-4 h-4 mr-2" />
									{isAddingNew ? "Add Column" : "Save Changes"}
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
