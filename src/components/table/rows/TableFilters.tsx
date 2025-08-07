/** @format */
"use client";

import { useState, useMemo, useEffect } from "react";
import { Row, Column, Table } from "@/types/database";
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
	Save,
	Bookmark,
	PanelRightClose,
	PanelRightOpen,
	Info,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { USER_FRIENDLY_COLUMN_TYPES } from "@/lib/columnTypes";

interface FilterConfig {
	columnId: number;
	columnName: string;
	columnType: string;
	operator: string;
	value: any;
	secondValue?: any; // For range filters
}

interface TableFiltersProps {
	columns: Column[];
	rows: Row[];
	tables: Table[] | null;
	onFilterChange: (filteredRows: Row[]) => void;
}

export function TableFilters({
	columns,
	rows,
	tables,
	onFilterChange,
}: TableFiltersProps) {
	const [filters, setFilters] = useState<FilterConfig[]>([]);
	const [showSidebar, setShowSidebar] = useState(false);
	const [globalSearch, setGlobalSearch] = useState("");
	const [filterPresets, setFilterPresets] = useState<
		{ name: string; filters: FilterConfig[]; globalSearch: string }[]
	>([]);
	const [showPresets, setShowPresets] = useState(false);

	// Get unique values for dropdown filters
	const getUniqueValues = (columnId: number) => {
		const values = new Set<any>();
		rows.forEach((row) => {
			const cell = row.cells?.find((cell) => cell.columnId === columnId);
			if (
				cell &&
				cell.value !== null &&
				cell.value !== undefined &&
				cell.value !== ""
			) {
				values.add(cell.value);
			}
		});
		return Array.from(values).sort();
	};

	// Get reference table options for link columns
	const getReferenceOptions = (column: Column) => {
		if (
			column.type !== USER_FRIENDLY_COLUMN_TYPES.link ||
			!column.referenceTableId
		) {
			return [];
		}

		const referencedTable = tables?.find(
			(t) => t.id === column.referenceTableId,
		);
		if (!referencedTable?.rows) return [];

		return referencedTable.rows.map((row) => {
			const primaryKeyCell = row.cells?.find((cell) => {
				const col = referencedTable.columns?.find(
					(c) => c.id === cell.columnId,
				);
				return col?.primary;
			});

			return {
				id: row.id,
				value: primaryKeyCell?.value || row.id,
				label: primaryKeyCell?.value || `Row ${row.id}`,
			};
		});
	};

	// Get operators based on column type
	const getOperators = (columnType: string) => {
		switch (columnType) {
			case USER_FRIENDLY_COLUMN_TYPES.text:
				return [
					{ value: "contains", label: "Contains" },
					{ value: "equals", label: "Equals" },
					{ value: "starts_with", label: "Starts with" },
					{ value: "ends_with", label: "Ends with" },
					{ value: "not_contains", label: "Does not contain" },
					{ value: "not_equals", label: "Does not equal" },
					{ value: "regex", label: "Matches regex" },
					{ value: "is_empty", label: "Is empty" },
					{ value: "is_not_empty", label: "Is not empty" },
				];
			case USER_FRIENDLY_COLUMN_TYPES.number:
				return [
					{ value: "equals", label: "Equals" },
					{ value: "not_equals", label: "Does not equal" },
					{ value: "greater_than", label: "Greater than" },
					{ value: "greater_than_or_equal", label: "Greater than or equal" },
					{ value: "less_than", label: "Less than" },
					{ value: "less_than_or_equal", label: "Less than or equal" },
					{ value: "between", label: "Between" },
					{ value: "not_between", label: "Not between" },
					{ value: "is_empty", label: "Is empty" },
					{ value: "is_not_empty", label: "Is not empty" },
				];
			case USER_FRIENDLY_COLUMN_TYPES.yesNo:
				return [
					{ value: "equals", label: "Equals" },
					{ value: "is_empty", label: "Is empty" },
					{ value: "is_not_empty", label: "Is not empty" },
				];
			case USER_FRIENDLY_COLUMN_TYPES.date:
				return [
					{ value: "equals", label: "Equals" },
					{ value: "not_equals", label: "Does not equal" },
					{ value: "before", label: "Before" },
					{ value: "after", label: "After" },
					{ value: "between", label: "Between" },
					{ value: "not_between", label: "Not between" },
					{ value: "today", label: "Today" },
					{ value: "yesterday", label: "Yesterday" },
					{ value: "this_week", label: "This week" },
					{ value: "this_month", label: "This month" },
					{ value: "this_year", label: "This year" },
					{ value: "is_empty", label: "Is empty" },
					{ value: "is_not_empty", label: "Is not empty" },
				];
			case USER_FRIENDLY_COLUMN_TYPES.link:
				return [
					{ value: "equals", label: "Equals" },
					{ value: "not_equals", label: "Does not equal" },
					{ value: "is_empty", label: "Is empty" },
					{ value: "is_not_empty", label: "Is not empty" },
				];
			case USER_FRIENDLY_COLUMN_TYPES.customArray:
				return [
					{ value: "equals", label: "Equals" },
					{ value: "not_equals", label: "Does not equal" },
					{ value: "contains", label: "Contains" },
					{ value: "not_contains", label: "Does not contain" },
					{ value: "is_empty", label: "Is empty" },
					{ value: "is_not_empty", label: "Is not empty" },
				];
			default:
				return [
					{ value: "equals", label: "Equals" },
					{ value: "not_equals", label: "Does not equal" },
					{ value: "is_empty", label: "Is empty" },
					{ value: "is_not_empty", label: "Is not empty" },
				];
		}
	};

	// Render filter value input based on column type
	const renderFilterValue = (filter: FilterConfig) => {
		const column = columns.find((col) => col.id === filter.columnId);
		if (!column) return null;

		switch (column.type) {
			case USER_FRIENDLY_COLUMN_TYPES.text:
				if (filter.operator === "regex") {
					return (
						<div className='space-y-2'>
							<Input
								placeholder='Enter regex pattern...'
								value={filter.value || ""}
								onChange={(e) =>
									updateFilter(filter.columnId, "value", e.target.value)
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
						value={filter.value || ""}
						onChange={(e) =>
							updateFilter(filter.columnId, "value", e.target.value)
						}
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
								value={filter.value || ""}
								onChange={(e) =>
									updateFilter(filter.columnId, "value", e.target.value)
								}
								className='w-full'
							/>
							<Input
								placeholder='Max'
								type='number'
								value={filter.secondValue || ""}
								onChange={(e) =>
									updateFilter(filter.columnId, "secondValue", e.target.value)
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
						value={filter.value || ""}
						onChange={(e) =>
							updateFilter(filter.columnId, "value", e.target.value)
						}
						className='w-full'
					/>
				);

			case USER_FRIENDLY_COLUMN_TYPES.yesNo:
				return (
					<Select
						value={filter.value?.toString() || ""}
						onValueChange={(value) =>
							updateFilter(filter.columnId, "value", value === "true")
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
				// Handle operators that don't require user input
				if (
					[
						"today",
						"yesterday",
						"this_week",
						"this_month",
						"this_year",
					].includes(filter.operator)
				) {
					return (
						<div className='text-sm text-muted-foreground p-2 bg-muted/20 rounded border'>
							No input required for this filter
						</div>
					);
				}

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
										{filter.value
											? format(new Date(filter.value), "PPP")
											: "Start date"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar
										mode='single'
										selected={filter.value ? new Date(filter.value) : undefined}
										onSelect={(date) =>
											updateFilter(
												filter.columnId,
												"value",
												date?.toISOString(),
											)
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
										{filter.secondValue
											? format(new Date(filter.secondValue), "PPP")
											: "End date"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar
										mode='single'
										selected={
											filter.secondValue
												? new Date(filter.secondValue)
												: undefined
										}
										onSelect={(date) =>
											updateFilter(
												filter.columnId,
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
								{filter.value
									? format(new Date(filter.value), "PPP")
									: "Pick a date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-auto p-0'>
							<Calendar
								mode='single'
								selected={filter.value ? new Date(filter.value) : undefined}
								onSelect={(date) =>
									updateFilter(filter.columnId, "value", date?.toISOString())
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
						onValueChange={(value) =>
							updateFilter(filter.columnId, "value", value)
						}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder='Select reference...' />
						</SelectTrigger>
						<SelectContent>
							{referenceOptions.map((option) => (
								<SelectItem key={option.id} value={option.value.toString()}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);

			case USER_FRIENDLY_COLUMN_TYPES.customArray:
				if (!column.customOptions) return null;
				return (
					<Select
						value={filter.value || ""}
						onValueChange={(value) =>
							updateFilter(filter.columnId, "value", value)
						}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder='Select option...' />
						</SelectTrigger>
						<SelectContent>
							{column.customOptions.map((option) => (
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
						value={filter.value || ""}
						onChange={(e) =>
							updateFilter(filter.columnId, "value", e.target.value)
						}
						className='w-full'
					/>
				);
		}
	};

	// Update filter value
	const updateFilter = (columnId: number, field: string, value: any) => {
		setFilters((prev) =>
			prev.map((filter) =>
				filter.columnId === columnId ? { ...filter, [field]: value } : filter,
			),
		);
	};

	// Check if operator requires a value
	const operatorRequiresValue = (operator: string) => {
		return ![
			"today",
			"yesterday",
			"this_week",
			"this_month",
			"this_year",
		].includes(operator);
	};

	// Get operator description
	const getOperatorDescription = (operator: string) => {
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
			this_month: "Date is in the current month",
			this_year: "Date is in the current year",
			is_empty: "Field is empty or null",
			is_not_empty: "Field has a value",
		};
		return descriptions[operator] || "";
	};

	// Add new filter
	const addFilter = () => {
		const firstColumn = columns[0];
		if (!firstColumn) return;

		const newFilter: FilterConfig = {
			columnId: firstColumn.id,
			columnName: firstColumn.name,
			columnType: firstColumn.type,
			operator: getOperators(firstColumn.type)[0].value,
			value: operatorRequiresValue(getOperators(firstColumn.type)[0].value)
				? null
				: undefined,
		};

		setFilters((prev) => [...prev, newFilter]);
	};

	// Remove filter
	const removeFilter = (columnId: number) => {
		setFilters((prev) => prev.filter((filter) => filter.columnId !== columnId));
	};

	// Clear all filters
	const clearAllFilters = () => {
		setFilters([]);
		setGlobalSearch("");
	};

	// Save current filter as preset
	const saveFilterPreset = () => {
		const presetName = prompt("Enter a name for this filter preset:");
		if (presetName && presetName.trim()) {
			const newPreset = {
				name: presetName.trim(),
				filters: [...filters],
				globalSearch: globalSearch,
			};
			setFilterPresets((prev) => [...prev, newPreset]);
		}
	};

	// Load filter preset
	const loadFilterPreset = (preset: {
		name: string;
		filters: FilterConfig[];
		globalSearch: string;
	}) => {
		setFilters(preset.filters);
		setGlobalSearch(preset.globalSearch);
		setShowPresets(false);
	};

	// Delete filter preset
	const deleteFilterPreset = (presetName: string) => {
		setFilterPresets((prev) => prev.filter((p) => p.name !== presetName));
	};

	// Apply filters to rows
	const filteredRows = useMemo(() => {
		let result = [...rows];

		// Apply global search
		if (globalSearch.trim()) {
			const searchTerm = globalSearch.toLowerCase();
			result = result.filter((row) => {
				return row.cells?.some((cell) => {
					const column = columns.find((col) => col.id === cell.columnId);
					if (!column) return false;

					const cellValue = cell.value?.toString().toLowerCase() || "";
					return cellValue.includes(searchTerm);
				});
			});
		}

		// Apply column filters
		filters.forEach((filter) => {
			const column = columns.find((col) => col.id === filter.columnId);
			if (!column) return;

			result = result.filter((row) => {
				const cell = row.cells?.find(
					(cell) => cell.columnId === filter.columnId,
				);
				const cellValue = cell?.value;

				switch (filter.operator) {
					case "contains":
						return cellValue
							?.toString()
							.toLowerCase()
							.includes(filter.value?.toLowerCase());
					case "not_contains":
						return !cellValue
							?.toString()
							.toLowerCase()
							.includes(filter.value?.toLowerCase());
					case "equals":
						return cellValue === filter.value;
					case "not_equals":
						return cellValue !== filter.value;
					case "starts_with":
						return cellValue
							?.toString()
							.toLowerCase()
							.startsWith(filter.value?.toLowerCase());
					case "ends_with":
						return cellValue
							?.toString()
							.toLowerCase()
							.endsWith(filter.value?.toLowerCase());
					case "regex":
						try {
							const regex = new RegExp(filter.value, "i");
							return regex.test(cellValue?.toString() || "");
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
						return new Date(cellValue) < new Date(filter.value);
					case "after":
						return new Date(cellValue) > new Date(filter.value);
					case "between":
						if (column.type === USER_FRIENDLY_COLUMN_TYPES.number) {
							const numValue = Number(cellValue);
							return (
								numValue >= Number(filter.value) &&
								numValue <= Number(filter.secondValue)
							);
						} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.date) {
							const dateValue = new Date(cellValue);
							return (
								dateValue >= new Date(filter.value) &&
								dateValue <= new Date(filter.secondValue)
							);
						}
						return true;
					case "not_between":
						if (column.type === USER_FRIENDLY_COLUMN_TYPES.number) {
							const numValue = Number(cellValue);
							return (
								numValue < Number(filter.value) ||
								numValue > Number(filter.secondValue)
							);
						} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.date) {
							const dateValue = new Date(cellValue);
							return (
								dateValue < new Date(filter.value) ||
								dateValue > new Date(filter.secondValue)
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
	}, [rows, filters, globalSearch, columns]);

	// Update filtered rows when filters change
	useEffect(() => {
		onFilterChange(filteredRows);
	}, [filteredRows, onFilterChange]);

	const activeFiltersCount = filters.length + (globalSearch ? 1 : 0);

	return (
		<>
			{/* Toggle Button - Fixed Position */}
			<Button
				variant='outline'
				size='sm'
				onClick={() => setShowSidebar(!showSidebar)}
				className='fixed top-4 right-4 z-50 shadow-lg bg-background/95 backdrop-blur-sm border-border/50'>
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
									{columns.slice(0, 3).map((column) => {
										const uniqueValues = getUniqueValues(column.id).slice(0, 2);
										if (uniqueValues.length === 0) return null;

										return (
											<div key={column.id} className='flex flex-wrap gap-1'>
												{uniqueValues.map((value) => (
													<Button
														key={`${column.id}-${value}`}
														variant='outline'
														size='sm'
														onClick={() => {
															const newFilter: FilterConfig = {
																columnId: column.id,
																columnName: column.name,
																columnType: column.type,
																operator: "equals",
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
											onClick={saveFilterPreset}
											className='text-xs h-7 px-2 text-muted-foreground hover:text-foreground'>
											<Save className='w-3 h-3' />
										</Button>
									)}
									{activeFiltersCount > 0 && (
										<Button
											variant='ghost'
											size='sm'
											onClick={clearAllFilters}
											className='text-xs h-7 px-2 text-muted-foreground hover:text-foreground'>
											<RotateCcw className='w-3 h-3' />
										</Button>
									)}
								</div>
							</div>

							{/* Filter Presets */}
							{filterPresets.length > 0 && (
								<div className='space-y-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => setShowPresets(!showPresets)}
										className='w-full justify-between'>
										<div className='flex items-center gap-2'>
											<Bookmark className='w-4 h-4' />
											Presets
										</div>
										{showPresets ? (
											<ChevronUp className='w-4 h-4' />
										) : (
											<ChevronDown className='w-4 h-4' />
										)}
									</Button>

									{showPresets && (
										<div className='space-y-2 pl-4'>
											{filterPresets.map((preset) => (
												<div
													key={preset.name}
													className='flex items-center justify-between p-2 border border-border/20 rounded-lg bg-muted/20'>
													<div className='flex-1 min-w-0'>
														<h5 className='font-medium text-xs truncate'>
															{preset.name}
														</h5>
														<p className='text-xs text-muted-foreground'>
															{preset.filters.length} filter(s)
														</p>
													</div>
													<div className='flex items-center gap-1'>
														<Button
															variant='outline'
															size='sm'
															onClick={() => loadFilterPreset(preset)}
															className='text-xs h-6 px-2'>
															Load
														</Button>
														<Button
															variant='ghost'
															size='sm'
															onClick={() => deleteFilterPreset(preset.name)}
															className='text-xs h-6 px-2 text-muted-foreground hover:text-destructive'>
															<X className='w-3 h-3' />
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}

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
										{filters.map((filter) => {
											const column = columns.find(
												(col) => col.id === filter.columnId,
											);
											if (!column) return null;

											return (
												<div
													key={filter.columnId}
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
																	)[0].value;
																	setFilters((prev) =>
																		prev.map((f) =>
																			f.columnId === filter.columnId
																				? {
																						...f,
																						columnId: newColumn.id,
																						columnName: newColumn.name,
																						columnType: newColumn.type,
																						operator: newOperator,
																						value: operatorRequiresValue(
																							newOperator,
																						)
																							? null
																							: undefined,
																						secondValue: null,
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
																updateFilter(
																	filter.columnId,
																	"operator",
																	value,
																);
																// Clear value if operator doesn't require it
																if (!operatorRequiresValue(value)) {
																	updateFilter(
																		filter.columnId,
																		"value",
																		undefined,
																	);
																	updateFilter(
																		filter.columnId,
																		"secondValue",
																		null,
																	);
																}
															}}>
															<SelectTrigger className='w-full'>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{getOperators(filter.columnType).map((op) => (
																	<SelectItem key={op.value} value={op.value}>
																		<div className='flex items-center justify-between w-full'>
																			<span>{op.label}</span>
																			{getOperatorDescription(op.value) && (
																				<TooltipProvider>
																					<Tooltip>
																						<TooltipTrigger asChild>
																							<Info className='w-3 h-3 text-muted-foreground ml-2' />
																						</TooltipTrigger>
																						<TooltipContent>
																							<p className='max-w-xs'>
																								{getOperatorDescription(
																									op.value,
																								)}
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
															onClick={() => removeFilter(filter.columnId)}
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
									className='w-full'>
									Add Filter
								</Button>
							</div>
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
