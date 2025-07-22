/** @format */

"use client";

import { FormEvent, useCallback, useMemo } from "react";
import { ColumnSchema, Table } from "@/types/database";
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
	newColumn: ColumnSchema | null;
	setNewColumn: (col: ColumnSchema | null) => void;
	onAdd: (e: FormEvent) => void;
	tables: Table[] | null;
}

type FieldType = "string" | "boolean" | readonly string[];

interface FieldMeta {
	key: keyof ColumnSchema;
	type: FieldType;
	required: boolean;
	label: string;
	placeholder?: string;
	referenceOptions?: { value: number | string; label: string }[];
}

export default function AddColumnForm({
	newColumn,
	setNewColumn,
	onAdd,
	tables,
}: Props) {
	if (!tables) return null;

	const currentColumn = useMemo(
		() =>
			newColumn || {
				name: "",
				type: "string" as const,
				required: false,
				primary: false,
				autoIncrement: false,
				referenceTableId: undefined,
			},
		[newColumn],
	);

	const updateColumn = useCallback(
		(key: keyof ColumnSchema, value: any) => {
			setNewColumn({
				...currentColumn,
				[key]: value,
			});
		},
		[currentColumn, setNewColumn],
	);

	const handleBooleanChange = useCallback(
		(key: keyof ColumnSchema, value: string) => {
			updateColumn(key, value === "true");
		},
		[updateColumn],
	);

	const handleStringChange = useCallback(
		(key: keyof ColumnSchema, value: string) => {
			updateColumn(key, value);
		},
		[updateColumn],
	);

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

	const renderEnumField = useCallback(
		(field: FieldMeta) => {
			const value = currentColumn[field.key] as string;
			const options =
				field.referenceOptions ?? (field.type as readonly string[]);

			return (
				<div key={field.key} className='space-y-2'>
					<Label className='text-sm font-medium'>
						{field.label}
						{field.required && <span className='text-destructive ml-1'>*</span>}
					</Label>
					<Select
						value={value?.toString()}
						onValueChange={(val) =>
							updateColumn(field.key, isNaN(Number(val)) ? val : Number(val))
						}>
						<SelectTrigger>
							<SelectValue
								placeholder={`Select ${field.label.toLowerCase()}`}
							/>
						</SelectTrigger>
						<SelectContent>
							{options.map((option) => (
								<SelectItem
									key={
										typeof option === "string" ? option : String(option.value)
									}
									value={
										typeof option === "string" ? option : String(option.value)
									}>
									{typeof option === "string"
										? option.charAt(0).toUpperCase() + option.slice(1)
										: option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			);
		},
		[currentColumn, updateColumn],
	);

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

	const columnSchemaMeta: FieldMeta[] = useMemo(() => {
		const base: FieldMeta[] = [
			{
				key: "name",
				type: "string",
				required: true,
				label: "Column Name",
				placeholder: "Enter column name",
			},
			{
				key: "type",
				type: ["string", "number", "boolean", "date", "reference"] as const,
				required: true,
				label: "Data Type",
			},
			{
				key: "required",
				type: "boolean",
				required: false,
				label: "Required",
			},
			{
				key: "primary",
				type: "boolean",
				required: false,
				label: "Primary Key",
			},
			{
				key: "autoIncrement",
				type: "boolean",
				required: false,
				label: "Auto Increment",
			},
		];

		// Dacă e de tip "reference", adaugă un câmp nou
		if (currentColumn.type === "reference") {
			base.push({
				key: "referenceTableId",
				type: tables.map((t) => t.id.toString()) as readonly string[],
				required: true,
				label: "Reference Table",
				referenceOptions: tables.map((t) => ({
					value: t.id,
					label: t.name,
				})),
			});
		}

		return base;
	}, [currentColumn.type, tables]);

	const renderField = useCallback(
		(field: FieldMeta) => {
			if (field.type === "boolean") return renderBooleanField(field);
			if (Array.isArray(field.type)) return renderEnumField(field);
			return renderStringField(field);
		},
		[renderBooleanField, renderEnumField, renderStringField],
	);

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
