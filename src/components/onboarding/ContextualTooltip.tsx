/** @format */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
	X, 
	ChevronRight, 
	Info, 
	Lightbulb,
	ArrowRight,
	Sparkles
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { logger } from "@/lib/error-logger";

interface TooltipData {
	id: string;
	title: string;
	description: string;
	action?: {
		text: string;
		href?: string;
		onClick?: () => void;
	};
	type?: "info" | "tip" | "feature" | "warning";
	position?: "top" | "bottom" | "left" | "right";
	delay?: number;
}

interface ContextualTooltipProps {
	tooltip: TooltipData;
	isVisible: boolean;
	onClose: () => void;
	onAction?: () => void;
	targetElement?: HTMLElement | null;
}

/**
 * Contextual Tooltip Component
 * Shows helpful tips and information based on user context
 */
export function ContextualTooltip({ 
	tooltip, 
	isVisible, 
	onClose, 
	onAction,
	targetElement 
}: ContextualTooltipProps) {
	const { t } = useLanguage();
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [isAnimating, setIsAnimating] = useState(false);
	const tooltipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isVisible && targetElement) {
			updatePosition();
		}
	}, [isVisible, targetElement]);

	useEffect(() => {
		const handleResize = () => {
			if (isVisible && targetElement) {
				updatePosition();
			}
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("scroll", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("scroll", handleResize);
		};
	}, [isVisible, targetElement]);

	const updatePosition = () => {
		if (!targetElement || !tooltipRef.current) return;

		const rect = targetElement.getBoundingClientRect();
		const tooltipRect = tooltipRef.current.getBoundingClientRect();
		const viewport = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		let top = 0;
		let left = 0;

		// Calculate position based on tooltip type
		switch (tooltip.position || "bottom") {
			case "top":
				top = rect.top - tooltipRect.height - 12;
				left = rect.left + (rect.width - tooltipRect.width) / 2;
				break;
			case "bottom":
				top = rect.bottom + 12;
				left = rect.left + (rect.width - tooltipRect.width) / 2;
				break;
			case "left":
				top = rect.top + (rect.height - tooltipRect.height) / 2;
				left = rect.left - tooltipRect.width - 12;
				break;
			case "right":
				top = rect.top + (rect.height - tooltipRect.height) / 2;
				left = rect.right + 12;
				break;
		}

		// Ensure tooltip stays within viewport
		if (left < 12) left = 12;
		if (left + tooltipRect.width > viewport.width - 12) {
			left = viewport.width - tooltipRect.width - 12;
		}
		if (top < 12) top = 12;
		if (top + tooltipRect.height > viewport.height - 12) {
			top = viewport.height - tooltipRect.height - 12;
		}

		setPosition({ top, left });
	};

	const handleAction = () => {
		if (tooltip.action?.onClick) {
			tooltip.action.onClick();
		}
		onAction?.();
		onClose();
	};

	const getTypeIcon = () => {
		switch (tooltip.type) {
			case "tip":
				return <Lightbulb className="h-4 w-4 text-yellow-600" />;
			case "feature":
				return <Sparkles className="h-4 w-4 text-blue-600" />;
			case "warning":
				return <Info className="h-4 w-4 text-orange-600" />;
			default:
				return <Info className="h-4 w-4 text-blue-600" />;
		}
	};

	const getTypeColor = () => {
		switch (tooltip.type) {
			case "tip":
				return "border-yellow-200 bg-yellow-50";
			case "feature":
				return "border-blue-200 bg-blue-50";
			case "warning":
				return "border-orange-200 bg-orange-50";
			default:
				return "border-blue-200 bg-blue-50";
		}
	};

	if (!isVisible) return null;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-40" />
			
			{/* Tooltip */}
			<Card
				ref={tooltipRef}
				className={`fixed z-50 w-80 transition-all duration-300 ${
					isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
				} ${getTypeColor()}`}
				style={{
					top: `${position.top}px`,
					left: `${position.left}px`,
				}}
			>
				<CardContent className="p-4">
					{/* Header */}
					<div className="flex items-start justify-between mb-3">
						<div className="flex items-center gap-2">
							{getTypeIcon()}
							<Badge 
								variant="secondary" 
								className="text-xs"
							>
								{tooltip.type || "info"}
							</Badge>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-6 w-6 p-0"
						>
							<X className="h-3 w-3" />
						</Button>
					</div>

					{/* Content */}
					<div className="space-y-3">
						<h4 className="font-medium text-sm">{tooltip.title}</h4>
						<p className="text-sm text-muted-foreground">
							{tooltip.description}
						</p>

						{/* Action Button */}
						{tooltip.action && (
							<Button 
								size="sm" 
								onClick={handleAction}
								className="w-full"
							>
								{tooltip.action.text}
								<ArrowRight className="h-3 w-3 ml-1" />
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</>
	);
}

/**
 * Hook for managing contextual tooltips
 */
export function useContextualTooltips() {
	const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null);
	const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

	const showTooltip = (tooltip: TooltipData, element?: HTMLElement) => {
		setActiveTooltip(tooltip);
		setTargetElement(element || null);

		// Log tooltip display
		logger.info("Contextual tooltip displayed", {
			component: "ContextualTooltip",
			tooltipId: tooltip.id,
			tooltipType: tooltip.type,
		});
	};

	const hideTooltip = () => {
		setActiveTooltip(null);
		setTargetElement(null);
	};

	const showTooltipForElement = (elementId: string, tooltip: TooltipData) => {
		const element = document.getElementById(elementId);
		if (element) {
			showTooltip(tooltip, element);
		}
	};

	return {
		activeTooltip,
		targetElement,
		showTooltip,
		hideTooltip,
		showTooltipForElement,
	};
}

/**
 * Predefined tooltip templates
 */
export const TOOLTIP_TEMPLATES = {
	firstDatabase: {
		id: "first-database",
		title: "Create Your First Database",
		description: "Start by creating a database to organize your data. This will be your main container for related tables.",
		type: "feature" as const,
		action: {
			text: "Create Database",
			href: "/home/database/create",
		},
	},
	firstTable: {
		id: "first-table",
		title: "Add Your First Table",
		description: "Tables store your actual data. Define columns with different types to structure your information properly.",
		type: "tip" as const,
		action: {
			text: "Create Table",
			href: "/home/database/table/create",
		},
	},
	importData: {
		id: "import-data",
		title: "Import Your Data",
		description: "You can import data from CSV files or add entries manually. This saves time when setting up your database.",
		type: "tip" as const,
		action: {
			text: "Import Data",
			onClick: () => {
				// Trigger import modal
				const importButton = document.querySelector('[data-tour="import-data"]') as HTMLElement;
				importButton?.click();
			},
		},
	},
	inviteUsers: {
		id: "invite-users",
		title: "Invite Your Team",
		description: "Collaborate with your team by inviting users and setting appropriate permissions for each member.",
		type: "feature" as const,
		action: {
			text: "Invite Users",
			href: "/home/users",
		},
	},
	analytics: {
		id: "analytics",
		title: "View Your Analytics",
		description: "Track your data usage, monitor performance, and get insights about your platform usage.",
		type: "info" as const,
		action: {
			text: "View Analytics",
			href: "/home/analytics",
		},
	},
	upgrade: {
		id: "upgrade",
		title: "Upgrade Your Plan",
		description: "You're approaching your plan limits. Consider upgrading to unlock more features and higher limits.",
		type: "warning" as const,
		action: {
			text: "View Plans",
			href: "/pricing",
		},
	},
};
