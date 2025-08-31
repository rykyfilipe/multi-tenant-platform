/** @format */

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Search,
	ChevronDown,
	X,
	CheckCircle2,
	AlertCircle,
} from "lucide-react";
import {
	SemanticColumnType,
	SEMANTIC_TYPE_LABELS,
	SEMANTIC_TYPE_GROUPS,
	isRequiredForInvoices,
} from "@/lib/semantic-types";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface SemanticTypeSelectorProps {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	variant?: "default" | "compact";
}

export function SemanticTypeSelector({
	value,
	onChange,
	placeholder = "Choose semantic type...",
	className,
	variant = "default",
}: SemanticTypeSelectorProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTab, setSelectedTab] = useState("Produse");
	const [isOpen, setIsOpen] = useState(false);
	const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Filter semantic types based on search
	const filteredTypes = Object.entries(SEMANTIC_TYPE_LABELS).filter(
		([_, label]) => label.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	// Group filtered types by category
	const filteredGroups = Object.entries(SEMANTIC_TYPE_GROUPS).reduce(
		(acc, [groupName, types]) => {
			const filteredGroupTypes = types.filter((type) =>
				SEMANTIC_TYPE_LABELS[type]
					.toLowerCase()
					.includes(searchTerm.toLowerCase()),
			);

			if (filteredGroupTypes.length > 0) {
				acc[groupName] = filteredGroupTypes;
			}

			return acc;
		},
		{} as Record<string, SemanticColumnType[]>,
	);

	const handleTypeSelect = (semanticType: string) => {
		onChange(semanticType);
		setIsOpen(false);
		setSearchTerm("");
	};

	const getSelectedTypeLabel = () => {
		if (!value) return placeholder;
		return SEMANTIC_TYPE_LABELS[value as SemanticColumnType] || value;
	};

	const isRequired = value
		? isRequiredForInvoices(value as SemanticColumnType)
		: false;

	const handleClear = () => {
		onChange("");
		setSearchTerm("");
	};

	// Focus search input when popover opens
	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			setTimeout(() => searchInputRef.current?.focus(), 100);
		}
	}, [isOpen]);

	// Detect optimal placement based on available space
	useEffect(() => {
		if (isOpen) {
			const rect = searchInputRef.current?.getBoundingClientRect();
			if (rect) {
				const spaceBelow = window.innerHeight - rect.bottom;
				const spaceAbove = rect.top;
				setPlacement(spaceBelow >= 350 ? "bottom" : "top");
			}
		}
	}, [isOpen]);

	// Compact variant for inline editing
	if (variant === "compact") {
		return (
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						role='combobox'
						aria-expanded={isOpen}
						className='w-full justify-between h-9 px-3 text-sm'>
						{value ? (
							<div className='flex items-center gap-2'>
								<Badge
									variant={isRequired ? "destructive" : "secondary"}
									className='text-xs'>
									{getSelectedTypeLabel()}
								</Badge>
								{isRequired && (
									<AlertCircle className='w-3 h-3 text-orange-600' />
								)}
							</div>
						) : (
							<span className='text-muted-foreground'>{placeholder}</span>
						)}
						<ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className='w-[350px] max-w-[90vw] p-0 z-50'
					align='start'
					side={placement}
					sideOffset={4}
					avoidCollisions={true}
					collisionPadding={8}
					style={{ maxHeight: "80vh" }}>
					<div className='p-3 border-b'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
							<Input
								ref={searchInputRef}
								placeholder='Search semantic types...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='pl-10 pr-8'
							/>
							{searchTerm && (
								<Button
									variant='ghost'
									size='sm'
									onClick={() => setSearchTerm("")}
									className='absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0'>
									<X className='h-3 w-3' />
								</Button>
							)}
						</div>
					</div>

					<div className='max-h-[300px] overflow-y-auto '>
						<Tabs value={selectedTab} onValueChange={setSelectedTab}>
							<TabsList className='grid w-full grid-cols-3 h-20 '>
								{Object.keys(filteredGroups).map((groupName) => (
									<TabsTrigger
										key={groupName}
										value={groupName}
										className='text-xs'>
										{groupName}
									</TabsTrigger>
								))}
							</TabsList>

							{Object.entries(filteredGroups).map(([groupName, types]) => (
								<TabsContent key={groupName} value={groupName} className='mt-2'>
									<div className='space-y-1 p-2'>
										{types.map((semanticType) => {
											const label = SEMANTIC_TYPE_LABELS[semanticType];
											const isSelected = value === semanticType;
											const isRequiredType =
												isRequiredForInvoices(semanticType);

											return (
												<Button
													key={semanticType}
													variant={isSelected ? "default" : "ghost"}
													className={`w-full justify-start h-auto p-2 text-sm ${
														isSelected
															? "bg-primary text-primary-foreground"
															: ""
													}`}
													onClick={() => handleTypeSelect(semanticType)}>
													<div className='flex items-center gap-2 w-full'>
														<span className='truncate'>{label}</span>
														{isRequiredType && (
															<Badge
																variant='outline'
																className='text-orange-600 border-orange-600 ml-auto text-xs px-2 py-1'>
																Required
															</Badge>
														)}
														{isSelected && (
															<CheckCircle2 className='w-4 h-4 ml-auto' />
														)}
													</div>
												</Button>
											);
										})}
									</div>
								</TabsContent>
							))}
						</Tabs>
					</div>

					{value && (
						<div className='p-3 border-t bg-muted/30'>
							<Button
								variant='ghost'
								size='sm'
								onClick={handleClear}
								className='w-full text-muted-foreground'>
								Clear selection
							</Button>
						</div>
					)}
				</PopoverContent>
			</Popover>
		);
	}

	// Default variant (original implementation for backward compatibility)
	return (
		<div className={className}>
			<Label className='text-sm font-medium mb-2 block'>
				What does this column represent?
			</Label>

			{/* Selected Value Display */}
			{value && (
				<div className='mb-4 p-3 bg-muted/50 rounded-lg border'>
					<div className='flex items-center gap-2'>
						<CheckCircle2 className='w-4 h-4 text-green-600' />
						<span className='font-medium'>Selected semantic type:</span>
						<Badge variant={isRequired ? "destructive" : "secondary"}>
							{getSelectedTypeLabel()}
						</Badge>
						{isRequired && (
							<Badge
								variant='outline'
								className='text-orange-600 border-orange-600'>
								<AlertCircle className='w-3 h-3 mr-1' />
								Required for invoices
							</Badge>
						)}
					</div>
					<p className='text-sm text-muted-foreground mt-1'>
						This column will be automatically recognized as "
						{getSelectedTypeLabel()}" in the invoice system, regardless of its
						name.
					</p>
				</div>
			)}

			{/* Search Input */}
			<div className='relative mb-4'>
				<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
				<Input
					placeholder='Search semantic type...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className='pl-10'
				/>
			</div>

			{/* Semantic Types Selection */}
			<Tabs
				value={selectedTab}
				onValueChange={setSelectedTab}
				className='w-full'>
				<TabsList className='grid w-full grid-cols-3'>
					{Object.keys(filteredGroups).map((groupName) => (
						<TabsTrigger key={groupName} value={groupName} className='text-xs'>
							{groupName}
						</TabsTrigger>
					))}
				</TabsList>

				{Object.entries(filteredGroups).map(([groupName, types]) => (
					<TabsContent key={groupName} value={groupName} className='mt-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
							{types.map((semanticType) => {
								const label = SEMANTIC_TYPE_LABELS[semanticType];
								const isSelected = value === semanticType;
								const isRequiredType = isRequiredForInvoices(semanticType);

								return (
									<Button
										key={semanticType}
										variant={isSelected ? "default" : "outline"}
										className={`h-auto p-3 justify-start text-left ${
											isSelected ? "ring-2 ring-primary" : ""
										} ${isRequiredType ? "border-orange-300" : ""}`}
										onClick={() => handleTypeSelect(semanticType)}>
										<div className='flex flex-col items-start gap-1'>
											<div className='flex items-center gap-2'>
												<span className='font-medium'>{label}</span>
												{isRequiredType && (
													<Badge
														variant='outline'
														className='text-orange-600 border-orange-600 text-xs px-2 py-1'>
														Required
													</Badge>
												)}
											</div>
											<span className='text-xs text-muted-foreground font-mono'>
												{semanticType}
											</span>
										</div>
									</Button>
								);
							})}
						</div>
					</TabsContent>
				))}
			</Tabs>

			{/* Quick Actions */}
			<div className='mt-4 pt-4 border-t'>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={handleClear}
						className='text-muted-foreground'>
						Clear semantic type
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => setSearchTerm("")}
						className='text-muted-foreground'>
						Reset search
					</Button>
				</div>
			</div>
		</div>
	);
}
