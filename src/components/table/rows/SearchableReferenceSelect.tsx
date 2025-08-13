/** @format */

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferenceOption {
	id: number;
	displayValue: string;
	primaryKeyValue: any;
}

interface SearchableReferenceSelectProps {
	value: string;
	onValueChange: (value: string) => void;
	options: { id: number; displayValue: string; primaryKeyValue: any }[];
	placeholder?: string;
	className?: string;
	hasError?: boolean;
	referencedTableName?: string;
}

export function SearchableReferenceSelect({
	value,
	onValueChange,
	options,
	placeholder = "Select reference",
	className,
	hasError = false,
	referencedTableName,
}: SearchableReferenceSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Transform options to include primary key value
	const transformedOptions: ReferenceOption[] = useMemo(() => {
		return options.map((opt) => ({
			...opt,
			primaryKeyValue: opt.primaryKeyValue,
		}));
	}, [options]);

	// Filter options based on search term
	const filteredOptions = useMemo(() => {
		if (!searchTerm.trim()) return transformedOptions;

		const lowerSearchTerm = searchTerm.toLowerCase();
		return transformedOptions.filter(
			(option) =>
				option.displayValue.toLowerCase().includes(lowerSearchTerm) ||
				option.primaryKeyValue.toLowerCase().includes(lowerSearchTerm),
		);
	}, [transformedOptions, searchTerm]);

	// Find current selected option
	const selectedOption = transformedOptions.find(
		(opt) => opt.primaryKeyValue === value,
	);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setSearchTerm("");
				setHighlightedIndex(-1);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

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
						selectOption(filteredOptions[highlightedIndex]);
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

	const selectOption = (option: ReferenceOption) => {
		onValueChange(option.primaryKeyValue?.toString() || "");
		setIsOpen(false);
		setSearchTerm("");
		setHighlightedIndex(-1);
	};

	const clearSelection = () => {
		onValueChange("");
		setSearchTerm("");
	};

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			// Focus input when opening
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	};

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			{/* Main trigger button */}
			<div
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer",
					hasError && "border-destructive focus-within:ring-destructive",
					isOpen && "ring-2 ring-ring ring-offset-2",
				)}
				onClick={toggleDropdown}>
				<div className='flex-1 flex items-center'>
					{selectedOption ? (
						<span className='truncate' title={selectedOption.displayValue}>
							{selectedOption.displayValue}
						</span>
					) : (
						<span className='text-muted-foreground'>{placeholder}</span>
					)}
				</div>
				<div className='flex items-center gap-1'>
					{value && (
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-6 w-6 p-0 hover:bg-muted'
							onClick={(e) => {
								e.stopPropagation();
								clearSelection();
							}}>
							<X className='h-3 w-3' />
						</Button>
					)}
					{isOpen ? (
						<ChevronUp className='h-4 w-4 text-muted-foreground' />
					) : (
						<ChevronDown className='h-4 w-4 text-muted-foreground' />
					)}
				</div>
			</div>

			{/* Dropdown */}
			{isOpen && (
				<div className='absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg'>
					{/* Search input */}
					<div className='p-2 border-b border-border'>
						<div className='relative'>
							<Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input
								ref={inputRef}
								type='text'
								placeholder={`Search ${referencedTableName || "options"}...`}
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setHighlightedIndex(-1);
								}}
								className='pl-8 h-8'
								autoFocus
							/>
						</div>
					</div>

					{/* Options list */}
					<div
						ref={dropdownRef}
						className='max-h-60 overflow-auto p-1'
						role='listbox'>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option, index) => (
								<div
									key={option.id}
									className={cn(
										"relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
										"hover:bg-accent hover:text-accent-foreground",
										index === highlightedIndex &&
											"bg-accent text-accent-foreground",
										option.primaryKeyValue === value &&
											"bg-primary text-primary-foreground",
									)}
									onClick={() => selectOption(option)}
									role='option'
									aria-selected={option.primaryKeyValue === value}>
									<span className='truncate' title={option.displayValue}>
										{option.displayValue}
									</span>
								</div>
							))
						) : (
							<div className='px-2 py-4 text-center text-sm text-muted-foreground'>
								{searchTerm.trim() ? (
									<>
										No results found for "{searchTerm}"
										<br />
										<span className='text-xs'>Try a different search term</span>
									</>
								) : (
									`No ${referencedTableName || "options"} available`
								)}
							</div>
						)}
					</div>

					{/* Footer info */}
					{filteredOptions.length > 0 && (
						<div className='border-t border-border px-2 py-1 text-xs text-muted-foreground'>
							{filteredOptions.length} of {transformedOptions.length}{" "}
							{referencedTableName || "items"}
							{searchTerm.trim() && ` matching "${searchTerm}"`}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
