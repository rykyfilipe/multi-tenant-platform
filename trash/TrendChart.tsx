/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ResponsiveContainer,
	ComposedChart,
	Line,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
} from "recharts";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PREMIUM_CHART_COLORS, CHART_STYLES, getChartColor } from "@/lib/chart-colors";

interface TrendChartProps {
	title: string;
	icon: LucideIcon;
	data: Array<any>;
	metrics: Array<{
		key: string;
		name: string;
		type: "line" | "bar";
		color: string;
	}>;
	xAxisKey: string;
	trend?: "up" | "down" | "stable";
	trendValue?: number;
	height?: number;
	delay?: number;
}

const getTrendIcon = (trend?: "up" | "down" | "stable") => {
	switch (trend) {
		case "up":
			return <TrendingUp className='w-3 h-3' />;
		case "down":
			return <TrendingDown className='w-3 h-3' />;
		default:
			return <Minus className='w-3 h-3' />;
	}
};

const getTrendColor = (trend?: "up" | "down" | "stable") => {
	switch (trend) {
		case "up":
			return "text-green-600 bg-green-500/10";
		case "down":
			return "text-red-600 bg-red-500/10";
		default:
			return "text-gray-600 bg-gray-500/10";
	}
};

export const TrendChart: React.FC<TrendChartProps> = ({
	title,
	icon: Icon,
	data,
	metrics,
	xAxisKey,
	trend,
	trendValue,
	height = 300,
	delay = 0,
}) => {
	console.log('[TrendChart] Render:', {
		title,
		hasData: !!data,
		dataLength: data?.length || 0,
		metricsLength: metrics?.length || 0,
		xAxisKey
	});
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}>
			<Card className='bg-card border-border'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle className='flex items-center gap-2 text-foreground'>
							<Icon className='w-5 h-5' />
							{title}
						</CardTitle>
						{trend && trendValue !== undefined && (
							<Badge
								variant='secondary'
								className={`text-xs ${getTrendColor(trend)}`}>
								{getTrendIcon(trend)}
								<span className='ml-1'>{Math.abs(trendValue)}%</span>
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div style={{ height }}>
						{data.length > 0 ? (
							<ResponsiveContainer width='100%' height='100%'>
								<ComposedChart data={data}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='hsl(var(--border))'
									/>
									<XAxis
										dataKey={xAxisKey}
										stroke='hsl(var(--muted-foreground))'
										fontSize={12}
									/>
									<YAxis stroke='hsl(var(--muted-foreground))' fontSize={12} />
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "8px",
											color: "hsl(var(--foreground))",
										}}
									/>
									<Legend />
									{metrics.map((metric) => {
										if (metric.type === "bar") {
											return (
												<Bar
													key={metric.key}
													dataKey={metric.key}
													fill={metric.color}
													name={metric.name}
													radius={[2, 2, 0, 0]}
												/>
											);
										}
										return (
											<Line
												key={metric.key}
												type='monotone'
												dataKey={metric.key}
												stroke={metric.color}
												name={metric.name}
												strokeWidth={2}
												dot={{ r: 4 }}
												activeDot={{ r: 6 }}
											/>
										);
									})}
								</ComposedChart>
							</ResponsiveContainer>
						) : (
							<div className='flex items-center justify-center h-full text-muted-foreground'>
								No data available
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};

