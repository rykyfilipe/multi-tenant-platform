/** @format */

"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Search, X, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AbsoluteDropdown } from "@/components/ui/absolute-dropdown";

interface ReferenceOption {
	id: number;
	displayValue: string;
	rowData: any;
}

interface MultipleReferenceSelectProps {
	value: string[] | string | null;
	onValueChange: (value: string[] | string | null) => void;
	options: { id: number; displayValue: string; rowData: any }[];
	placeholder?: string;
	className?: string;
	hasError?: boolean;
	referencedTableName?: string;
	isMultiple: boolean;
	isLoading?: boolean;
	loadingError?: string | null;
	onValidationChange?: (isValid: boolean, invalidCount: number) => void;
}

export function MultipleReferenceSelect({
	value,
	onValueChange,
	options,
	placeholder = "Select reference",
	className,
	hasError = false,
	referencedTableName,
	isMultiple,
	isLoading = false,
	loadingError = null,
	onValidationChange,
}: MultipleReferenceSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Debounce search term for better performance
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 150); // 150ms delay for responsive feel

		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Transform options to include row data
	const transformedOptions: ReferenceOption[] = useMemo(() => {
		return options.map((opt) => ({
			...opt,
			rowData: opt.rowData,
		}));
	}, [options]);

	// Filter options based on search term - optimistic filtering with debounce
	const filteredOptions = useMemo(() => {
		if (!debouncedSearchTerm.trim()) return transformedOptions;

		const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
		return transformedOptions.filter(
			(option) =>
				option.displayValue.toLowerCase().includes(lowerSearchTerm) ||
				option.id?.toString().toLowerCase().includes(lowerSearchTerm) ||
				// Search in row data values too
				Object.values(option.rowData || {}).some(value => 
					value?.toString().toLowerCase().includes(lowerSearchTerm)
				),
		);
	}, [transformedOptions, debouncedSearchTerm]);

	// Handle multiple vs single selection
	const selectedValues = useMemo(() => {
		// For reference columns, always treat as multiple selection
		if (isMultiple) {
			if (Array.isArray(value)) {
				// Convert all values to strings for consistent comparison
				return value.map((val) => val?.toString() || "");
			}
			// If value is not an array but exists, convert to array of strings
			return value ? [value.toString()] : [];
		}
		// For single selection, always return array of strings
		return value ? [value.toString()] : [];
	}, [value, isMultiple]);

	// Find current selected options - filter only when options are available
	const selectedOptions = useMemo(() => {
		if (transformedOptions.length === 0) {
			// If options are not loaded yet, return empty array
			// This prevents the component from showing "no selection" when it should show selected values
			return [];
		}

		// Only return options that actually exist in the available options
		// Use ID for validation, compare as strings to handle type inconsistencies
		const filtered = transformedOptions.filter((opt) => {
			const optId = opt.id?.toString() || "";
			const isSelected = selectedValues.some(
				(val) => val?.toString() === optId,
			);

			return isSelected;
		});

		return filtered;
	}, [selectedValues, transformedOptions]);

	// Handle cases when value changes but options haven't been updated yet
	useEffect(() => {
		if (
			isMultiple &&
			Array.isArray(value) &&
			value.length > 0 &&
			transformedOptions.length > 0
		) {
			// Check if all selected values exist in options
			const missingValues = value.filter(
				(val) =>
					!transformedOptions.some(
						(opt) => opt.id?.toString() === val?.toString(),
					),
			);

			if (missingValues.length > 0) {
				console.warn(
					"MultipleReferenceSelect: Some selected values not found in options:",
					{
						missingValues,
						availableOptions: transformedOptions.map(
							(opt) => opt.id,
						),
						selectedValues: value,
					},
				);

				// Auto-clean invalid values to prevent API errors
				const validValues = value.filter((val) =>
					transformedOptions.some(
						(opt) => opt.id?.toString() === val?.toString(),
					),
				);

				if (validValues.length !== value.length) {
					onValueChange(validValues.length > 0 ? validValues : null);
				}
			}
		}
	}, [value, transformedOptions, isMultiple, onValueChange]);

	// Notify parent component of validation state changes
	useEffect(() => {
		if (onValidationChange && transformedOptions.length > 0) {
			const isValid = validateSelectedValues();
			const invalidCount =
				selectedValues.length - getValidSelectedValues().length;
			onValidationChange(isValid, invalidCount);
		}
	}, [selectedValues, transformedOptions, onValidationChange]);

	// Handle click outside to close dropdown - now handled by AbsoluteDropdown

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!isOpen) return;

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					setHighlightedIndex((prev) =>
						prev < filteredOptions.length - 1 ? prev + 1 : 0,
					);
					break;
				case "ArrowUp":
					event.preventDefault();
					setHighlightedIndex((prev) =>
						prev > 0 ? prev - 1 : filteredOptions.length - 1,
					);
					break;
				case "Enter":
					event.preventDefault();
					if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
						toggleOption(filteredOptions[highlightedIndex]);
					}
					break;
				case "Escape":
					event.preventDefault();
					setIsOpen(false);
					setSearchTerm("");
					setHighlightedIndex(-1);
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, highlightedIndex, filteredOptions]);

	// Auto-scroll to highlighted option
	useEffect(() => {
		if (highlightedIndex >= 0 && dropdownRef.current) {
			const highlightedElement = dropdownRef.current.children[
				highlightedIndex
			] as HTMLElement;
			if (highlightedElement) {
				highlightedElement.scrollIntoView({
					block: "nearest",
					behavior: "smooth",
				});
			}
		}
	}, [highlightedIndex]);

	const toggleOption = (option: ReferenceOption) => {
		// Pentru coloanele de tip reference, folosim ÎNTOTDEAUNA ID-ul rândului
		// Nu mai folosim primaryKeyValue - folosim ID-ul rândului pentru referințe
		const optionValue = option.id?.toString();

		if (!optionValue) {
			return;
		}

		if (isMultiple) {
			const isCurrentlySelected = selectedValues.some(
				(val) => val?.toString() === optionValue,
			);

			const newValues = isCurrentlySelected
				? selectedValues.filter((v) => v?.toString() !== optionValue)
				: [...selectedValues, optionValue]; // Store as string for consistency

			// Call onValueChange with the new values
			onValueChange(newValues as string[]);
		} else {
			// Single selection - replace current value
			onValueChange(optionValue);
			setIsOpen(false);
			setSearchTerm("");
			setHighlightedIndex(-1);
		}
	};

	// Validate that all selected values exist in available options
	const validateSelectedValues = () => {
		if (transformedOptions.length === 0) return true; // Can't validate yet

		const invalidValues = selectedValues.filter(
			(val) =>
				!transformedOptions.some(
					(opt) => opt.id?.toString() === val?.toString(),
				),
		);

		return invalidValues.length === 0;
	};

	// Get only valid selected values for API calls
	const getValidSelectedValues = () => {
		if (transformedOptions.length === 0) return selectedValues; // Can't validate yet

		const validValues = selectedValues.filter((val) =>
			transformedOptions.some(
				(opt) => opt.id?.toString() === val?.toString(),
			),
		);

		return validValues;
	};

	const clearSelection = () => {
		onValueChange(isMultiple ? [] : null);
		setSearchTerm("");
	};

	const removeOption = (optionValue: string) => {
		if (isMultiple) {
			const newValues = selectedValues.filter(
				(v) => v?.toString() !== optionValue,
			);

			if (newValues.length === 0) {
				onValueChange(null);
			} else {
				onValueChange(newValues as string[]);
			}
		}
	};

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			// Focus input when opening
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	};

	const getDisplayText = () => {
		if (isMultiple) {
			if (selectedValues.length === 0) {
				return placeholder;
			}

			// If we have selected values but options are not loaded yet, show the raw values
			if (selectedOptions.length === 0 && selectedValues.length > 0) {
				if (selectedValues.length === 1) {
					return selectedValues[0]?.toString() || "Selected value";
				}
				return `${selectedValues[0]?.toString() || "Value"} +${
					selectedValues.length - 1
				} more`;
			}

			// If we have fewer selected options than selected values, some values are invalid
			if (selectedOptions.length < selectedValues.length) {
				const validCount = selectedOptions.length;
				const invalidCount = selectedValues.length - validCount;
				if (validCount === 0) {
					return `⚠️ ${invalidCount} invalid reference${
						invalidCount !== 1 ? "s" : ""
					}`;
				}
				return `${selectedOptions[0]?.displayValue || selectedValues[0]} +${
					validCount - 1
				} more +${invalidCount} invalid`;
			}

			if (selectedOptions.length === 1) {
				return selectedOptions[0]?.displayValue || selectedValues[0];
			}
			// Show first item + count for better UX
			const firstItem = selectedOptions[0]?.displayValue || selectedValues[0];
			return `${firstItem} +${selectedOptions.length - 1} more`;
		}

		// Single selection
		if (selectedOptions.length > 0) {
			return selectedOptions[0].displayValue;
		}
		return placeholder;
	};

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			{/* Main trigger button */}
			<div
				className={cn(
					"flex h-auto min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer transition-all duration-200 hover:border-border/80 hover:shadow-sm",
					hasError && "border-destructive focus-within:ring-destructive",
					isOpen && "ring-2 ring-ring ring-offset-2 border-ring shadow-md",
				)}
				onClick={toggleDropdown}>
				<div className='flex-1 flex flex-wrap gap-1.5 items-center'>
					{isMultiple && selectedValues.length > 0 ? (
						<>
							{/* Show selected options if available, otherwise show raw values */}
							{(selectedOptions.length > 0
								? selectedOptions
							: selectedValues.map((val) => ({
									id: val,
									displayValue: val?.toString() || "Value",
									rowData: {},
							  }))
							)
								.slice(0, 3) // Show max 3 items to save space
								.map((option) => {
									// Check if this option is valid (exists in current options)
									// Use ID for validation, compare as strings
									const isValid = transformedOptions.some(
										(opt) =>
											opt.id?.toString() ===
											option.id?.toString(),
									);

									return (
										<Badge
											key={String(option.id)}
											variant={isValid ? "secondary" : "destructive"}
											className={cn(
												"text-xs max-w-[120px] truncate transition-colors group h-6 px-2",
												isValid
													? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
													: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
											)}
											onClick={(e) => {
												e.stopPropagation();
												removeOption(option.id?.toString() || "");
											}}>
											<span className='truncate text-xs'>
												{option.displayValue}
											</span>
											<X className='h-3 w-3 ml-1 cursor-pointer hover:text-destructive opacity-70 group-hover:opacity-100 transition-opacity' />
										</Badge>
									);
								})}
							{/* Show count of invalid references if any */}
							{selectedOptions.length < selectedValues.length && (
								<Badge
									variant='destructive'
									className='text-xs bg-destructive/10 text-destructive border-destructive/20 h-6 px-2'>
									⚠️ {selectedValues.length - selectedOptions.length} invalid
								</Badge>
							)}
							{/* Only show "more" badge if there are actually more than 3 selected options */}
							{selectedValues.length > 3 && (
								<Badge
									variant='outline'
									className='text-xs bg-muted/50 hover:bg-muted transition-colors h-6 px-2'>
									+{selectedValues.length - 3} more
								</Badge>
							)}
						</>
					) : (
						<span
							className={cn(
								selectedValues.length === 0 ? "text-muted-foreground" : "",
							)}>
							{getDisplayText()}
						</span>
					)}
				</div>
				<div className='flex items-center gap-1.5'>
					{selectedValues.length > 0 && (
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-6 w-6 p-0 hover:bg-muted/80 hover:text-muted-foreground transition-colors'
							onClick={(e) => {
								e.stopPropagation();
								clearSelection();
							}}>
							<X className='h-3 w-3' />
						</Button>
					)}
					{isOpen ? (
						<ChevronUp className='h-3.5 w-3.5 text-muted-foreground transition-transform duration-200' />
					) : (
						<ChevronDown className='h-3.5 w-3.5 text-muted-foreground transition-transform duration-200' />
					)}
				</div>
			</div>

			{/* Absolute Dropdown */}
			<AbsoluteDropdown
				isOpen={isOpen}
				onClose={() => {
					setIsOpen(false);
					setSearchTerm("");
					setHighlightedIndex(-1);
				}}
				triggerRef={containerRef}
				className="w-full min-w-[280px] max-w-[95vw] sm:max-w-[400px]"
				placement="bottom-start">
				{/* Search input */}
				<div className='p-2.5 border-b border-border bg-muted/30'>
					<div className='relative'>
						<Search className='absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
						<Input
							ref={inputRef}
							type='text'
							placeholder={`Search ${referencedTableName || "options"}...`}
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setHighlightedIndex(-1);
							}}
							className='pl-8 h-10 bg-background border-border/50 focus:border-primary text-base sm:text-sm'
							autoFocus
						/>
					</div>
				</div>

				{/* Options list */}
				<div
					ref={dropdownRef}
					className={cn(
						"overflow-auto p-2",
						// Standard height for dropdown - always show max 8 items
						"max-h-64 min-h-32",
					)}
					role='listbox'
					data-dropdown="true">
					{isLoading ? (
						<div className='px-3 py-8 text-center text-sm text-muted-foreground'>
							<div className='mb-3'>
								<div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto'></div>
							</div>
							Loading {referencedTableName || "options"}...
							<br />
							<span className='text-xs mt-1 text-muted-foreground/70'>
								Please wait while we fetch the data
							</span>
						</div>
					) : loadingError ? (
						<div className='px-3 py-8 text-center text-sm text-destructive'>
							<div className='mb-2 text-lg'>⚠️</div>
							Error loading {referencedTableName || "options"}
							<br />
							<span className='text-xs mt-1 text-muted-foreground/70'>
								{loadingError}
							</span>
						</div>
					) : filteredOptions.length > 0 ? (
						filteredOptions.map((option, index) => {
							const isSelected = selectedValues.some(
								(val) =>
									val?.toString() ===
									(option.id?.toString() || ""),
							);
							return (
								<div
									key={option.id}
									className={cn(
										"relative flex cursor-pointer select-none items-center rounded-md px-3 py-3 text-base sm:text-sm outline-none transition-all duration-200",
										"hover:bg-accent hover:text-accent-foreground",
										index === highlightedIndex &&
											"bg-accent text-accent-foreground ring-2 ring-primary/20",
										isSelected &&
											"bg-primary/10 text-primary border border-primary/20 shadow-sm",
									)}
									onClick={() => toggleOption(option)}
									role='option'
									aria-selected={isSelected}
									data-dropdown="true">
									{isMultiple && (
										<div className='mr-2.5 flex items-center justify-center w-4 h-4 rounded border-2 border-muted-foreground/30'>
											{isSelected && (
												<CheckIcon className='h-2.5 w-2.5 text-primary' />
											)}
										</div>
									)}
									<span
										className='truncate font-medium text-base sm:text-sm'
										title={option.displayValue}>
										{option.displayValue}
									</span>
								</div>
							);
						})
					) : (
						<div className='px-3 py-8 text-center text-sm text-muted-foreground'>
							{searchTerm.trim() ? (
								<>
									<div className='mb-2 text-lg'>🔍</div>
									No results found for "{searchTerm}"
									<br />
									<span className='text-xs mt-1 text-muted-foreground/70'>
										Try a different search term
									</span>
								</>
							) : (
								<>
									<div className='mb-2 text-lg'>📋</div>
									No {referencedTableName || "options"} available
								</>
							)}
						</div>
					)}
				</div>

				{/* Footer info */}
				{!isLoading &&
					!loadingError &&
					(filteredOptions.length > 0 || isOpen) && (
						<div className='border-t border-border px-2.5 py-2 text-xs text-muted-foreground bg-muted/20'>
							<div className='flex items-center justify-between'>
								{filteredOptions.length > 0 ? (
									<span>
										{filteredOptions.length} of {transformedOptions.length}{" "}
										{referencedTableName || "items"}
										{searchTerm.trim() && ` matching "${searchTerm}"`}
									</span>
								) : (
									<span>0 {referencedTableName || "items"} available</span>
								)}
								{isMultiple && selectedValues.length > 0 && (
									<div className='flex items-center gap-1.5'>
										{/* Show warning if there are invalid references */}
										{!validateSelectedValues() && (
											<span className='text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded-full text-xs'>
												⚠️{" "}
												{selectedValues.length -
													getValidSelectedValues().length}{" "}
												invalid
											</span>
										)}
										<span className='text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full text-xs'>
											{selectedValues.length} selected
										</span>
									</div>
								)}
							</div>
						</div>
					)}
				{/* Loading footer */}
				{isLoading && (
					<div className='border-t border-border px-2.5 py-2 text-xs text-muted-foreground bg-muted/20'>
						<div className='flex items-center gap-2'>
							<div className='w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin'></div>
							<span>Loading {referencedTableName || "data"}...</span>
						</div>
					</div>
				)}
			</AbsoluteDropdown>
		</div>
	);
}
