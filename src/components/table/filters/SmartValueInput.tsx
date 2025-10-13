/** @format */

import React from "react";
import { FilterConfig, ColumnType } from "@/types/filtering";
import { Column } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { operatorRequiresValue, requiresSecondValue } from "./utils/filterValidation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select";
import { useInfiniteReferenceData } from "@/hooks/useInfiniteReferenceData";

interface SmartValueInputProps {
	filter: FilterConfig;
	column: Column;
	onChange: (value: any, isSecondValue?: boolean) => void;
	referenceData?: any[];
	className?: string;
}

export const SmartValueInput: React.FC<SmartValueInputProps> = ({
	filter,
	column,
	onChange,
	referenceData = [],
	className,
}) => {
	// Don't render input for operators that don't require values
	if (!operatorRequiresValue(filter.operator)) {
		return (
			<div className={cn("text-sm text-muted-foreground p-2 bg-muted/20 rounded-md border border-dashed", className)}>
				No value needed
			</div>
		);
	}

	// Render based on column type
	switch (column.type as ColumnType | string) {
		case "text":
		case "string":
		case "email":
		case "url":
			return renderTextInput();

		case "number":
		case "integer":
		case "decimal":
			return renderNumberInput();

		case "boolean":
			return renderBooleanInput();

		case "date":
		case "datetime":
		case "time":
			return renderDateInput();

		case "reference":
			return renderReferenceInput();

		case "customArray":
			return renderCustomArrayInput();

		default:
			return renderTextInput();
	}

	function renderTextInput() {
		if (filter.operator === "regex") {
			return (
				<div className={cn("space-y-2", className)}>
					<Input
						placeholder="Enter regex pattern..."
						value={String(filter.value || "")}
						onChange={(e) => onChange(e.target.value)}
						className="font-mono text-sm"
					/>
					<p className="text-xs text-muted-foreground">
						Examples: ^start, end$, [0-9]+
					</p>
				</div>
			);
		}

		return (
			<Input
				placeholder="Enter text..."
				value={String(filter.value || "")}
				onChange={(e) => onChange(e.target.value)}
				className={className}
			/>
		);
	}

	function renderNumberInput() {
		if (requiresSecondValue(filter.operator)) {
			return (
				<div className={cn("flex gap-2", className)}>
					<Input
						type="number"
						placeholder="Min"
						value={String(filter.value || "")}
						onChange={(e) => {
							const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
							onChange(isNaN(numValue as number) ? null : numValue, false);
						}}
						className="flex-1"
					/>
					<Input
						type="number"
						placeholder="Max"
						value={String(filter.secondValue || "")}
						onChange={(e) => {
							const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
							onChange(isNaN(numValue as number) ? null : numValue, true);
						}}
						className="flex-1"
					/>
				</div>
			);
		}

		return (
			<Input
				type="number"
				placeholder="Enter number..."
				value={String(filter.value || "")}
				onChange={(e) => {
					const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
					onChange(isNaN(numValue as number) ? null : numValue);
				}}
				className={className}
				step={column.type === "decimal" ? "0.01" : "1"}
			/>
		);
	}

	function renderBooleanInput() {
		return (
			<ToggleGroup
				type="single"
				value={String(filter.value ?? "")}
				onValueChange={(value) => onChange(value === "true")}
				className={cn("grid grid-cols-2 w-full", className)}
			>
				<ToggleGroupItem
					value="true"
					className="data-[state=on]:bg-emerald-500 data-[state=on]:text-white"
				>
					Yes
				</ToggleGroupItem>
				<ToggleGroupItem
					value="false"
					className="data-[state=on]:bg-rose-500 data-[state=on]:text-white"
				>
					No
				</ToggleGroupItem>
			</ToggleGroup>
		);
	}

	function renderDateInput() {
		if (requiresSecondValue(filter.operator)) {
			return (
				<div className={cn("flex flex-col gap-2", className)}>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"justify-start text-left font-normal h-9",
									!filter.value && "text-muted-foreground",
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{filter.value && typeof filter.value === "string"
									? format(new Date(filter.value), "PPP")
									: "Start date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={
									filter.value && typeof filter.value === "string"
										? new Date(filter.value)
										: undefined
								}
								onSelect={(date) => onChange(date?.toISOString(), false)}
							/>
						</PopoverContent>
					</Popover>

					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"justify-start text-left font-normal h-9",
									!filter.secondValue && "text-muted-foreground",
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{filter.secondValue && typeof filter.secondValue === "string"
									? format(new Date(filter.secondValue), "PPP")
									: "End date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={
									filter.secondValue && typeof filter.secondValue === "string"
										? new Date(filter.secondValue)
										: undefined
								}
								onSelect={(date) => onChange(date?.toISOString(), true)}
							/>
						</PopoverContent>
					</Popover>
				</div>
			);
		}

		return (
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"justify-start text-left font-normal h-9",
							!filter.value && "text-muted-foreground",
							className,
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{filter.value && typeof filter.value === "string"
							? format(new Date(filter.value), "PPP")
							: "Pick a date"}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={
							filter.value && typeof filter.value === "string"
								? new Date(filter.value)
								: undefined
						}
						onSelect={(date) => onChange(date?.toISOString())}
					/>
				</PopoverContent>
			</Popover>
		);
	}

	function renderReferenceInput() {
		// Use infinite scroll hook for reference data
		const referenceTableId = column.referenceTableId;
		const {
			data: infiniteData,
			isLoading,
			hasMore,
			loadMore,
			search,
		} = useInfiniteReferenceData(referenceTableId, column.referenceTableColumns);

		// Map data to InfiniteScrollSelect format
		const options = infiniteData.map((item) => ({
			value: item.value,
			label: item.label,
		}));

		return (
			<InfiniteScrollSelect
				value={filter.value?.toString() || ""}
				onValueChange={(value) => onChange(value)}
				options={options}
				placeholder="Select reference..."
				searchPlaceholder="Search rows..."
				className={className}
				isLoading={isLoading}
				hasMore={hasMore}
				onLoadMore={loadMore}
				onSearch={search}
				emptyMessage="No rows found in referenced table"
			/>
		);
	}

	function renderCustomArrayInput() {
		if (!column.customOptions || column.customOptions.length === 0) {
			return (
				<Input
					placeholder="No options configured"
					value={String(filter.value || "")}
					disabled
					className={className}
				/>
			);
		}

		return (
			<Select
				value={String(filter.value || "")}
				onValueChange={(value) => onChange(value)}
			>
				<SelectTrigger className={cn("h-9", className)}>
					<SelectValue placeholder="Select option..." />
				</SelectTrigger>
				<SelectContent>
					{column.customOptions
						.filter((option) => option && option.trim() !== "")
						.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
				</SelectContent>
			</Select>
		);
	}
};

