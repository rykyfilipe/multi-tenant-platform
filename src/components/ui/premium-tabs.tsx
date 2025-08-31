/** @format */

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Premium Tabs Root Component
function PremiumTabs({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot='premium-tabs'
			className={cn("flex flex-col gap-6", className)}
			{...props}
		/>
	);
}

// Premium Tabs List with enhanced styling
function PremiumTabsList({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
	variant?: "default" | "pills" | "underline" | "cards";
}) {
	const baseStyles = "inline-flex items-center justify-center";

	const variants = {
		default:
			"bg-gradient-to-r from-muted/50 to-muted rounded-2xl p-1.5 border border-border shadow-sm",
		pills: "bg-muted/20 rounded-2xl p-1.5 gap-2",
		underline: "bg-transparent border-b border-border",
		cards: "bg-transparent gap-3",
	};

	return (
		<TabsPrimitive.List
			data-slot='premium-tabs-list'
			className={cn(baseStyles, variants[variant], className)}
			{...props}
		/>
	);
}

// Premium Tabs Trigger with luxury animations
function PremiumTabsTrigger({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
	variant?: "default" | "pills" | "underline" | "cards";
}) {
	const baseStyles =
		"inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

	const variants = {
		default:
			"data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-xl border border-transparent data-[state=active]:border-primary/20 hover:bg-card/50 hover:scale-102",
		pills:
			"data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl px-6 py-2.5 hover:bg-primary/10 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground hover:scale-105",
		underline:
			"data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2 hover:text-primary/80",
		cards:
			"data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xl data-[state=active]:scale-105 rounded-2xl border border-border hover:bg-card/50 hover:scale-102 hover:shadow-lg",
	};

	return (
		<TabsPrimitive.Trigger
			data-slot='premium-tabs-trigger'
			className={cn(baseStyles, variants[variant], className)}
			{...props}
		/>
	);
}

// Premium Tabs Content with smooth transitions
function PremiumTabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot='premium-tabs-content'
			className={cn("flex-1 outline-none", className)}
			{...props}
		/>
	);
}

// Enhanced Tab Navigation Component for Sidebar-style layouts
function PremiumTabNavigation({
	tabs,
	activeTab,
	onTabChange,
	variant = "sidebar",
	className,
}: {
	tabs: Array<{
		id: string;
		label: string;
		icon?: React.ComponentType<{ className?: string }>;
		description?: string;
		badge?: string | number;
	}>;
	activeTab: string;
	onTabChange: (tabId: string) => void;
	variant?: "sidebar" | "horizontal" | "grid";
	className?: string;
}) {
	const variants = {
		sidebar: "flex flex-col space-y-2",
		horizontal: "flex flex-row space-x-2 overflow-x-auto pb-2",
		grid: "grid grid-cols-2 md:grid-cols-3 gap-3",
	};

	return (
		<div className={cn(variants[variant], className)}>
			<AnimatePresence mode='wait'>
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;
					const Icon = tab.icon;

					return (
						<motion.button
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={cn(
								"group relative w-full text-left transition-all duration-300 ease-out",
								"focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
								variant === "sidebar" && "px-4 py-3 rounded-2xl",
								variant === "horizontal" &&
									"px-4 py-2.5 rounded-xl whitespace-nowrap",
								variant === "grid" && "p-4 rounded-2xl border border-border",
							)}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}>
							{/* Active indicator */}
							{isActive && (
								<motion.div
									className='absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl'
									layoutId='activeTab'
									initial={false}
									transition={{ type: "spring", stiffness: 500, damping: 30 }}
								/>
							)}

							{/* Content */}
							<div className='relative flex items-center gap-3'>
								{Icon && (
									<div
										className={cn(
											"flex-shrink-0 p-2 rounded-xl transition-all duration-300",
											isActive
												? "bg-primary/20 text-primary"
												: "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
										)}>
										<Icon className='w-4 h-4' />
									</div>
								)}

								<div className='flex-1 min-w-0'>
									<div
										className={cn(
											"font-medium transition-colors duration-300",
											isActive
												? "text-primary"
												: "text-foreground group-hover:text-primary",
										)}>
										{tab.label}
									</div>
									{tab.description && (
										<div
											className={cn(
												"text-xs transition-colors duration-300 mt-0.5",
												isActive
													? "text-primary/70"
													: "text-muted-foreground group-hover:text-muted-foreground/80",
											)}>
											{tab.description}
										</div>
									)}
								</div>

								{tab.badge && (
									<div
										className={cn(
											"flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full transition-all duration-300",
											isActive
												? "bg-primary/20 text-primary"
												: "bg-muted text-muted-foreground",
										)}>
										{tab.badge}
									</div>
								)}
							</div>
						</motion.button>
					);
				})}
			</AnimatePresence>
		</div>
	);
}

// Tab Content Wrapper with animations
function PremiumTabContentWrapper({
	children,
	isActive,
	className,
}: {
	children: React.ReactNode;
	isActive: boolean;
	className?: string;
}) {
	return (
		<AnimatePresence mode='wait'>
			{isActive && (
				<motion.div
					key='tab-content'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{
						duration: 0.3,
						ease: [0.4, 0.0, 0.2, 1],
					}}
					className={cn("w-full", className)}>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export {
	PremiumTabs,
	PremiumTabsList,
	PremiumTabsTrigger,
	PremiumTabsContent,
	PremiumTabNavigation,
	PremiumTabContentWrapper,
};
