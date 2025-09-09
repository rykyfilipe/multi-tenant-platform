/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Search, Filter, SortAsc, SortDesc } from "lucide-react";

interface MobileButtonProps {
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	size?: "sm" | "default" | "lg" | "icon";
	onClick?: () => void;
	disabled?: boolean;
	loading?: boolean;
	fullWidth?: boolean;
}

export function MobileButton({
	children,
	className,
	variant = "default",
	size = "default",
	onClick,
	disabled = false,
	loading = false,
	fullWidth = false,
}: MobileButtonProps) {
	const [isPressed, setIsPressed] = useState(false);

	const sizeClasses = {
		sm: "h-10 px-4 text-sm",
		default: "h-12 px-6 text-base",
		lg: "h-14 px-8 text-lg",
		icon: "h-12 w-12",
	};

	const buttonClasses = cn(
		"relative overflow-hidden transition-all duration-200",
		"active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20",
		"min-h-[44px] min-w-[44px]", // Minimum touch target size
		sizeClasses[size],
		fullWidth && "w-full",
		disabled && "opacity-50 cursor-not-allowed",
		className
	);

	return (
		<motion.div
			className={fullWidth ? "w-full" : "inline-block"}
			whileTap={{ scale: disabled ? 1 : 0.95 }}
			transition={{ type: "spring", damping: 20, stiffness: 300 }}
		>
			<Button
				variant={variant}
				size={size}
				onClick={onClick}
				disabled={disabled || loading}
				className={buttonClasses}
				onMouseDown={() => setIsPressed(true)}
				onMouseUp={() => setIsPressed(false)}
				onMouseLeave={() => setIsPressed(false)}
			>
				{loading && (
					<motion.div
						className="absolute inset-0 flex items-center justify-center"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
					</motion.div>
				)}
				<motion.div
					className={cn("flex items-center justify-center", loading && "opacity-0")}
					animate={{ opacity: loading ? 0 : 1 }}
				>
					{children}
				</motion.div>
			</Button>
		</motion.div>
	);
}

interface MobileInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	type?: "text" | "email" | "password" | "number" | "search";
	disabled?: boolean;
	error?: string;
	label?: string;
	required?: boolean;
}

export function MobileInput({
	value,
	onChange,
	placeholder,
	className,
	type = "text",
	disabled = false,
	error,
	label,
	required = false,
}: MobileInputProps) {
	const [isFocused, setIsFocused] = useState(false);

	const inputClasses = cn(
		"w-full h-12 px-4 text-base rounded-lg border transition-all duration-200",
		"focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
		"disabled:opacity-50 disabled:cursor-not-allowed",
		error ? "border-destructive" : "border-border",
		isFocused && "border-primary/50",
		className
	);

	return (
		<div className="space-y-2">
			{label && (
				<label className="text-sm font-medium text-foreground">
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
				</label>
			)}
			<motion.div
				className="relative"
				animate={{ scale: isFocused ? 1.02 : 1 }}
				transition={{ type: "spring", damping: 20, stiffness: 300 }}
			>
				<Input
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
					className={inputClasses}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
				/>
			</motion.div>
			{error && (
				<motion.p
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-sm text-destructive"
				>
					{error}
				</motion.p>
			)}
		</div>
	);
}

interface MobileCardProps {
	children: React.ReactNode;
	className?: string;
	title?: string;
	subtitle?: string;
	badge?: string;
	clickable?: boolean;
	onClick?: () => void;
	hover?: boolean;
}

export function MobileCard({
	children,
	className,
	title,
	subtitle,
	badge,
	clickable = false,
	onClick,
	hover = true,
}: MobileCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	const cardClasses = cn(
		"bg-card border border-border/20 rounded-xl transition-all duration-300",
		"p-4 sm:p-6",
		hover && "hover:shadow-lg hover:border-border/40",
		clickable && "cursor-pointer active:scale-95",
		className
	);

	return (
		<motion.div
			className={cardClasses}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			whileHover={clickable ? { scale: 1.02 } : {}}
			whileTap={clickable ? { scale: 0.98 } : {}}
			transition={{ type: "spring", damping: 20, stiffness: 300 }}
		>
			{(title || subtitle || badge) && (
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="space-y-1">
							{title && (
								<CardTitle className="text-lg font-semibold text-foreground">
									{title}
								</CardTitle>
							)}
							{subtitle && (
								<p className="text-sm text-muted-foreground">{subtitle}</p>
							)}
						</div>
						{badge && (
							<Badge variant="secondary" className="text-xs">
								{badge}
							</Badge>
						)}
					</div>
				</CardHeader>
			)}
			<CardContent className={cn((title || subtitle || badge) && "pt-0")}>
				{children}
			</CardContent>
		</motion.div>
	);
}

interface MobileSearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	onSearch?: (value: string) => void;
	showFilters?: boolean;
	onFilterClick?: () => void;
	showSort?: boolean;
	onSortClick?: () => void;
	sortDirection?: "asc" | "desc";
}

export function MobileSearchBar({
	value,
	onChange,
	placeholder = "Search...",
	className,
	onSearch,
	showFilters = false,
	onFilterClick,
	showSort = false,
	onSortClick,
	sortDirection = "asc",
}: MobileSearchBarProps) {
	const [isFocused, setIsFocused] = useState(false);

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && onSearch) {
			onSearch(value);
		}
	};

	return (
		<div className={cn("w-full", className)}>
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					onKeyPress={handleKeyPress}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					className="h-12 pl-10 pr-4 text-base rounded-lg border-border/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
				/>
				<div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
					{showFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onFilterClick}
							className="h-8 w-8 p-0 mobile-touch-feedback"
						>
							<Filter className="h-4 w-4" />
						</Button>
					)}
					{showSort && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onSortClick}
							className="h-8 w-8 p-0 mobile-touch-feedback"
						>
							{sortDirection === "asc" ? (
								<SortAsc className="h-4 w-4" />
							) : (
								<SortDesc className="h-4 w-4" />
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

interface MobileAccordionProps {
	title: string;
	children: React.ReactNode;
	className?: string;
	defaultOpen?: boolean;
	icon?: React.ReactNode;
}

export function MobileAccordion({
	title,
	children,
	className,
	defaultOpen = false,
	icon,
}: MobileAccordionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className={cn("border border-border/20 rounded-xl overflow-hidden", className)}>
			<Button
				variant="ghost"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full h-14 px-4 justify-between hover:bg-muted/50 mobile-touch-feedback"
			>
				<div className="flex items-center space-x-3">
					{icon && <div className="text-muted-foreground">{icon}</div>}
					<span className="font-medium text-foreground">{title}</span>
				</div>
				<motion.div
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.2 }}
				>
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				</motion.div>
			</Button>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className="p-4 border-t border-border/20">
							{children}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

interface MobileListProps {
	items: Array<{
		id: string;
		title: string;
		subtitle?: string;
		icon?: React.ReactNode;
		badge?: string;
		onClick?: () => void;
	}>;
	className?: string;
	emptyMessage?: string;
}

export function MobileList({
	items,
	className,
	emptyMessage = "No items found",
}: MobileListProps) {
	if (items.length === 0) {
		return (
			<div className={cn("text-center py-8", className)}>
				<p className="text-muted-foreground">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className={cn("space-y-2", className)}>
			{items.map((item) => (
				<motion.div
					key={item.id}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
					className="bg-card border border-border/20 rounded-lg p-4 hover:bg-muted/50 transition-colors duration-200"
				>
					<Button
						variant="ghost"
						onClick={item.onClick}
						className="w-full h-auto p-0 justify-start mobile-touch-feedback"
					>
						<div className="flex items-center space-x-3 w-full">
							{item.icon && (
								<div className="text-muted-foreground">{item.icon}</div>
							)}
							<div className="flex-1 text-left">
								<p className="font-medium text-foreground">{item.title}</p>
								{item.subtitle && (
									<p className="text-sm text-muted-foreground">{item.subtitle}</p>
								)}
							</div>
							{item.badge && (
								<Badge variant="secondary" className="text-xs">
									{item.badge}
								</Badge>
							)}
						</div>
					</Button>
				</motion.div>
			))}
		</div>
	);
}
