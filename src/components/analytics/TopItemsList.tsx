/**
 * Top Items List Component
 * Ranked lists with avatars and status indicators
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TopItem {
	id: string;
	name: string;
	value: number | string;
	change?: number;
	changeType?: "increase" | "decrease" | "neutral";
	avatar?: string;
	icon?: LucideIcon;
	status?: "active" | "inactive" | "pending";
	description?: string;
}

interface TopItemsListProps {
	items: TopItem[];
	title?: string;
	description?: string;
	delay?: number;
	showRanking?: boolean;
	showChange?: boolean;
	maxItems?: number;
}

const getChangeIcon = (type?: "increase" | "decrease" | "neutral") => {
	switch (type) {
		case "increase":
			return <TrendingUp className="w-3 h-3 text-green-500" />;
		case "decrease":
			return <TrendingDown className="w-3 h-3 text-red-500" />;
		default:
			return <Minus className="w-3 h-3 text-gray-500" />;
	}
};

const getStatusColor = (status?: "active" | "inactive" | "pending") => {
	switch (status) {
		case "active":
			return "bg-green-500/10 text-green-600 border-green-500/20";
		case "inactive":
			return "bg-gray-500/10 text-gray-600 border-gray-500/20";
		case "pending":
			return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
		default:
			return "bg-gray-500/10 text-gray-600 border-gray-500/20";
	}
};

export const TopItemsList: React.FC<TopItemsListProps> = ({
	items,
	title = "Top Items",
	description,
	delay = 0,
	showRanking = true,
	showChange = true,
	maxItems = 10,
}) => {
	const displayItems = items.slice(0, maxItems);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold">{title}</CardTitle>
					{description && (
						<p className="text-sm text-muted-foreground">{description}</p>
					)}
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{displayItems.map((item, index) => (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.3, delay: delay + index * 0.1 }}
								className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
							>
								<div className="flex items-center space-x-3">
									{showRanking && (
										<div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
											{index + 1}
										</div>
									)}
									
									{item.avatar ? (
										<Avatar className="h-8 w-8">
											<AvatarImage src={item.avatar} alt={item.name} />
											<AvatarFallback>
												{item.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									) : item.icon ? (
										<div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
											<item.icon className="h-4 w-4" />
										</div>
									) : (
										<div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
											<span className="text-sm font-semibold">
												{item.name.charAt(0).toUpperCase()}
											</span>
										</div>
									)}
									
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{item.name}</p>
										{item.description && (
											<p className="text-xs text-muted-foreground truncate">
												{item.description}
											</p>
										)}
									</div>
								</div>
								
								<div className="flex items-center space-x-2">
									<span className="text-sm font-semibold">
										{typeof item.value === "number" ? item.value.toLocaleString() : item.value}
									</span>
									
									{item.status && (
										<Badge 
											variant="outline" 
											className={getStatusColor(item.status)}
										>
											{item.status}
										</Badge>
									)}
									
									{showChange && item.change !== undefined && (
										<div className="flex items-center space-x-1">
											{getChangeIcon(item.changeType)}
											<span className={`text-xs ${
												item.changeType === "increase" ? "text-green-600" :
												item.changeType === "decrease" ? "text-red-600" :
												"text-gray-600"
											}`}>
												{Math.abs(item.change)}%
											</span>
										</div>
									)}
								</div>
							</motion.div>
						))}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
