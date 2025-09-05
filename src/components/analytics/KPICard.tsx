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
			transition={{ duration: 0.4, delay }}
			whileHover={{ 
				scale: 1.02,
				y: -2,
				transition: { duration: 0.2 }
			}}>
			<Card className='group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/60 border-border/20 hover:border-border/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm'>
				{/* Subtle gradient overlay */}
				<div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
				
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3 relative z-10'>
					<CardTitle className='text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-200'>
						{title}
					</CardTitle>
					<div
						className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${colorClasses[color]}`}>
						<Icon className='w-5 h-5' />
					</div>
				</CardHeader>
				<CardContent className='relative z-10'>
					<div className='flex items-baseline space-x-3'>
						<div className='text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-200'>
							{formatValue(value)}
							{unit && (
								<span className='text-lg font-normal text-muted-foreground ml-1'>
									{unit}
								</span>
							)}
						</div>
						{change !== undefined && (
							<Badge
								variant='secondary'
								className={`text-xs font-medium px-2 py-1 rounded-full shadow-sm ${getTrendColor(changeType)}`}>
								{getTrendIcon(changeType)}
								<span className='ml-1'>{Math.abs(change)}%</span>
							</Badge>
						)}
					</div>
					{description && (
						<p className='text-sm text-muted-foreground mt-2 group-hover:text-foreground/80 transition-colors duration-200'>{description}</p>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
};
