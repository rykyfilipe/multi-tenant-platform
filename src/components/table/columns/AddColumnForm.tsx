/** @format */

"use client";

import { FormEvent, useCallback, useMemo } from "react";
import { ColumnSchema } from "@/types/database";
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
import Link from "next/link";

interface Props {
	newColumn: ColumnSchema | null;
	setNewColumn: (col: ColumnSchema | null) => void;
	onAdd: (e: FormEvent) => void;
	columnSchemaMeta: FieldMeta[];
}

type FieldType = "string" | "boolean" | readonly string[];

interface FieldMeta {
	key: keyof ColumnSchema;
	type: FieldType;
	required: boolean;
	label: string;
	placeholder?: string;
}

export default function AddColumnForm({
	newColumn,
	setNewColumn,
	onAdd,
	columnSchemaMeta,
}: Props) {
	// Initialize default column if null
	const currentColumn = useMemo(
		() =>
			newColumn || {
				name: "",
				type: "string" as const,
				required: false,
				primary: false,
				autoIncrement: false,
			},
		[newColumn],
	);

	// Optimized update function
	const updateColumn = useCallback(
		(key: keyof ColumnSchema, value: any) => {
			setNewColumn({
				...currentColumn,
				[key]: value,
			});
		},
		[currentColumn, setNewColumn],
	);

	// Handle boolean field changes
	const handleBooleanChange = useCallback(
		(key: keyof ColumnSchema, value: string) => {
			updateColumn(key, value === "true");
		},
		[updateColumn],
	);

	// Handle string field changes
	const handleStringChange = useCallback(
		(key: keyof ColumnSchema, value: string) => {
			updateColumn(key, value);
		},
		[updateColumn],
	);

	// Render boolean select field
	const renderBooleanField = useCallback(
		(field: FieldMeta) => {
			const value = currentColumn[field.key] as boolean;

			return (
				<div key={field.key} className='space-y-2'>
					<Label className='text-sm font-medium'>
						{field.label}
						{field.required && <span className='text-destructive ml-1'>*</span>}
					</Label>
					<Select
						value={String(value)}
						onValueChange={(val) => handleBooleanChange(field.key, val)}>
						<SelectTrigger>
							<SelectValue placeholder='Select option' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='false'>False</SelectItem>
							<SelectItem value='true'>True</SelectItem>
						</SelectContent>
					</Select>
				</div>
			);
		},
		[currentColumn, handleBooleanChange],
	);

	// Render enum select field
	const renderEnumField = useCallback(
		(field: FieldMeta) => {
			const value = currentColumn[field.key] as string;
			const options = field.type as readonly string[];

			return (
				<div key={field.key} className='space-y-2'>
					<Label className='text-sm font-medium'>
						{field.label}
						{field.required && <span className='text-destructive ml-1'>*</span>}
					</Label>
					<Select
						value={value}
						onValueChange={(val) => handleStringChange(field.key, val)}>
						<SelectTrigger>
							<SelectValue
								placeholder={`Select ${field.label.toLowerCase()}`}
							/>
						</SelectTrigger>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option} value={option}>
									{option.charAt(0).toUpperCase() + option.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			);
		},
		[currentColumn, handleStringChange],
	);

	// Render string input field
	const renderStringField = useCallback(
		(field: FieldMeta) => {
			const value = currentColumn[field.key] as string;

			return (
				<div key={field.key} className='space-y-2'>
					<Label className='text-sm font-medium'>
						{field.label}
						{field.required && <span className='text-destructive ml-1'>*</span>}
					</Label>
					<Input
						type='text'
						value={value || ""}
						onChange={(e) => handleStringChange(field.key, e.target.value)}
						placeholder={
							field.placeholder || `Enter ${field.label.toLowerCase()}`
						}
						required={field.required}
						className='w-full'
					/>
				</div>
			);
		},
		[currentColumn, handleStringChange],
	);

	// Render field based on type
	const renderField = useCallback(
		(field: FieldMeta) => {
			if (field.type === "boolean") {
				return renderBooleanField(field);
			}

			if (Array.isArray(field.type)) {
				return renderEnumField(field);
			}

			return renderStringField(field);
		},
		[renderBooleanField, renderEnumField, renderStringField],
	);

	// Form validation
	const isFormValid = useMemo(() => {
		return (
			currentColumn.name.trim().length > 0 && currentColumn.type.length > 0
		);
	}, [currentColumn]);

	return (
		<Card className='shadow-lg border-0 bg-gradient-to-br from-background to-muted/20'>
			<CardHeader className='pb-4'>
				<CardTitle className='text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>
					Create New Column
				</CardTitle>
				
			</CardHeader>
			<CardContent>
				<form onSubmit={onAdd} className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{columnSchemaMeta.map(renderField)}
					</div>

					{/* Logic validation warnings */}
					{currentColumn.autoIncrement && currentColumn.type !== "number" && (
						<div className='p-3 bg-warning/10 border border-warning/20 rounded-md'>
							<p className='text-sm text-warning-foreground'>
								⚠️ Auto increment is typically used with number types
							</p>
						</div>
					)}

					{currentColumn.primary && currentColumn.required === false && (
						<div className='p-3 bg-info/10 border border-info/20 rounded-md'>
							<p className='text-sm text-info-foreground'>
								💡 Primary keys are usually required
							</p>
						</div>
					)}

					<div className='flex justify-end space-x-3 pt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setNewColumn(null)}>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={!isFormValid}
							className='min-w-[120px]'>
							Add Column
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
