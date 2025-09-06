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
import { PREMIUM_CHART_COLORS, CHART_STYLES, getStatusColor } from "@/lib/chart-colors";

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
	return getStatusColor(percentage);
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
			transition={{ 
				duration: CHART_STYLES.animation.duration, 
				ease: "easeOut",
				delay 
			}}
			whileHover={{ 
				y: -2,
				transition: { duration: 0.2 }
			}}>
			<Card 
				className='bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300'
				style={CHART_STYLES.card}>
				<CardHeader className='pb-4'>
					<CardTitle className='flex items-center gap-3 text-foreground text-lg font-semibold'>
						<div className='p-2 rounded-lg bg-gradient-to-br from-black to-gray-800 text-white'>
							<Icon className='w-5 h-5' />
						</div>
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent className='pt-0'>
					<div style={{ height }}>
						{data.length > 0 ? (
							<ResponsiveContainer width='100%' height='100%'>
								<BarChart 
									data={data} 
									layout='horizontal'
									margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
								>
									<CartesianGrid
										strokeDasharray={CHART_STYLES.grid.strokeDasharray}
										stroke={CHART_STYLES.grid.stroke}
										strokeWidth={CHART_STYLES.grid.strokeWidth}
									/>
									<XAxis
										type='number'
										domain={[0, 100]}
										stroke={CHART_STYLES.axis.stroke}
										fontSize={CHART_STYLES.axis.fontSize}
										fontWeight={CHART_STYLES.axis.fontWeight}
										tickLine={false}
										axisLine={false}
										ticks={[0, 25, 50, 75, 100]}
										tickFormatter={(value) => `${value}%`}
									/>
									<YAxis
										dataKey='resource'
										type='category'
										stroke={CHART_STYLES.axis.stroke}
										fontSize={CHART_STYLES.axis.fontSize}
										fontWeight={CHART_STYLES.axis.fontWeight}
										width={120}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										formatter={(value: any, name: string, props: any) => [
											`${value.toFixed(1)}%`,
											"Usage",
										]}
										labelFormatter={(label: string) => `Resource: ${label}`}
										contentStyle={{
											...CHART_STYLES.tooltip,
											border: '1px solid #e5e7eb',
											borderRadius: '8px',
											boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
										}}
									/>
									<Bar 
										dataKey='percentage' 
										radius={[0, 6, 6, 0]}
										strokeWidth={0}
										fill={PREMIUM_CHART_COLORS.primary.black}
									>
										{data.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={getColorByPercentage(entry.percentage)}
												style={{
													filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
												}}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className='flex flex-col items-center justify-center h-full text-muted-foreground space-y-2'>
								<div className='w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
									<Icon className='w-6 h-6' />
								</div>
								<p className='text-sm font-medium'>No data available</p>
							</div>
						)}
					</div>

					{/* Resource Details */}
					<div className='mt-6 space-y-3'>
						{data.map((resource, index) => (
							<motion.div
								key={resource.resource}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className='flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200'>
								<div className='flex items-center gap-3'>
									<div 
										className='w-3 h-3 rounded-full'
										style={{ backgroundColor: getColorByPercentage(resource.percentage) }}
									/>
									<span className='text-sm font-medium text-foreground'>
										{resource.resource}
									</span>
								</div>
								<div className='flex items-center gap-3'>
									<span className='text-sm text-muted-foreground'>
										{resource.used.toLocaleString()} / {resource.total.toLocaleString()}
									</span>
									<div className='px-3 py-1 rounded-full text-xs font-semibold'
										style={{
											backgroundColor: getColorByPercentage(resource.percentage) + '20',
											color: getColorByPercentage(resource.percentage)
										}}>
										{resource.percentage.toFixed(1)}%
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};

export { ResourceUsageChart };
