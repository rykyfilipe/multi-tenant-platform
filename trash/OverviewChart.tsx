/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
} from "recharts";
import { LucideIcon } from "lucide-react";
import { PREMIUM_CHART_COLORS, CHART_STYLES, getChartColor, getGradientColor } from "@/lib/chart-colors";

interface OverviewChartProps {
	title: string;
	icon: LucideIcon;
	data: Array<any>;
	dataKeys: Array<{
		key: string;
		name: string;
		color: string;
		type?: "line" | "area";
	}>;
	xAxisKey: string;
	height?: number;
	delay?: number;
}

export const OverviewChart: React.FC<OverviewChartProps> = ({
	title,
	icon: Icon,
	data,
	dataKeys,
	xAxisKey,
	height = 300,
	delay = 0,
}) => {
	console.log('[OverviewChart] Render:', {
		title,
		hasData: !!data,
		dataLength: data?.length || 0,
		dataKeysLength: dataKeys?.length || 0,
		xAxisKey
	});
	const hasAreaData = dataKeys.some((key) => key.type === "area");
	const ChartComponent = hasAreaData ? AreaChart : LineChart;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ 
				duration: CHART_STYLES.animation.duration, 
				ease: CHART_STYLES.animation.easing,
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
								<ChartComponent data={data}>
									<CartesianGrid
										strokeDasharray={CHART_STYLES.grid.strokeDasharray}
										stroke={CHART_STYLES.grid.stroke}
										strokeWidth={CHART_STYLES.grid.strokeWidth}
									/>
									<XAxis
										dataKey={xAxisKey}
										stroke={CHART_STYLES.axis.stroke}
										fontSize={CHART_STYLES.axis.fontSize}
										fontWeight={CHART_STYLES.axis.fontWeight}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis 
										stroke={CHART_STYLES.axis.stroke} 
										fontSize={CHART_STYLES.axis.fontSize}
										fontWeight={CHART_STYLES.axis.fontWeight}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										contentStyle={CHART_STYLES.tooltip}
										cursor={{ 
											stroke: PREMIUM_CHART_COLORS.data.primary,
											strokeWidth: 1,
											strokeDasharray: "3 3"
										}}
									/>
									<Legend 
										wrapperStyle={CHART_STYLES.legend}
									/>
									{dataKeys.map((dataKey, index) => {
										const color = dataKey.color || getChartColor(index, 'elegant');
										
										if (hasAreaData && dataKey.type === "area") {
											return (
												<Area
													key={dataKey.key}
													type='monotone'
													dataKey={dataKey.key}
													stroke={color}
													fill={color}
													fillOpacity={0.15}
													name={dataKey.name}
													strokeWidth={3}
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											);
										}
										return (
											<Line
												key={dataKey.key}
												type='monotone'
												dataKey={dataKey.key}
												stroke={color}
												name={dataKey.name}
												strokeWidth={3}
												strokeLinecap="round"
												strokeLinejoin="round"
												dot={{ 
													r: 4, 
													fill: color,
													stroke: PREMIUM_CHART_COLORS.white,
													strokeWidth: 2
												}}
												activeDot={{ 
													r: 6, 
													fill: color,
													stroke: PREMIUM_CHART_COLORS.white,
													strokeWidth: 2,
													style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }
												}}
											/>
										);
									})}
								</ChartComponent>
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
				</CardContent>
			</Card>
		</motion.div>
	);
};

