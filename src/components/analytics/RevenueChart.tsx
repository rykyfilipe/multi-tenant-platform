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
	BarChart,
	Bar,
} from "recharts";
import { LucideIcon, DollarSign, TrendingUp, Users } from "lucide-react";

interface RevenueChartProps {
	title: string;
	icon: LucideIcon;
	data: Array<{
		date: string;
		revenue: number;
		users: number;
		arpu: number;
		growth: number;
	}>;
	chartType?: "line" | "area" | "bar";
	height?: number;
	delay?: number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
	title,
	icon: Icon,
	data,
	chartType = "area",
	height = 300,
	delay = 0,
}) => {
	const ChartComponent =
		chartType === "area"
			? AreaChart
			: chartType === "bar"
			? BarChart
			: LineChart;

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
						{data && data.length > 0 ? (
							<ResponsiveContainer width='100%' height='100%'>
								<ChartComponent data={data}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='hsl(var(--border))'
									/>
									<XAxis
										dataKey='date'
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
										formatter={(value: any, name: string) => {
											if (name === "revenue" || name === "arpu") {
												return [`$${value.toLocaleString()}`, name];
											}
											return [value.toLocaleString(), name];
										}}
									/>
									<Legend />
									{chartType === "area" ? (
										<>
											<Area
												type='monotone'
												dataKey='revenue'
												stroke='#10b981'
												fill='#10b981'
												fillOpacity={0.3}
												name='Revenue'
												strokeWidth={2}
											/>
											<Area
												type='monotone'
												dataKey='arpu'
												stroke='#3b82f6'
												fill='#3b82f6'
												fillOpacity={0.3}
												name='ARPU'
												strokeWidth={2}
											/>
										</>
									) : chartType === "bar" ? (
										<>
											<Bar
												dataKey='revenue'
												fill='#10b981'
												name='Revenue'
												radius={[2, 2, 0, 0]}
											/>
											<Bar
												dataKey='users'
												fill='#3b82f6'
												name='Users'
												radius={[2, 2, 0, 0]}
											/>
										</>
									) : (
										<>
											<Line
												type='monotone'
												dataKey='revenue'
												stroke='#10b981'
												name='Revenue'
												strokeWidth={2}
												dot={{ r: 4 }}
												activeDot={{ r: 6 }}
											/>
											<Line
												type='monotone'
												dataKey='arpu'
												stroke='#3b82f6'
												name='ARPU'
												strokeWidth={2}
												dot={{ r: 4 }}
												activeDot={{ r: 6 }}
											/>
										</>
									)}
								</ChartComponent>
							</ResponsiveContainer>
						) : (
							<div className='flex items-center justify-center h-full text-muted-foreground'>
								No revenue data available
							</div>
						)}
					</div>

					{/* Revenue Summary */}
					{data && data.length > 0 && (
						<div className='mt-4 grid grid-cols-2 gap-4'>
							<div className='text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20'>
								<div className='text-lg font-bold text-green-600'>
									$
									{data
										.reduce((sum, item) => sum + item.revenue, 0)
										.toLocaleString()}
								</div>
								<p className='text-xs text-muted-foreground'>Total Revenue</p>
							</div>
							<div className='text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20'>
								<div className='text-lg font-bold text-blue-600'>
									$
									{data && data.length > 0
										? (data.reduce((sum, item) => sum + (item?.arpu || 0), 0) / data.length).toFixed(0)
										: '0'}
								</div>
								<p className='text-xs text-muted-foreground'>Avg ARPU</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
};
