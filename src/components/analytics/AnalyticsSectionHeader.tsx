/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AnalyticsSectionHeaderProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	action?: React.ReactNode;
	className?: string;
}

export const AnalyticsSectionHeader: React.FC<AnalyticsSectionHeaderProps> = ({
	title,
	description,
	icon: Icon,
	action,
	className = "",
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className={`flex items-center justify-between ${className}`}>
			<div className='flex items-center gap-3'>
				{Icon && (
					<div className='p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm'>
						<Icon className='w-5 h-5 text-primary' />
					</div>
				)}
				<div>
					<h2 className='text-2xl font-bold text-foreground tracking-tight'>
						{title}
					</h2>
					{description && (
						<p className='text-muted-foreground font-medium mt-1'>
							{description}
						</p>
					)}
				</div>
			</div>
			{action && <div className='flex items-center gap-2'>{action}</div>}
		</motion.div>
	);
};
