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
	const hasAreaData = dataKeys.some((key) => key.type === "area");
	const ChartComponent = hasAreaData ? AreaChart : LineChart;

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
								<ChartComponent data={data}>
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
									{dataKeys.map((dataKey, index) => {
										if (hasAreaData && dataKey.type === "area") {
											return (
												<Area
													key={dataKey.key}
													type='monotone'
													dataKey={dataKey.key}
													stroke={dataKey.color}
													fill={dataKey.color}
													fillOpacity={0.3}
													name={dataKey.name}
													strokeWidth={2}
												/>
											);
										}
										return (
											<Line
												key={dataKey.key}
												type='monotone'
												dataKey={dataKey.key}
												stroke={dataKey.color}
												name={dataKey.name}
												strokeWidth={2}
												dot={{ r: 4 }}
												activeDot={{ r: 6 }}
											/>
										);
									})}
								</ChartComponent>
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
