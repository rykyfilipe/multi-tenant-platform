/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LucideIcon } from "lucide-react";

interface TopItemsListProps {
	title: string;
	icon: LucideIcon;
	items: Array<{
		id?: string | number;
		name: string;
		value: string | number;
		subtitle?: string;
		status?: string;
		color?: "green" | "blue" | "orange" | "red" | "purple" | "gray";
	}>;
	delay?: number;
}

const statusColors = {
	online: "bg-green-500/10 text-green-600",
	offline: "bg-gray-500/10 text-gray-600",
	away: "bg-yellow-500/10 text-yellow-600",
	active: "bg-blue-500/10 text-blue-600",
	inactive: "bg-red-500/10 text-red-600",
};

export const TopItemsList: React.FC<TopItemsListProps> = ({
	title,
	icon: Icon,
	items,
	delay = 0,
}) => {
	const formatValue = (value: string | number): string => {
		if (typeof value === "number") {
			if (value >= 1000000) {
				return `${(value / 1000000).toFixed(1)}M`;
			}
			if (value >= 1000) {
				return `${(value / 1000).toFixed(1)}K`;
			}
			return value.toLocaleString();
		}
		return value;
	};

	const getInitials = (name: string): string => {
		return name
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}>
			<Card className='bg-card border-border'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2 text-foreground'>
						<Icon className='w-5 h-5' />
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{items.length > 0 ? (
						<div className='space-y-3'>
							{items.map((item, index) => (
								<motion.div
									key={item.id || index}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: delay + index * 0.1 }}
									className='flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/80 transition-colors'>
									<div className='flex items-center gap-3'>
										<div className='flex items-center justify-center'>
											<div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary'>
												#{index + 1}
											</div>
										</div>

										<div className='flex items-center gap-2'>
											{/* Avatar for users or icon for other items */}
											{item.subtitle?.includes("@") ? (
												<Avatar className='w-8 h-8'>
													<AvatarFallback className='text-xs'>
														{getInitials(item.name)}
													</AvatarFallback>
												</Avatar>
											) : null}

											<div>
												<div className='font-medium text-foreground text-sm'>
													{item.name}
												</div>
												{item.subtitle && (
													<div className='text-xs text-muted-foreground'>
														{item.subtitle}
													</div>
												)}
											</div>
										</div>
									</div>

									<div className='flex items-center gap-2'>
										<div className='text-right'>
											<div className='font-semibold text-foreground'>
												{formatValue(item.value)}
											</div>
										</div>

										{item.status && (
											<Badge
												variant='secondary'
												className={`text-xs ${
													statusColors[
														item.status as keyof typeof statusColors
													] || "bg-gray-500/10 text-gray-600"
												}`}>
												{item.status}
											</Badge>
										)}
									</div>
								</motion.div>
							))}
						</div>
					) : (
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							No items available
						</div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
};
