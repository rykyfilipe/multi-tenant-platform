/**
 * Revenue Chart Component
 * Specialized chart for revenue data visualization
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface RevenueChartProps {
	data: any[];
	title?: string;
	description?: string;
	height?: number;
	delay?: number;
	type?: "line" | "area";
	showGrid?: boolean;
	showTooltip?: boolean;
	color?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
	data,
	title = "Revenue Analysis",
	description,
	height = 300,
	delay = 0,
	type = "area",
	showGrid = true,
	showTooltip = true,
	color = "#10b981",
}) => {
	const ChartComponent = type === "area" ? AreaChart : LineChart;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-semibold flex items-center space-x-2">
						<span>{title}</span>
						<span className="text-sm font-normal text-muted-foreground">
							({type === "area" ? "Area Chart" : "Line Chart"})
						</span>
					</CardTitle>
					{description && (
						<p className="text-sm text-muted-foreground">{description}</p>
					)}
				</CardHeader>
				<CardContent>
					<div style={{ height }}>
						<ResponsiveContainer width="100%" height="100%">
							<ChartComponent data={data}>
								{showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
								<XAxis 
									dataKey="name" 
									tick={{ fontSize: 12 }}
									tickLine={{ stroke: "currentColor", opacity: 0.3 }}
								/>
								<YAxis 
									tick={{ fontSize: 12 }}
									tickLine={{ stroke: "currentColor", opacity: 0.3 }}
									tickFormatter={(value) => `$${value.toLocaleString()}`}
								/>
								{showTooltip && (
									<Tooltip 
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "6px",
										}}
										formatter={(value: any) => [`$${value.toLocaleString()}`, "Revenue"]}
									/>
								)}
								{type === "area" ? (
									<Area
										type="monotone"
										dataKey="value"
										stroke={color}
										fill={color}
										fillOpacity={0.1}
										strokeWidth={2}
									/>
								) : (
									<Line
										type="monotone"
										dataKey="value"
										stroke={color}
										strokeWidth={2}
										dot={{ fill: color, strokeWidth: 2, r: 4 }}
										activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
									/>
								)}
							</ChartComponent>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
};
