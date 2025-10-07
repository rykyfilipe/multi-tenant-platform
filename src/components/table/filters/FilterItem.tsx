/** @format */

import React, { useMemo } from "react";
import { FilterConfig, FilterOperator, ColumnType } from "@/types/filtering";
import { Column } from "@/types/database";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, AlertCircle, Info } from "lucide-react";
import { SmartValueInput } from "./SmartValueInput";
import { TypeIcon, getTypeColor, OperatorIcon, getOperatorLabel } from "./utils/filterIcons";
import {
	validateFilter,
	getFilterFieldError,
	operatorRequiresValue,
} from "./utils/filterValidation";
import { cn } from "@/lib/utils";

interface FilterItemProps {
	filter: FilterConfig;
	columns: Column[];
	onUpdate: (filterId: string, updates: Partial<FilterConfig>) => void;
	onRemove: (filterId: string) => void;
	onDuplicate?: (filter: FilterConfig) => void;
	referenceData?: Record<number, any[]>;
	className?: string;
}

// Get available operators for a column type
function getOperators(columnType: ColumnType | string): FilterOperator[] {
	switch (columnType) {
		case "string":
		case "text":
		case "email":
		case "url":
			return [
				"contains",
				"not_contains",
				"equals",
				"not_equals",
				"starts_with",
				"ends_with",
				"regex",
				"is_empty",
				"is_not_empty",
			] as FilterOperator[];
		case "number":
		case "integer":
		case "decimal":
			return [
				"equals",
				"not_equals",
				"greater_than",
				"greater_than_or_equal",
				"less_than",
				"less_than_or_equal",
				"between",
				"not_between",
				"is_empty",
				"is_not_empty",
			] as FilterOperator[];
		case "boolean":
			return ["equals", "not_equals", "is_empty", "is_not_empty"] as FilterOperator[];
		case "date":
		case "datetime":
		case "time":
			return [
				"equals",
				"not_equals",
				"before",
				"after",
				"between",
				"not_between",
				"today",
				"yesterday",
				"this_week",
				"last_week",
				"this_month",
				"last_month",
				"this_year",
				"last_year",
				"is_empty",
				"is_not_empty",
			] as FilterOperator[];
		case "reference":
		case "customArray":
			return ["equals", "not_equals", "is_empty", "is_not_empty"] as FilterOperator[];
		default:
			return ["equals", "not_equals", "is_empty", "is_not_empty"] as FilterOperator[];
	}
}

// Get operator description
function getOperatorDescription(operator: FilterOperator): string {
	const descriptions: Record<string, string> = {
		contains: "Text contains the specified value",
		not_contains: "Text does not contain the specified value",
		equals: "Exact match",
		not_equals: "Not equal to the specified value",
		starts_with: "Text starts with the specified value",
		ends_with: "Text ends with the specified value",
		regex: "Matches regular expression pattern",
		greater_than: "Greater than the specified number",
		greater_than_or_equal: "Greater than or equal to",
		less_than: "Less than the specified number",
		less_than_or_equal: "Less than or equal to",
		between: "Between two values (inclusive)",
		not_between: "Outside the range",
		before: "Date is before the specified date",
		after: "Date is after the specified date",
		today: "Date is today",
		yesterday: "Date is yesterday",
		this_week: "Date is in the current week",
		last_week: "Date is in the last week",
		this_month: "Date is in the current month",
		last_month: "Date is in the last month",
		this_year: "Date is in the current year",
		last_year: "Date is in the last year",
		is_empty: "Field is empty or null",
		is_not_empty: "Field has a value",
	};
	return descriptions[operator] || "";
}

export const FilterItem: React.FC<FilterItemProps> = ({
	filter,
	columns,
	onUpdate,
	onRemove,
	onDuplicate,
	referenceData = {},
	className,
}) => {
	const column = columns.find((col) => col.id === filter.columnId);
	const validation = useMemo(() => validateFilter(filter), [filter]);

	const handleColumnChange = (columnId: string) => {
		const newColumn = columns.find((col) => col.id === Number(columnId));
		if (!newColumn) return;

		const newOperator = getOperators(newColumn.type)[0];
		onUpdate(filter.id, {
			columnId: newColumn.id,
			columnName: newColumn.name,
			columnType: newColumn.type as ColumnType,
			operator: newOperator,
			value: operatorRequiresValue(newOperator) ? "" : undefined,
			secondValue: undefined,
		});
	};

	const handleOperatorChange = (operator: string) => {
		onUpdate(filter.id, {
			operator: operator as FilterOperator,
			value: operatorRequiresValue(operator as FilterOperator) ? (filter.value || "") : undefined,
			secondValue: undefined,
		});
	};

	const handleValueChange = (value: any, isSecondValue = false) => {
		onUpdate(filter.id, {
			[isSecondValue ? "secondValue" : "value"]: value,
		});
	};

	if (!column) return null;

	return (
		<div
			className={cn(
				"group relative p-3 rounded-lg border border-border/50 bg-card hover:border-primary/50 hover:shadow-sm transition-all",
				!validation.isValid && "border-destructive/50 bg-destructive/5",
				className,
			)}
		>
			{/* Main Grid Layout */}
			<div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_2.5fr_auto] gap-3 items-start">
				{/* Field Selector */}
				<div className="space-y-1.5">
					<Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Field
					</Label>
					<Select value={filter.columnId.toString()} onValueChange={handleColumnChange}>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{columns.map((col) => (
								<SelectItem key={col.id} value={col.id.toString()}>
									<div className="flex items-center gap-2">
										<TypeIcon type={col.type} className="w-4 h-4" />
										<span>{col.name}</span>
										<Badge
											variant="outline"
											className={cn("ml-auto text-xs", getTypeColor(col.type))}
										>
											{col.type}
										</Badge>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Operator Selector */}
				<div className="space-y-1.5">
					<Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Operator
					</Label>
					<Select value={filter.operator} onValueChange={handleOperatorChange}>
						<SelectTrigger className="h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{getOperators(filter.columnType).map((op) => (
								<SelectItem key={op} value={op}>
									<TooltipProvider delayDuration={200}>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex items-center w-full gap-2">
													<OperatorIcon operator={op} className="w-3.5 h-3.5" />
													<span className="capitalize flex-1">
														{getOperatorLabel(op)}
													</span>
													{getOperatorDescription(op) && (
														<Info className="w-3 h-3 text-muted-foreground ml-auto" />
													)}
												</div>
											</TooltipTrigger>
											<TooltipContent side="right" className="max-w-[200px]">
												<p className="text-xs">{getOperatorDescription(op)}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Value Input */}
				<div className="space-y-1.5">
					<Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Value
					</Label>
					<SmartValueInput
						filter={filter}
						column={column}
						onChange={handleValueChange}
						referenceData={
							column.type === "reference" && column.referenceTableId
								? referenceData[column.referenceTableId]
								: undefined
						}
					/>
				</div>

				{/* Actions */}
				<div className="flex items-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
					{onDuplicate && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-9 w-9 text-muted-foreground hover:text-primary"
										onClick={() => onDuplicate(filter)}
									>
										<Copy className="w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Duplicate filter</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 text-muted-foreground hover:text-destructive"
									onClick={() => onRemove(filter.id)}
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Remove filter</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>

			{/* Validation Errors */}
			{!validation.isValid && (
				<div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
					<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
					<span>
						{validation.errors.map((e) => e.message).join(", ")}
					</span>
				</div>
			)}

			{/* Validation Warnings */}
			{validation.warnings.length > 0 && (
				<div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
					<Info className="w-3.5 h-3.5 flex-shrink-0" />
					<span>{validation.warnings.join(", ")}</span>
				</div>
			)}
		</div>
	);
};

