/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Cell,
} from "recharts";
import { LucideIcon } from "lucide-react";

interface ResourceUsageChartProps {
	title: string;
	icon: LucideIcon;
	data: Array<{
		resource: string;
		used: number;
		total: number;
		percentage: number;
	}>;
	height?: number;
	delay?: number;
}

const getColorByPercentage = (percentage: number): string => {
	if (percentage >= 90) return "#ef4444"; // red
	if (percentage >= 75) return "#f59e0b"; // orange
	if (percentage >= 50) return "#3b82f6"; // blue
	return "#10b981"; // green
};

export const ResourceUsageChart: React.FC<ResourceUsageChartProps> = ({
	title,
	icon: Icon,
	data,
	height = 300,
	delay = 0,
}) => {
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
					<div style={{ height }}>
						{data.length > 0 ? (
							<ResponsiveContainer width='100%' height='100%'>
								<BarChart data={data} layout='horizontal'>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='hsl(var(--border))'
									/>
									<XAxis
										type='number'
										domain={[0, 100]}
										stroke='hsl(var(--muted-foreground))'
										fontSize={12}
									/>
									<YAxis
										dataKey='resource'
										type='category'
										stroke='hsl(var(--muted-foreground))'
										fontSize={12}
										width={80}
									/>
									<Tooltip
										formatter={(value: any) => [
											`${value.toFixed(1)}%`,
											"Usage",
										]}
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "8px",
											color: "hsl(var(--foreground))",
										}}
									/>
									<Bar dataKey='percentage' radius={[0, 4, 4, 0]}>
										{data.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={getColorByPercentage(entry.percentage)}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className='flex items-center justify-center h-full text-muted-foreground'>
								No data available
							</div>
						)}
					</div>

					{/* Resource Details */}
					<div className='mt-4 space-y-2'>
						{data.map((resource, index) => (
							<div
								key={resource.resource}
								className='flex justify-between items-center text-sm'>
								<span className='text-muted-foreground'>
									{resource.resource}
								</span>
								<div className='flex items-center gap-2'>
									<span className='font-medium'>
										{resource.used.toLocaleString()} /{" "}
										{resource.total.toLocaleString()}
									</span>
									<span
										className='font-semibold'
										style={{
											color: getColorByPercentage(resource.percentage),
										}}>
										{resource.percentage.toFixed(1)}%
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
