/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface AnalyticsChartProps {
	title: string;
	icon: LucideIcon;
	children: React.ReactNode;
	className?: string;
	delay?: number;
	description?: string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
	title,
	icon: Icon,
	children,
	className = "",
	delay = 0,
	description,
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
			className={`h-full ${className}`}>
			<Card className='group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/60 border-border/20 hover:border-border/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm h-full'>
				{/* Subtle gradient overlay */}
				<div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
				
				<CardHeader className='pb-4 relative z-10'>
					<CardTitle className='flex items-center gap-3 text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200'>
						<div className='p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300'>
							<Icon className='w-5 h-5 text-primary' />
						</div>
						{title}
					</CardTitle>
					{description && (
						<p className='text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-200'>
							{description}
						</p>
					)}
				</CardHeader>
				<CardContent className='relative z-10 h-full'>
					<div className='h-full min-h-[300px]'>
						{children}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
