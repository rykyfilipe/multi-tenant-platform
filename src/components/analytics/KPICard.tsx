/**
 * KPI Card Component
 * Displays key performance indicators with trend information
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown, Zap } from "lucide-react";

interface KPICardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	change?: number;
	changeType?: "increase" | "decrease" | "neutral";
	unit?: string;
	description?: string;
	color?: "blue" | "green" | "orange" | "red" | "purple" | "gray";
	delay?: number;
	trend?: "up" | "down" | "stable";
}

const colorClasses = {
	blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
	green: "bg-green-500/10 text-green-600 border-green-500/20",
	orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
	red: "bg-red-500/10 text-red-600 border-red-500/20",
	purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
	gray: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const getTrendIcon = (type?: "increase" | "decrease" | "neutral") => {
	switch (type) {
		case "increase":
			return <TrendingUp className="w-3 h-3" />;
		case "decrease":
			return <TrendingDown className="w-3 h-3" />;
		default:
			return <Zap className="w-3 h-3" />;
	}
};

export const KPICard: React.FC<KPICardProps> = ({
	title,
	value,
	icon: Icon,
	change,
	changeType = "neutral",
	unit,
	description,
	color = "blue",
	delay = 0,
	trend,
}) => {
	const colorClass = colorClasses[color];

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
		>
			<Card className="relative overflow-hidden">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						{title}
					</CardTitle>
					<div className={`p-2 rounded-full ${colorClass}`}>
						<Icon className="h-4 w-4" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex items-center space-x-2">
							<span className="text-2xl font-bold">
								{typeof value === "number" ? value.toLocaleString() : value}
								{unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
							</span>
							{change !== undefined && (
								<Badge
									variant={changeType === "increase" ? "default" : changeType === "decrease" ? "destructive" : "secondary"}
									className="flex items-center space-x-1"
								>
									{getTrendIcon(changeType)}
									<span>{Math.abs(change)}%</span>
								</Badge>
							)}
						</div>
						{description && (
							<p className="text-xs text-muted-foreground">{description}</p>
						)}
						{trend && (
							<div className="flex items-center space-x-1 text-xs text-muted-foreground">
								{getTrendIcon(changeType)}
								<span className="capitalize">{trend}</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
