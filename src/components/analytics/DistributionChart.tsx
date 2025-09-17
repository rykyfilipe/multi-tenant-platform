/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
} from "recharts";
import { LucideIcon } from "lucide-react";
import { PREMIUM_CHART_COLORS, CHART_STYLES, getChartColor } from "@/lib/chart-colors";

interface DistributionChartProps {
	title: string;
	icon: LucideIcon;
	data: Array<{
		name: string;
		value: number;
		percentage?: number;
	}>;
	colors?: string[];
	height?: number;
	delay?: number;
}

const DEFAULT_COLORS = [
	PREMIUM_CHART_COLORS.data.primary,    // Pure black
	PREMIUM_CHART_COLORS.data.secondary,  // Dark gray
	PREMIUM_CHART_COLORS.data.tertiary,   // Medium gray
	PREMIUM_CHART_COLORS.data.quaternary, // Light gray
	PREMIUM_CHART_COLORS.data.accent,     // Gold accent
	PREMIUM_CHART_COLORS.accent.charcoal, // Charcoal
	PREMIUM_CHART_COLORS.accent.graphite, // Graphite
	PREMIUM_CHART_COLORS.accent.platinum, // Platinum
];

export const DistributionChart: React.FC<DistributionChartProps> = ({
	title,
	icon: Icon,
	data,
	colors = DEFAULT_COLORS,
	height = 300,
	delay = 0,
}) => {
	const renderCustomLabel = ({
		cx,
		cy,
		midAngle,
		innerRadius,
		outerRadius,
		percent,
	}: any) => {
		if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

		const RADIAN = Math.PI / 180;
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);

		return (
			<text
				x={x}
				y={y}
				fill={PREMIUM_CHART_COLORS.white}
				textAnchor={x > cx ? "start" : "end"}
				dominantBaseline='central'
				fontSize={12}
				fontWeight='600'
				style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
				{`${(percent * 100).toFixed(0)}%`}
			</text>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ 
				duration: CHART_STYLES.animation.duration, 
				ease: "easeInOut",
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
								<PieChart>
									<Pie
										data={data}
										cx='50%'
										cy='50%'
										labelLine={false}
										label={renderCustomLabel}
										outerRadius={90}
										innerRadius={30}
										fill={PREMIUM_CHART_COLORS.data.primary}
										dataKey='value'
										stroke={PREMIUM_CHART_COLORS.white}
										strokeWidth={2}
									>
										{data.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={colors[index % colors.length]}
												style={{
													filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
												}}
											/>
										))}
									</Pie>
									<Tooltip
										formatter={(value: any, name: string) => [
											`${value.toLocaleString()}`,
											name,
										]}
										contentStyle={CHART_STYLES.tooltip}
									/>
									<Legend 
										wrapperStyle={{
											fontSize: 12,
											fontFamily: 'Inter, system-ui, sans-serif',
											color: '#1A1A1A'
										}}
									/>
								</PieChart>
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

					{/* Distribution Details */}
					<div className='mt-6 space-y-3'>
						{data.map((item, index) => (
							<motion.div
								key={item.name}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className='flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200'>
								<div className='flex items-center gap-3'>
									<div
										className='w-3 h-3 rounded-full'
										style={{ backgroundColor: colors[index % colors.length] }}
									/>
									<span className='text-sm font-medium text-foreground'>{item.name}</span>
								</div>
								<div className='flex items-center gap-3'>
									<span className='text-sm font-semibold text-foreground'>
										{item.value.toLocaleString()}
									</span>
									{item.percentage && (
										<div className='px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'>
											{item.percentage.toFixed(1)}%
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

