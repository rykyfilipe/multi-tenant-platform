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
	onAdd: (columnData: CreateColumnRequest) => void;
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
	const [customOptions, setCustomOptions] = useState<string[]>([]);
	const [newOption, setNewOption] = useState<string>("");

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
			setCustomOptions(selectedColumn.customOptions || []);
			setIsAddingNew(false);
		} else {
			setFormData({});
			setCustomOptions([]);
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
				onAdd(newColumn);
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
			const updatedColumn = { ...newColumn, [field]: value };
			setNewColumn(updatedColumn);
			
			// Update custom options if type changes to customArray
			if (field === 'type' && value === USER_FRIENDLY_COLUMN_TYPES.customArray) {
				setCustomOptions(updatedColumn.customOptions || []);
			}
		} else {
			const updatedData = { ...formData, [field]: value };
			setFormData(updatedData);
			
			// Update custom options if type changes to customArray
			if (field === 'type' && value === USER_FRIENDLY_COLUMN_TYPES.customArray) {
				setCustomOptions(updatedData.customOptions || []);
			}
		}
		
		// Clear error when user starts typing
		if (errors[field as string]) {
			setErrors(prev => ({ ...prev, [field as string]: "" }));
		}
	};

	const handleSemanticTypeChange = (semanticType: string) => {
		// Auto-update column type and properties based on semantic type
		const semanticTypeMapping: Record<string, { type: string; required?: boolean; unique?: boolean }> = {
			'email': { type: USER_FRIENDLY_COLUMN_TYPES.text, required: true, unique: true },
			'phone': { type: USER_FRIENDLY_COLUMN_TYPES.text, required: true },
			'url': { type: USER_FRIENDLY_COLUMN_TYPES.text, required: true },
			'name': { type: USER_FRIENDLY_COLUMN_TYPES.text, required: true },
			'description': { type: USER_FRIENDLY_COLUMN_TYPES.text },
			'age': { type: USER_FRIENDLY_COLUMN_TYPES.number, required: true },
			'price': { type: USER_FRIENDLY_COLUMN_TYPES.number, required: true },
			'quantity': { type: USER_FRIENDLY_COLUMN_TYPES.number, required: true },
			'date_of_birth': { type: USER_FRIENDLY_COLUMN_TYPES.date, required: true },
			'created_at': { type: USER_FRIENDLY_COLUMN_TYPES.date, required: true },
			'updated_at': { type: USER_FRIENDLY_COLUMN_TYPES.date, required: true },
			'is_active': { type: USER_FRIENDLY_COLUMN_TYPES.yesNo, required: true },
			'is_verified': { type: USER_FRIENDLY_COLUMN_TYPES.yesNo, required: true },
			'status': { type: USER_FRIENDLY_COLUMN_TYPES.customArray, required: true },
			'category': { type: USER_FRIENDLY_COLUMN_TYPES.customArray, required: true },
			'priority': { type: USER_FRIENDLY_COLUMN_TYPES.customArray, required: true },
		};

		const mapping = semanticTypeMapping[semanticType];
		if (mapping) {
			if (isAddingNew && newColumn) {
				const updatedColumn = {
					...newColumn,
					semanticType,
					type: mapping.type,
					required: mapping.required ?? newColumn.required,
					unique: mapping.unique ?? newColumn.unique,
				};
				setNewColumn(updatedColumn);
				
				// Set default custom options for certain semantic types
				if (mapping.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
					const defaultOptions: Record<string, string[]> = {
						'status': ['Active', 'Inactive', 'Pending', 'Suspended'],
						'category': ['General', 'Important', 'Urgent', 'Low Priority'],
						'priority': ['Low', 'Medium', 'High', 'Critical'],
					};
					const options = defaultOptions[semanticType] || [];
					setCustomOptions(options);
					updatedColumn.customOptions = options;
				}
			} else {
				const updatedData = {
					...formData,
					semanticType,
					type: mapping.type,
					required: mapping.required ?? formData.required,
					unique: mapping.unique ?? formData.unique,
				};
				setFormData(updatedData);
				
				// Set default custom options for certain semantic types
				if (mapping.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
					const defaultOptions: Record<string, string[]> = {
						'status': ['Active', 'Inactive', 'Pending', 'Suspended'],
						'category': ['General', 'Important', 'Urgent', 'Low Priority'],
						'priority': ['Low', 'Medium', 'High', 'Critical'],
					};
					const options = defaultOptions[semanticType] || [];
					setCustomOptions(options);
					updatedData.customOptions = options;
				}
			}
		} else {
			// If no mapping found, just set the semantic type
			handleInputChange('semanticType', semanticType);
		}
	};

	const addCustomOption = () => {
		if (newOption.trim() && !customOptions.includes(newOption.trim())) {
			const updatedOptions = [...customOptions, newOption.trim()];
			setCustomOptions(updatedOptions);
			setNewOption("");
			
			// Update the column data
			if (isAddingNew && newColumn) {
				setNewColumn({ ...newColumn, customOptions: updatedOptions });
			} else {
				setFormData(prev => ({ ...prev, customOptions: updatedOptions }));
			}
		}
	};

	const removeCustomOption = (option: string) => {
		const updatedOptions = customOptions.filter(opt => opt !== option);
		setCustomOptions(updatedOptions);
		
		// Update the column data
		if (isAddingNew && newColumn) {
			setNewColumn({ ...newColumn, customOptions: updatedOptions });
		} else {
			setFormData(prev => ({ ...prev, customOptions: updatedOptions }));
		}
	};

	const currentData = isAddingNew ? newColumn : formData;
	const isDisabled = !isOpen;

	return (
		<div className={`bg-white border border-neutral-200 rounded-2xl shadow-md transition-all duration-200 ${
			isDisabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
		}`}>
			{/* Modern Horizontal Toolbar */}
			<div className="px-4 py-2">
				<div className="flex items-center gap-4 flex-wrap">
					{/* Column Selector */}
					<div className="flex items-center gap-2 min-w-0">
						<Settings className="w-4 h-4 text-neutral-600 flex-shrink-0" />
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
							<SelectTrigger className="w-40 h-8 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500">
								<SelectValue placeholder={isDisabled ? "Select column" : "Column"} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="new">
									<div className="flex items-center gap-2">
										<Plus className="w-3 h-3" />
										Add New
									</div>
								</SelectItem>
								{columns.map((column) => (
									<SelectItem key={column.id} value={column.id.toString()}>
										<div className="flex items-center gap-2">
											<span className="font-medium">{column.name}</span>
											<span className="text-xs text-neutral-500">({column.type})</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Separator */}
					<div className="w-px h-6 bg-neutral-200" />

					{/* Column Name */}
					<div className="flex items-center gap-2 min-w-0">
						<Label htmlFor="name" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Name</Label>
						<Input
							id="name"
							value={currentData?.name || ""}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className={cn("h-8 w-32 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500", errors.name && "border-red-500")}
							placeholder="Column name"
							disabled={isDisabled}
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
							value={currentData?.type || ""}
							onValueChange={(value) => handleInputChange("type", value)}
							disabled={isDisabled}
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
							value={currentData?.semanticType || ""}
							onValueChange={handleSemanticTypeChange}
							disabled={isDisabled}
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

					{/* Default Value - Dynamic based on column type */}
					<div className="flex items-center gap-2 min-w-0">
						<Label htmlFor="defaultValue" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Default</Label>
						{currentData?.type === USER_FRIENDLY_COLUMN_TYPES.yesNo ? (
							<Select
								value={currentData?.defaultValue || ""}
								onValueChange={(value) => handleInputChange("defaultValue", value)}
								disabled={isDisabled}
							>
								<SelectTrigger className="h-8 w-20 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500">
									<SelectValue placeholder="-" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">-</SelectItem>
									<SelectItem value="true">Yes</SelectItem>
									<SelectItem value="false">No</SelectItem>
								</SelectContent>
							</Select>
						) : currentData?.type === USER_FRIENDLY_COLUMN_TYPES.customArray ? (
							<Select
								value={currentData?.defaultValue || ""}
								onValueChange={(value) => handleInputChange("defaultValue", value)}
								disabled={isDisabled}
							>
								<SelectTrigger className="h-8 w-24 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500">
									<SelectValue placeholder="-" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">-</SelectItem>
									{customOptions.map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : currentData?.type === USER_FRIENDLY_COLUMN_TYPES.date ? (
							<Input
								id="defaultValue"
								type="date"
								value={currentData?.defaultValue || ""}
								onChange={(e) => handleInputChange("defaultValue", e.target.value)}
								className="h-8 w-28 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
								placeholder="YYYY-MM-DD"
								disabled={isDisabled}
							/>
						) : currentData?.type === USER_FRIENDLY_COLUMN_TYPES.number ? (
							<Input
								id="defaultValue"
								type="number"
								value={currentData?.defaultValue || ""}
								onChange={(e) => handleInputChange("defaultValue", e.target.value)}
								className="h-8 w-20 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
								placeholder="0"
								disabled={isDisabled}
							/>
						) : (
							<Input
								id="defaultValue"
								value={currentData?.defaultValue || ""}
								onChange={(e) => handleInputChange("defaultValue", e.target.value)}
								className="h-8 w-24 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
								placeholder="Default"
								disabled={isDisabled}
							/>
						)}
					</div>

					{/* Reference Table */}
					{currentData?.type === "reference" && (
						<div className="flex items-center gap-2 min-w-0">
							<Label htmlFor="referenceTableId" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Reference</Label>
							<Select
								value={currentData?.referenceTableId?.toString() || ""}
								onValueChange={(value) => handleInputChange("referenceTableId", parseInt(value))}
								disabled={isDisabled}
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
								checked={currentData?.required || false}
								onCheckedChange={(checked) => handleInputChange("required", checked)}
								disabled={isDisabled}
								className="data-[state=checked]:bg-neutral-900"
							/>
							<Label htmlFor="required" className="text-xs font-medium text-neutral-700">Required</Label>
						</div>

						<div className="flex items-center gap-1.5">
							<Switch
								id="unique"
								checked={currentData?.unique || false}
								onCheckedChange={(checked) => handleInputChange("unique", checked)}
								disabled={isDisabled}
								className="data-[state=checked]:bg-neutral-900"
							/>
							<Label htmlFor="unique" className="text-xs font-medium text-neutral-700">Unique</Label>
						</div>

						<div className="flex items-center gap-1.5">
							<Switch
								id="primary"
								checked={currentData?.primary || false}
								onCheckedChange={(checked) => handleInputChange("primary", checked)}
								disabled={isDisabled}
								className="data-[state=checked]:bg-neutral-900"
							/>
							<Label htmlFor="primary" className="text-xs font-medium text-neutral-700">Primary</Label>
						</div>
					</div>

					{/* Separator */}
					<div className="w-px h-6 bg-neutral-200" />

					{/* Actions */}
					<div className="flex items-center gap-2">
						{selectedColumn && !selectedColumn.primary && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleDelete}
								disabled={isDisabled || isSubmitting}
								className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
							>
								<Trash2 className="w-3 h-3 mr-1" />
								Delete
							</Button>
						)}

						<Button
							size="sm"
							onClick={handleSave}
							disabled={isDisabled || isSubmitting}
							className="h-8 px-4 text-xs bg-neutral-900 hover:bg-neutral-800 text-white"
						>
							{isSubmitting ? (
								<>
									<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
									{isAddingNew ? "Adding..." : "Saving..."}
								</>
							) : (
								<>
									<Save className="w-3 h-3 mr-1" />
									{isAddingNew ? "Add Column" : "Save"}
								</>
							)}
						</Button>
					</div>
				</div>

				{/* Custom Options for customArray type */}
				{currentData?.type === USER_FRIENDLY_COLUMN_TYPES.customArray && (
					<div className="mt-3 pt-3 border-t border-neutral-100">
						<div className="space-y-2">
							<Label className="text-xs font-medium text-neutral-700">Custom Options</Label>
							<div className="flex items-center gap-2">
								<Input
									value={newOption}
									onChange={(e) => setNewOption(e.target.value)}
									placeholder="Add option..."
									className="h-7 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
									disabled={isDisabled}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											addCustomOption();
										}
									}}
								/>
								<Button
									type="button"
									size="sm"
									onClick={addCustomOption}
									disabled={isDisabled || !newOption.trim()}
									className="h-7 px-2 text-xs"
								>
									Add
								</Button>
							</div>
							{customOptions.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{customOptions.map((option) => (
										<div
											key={option}
											className="flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs"
										>
											<span>{option}</span>
											<button
												type="button"
												onClick={() => removeCustomOption(option)}
												disabled={isDisabled}
												className="text-neutral-500 hover:text-red-600"
											>
												×
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{/* Description - Compact horizontal input */}
				{currentData?.description && (
					<div className="mt-3 pt-3 border-t border-neutral-100">
						<div className="flex items-center gap-2">
							<Label htmlFor="description" className="text-xs font-medium text-neutral-700 whitespace-nowrap">Description</Label>
							<Input
								id="description"
								value={currentData?.description || ""}
								onChange={(e) => handleInputChange("description", e.target.value)}
								placeholder="Column description..."
								className="h-7 text-sm border-neutral-300 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
								disabled={isDisabled}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
