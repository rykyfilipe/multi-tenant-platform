/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "dashboard" | "cards" | "list";
	columns?: {
		mobile?: number;
		tablet?: number;
		desktop?: number;
		wide?: number;
	};
	gap?: "sm" | "md" | "lg" | "xl";
	animation?: boolean;
}

const gapVariants = {
	sm: "gap-2 sm:gap-3 md:gap-4",
	md: "gap-3 sm:gap-4 md:gap-6",
	lg: "gap-4 sm:gap-6 md:gap-8",
	xl: "gap-6 sm:gap-8 md:gap-12",
};

const variantClasses = {
	default: "grid",
	dashboard: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
	cards: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
	list: "grid grid-cols-1",
};

export function ResponsiveGrid({
	children,
	className,
	variant = "default",
	columns = {
		mobile: 1,
		tablet: 2,
		desktop: 3,
		wide: 4,
	},
	gap = "md",
	animation = true,
}: ResponsiveGridProps) {
	const gridClasses = cn(
		"w-full",
		variantClasses[variant],
		gapVariants[gap],
		className
	);

	// Generate responsive grid classes based on columns prop
	const responsiveClasses = cn(
		`grid-cols-${columns.mobile || 1}`,
		`sm:grid-cols-${columns.tablet || 2}`,
		`lg:grid-cols-${columns.desktop || 3}`,
		`xl:grid-cols-${columns.wide || 4}`
	);

	const finalClasses = cn(
		gridClasses,
		variant === "default" && responsiveClasses,
		className
	);

	if (animation) {
		return (
			<motion.div
				className={finalClasses}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, staggerChildren: 0.1 }}
			>
				{React.Children.map(children, (child, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: index * 0.1 }}
					>
						{child}
					</motion.div>
				))}
			</motion.div>
		);
	}

	return <div className={finalClasses}>{children}</div>;
}

interface ResponsiveCardProps {
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "elevated" | "outlined" | "glass";
	size?: "sm" | "md" | "lg" | "xl";
	hover?: boolean;
	clickable?: boolean;
	onClick?: () => void;
}

const cardVariants = {
	default: "bg-card border border-border/20 shadow-sm",
	elevated: "bg-card border border-border/20 shadow-lg hover:shadow-xl",
	outlined: "bg-card border-2 border-border shadow-none",
	glass: "bg-card/80 backdrop-blur-sm border border-border/20 shadow-lg",
};

const cardSizes = {
	sm: "p-3 sm:p-4",
	md: "p-4 sm:p-6",
	lg: "p-6 sm:p-8",
	xl: "p-8 sm:p-12",
};

export function ResponsiveCard({
	children,
	className,
	variant = "default",
	size = "md",
	hover = false,
	clickable = false,
	onClick,
}: ResponsiveCardProps) {
	const cardClasses = cn(
		"rounded-xl transition-all duration-300",
		cardVariants[variant],
		cardSizes[size],
		hover && "hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]",
		clickable && "cursor-pointer active:scale-95",
		className
	);

	if (clickable) {
		return (
			<motion.div
				className={cardClasses}
				onClick={onClick}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				transition={{ type: "spring", damping: 20, stiffness: 300 }}
			>
				{children}
			</motion.div>
		);
	}

	return <div className={cardClasses}>{children}</div>;
}

interface ResponsiveContainerProps {
	children: React.ReactNode;
	className?: string;
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
	padding?: "none" | "sm" | "md" | "lg" | "xl";
	centered?: boolean;
}

const maxWidthVariants = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	full: "max-w-full",
};

const paddingVariants = {
	none: "",
	sm: "p-3 sm:p-4",
	md: "p-4 sm:p-6",
	lg: "p-6 sm:p-8",
	xl: "p-8 sm:p-12",
};

export function ResponsiveContainer({
	children,
	className,
	maxWidth = "2xl",
	padding = "md",
	centered = true,
}: ResponsiveContainerProps) {
	const containerClasses = cn(
		"w-full",
		maxWidthVariants[maxWidth],
		paddingVariants[padding],
		centered && "mx-auto",
		className
	);

	return <div className={containerClasses}>{children}</div>;
}

interface ResponsiveStackProps {
	children: React.ReactNode;
	className?: string;
	direction?: "vertical" | "horizontal";
	spacing?: "none" | "sm" | "md" | "lg" | "xl";
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
	wrap?: boolean;
}

const spacingVariants = {
	none: "space-y-0",
	sm: "space-y-2 sm:space-y-3",
	md: "space-y-3 sm:space-y-4",
	lg: "space-y-4 sm:space-y-6",
	xl: "space-y-6 sm:space-y-8",
};

const horizontalSpacingVariants = {
	none: "space-x-0",
	sm: "space-x-2 sm:space-x-3",
	md: "space-x-3 sm:space-x-4",
	lg: "space-x-4 sm:space-x-6",
	xl: "space-x-6 sm:space-x-8",
};

const alignVariants = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
};

const justifyVariants = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
	evenly: "justify-evenly",
};

export function ResponsiveStack({
	children,
	className,
	direction = "vertical",
	spacing = "md",
	align = "start",
	justify = "start",
	wrap = false,
}: ResponsiveStackProps) {
	const stackClasses = cn(
		"flex",
		direction === "vertical" ? "flex-col" : "flex-row",
		direction === "vertical" ? spacingVariants[spacing] : horizontalSpacingVariants[spacing],
		alignVariants[align],
		justifyVariants[justify],
		wrap && "flex-wrap",
		className
	);

	return <div className={stackClasses}>{children}</div>;
}
