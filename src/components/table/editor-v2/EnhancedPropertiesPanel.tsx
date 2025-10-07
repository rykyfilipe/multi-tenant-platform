/** @format */
"use client";

import { useState, useEffect } from "react";
import { Column, Table, CreateColumnRequest } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { X, Save, Shield, CheckCircle, Link as LinkIcon, Code, ChevronDown, AlertCircle, Sparkles } from "lucide-react";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";
import { cn } from "@/lib/utils";
import { getColumnTypeColor, getColumnTypeIcon, COLUMN_TYPE_EXAMPLES } from "@/lib/columnTypeStyles";
import { Badge } from "@/components/ui/badge";
import { 
	SEMANTIC_TYPE_TEMPLATES, 
	getTemplateCategories, 
	getTemplatesByCategory,
	applySemanticTemplate 
} from "@/lib/semanticTypeTemplates";
import { SemanticColumnType } from "@/lib/semantic-types";

interface Props {
	column: Column | null;
	onClose: () => void;
	onSave?: (updatedColumn: Partial<Column>) => void;
	onAdd?: (columnData: CreateColumnRequest) => void;
	tables: Table[];
	existingColumns: Column[];
	isSubmitting?: boolean;
}

export function EnhancedPropertiesPanel({
	column,
	onClose,
	onSave,
	onAdd,
	tables,
	existingColumns,
	isSubmitting = false,
}: Props) {
	const isNewColumn = column === null;
	const [formData, setFormData] = useState<Partial<Column> & { type: string }>({
		type: "text",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<string>("");

	useEffect(() => {
		if (column) {
			setFormData({
				name: column.name,
				type: column.type,
				semanticType: column.semanticType || undefined,
				description: column.description || "",
				required: column.required || false,
				unique: column.unique || false,
				referenceTableId: column.referenceTableId || undefined,
				defaultValue: column.defaultValue || "",
				customOptions: column.customOptions || undefined,
				order: column.order || 0,
				// New properties
				indexed: column.indexed || false,
				searchable: column.searchable !== undefined ? column.searchable : true,
				hidden: column.hidden || false,
				readOnly: column.readOnly || false,
				validation: column.validation || "",
				placeholder: column.placeholder || "",
				helpText: column.helpText || "",
			});
			setErrors({});
			setSelectedTemplate(column.semanticType || "");
		} else {
			// Reset for new column
			setFormData({ type: "text", searchable: true });
			setErrors({});
			setSelectedTemplate("");
		}
	}, [column]);

	// Handler for semantic type template selection
	const handleTemplateSelect = (semanticType: string) => {
		if (!semanticType || semanticType === "none") {
			setSelectedTemplate("");
			return;
		}

		setSelectedTemplate(semanticType);
		
		// Apply template to form data
		const templateData = applySemanticTemplate(
			semanticType as SemanticColumnType,
			formData
		);

		setFormData({
			...formData,
			...templateData,
		});

		// Clear errors when template is applied
		setErrors({});
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name?.trim()) {
			newErrors.name = "Column name is required";
		} else if (!isNewColumn && formData.name !== column?.name) {
			const nameExists = existingColumns.some((col) => col.name === formData.name);
			if (nameExists) {
				newErrors.name = "A column with this name already exists";
			}
		} else if (isNewColumn) {
			const nameExists = existingColumns.some((col) => col.name === formData.name);
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

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (validateForm()) {
			if (isNewColumn && onAdd) {
				onAdd(formData as CreateColumnRequest);
			} else if (!isNewColumn && onSave) {
				onSave(formData);
			}
			onClose();
		}
	};

	const handleInputChange = (field: keyof Column, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	// Empty state when no column selected
	if (!column && !isNewColumn) {
		return (
			<Card className='h-full'>
				<CardContent className='flex items-center justify-center h-full py-12'>
					<div className='text-center max-w-xs'>
						<div className='w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center'>
							<Shield className='w-8 h-8 text-muted-foreground' />
						</div>
						<h3 className='text-lg font-semibold mb-2'>No Column Selected</h3>
						<p className='text-sm text-muted-foreground'>
							Click on a column in the list to view and edit its properties, or add a new column.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='h-full overflow-y-auto'>
			{/* Header */}
			<CardHeader className='sticky top-0 bg-card border-b border-border/20 z-10'>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='text-lg'>
							{isNewColumn ? "Add New Column" : "Column Properties"}
						</CardTitle>
						{!isNewColumn && (
							<p className='text-sm text-muted-foreground mt-1'>"{column?.name}"</p>
						)}
					</div>
					<Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 p-0'>
						<X className='w-4 h-4' />
					</Button>
				</div>
			</CardHeader>

			{/* Content */}
			<CardContent className='space-y-4 py-4'>
				{/* Quick Templates - Only for new columns */}
				{isNewColumn && (
					<div className='space-y-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20'>
						<div className='flex items-center gap-2'>
							<Sparkles className='w-4 h-4 text-primary' />
							<Label className='text-sm font-semibold text-primary'>Quick Templates</Label>
						</div>
						<Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
							<SelectTrigger className='bg-background'>
								<SelectValue placeholder='Choose a template to auto-fill...' />
							</SelectTrigger>
							<SelectContent className='max-h-[400px]'>
								<SelectItem value='none'>
									<span className='text-muted-foreground italic'>No template - start from scratch</span>
								</SelectItem>
								
								{getTemplateCategories().map((category) => (
									<div key={category}>
										<div className='px-2 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0'>
											{category}
										</div>
										{getTemplatesByCategory(category).map((template) => (
											<SelectItem 
												key={template.semanticType} 
												value={template.semanticType}
												className='cursor-pointer'
											>
												<div className='flex items-center gap-2'>
													<span>{template.icon}</span>
													<span className='text-sm'>{template.label}</span>
												</div>
											</SelectItem>
										))}
									</div>
								))}
							</SelectContent>
						</Select>
						{selectedTemplate && (
							<div className='flex items-center gap-2 text-xs text-primary'>
								<CheckCircle className='w-3 h-3' />
								<span>Template applied! You can modify the fields below.</span>
							</div>
						)}
					</div>
				)}

				{/* Basic Settings */}
				<div className='space-y-4'>
					<div className='flex items-center gap-2 mb-2'>
						<h4 className='text-sm font-semibold'>Basic Settings</h4>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='name'>Column Name *</Label>
						<Input
							id='name'
							value={formData.name || ""}
							onChange={(e) => handleInputChange("name", e.target.value)}
							placeholder='e.g., customer_email'
							className={cn(errors.name && "border-destructive")}
						/>
						{errors.name && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='w-3 h-3' />
								{errors.name}
							</p>
						)}
						<p className='text-xs text-muted-foreground'>Used in formulas and API</p>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='type'>Data Type *</Label>
						<Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
							<SelectTrigger className={cn(errors.type && "border-destructive")}>
								<SelectValue placeholder='Select data type' />
							</SelectTrigger>
							<SelectContent>
								<div className='grid grid-cols-1 gap-1 p-1'>
									{Object.entries(USER_FRIENDLY_COLUMN_TYPES).map(([key, value]) => {
										const example = COLUMN_TYPE_EXAMPLES[value as keyof typeof COLUMN_TYPE_EXAMPLES] || "";
										return (
											<SelectItem key={key} value={value} className='cursor-pointer'>
												<div className='flex items-center gap-2'>
													<span className='text-sm'>{key}</span>
													<span className='text-xs text-muted-foreground'>({example})</span>
												</div>
											</SelectItem>
										);
									})}
								</div>
							</SelectContent>
						</Select>
						{errors.type && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='w-3 h-3' />
								{errors.type}
							</p>
						)}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='description'>Description (Optional)</Label>
						<Textarea
							id='description'
							value={formData.description || ""}
							onChange={(e) => handleInputChange("description", e.target.value)}
							placeholder='What does this column store?'
							rows={2}
						/>
					</div>
				</div>

				{/* Constraints */}
				<div className='space-y-4'>
					<div className='flex items-center gap-2'>
						<Shield className='w-4 h-4 text-primary' />
						<h4 className='text-sm font-semibold'>Constraints</h4>
					</div>

					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<div className='space-y-0.5'>
								<Label className='text-sm font-normal'>Required</Label>
								<p className='text-xs text-muted-foreground'>Cannot be empty</p>
							</div>
							<Switch
								checked={formData.required || false}
								onCheckedChange={(checked) => handleInputChange("required", checked)}
							/>
						</div>

					<div className='flex items-center justify-between'>
						<div className='space-y-0.5'>
							<Label className='text-sm font-normal'>Unique</Label>
							<p className='text-xs text-muted-foreground'>No duplicates allowed</p>
						</div>
						<Switch
							checked={formData.unique || false}
							onCheckedChange={(checked) => handleInputChange("unique", checked)}
						/>
					</div>

					<div className='flex items-center justify-between'>
						<div className='space-y-0.5'>
							<Label className='text-sm font-normal'>Indexed</Label>
							<p className='text-xs text-muted-foreground'>Faster queries & sorting</p>
						</div>
						<Switch
							checked={formData.indexed || false}
							onCheckedChange={(checked) => handleInputChange("indexed", checked)}
						/>
					</div>

					<div className='flex items-center justify-between'>
						<div className='space-y-0.5'>
							<Label className='text-sm font-normal'>Searchable</Label>
							<p className='text-xs text-muted-foreground'>Include in global search</p>
						</div>
						<Switch
							checked={formData.searchable !== undefined ? formData.searchable : true}
							onCheckedChange={(checked) => handleInputChange("searchable", checked)}
						/>
					</div>

					<div className='flex items-center justify-between'>
						<div className='space-y-0.5'>
							<Label className='text-sm font-normal'>Hidden</Label>
							<p className='text-xs text-muted-foreground'>Hide from default views</p>
						</div>
						<Switch
							checked={formData.hidden || false}
							onCheckedChange={(checked) => handleInputChange("hidden", checked)}
						/>
					</div>

					<div className='flex items-center justify-between'>
						<div className='space-y-0.5'>
							<Label className='text-sm font-normal'>Read-Only</Label>
							<p className='text-xs text-muted-foreground'>Prevent user editing</p>
						</div>
						<Switch
							checked={formData.readOnly || false}
							onCheckedChange={(checked) => handleInputChange("readOnly", checked)}
						/>
					</div>
					</div>
				</div>

				{/* Reference Settings (only for reference type) */}
				{formData.type === "reference" && (
					<div className='space-y-4'>
						<div className='flex items-center gap-2'>
							<LinkIcon className='w-4 h-4 text-primary' />
							<h4 className='text-sm font-semibold'>Relationship</h4>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='referenceTableId'>Reference Table *</Label>
							<Select
								value={formData.referenceTableId?.toString() || ""}
								onValueChange={(value) => handleInputChange("referenceTableId", parseInt(value))}>
								<SelectTrigger className={cn(errors.referenceTableId && "border-destructive")}>
									<SelectValue placeholder='Select table' />
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
								<p className='text-sm text-destructive flex items-center gap-1'>
									<AlertCircle className='w-3 h-3' />
									{errors.referenceTableId}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Default Value */}
				<div className='space-y-4'>
					<div className='flex items-center gap-2'>
						<CheckCircle className='w-4 h-4 text-primary' />
						<h4 className='text-sm font-semibold'>Default Value</h4>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='defaultValue'>Default Value (Optional)</Label>
						<Input
							id='defaultValue'
							value={formData.defaultValue || ""}
							onChange={(e) => handleInputChange("defaultValue", e.target.value)}
							placeholder='Enter default value...'
						/>
						<p className='text-xs text-muted-foreground'>
							Applied when creating new rows
						</p>
					</div>
				</div>

				{/* Advanced Options - Collapsible */}
				<Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
					<CollapsibleTrigger asChild>
						<Button variant='ghost' className='w-full justify-between hover:bg-muted/50'>
							<div className='flex items-center gap-2'>
								<Code className='w-4 h-4' />
								<span className='text-sm font-semibold'>Advanced Options</span>
							</div>
							<div className='flex items-center gap-2'>
								<Badge variant='outline' className='text-xs'>
									Beta
								</Badge>
								<ChevronDown
									className={cn(
										"w-4 h-4 transition-transform duration-200",
										showAdvanced && "rotate-180",
									)}
								/>
							</div>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className='space-y-4 pt-4'>
						<p className='text-sm text-muted-foreground'>
							Advanced features like computed fields and validation rules coming soon.
						</p>
					</CollapsibleContent>
				</Collapsible>
			</CardContent>

			{/* Footer - Sticky */}
			<div className='sticky bottom-0 bg-card border-t border-border/20 p-4'>
				<div className='flex justify-end gap-3'>
					<Button variant='outline' onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSubmitting} className='bg-primary hover:bg-primary/90'>
						{isSubmitting ? (
							<>
								<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
								Saving...
							</>
						) : (
							<>
								<Save className='w-4 h-4 mr-2' />
								{isNewColumn ? "Create Column" : "Save Changes"}
							</>
						)}
					</Button>
				</div>
			</div>
		</Card>
	);
}

