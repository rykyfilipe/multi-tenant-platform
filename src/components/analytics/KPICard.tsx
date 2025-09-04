/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
			return <TrendingUp className='w-3 h-3' />;
		case "decrease":
			return <TrendingDown className='w-3 h-3' />;
		default:
			return <Minus className='w-3 h-3' />;
	}
};

const getTrendColor = (type?: "increase" | "decrease" | "neutral") => {
	switch (type) {
		case "increase":
			return "text-green-600 bg-green-500/10";
		case "decrease":
			return "text-red-600 bg-red-500/10";
		default:
			return "text-gray-600 bg-gray-500/10";
	}
};

export const KPICard: React.FC<KPICardProps> = ({
	title,
	value,
	icon: Icon,
	change,
	changeType,
	unit,
	description,
	color = "blue",
	delay = 0,
}) => {
	const formatValue = (val: string | number) => {
		if (typeof val === "number") {
			if (val >= 1000000) {
				return `${(val / 1000000).toFixed(1)}M`;
			}
			if (val >= 10000) {
				return `${(val / 1000).toFixed(1)}K`;
			}
			return val.toLocaleString();
		}
		return val;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay }}
			whileHover={{ scale: 1.02 }}>
			<Card className='bg-card border-border hover:shadow-md transition-all duration-200'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium text-muted-foreground'>
						{title}
					</CardTitle>
					<div
						className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
						<Icon className='w-4 h-4' />
					</div>
				</CardHeader>
				<CardContent>
					<div className='flex items-baseline space-x-2'>
						<div className='text-2xl font-bold text-foreground'>
							{formatValue(value)}
							{unit && (
								<span className='text-sm font-normal text-muted-foreground ml-1'>
									{unit}
								</span>
							)}
						</div>
						{change !== undefined && (
							<Badge
								variant='secondary'
								className={`text-xs ${getTrendColor(changeType)}`}>
								{getTrendIcon(changeType)}
								<span className='ml-1'>{Math.abs(change)}%</span>
							</Badge>
						)}
					</div>
					{description && (
						<p className='text-xs text-muted-foreground mt-1'>{description}</p>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
};
