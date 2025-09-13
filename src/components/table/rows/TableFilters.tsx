/** @format */
"use client";

import { useState, useMemo, useEffect } from "react";
import { Row, Column, Table } from "@/types/database";
import { FilterConfig, ColumnType, FilterOperator } from "@/types/filtering-enhanced";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import {
	Filter,
	X,
	Search,
	Calendar as CalendarIcon,
	ChevronDown,
	ChevronUp,
	RotateCcw,
	PanelRightClose,
	PanelRightOpen,
	Info,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";
import { useOptimizedReferenceData } from "@/hooks/useOptimizedReferenceData";


interface TableFiltersProps {
	columns: Column[];
	rows: Row[];
	tables: Table[] | null;
	onFilterChange: (filteredRows: Row[]) => void;
	onApplyFilters?: (
		filters: FilterConfig[],
		globalSearch: string,
	) => Promise<void>;
	showToggleButton?: boolean;
	showSidebar?: boolean;
	setShowSidebar?: (show: boolean) => void;
	onActiveFiltersChange?: (count: number) => void;
	loading?: boolean;
	// External filter state to synchronize with
	currentFilters?: FilterConfig[];
	currentGlobalSearch?: string;
}

// Export the toggle button as a separate component
export function FilterToggleButton({
	showSidebar,
	setShowSidebar,
	activeFiltersCount,
}: {
	showSidebar: boolean;
	setShowSidebar: (show: boolean) => void;
	activeFiltersCount: number;
}) {
	return (
		<Button
			variant='outline'
			size='sm'
			onClick={() => setShowSidebar(!showSidebar)}
			className='shadow-sm bg-background/95 backdrop-blur-sm border-border/50'>
			{showSidebar ? (
				<PanelRightClose className='w-4 h-4' />
			) : (
				<PanelRightOpen className='w-4 h-4' />
			)}
			<span className='ml-2'>Filters</span>
			{activeFiltersCount > 0 && (
				<Badge variant='secondary' className='ml-2'>
					{activeFiltersCount}
				</Badge>
			)}
		</Button>
	);
}

export function TableFilters({
	columns,
	rows,
	tables,
	onFilterChange,
	onApplyFilters,
	showToggleButton = true,
	showSidebar: externalShowSidebar,
	setShowSidebar: externalSetSidebar,
	onActiveFiltersChange,
	loading = false,
	currentFilters = [],
	currentGlobalSearch = "",
}: TableFiltersProps) {
	const [showSidebar, setShowSidebar] = useState(externalShowSidebar ?? false);
	const [filters, setFilters] = useState<FilterConfig[]>([]);
	const [globalSearch, setGlobalSearch] = useState("");

	// Use optimized reference data hook
	const { referenceData, isLoading: referenceDataLoading } = useOptimizedReferenceData(tables);

	// Use external state if provided
	useEffect(() => {
		if (externalShowSidebar !== undefined) {
			setShowSidebar(externalShowSidebar);
		}
	}, [externalShowSidebar]);

	useEffect(() => {
		if (externalSetSidebar) {
			externalSetSidebar(showSidebar);
		}
	}, [showSidebar, externalSetSidebar]);

	// Synchronize local filter state with external props
	useEffect(() => {
		if (currentFilters && currentFilters.length > 0) {
			setFilters(currentFilters);
		}
		if (currentGlobalSearch !== undefined) {
			setGlobalSearch(currentGlobalSearch);
		}
	}, [currentFilters, currentGlobalSearch]);

	const applyFilters = async () => {
	
		
		if (onApplyFilters) {
			try {
				// Filter out empty filters before applying
				const validFilters = filters.filter(filter => {
					// Keep filters that don't require values (like "is_empty", "today", etc.)
					const operatorsWithoutValues = ["is_empty", "is_not_empty", "today", "yesterday", "this_week", "this_month", "this_year"];
					if (operatorsWithoutValues.includes(filter.operator)) {
						return true;
					}
					
					// For other operators, check if they have valid values
					return filter.value !== null && filter.value !== undefined && filter.value !== "";
				});
				
				await onApplyFilters(validFilters, globalSearch);
			} catch (error) {
				console.error("❌ TableFilters - applyFilters failed:", error);
			}
		} else {
			console.warn("⚠️ TableFilters - onApplyFilters not provided");
		}
	};

	const getUniqueValues = (columnId: number) => {
		const values = new Set<string>();
		if (!Array.isArray(rows)) return Array.from(values).sort();

		rows.forEach((row) => {
			if (row && row.cells && Array.isArray(row.cells)) {
				const cell = row.cells.find(
					(cell) => cell && cell.columnId === columnId,
				);
				if (cell?.value !== null && cell?.value !== undefined) {
					values.add(cell.value.toString());
				}
			}
		});
		return Array.from(values).sort();
	};

	const getReferenceOptions = (column: Column) => {
		if (
			column.type !== "reference" ||
			!column.referenceTableId ||
			!referenceData
		) {
			return [];
		}

		const tableReferenceData = referenceData[column.referenceTableId];
		if (!tableReferenceData || !Array.isArray(tableReferenceData)) {
			return [];
		}

		// Convert reference data to options format
		return tableReferenceData.map((item, index) => ({
			value: item.primaryKeyValue?.toString() || item.id?.toString() || `option_${index}`,
			label: item.displayValue || `Option ${index + 1}`,
		}));
	};

	const getOperators = (columnType: ColumnType | string) => {
		// Handle customArray as a special case since it's not in the enhanced types
		if (columnType === "customArray") {
			return ["equals", "not_equals", "is_empty", "is_not_empty"] as FilterOperator[];
		}
		
		// Cast to ColumnType for the switch statement
		const enhancedColumnType = columnType as ColumnType;
		
		switch (enhancedColumnType) {
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
				return ["equals", "not_equals", "is_empty", "is_not_empty"] as FilterOperator[];
			default:
				return ["equals", "not_equals", "is_empty", "is_not_empty"] as FilterOperator[];
		}
	};

	// Render filter value input based on column type
	const renderFilterValue = (filter: FilterConfig) => {
		const column = columns.find((col) => col.id === filter.columnId);
		if (!column) return null;

		// Handle operators that don't require user input
		if (!operatorRequiresValue(filter.operator)) {
			return (
				<div className='text-sm text-muted-foreground p-2 bg-muted/20 rounded border'>
					No input required for this filter
				</div>
			);
		}

		switch (column.type as ColumnType | string) {
			case USER_FRIENDLY_COLUMN_TYPES.text:
				if (filter.operator === "regex") {
					return (
						<div className='space-y-2'>
							<Input
								placeholder='Enter regex pattern...'
								value={String(filter.value || "")}
								onChange={(e) =>
									updateFilter(filter.id, "value", e.target.value)
								}
								className='w-full'
							/>
							<p className='text-xs text-muted-foreground'>
								Use regex patterns like: ^start, end$, [0-9]+, etc.
							</p>
						</div>
					);
				}
				return (
					<Input
						placeholder='Enter value...'
						value={String(filter.value || "")}
						onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
						className='w-full'
					/>
				);

			case USER_FRIENDLY_COLUMN_TYPES.number:
				if (
					filter.operator === "between" ||
					filter.operator === "not_between"
				) {
					return (
						<div className='flex flex-col gap-2 '>
							<Input
								placeholder='Min'
								type='number'
								value={String(filter.value || "")}
								onChange={(e) =>
									updateFilter(filter.id, "value", e.target.value)
								}
								className='w-full'
							/>
							<Input
								placeholder='Max'
								type='number'
								value={String(filter.secondValue || "")}
								onChange={(e) =>
									updateFilter(filter.id, "secondValue", e.target.value)
								}
								className='w-full'
							/>
						</div>
					);
				}
				return (
					<Input
						placeholder='Enter number...'
						type='number'
						value={String(filter.value || "")}
						onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
						className='w-full'
					/>
				);

			case USER_FRIENDLY_COLUMN_TYPES.yesNo:
				return (
					<Select
						value={filter.value?.toString() || ""}
						onValueChange={(value) =>
							updateFilter(filter.id, "value", value === "true")
						}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder='Select...' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='true'>Yes</SelectItem>
							<SelectItem value='false'>No</SelectItem>
						</SelectContent>
					</Select>
				);

			case USER_FRIENDLY_COLUMN_TYPES.date:
				if (
					filter.operator === "between" ||
					filter.operator === "not_between"
				) {
					return (
						<div className='flex flex-col gap-2'>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn(
											"w-full justify-start text-left font-normal",
											!filter.value && "text-muted-foreground",
										)}>
										<CalendarIcon className='mr-2 h-4 w-4' />
										{filter.value && typeof filter.value === 'string'
											? format(new Date(filter.value), "PPP")
											: "Start date"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar
										mode='single'
										selected={filter.value && typeof filter.value === 'string' ? new Date(filter.value) : undefined}
										onSelect={(date) =>
											updateFilter(filter.id, "value", date?.toISOString())
										}
									/>
								</PopoverContent>
							</Popover>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn(
											"w-full justify-start text-left font-normal",
											!filter.secondValue && "text-muted-foreground",
										)}>
										<CalendarIcon className='mr-2 h-4 w-4' />
										{filter.secondValue && typeof filter.secondValue === 'string'
											? format(new Date(filter.secondValue), "PPP")
											: "End date"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar
										mode='single'
										selected={
											filter.secondValue && typeof filter.secondValue === 'string'
												? new Date(filter.secondValue)
												: undefined
										}
										onSelect={(date) =>
											updateFilter(
												filter.id,
												"secondValue",
												date?.toISOString(),
											)
										}
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
								variant='outline'
								className={cn(
									"w-full justify-start text-left font-normal",
									!filter.value && "text-muted-foreground",
								)}>
								<CalendarIcon className='mr-2 h-4 w-4' />
								{filter.value && typeof filter.value === 'string'
									? format(new Date(filter.value), "PPP")
									: "Pick a date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-auto p-0'>
							<Calendar
								mode='single'
								selected={filter.value && typeof filter.value === 'string' ? new Date(filter.value) : undefined}
								onSelect={(date) =>
									updateFilter(filter.id, "value", date?.toISOString())
								}
							/>
						</PopoverContent>
					</Popover>
				);

			case USER_FRIENDLY_COLUMN_TYPES.link:
				const referenceOptions = getReferenceOptions(column);
				return (
					<Select
						value={filter.value?.toString() || ""}
						onValueChange={(value) => updateFilter(filter.id, "value", value)}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder={
								referenceDataLoading 
									? 'Loading options...' 
									: 'Select reference...'
							} />
						</SelectTrigger>
						<SelectContent>
							{referenceDataLoading ? (
								<SelectItem value="__loading__" disabled>
									Loading options...
								</SelectItem>
							) : referenceOptions.length === 0 ? (
								<SelectItem value="__no_options__" disabled>
									No options available
								</SelectItem>
							) : (
								referenceOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				);

			case USER_FRIENDLY_COLUMN_TYPES.customArray:
				if (!column.customOptions) return null;
				return (
					<Select
						value={String(filter.value || "")}
						onValueChange={(value) => updateFilter(filter.id, "value", value)}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder='Select option...' />
						</SelectTrigger>
						<SelectContent>
							{column.customOptions
								.filter(option => option && option.trim() !== "")
								.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				);

			default:
				return (
					<Input
						placeholder='Enter value...'
						value={String(filter.value || "")}
						onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
						className='w-full'
					/>
				);
		}
	};

	// Update filter value
	const updateFilter = (filterId: string, field: string, value: any) => {
		setFilters((prev) =>
			prev.map((filter) => {
				if (filter.id === filterId) {
					// Pentru câmpul value, înlocuiește null cu string gol
					if (field === "value" && value === null) {
						return { ...filter, [field]: "" };
					}
					return { ...filter, [field]: value };
				}
				return filter;
			}),
		);
	};

	// Check if operator requires a value
	const operatorRequiresValue = (operator: FilterOperator) => {
		return ![
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
		].includes(operator);
	};

	// Get operator description
	const getOperatorDescription = (operator: FilterOperator) => {
		const descriptions: Record<string, string> = {
			contains: "Text contains the specified value",
			not_contains: "Text does not contain the specified value",
			equals: "Exact match",
			not_equals: "Not equal to the specified value",
			starts_with: "Text starts with the specified value",
			ends_with: "Text ends with the specified value",
			regex: "Matches regular expression pattern",
			greater_than: "Greater than the specified number",
			greater_than_or_equal: "Greater than or equal to the specified number",
			less_than: "Less than the specified number",
			less_than_or_equal: "Less than or equal to the specified number",
			between: "Between two values (inclusive)",
			not_between: "Outside the range of two values",
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
	};

	// Add new filter
	const addFilter = () => {
		// Find the first column that doesn't already have a filter
		const usedColumnIds = filters.map((f) => f.columnId);
		const availableColumn =
			columns.find((col) => !usedColumnIds.includes(col.id)) || columns[0];

		if (!availableColumn) return;

		const newFilter: FilterConfig = {
			id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			columnId: availableColumn.id,
			columnName: availableColumn.name,
			columnType: availableColumn.type as ColumnType,
			operator: getOperators(availableColumn.type)[0],
			value: operatorRequiresValue(getOperators(availableColumn.type)[0])
				? "" // Folosește string gol în loc de null
				: undefined,
		};

		setFilters((prev) => [...prev, newFilter]);
	};

	// Remove filter
	const removeFilter = (filterId: string) => {
		setFilters((prev) => prev.filter((filter) => filter.id !== filterId));
	};

	// Clear all filters
	const clearAllFilters = () => {
		setFilters([]);
		setGlobalSearch("");

		// Trigger fetch without filters
		if (onApplyFilters) {
			onApplyFilters([], "");
		}
	};

	const activeFiltersCount = filters.length + (globalSearch ? 1 : 0);

	// Apply filters to rows - only for local filtering when server-side is not available
	const filteredRows = useMemo(() => {
		// If backend filtering is available, return rows as-is since they're already filtered
		if (onApplyFilters) {
			return rows;
		}

		// Fallback to local filtering if no backend support
		let result = [...rows];

		// Apply global search
		if (globalSearch.trim()) {
			const searchTerm = globalSearch.toLowerCase();
			result = result.filter((row) => {
				if (!row || !row.cells || !Array.isArray(row.cells)) return false;
				return row.cells.some((cell) => {
					if (!cell) return false;
					const column = columns.find((col) => col && col.id === cell.columnId);
					if (!column) return false;

					const cellValue = cell.value?.toString().toLowerCase() || "";
					return cellValue.includes(searchTerm);
				});
			});
		}

		// Apply column filters
		filters.forEach((filter) => {
			const column = columns.find((col) => col && col.id === filter.columnId);
			if (!column) return;

			result = result.filter((row) => {
				if (!row || !row.cells || !Array.isArray(row.cells)) return false;
				const cell = row.cells.find(
					(cell) => cell && cell.columnId === filter.columnId,
				);
				const cellValue = cell?.value;

				switch (filter.operator) {
					case "contains":
						return filter.value && typeof filter.value === 'string' ? cellValue
							?.toString()
							.toLowerCase()
							.includes(filter.value.toLowerCase()) : false;
					case "not_contains":
						return filter.value && typeof filter.value === 'string' ? !cellValue
							?.toString()
							.toLowerCase()
							.includes(filter.value.toLowerCase()) : false;
					case "equals":
						return cellValue === filter.value;
					case "not_equals":
						return cellValue !== filter.value;
					case "starts_with":
						return filter.value && typeof filter.value === 'string' ? cellValue
							?.toString()
							.toLowerCase()
							.startsWith(filter.value.toLowerCase()) : false;
					case "ends_with":
						return filter.value && typeof filter.value === 'string' ? cellValue
							?.toString()
							.toLowerCase()
							.endsWith(filter.value.toLowerCase()) : false;
					case "regex":
						try {
							return filter.value && typeof filter.value === 'string' ? new RegExp(filter.value, "i").test(cellValue?.toString() || "") : false;
						} catch {
							return false;
						}
					case "greater_than":
						return Number(cellValue) > Number(filter.value);
					case "greater_than_or_equal":
						return Number(cellValue) >= Number(filter.value);
					case "less_than":
						return Number(cellValue) < Number(filter.value);
					case "less_than_or_equal":
						return Number(cellValue) <= Number(filter.value);
					case "before":
						return filter.value && typeof filter.value === 'string' ? new Date(cellValue) < new Date(filter.value) : false;
					case "after":
						return filter.value && typeof filter.value === 'string' ? new Date(cellValue) > new Date(filter.value) : false;
					case "between":
						if ((column.type as ColumnType) === USER_FRIENDLY_COLUMN_TYPES.number) {
							const numValue = Number(cellValue);
							return (
								numValue >= Number(filter.value) &&
								numValue <= Number(filter.secondValue)
							);
						} else if ((column.type as ColumnType) === USER_FRIENDLY_COLUMN_TYPES.date) {
							const dateValue = new Date(cellValue);
							return (
								filter.value && typeof filter.value === 'string' && filter.secondValue && typeof filter.secondValue === 'string' &&
								dateValue >= new Date(filter.value) &&
								dateValue <= new Date(filter.secondValue)
							);
						}
						return true;
					case "not_between":
						if ((column.type as ColumnType) === USER_FRIENDLY_COLUMN_TYPES.number) {
							const numValue = Number(cellValue);
							return (
								numValue < Number(filter.value) ||
								numValue > Number(filter.secondValue)
							);
						} else if ((column.type as ColumnType) === USER_FRIENDLY_COLUMN_TYPES.date) {
							const dateValue = new Date(cellValue);
							return (
								filter.value && typeof filter.value === 'string' && filter.secondValue && typeof filter.secondValue === 'string' &&
								(dateValue < new Date(filter.value) ||
								dateValue > new Date(filter.secondValue))
							);
						}
						return true;
					case "today":
						const today = new Date();
						const cellDate = new Date(cellValue);
						return (
							cellDate.getDate() === today.getDate() &&
							cellDate.getMonth() === today.getMonth() &&
							cellDate.getFullYear() === today.getFullYear()
						);
					case "yesterday":
						const yesterday = new Date();
						yesterday.setDate(yesterday.getDate() - 1);
						const cellDateYesterday = new Date(cellValue);
						return (
							cellDateYesterday.getDate() === yesterday.getDate() &&
							cellDateYesterday.getMonth() === yesterday.getMonth() &&
							cellDateYesterday.getFullYear() === yesterday.getFullYear()
						);
					case "this_week":
						const now = new Date();
						const startOfWeek = new Date(now);
						startOfWeek.setDate(now.getDate() - now.getDay());
						startOfWeek.setHours(0, 0, 0, 0);
						const endOfWeek = new Date(startOfWeek);
						endOfWeek.setDate(startOfWeek.getDate() + 6);
						endOfWeek.setHours(23, 59, 59, 999);
						const cellDateWeek = new Date(cellValue);
						return cellDateWeek >= startOfWeek && cellDateWeek <= endOfWeek;
					case "this_month":
						const currentMonth = new Date();
						const cellDateMonth = new Date(cellValue);
						return (
							cellDateMonth.getMonth() === currentMonth.getMonth() &&
							cellDateMonth.getFullYear() === currentMonth.getFullYear()
						);
					case "this_year":
						const currentYear = new Date().getFullYear();
						const cellDateYear = new Date(cellValue);
						return cellDateYear.getFullYear() === currentYear;
					case "last_week":
						const nowLastWeek = new Date();
						const lastWeek = new Date(nowLastWeek);
						lastWeek.setDate(nowLastWeek.getDate() - 7);
						const startOfLastWeek = new Date(lastWeek);
						startOfLastWeek.setDate(lastWeek.getDate() - lastWeek.getDay());
						startOfLastWeek.setHours(0, 0, 0, 0);
						const endOfLastWeek = new Date(startOfLastWeek);
						endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
						const cellDateLastWeek = new Date(cellValue);
						return cellDateLastWeek >= startOfLastWeek && cellDateLastWeek < endOfLastWeek;
					case "last_month":
						const nowLastMonth = new Date();
						const lastMonth = new Date(nowLastMonth.getFullYear(), nowLastMonth.getMonth() - 1, 1);
						const endOfLastMonth = new Date(nowLastMonth.getFullYear(), nowLastMonth.getMonth(), 1);
						const cellDateLastMonth = new Date(cellValue);
						return cellDateLastMonth >= lastMonth && cellDateLastMonth < endOfLastMonth;
					case "last_year":
						const nowLastYear = new Date();
						const lastYear = new Date(nowLastYear.getFullYear() - 1, 0, 1);
						const endOfLastYear = new Date(nowLastYear.getFullYear(), 0, 1);
						const cellDateLastYear = new Date(cellValue);
						return cellDateLastYear >= lastYear && cellDateLastYear < endOfLastYear;
					case "is_empty":
						return (
							cellValue === null || cellValue === undefined || cellValue === ""
						);
					case "is_not_empty":
						return (
							cellValue !== null && cellValue !== undefined && cellValue !== ""
						);
					default:
						return true;
				}
			});
		});

		return result;
	}, [rows, filters, globalSearch, columns, onApplyFilters]);

	// Update filtered rows when filters change (only for local filtering)
	useEffect(() => {
		// REMOVED: Local filtering logic since we use server-side filtering
		// onFilterChange(filteredRows);
	}, [filteredRows, onFilterChange, onApplyFilters]);

	useEffect(() => {
		const activeFiltersCount = filters.length + (globalSearch ? 1 : 0);
		onActiveFiltersChange?.(activeFiltersCount);
	}, [filters, globalSearch, onActiveFiltersChange]);

	return (
		<>
			{/* Toggle Button - Inline Position */}
			{showToggleButton && (
				<FilterToggleButton
					showSidebar={showSidebar}
					setShowSidebar={setShowSidebar}
					activeFiltersCount={activeFiltersCount}
				/>
			)}

			{/* Sidebar */}
			<div
				className={cn(
					"fixed top-0 right-0 h-full w-80 bg-background/95 backdrop-blur-sm border-l border-border/50 shadow-xl transition-transform duration-300 ease-in-out z-40",
					showSidebar ? "translate-x-0" : "translate-x-full",
				)}>
				<div className='flex flex-col h-full'>
					{/* Header */}
					<div className='flex items-center justify-between p-4 border-b border-border/50'>
						<div className='flex items-center gap-2'>
							<Filter className='w-5 h-5 text-muted-foreground' />
							<h3 className='text-lg font-semibold'>Table Filters</h3>
						</div>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => setShowSidebar(false)}
							className='text-muted-foreground hover:text-foreground'>
							<X className='w-4 h-4' />
						</Button>
					</div>

					{/* Content */}
					<div className='flex-1 overflow-y-auto p-4 space-y-4'>
						{/* Global Search */}
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
							<Input
								placeholder='Search all columns...'
								value={globalSearch}
								onChange={(e) => setGlobalSearch(e.target.value)}
								className='pl-10'
							/>
						</div>

						{/* Quick Filters */}
						{columns.length > 0 && (
							<div className='space-y-2'>
								<h4 className='text-sm font-medium text-muted-foreground'>
									Quick Filters
								</h4>
								<div className='flex flex-wrap gap-1'>
									{columns.slice(0, 3).map((column, columnIndex) => {
										const uniqueValues = getUniqueValues(column.id).slice(0, 2);
										if (uniqueValues.length === 0) return null;

										return (
											<div
												key={`quick-filter-${column.id}-${columnIndex}`}
												className='flex flex-wrap gap-1'>
												{uniqueValues.map((value, valueIndex) => (
													<Button
														key={`quick-filter-${column.id}-${columnIndex}-${value}-${valueIndex}`}
														variant='outline'
														size='sm'
														onClick={() => {
															const newFilter: FilterConfig = {
																id: `quick-filter-${Date.now()}-${Math.random()
																	.toString(36)
																	.substr(2, 9)}`,
																columnId: column.id,
																columnName: column.name,
																columnType: column.type as ColumnType,
																operator: "equals" as FilterOperator,
																value: value,
															};
															setFilters((prev) => [...prev, newFilter]);
														}}
														className='text-xs h-6 px-2'>
														{column.name}: {String(value).slice(0, 10)}
														{String(value).length > 10 ? "..." : ""}
													</Button>
												))}
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Filters Section */}
						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<h4 className='text-sm font-medium text-muted-foreground'>
									Advanced Filters
								</h4>
								<div className='flex items-center gap-1'>
									{activeFiltersCount > 0 && (
										<Button
											variant='ghost'
											size='sm'
											onClick={clearAllFilters}
											disabled={loading}
											className='text-xs h-7 px-2 text-muted-foreground hover:text-foreground'>
											<RotateCcw className='w-3 h-3' />
										</Button>
									)}
								</div>
							</div>

							{/* Individual Filters */}
							<div className='space-y-3'>
								{filters.length === 0 ? (
									<div className='text-center text-muted-foreground py-4'>
										<p className='text-sm'>No filters applied</p>
										<p className='text-xs mt-1'>
											Click "Add Filter" to start filtering
										</p>
									</div>
								) : (
									<div className='space-y-3'>
										{filters.map((filter, filterIndex) => {
											const column = columns.find(
												(col) => col.id === filter.columnId,
											);
											if (!column) return null;

											return (
												<div
													key={filter.id}
													className='p-3 border border-border/20 rounded-lg bg-muted/20'>
													<div className='space-y-2'>
														{/* Column Selection */}
														<Select
															value={filter.columnId.toString()}
															onValueChange={(value) => {
																const newColumn = columns.find(
																	(col) => col.id === Number(value),
																);
																if (newColumn) {
																	const newOperator = getOperators(
																		newColumn.type,
																	)[0];
																	setFilters((prev) =>
																		prev.map((f) =>
																			f.id === filter.id
																				? {
																						...f,
																						columnId: newColumn.id,
																						columnName: newColumn.name,
																						columnType: newColumn.type as ColumnType,
																						operator: newOperator,
																						value: operatorRequiresValue(
																							newOperator,
																						)
																							? "" // Use empty string instead of null
																							: undefined,
																						secondValue: "", // Use empty string instead of null
																				  }
																				: f,
																		),
																	);
																}
															}}>
															<SelectTrigger className='w-full'>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{columns.map((col) => (
																	<SelectItem
																		key={col.id}
																		value={col.id.toString()}>
																		{col.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>

														{/* Operator Selection */}
														<Select
															value={filter.operator}
															onValueChange={(value) => {
																updateFilter(filter.id, "operator", value);
																// Clear value if operator doesn't require it
																if (!operatorRequiresValue(value as FilterOperator)) {
																	updateFilter(filter.id, "value", undefined);
																	updateFilter(filter.id, "secondValue", "");
																}
															}}>
															<SelectTrigger className='w-full'>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{getOperators(filter.columnType).map((op) => (
																	<SelectItem key={op} value={op}>
																		<div className='flex items-center justify-between w-full'>
																			<span>{op}</span>
																			{getOperatorDescription(op) && (
																				<TooltipProvider>
																					<Tooltip>
																						<TooltipTrigger asChild>
																							<Info className='w-3 h-3 text-muted-foreground ml-2' />
																						</TooltipTrigger>
																						<TooltipContent>
																							<p className='max-w-xs'>
																								{getOperatorDescription(op)}
																							</p>
																						</TooltipContent>
																					</Tooltip>
																				</TooltipProvider>
																			)}
																		</div>
																	</SelectItem>
																))}
															</SelectContent>
														</Select>

														{/* Value Input */}
														{renderFilterValue(filter)}

														{/* Remove Filter Button */}
														<Button
															variant='ghost'
															size='sm'
															onClick={() => removeFilter(filter.id)}
															disabled={loading}
															className='w-full text-muted-foreground hover:text-destructive'>
															<X className='w-4 h-4 mr-2' />
															Remove Filter
														</Button>
													</div>
												</div>
											);
										})}
									</div>
								)}

								<Button
									variant='outline'
									size='sm'
									onClick={addFilter}
									disabled={loading}
									className='w-full'>
									Add Filter
								</Button>
							</div>
						</div>

						{/* Filter Actions */}
						<div className='flex items-center gap-2 p-4 border-t border-border/20'>
							<Button
								onClick={applyFilters}
								disabled={
									!onApplyFilters ||
									(filters.length === 0 && !globalSearch.trim()) ||
									loading
								}
								className='flex-1 bg-primary hover:bg-primary/90'>
								{loading ? (
									<>
										<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
										Applying...
									</>
								) : (
									<>
										<Filter className='w-4 h-4 mr-2' />
										Apply Filters
									</>
								)}
							</Button>
						</div>
					</div>

					{/* Footer */}
					<div className='p-4 border-t border-border/50'>
						{activeFiltersCount > 0 && (
							<div className='text-sm text-muted-foreground text-center'>
								Showing {filteredRows.length} of {rows.length} rows
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Overlay */}
			{showSidebar && (
				<div
					className='fixed inset-0 bg-black/20 backdrop-blur-sm z-30'
					onClick={() => setShowSidebar(false)}
				/>
			)}
		</>
	);
}
